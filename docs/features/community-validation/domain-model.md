# Community Validation — Domain Model (DDD)

Bounded context: **Validation** (application + comment aggregate)  
Collaborates with: **Occurrences** aggregate (confirm/deny mutate occurrence state)

## Context map

```text
┌─────────────────┐     TrustWeight      ┌─────────────────┐
│   Reputation    │◀────────────────────│   Validation    │
│  [reputation](../reputation/README.md) │                  │  (this module)  │
└─────────────────┘                      └────────┬────────┘
                                                │
         ContributorRef                         │ recordConfirmation/Denial
         ContentPolicyPort                      ▼
┌─────────────────┐                      ┌─────────────────┐
│    Identity     │─────────────────────▶│   Occurrences   │
└─────────────────┘                      │   (aggregate)   │
                                         └─────────────────┘
                                                │
                                                │ CommentAdded
                                                ▼
                                         ┌─────────────────┐
                                         │ OccurrenceComment│
                                         │   (aggregate)    │
                                         └─────────────────┘
```

**Design choice:** Confirm/deny are **methods on `Occurrence`** because confidence and status are aggregate invariants. Validation feature slice **orchestrates** loading, policy checks, and persistence. Comments are a **separate aggregate** to avoid unbounded growth inside Occurrence.

---

## Occurrence aggregate extensions

Add to existing `Occurrence` in `packages/domain/src/occurrences/`:

```typescript
// Conceptual methods
recordConfirmation(params: {
  voter: ContributorRef;
  trustWeight: TrustWeight;
  policy: ValidationPolicy;
  existingVotes: ValidationVoteSummary;
}): DomainResult<OccurrenceValidationResult>

recordDenial(params: { ... }): DomainResult<OccurrenceValidationResult>
```

### Internal state for validation (on Occurrence or loaded snapshot)

```text
confirmationCount: number      // distinct confirmers
denialCount: number
authorReputationId: ReputationId  // for INV-V1
```

Votes stored in separate table — aggregate receives `existingVotes` summary + checks duplicate via domain service before mutate.

### `OccurrenceValidationResult`

```typescript
{
  occurrence: Occurrence;
  events: DomainEvent[];
  // OccurrenceConfirmed, OccurrenceConfidenceChanged, maybe OccurrenceStatusChanged
}
```

---

## Aggregate: OccurrenceComment

```text
OccurrenceComment (root)
├── id: CommentId
├── occurrenceId: OccurrenceId
├── cityId: CityId
├── authorRef: ContributorRef
├── text: CommentText (VO)
├── parentCommentId: CommentId | null
├── authorDisplayPolicy: AuthorDisplayPolicy
├── createdAt
└── deletedAt (soft delete — moderation v2)
```

Factory: `OccurrenceComment.create({ occurrenceId, authorRef, text, policy, ... })`

Does **not** modify occurrence confidence (INV-V4).

---

## Value objects

| VO | Package | Notes |
|----|---------|-------|
| `ValidationVoteType` | validation | `confirm` \| `deny` |
| `ValidationReason` | validation | optional enum |
| `TrustWeight` | validation | 0.1–1.0 |
| `CommentText` | validation | 1–1000 chars, sanitized |
| `CommentId` | validation | uuid v7 |
| `ValidationPolicy` | validation | thresholds per category |
| `ConfidenceLevel` | occurrences | existing — recalculated |

---

## Domain services

### `ConfidenceCalculator`

```typescript
calculate(params: {
  currentLevel: ConfidenceLevel;
  voteType: ValidationVoteType;
  trustWeight: TrustWeight;
  policy: ValidationPolicy;
}): ConfidenceLevel
```

Default: confirm `+20 × weight`, deny `−25 × weight`, clamp 0–100.

### `StatusTransitionService`

```typescript
resolveStatus(params: {
  currentStatus: OccurrenceStatus;
  confidence: ConfidenceLevel;
  distinctConfirms: number;
  policy: ValidationPolicy;
  isSensitive: boolean;
}): OccurrenceStatus
```

Implements transition table from [business rules](business-rules.md#status-transitions-triggered-by-validation).

### `SelfValidationPolicy`

```typescript
canVote(authorReputationId: ReputationId, voterReputationId: ReputationId): boolean
```

Returns false when equal (INV-V1).

### `DuplicateVotePolicy`

```typescript
hasAlreadyVoted(votes: ValidationVoteSummary, voter: ReputationId): boolean
```

INV-V2.

---

## Ports

| Port | Methods | Adapter |
|------|---------|---------|
| `ValidationVoteRepository` | `save`, `findByOccurrence`, `exists` | Drizzle |
| `OccurrenceRepository` | `findByIdForUpdate`, `save` | existing |
| `OccurrenceCommentRepository` | `save`, `listByOccurrence` | Drizzle |
| `ReputationPort` | `getTrustWeight`, `getPublicLabel` | [Reputation module](../reputation/domain-model.md) |
| `ValidationPolicyPort` | `getPolicy(cityId, category)` | Config JSON / DB |
| `ContentPolicyPort` | `validateUserText` | Shared with Anonymity |
| `ContributorResolverPort` | `resolve(session)` | Identity |

---

## Domain events

| Event | Payload (no PII) |
|-------|-------------------|
| `OccurrenceConfirmed` | `occurrenceId`, `cityId`, `newConfidence`, `distinctConfirms` |
| `OccurrenceDenied` | `occurrenceId`, `cityId`, `newConfidence` |
| `OccurrenceConfidenceChanged` | `occurrenceId`, `from`, `to`, `status` |
| `CommentAdded` | `commentId`, `occurrenceId`, `cityId` — no author on sensitive bus |

---

## Application layer (API)

```text
apps/api/src/features/validation/
├── confirm-occurrence/
│   ├── confirm-occurrence.controller.ts
│   ├── confirm-occurrence.handler.ts
│   └── confirm-occurrence.handler.spec.ts
├── deny-occurrence/
├── add-comment/
├── list-comments/
└── validation.module.ts
```

### Handler pattern (confirm)

```text
1. Resolve voter ContributorRef
2. Load Occurrence (city + version check)
3. Load existing votes for occurrence
4. SelfValidationPolicy + DuplicateVotePolicy
5. ReputationPort.getTrustWeight
6. occurrence.recordConfirmation(...)
7. Save vote + occurrence in transaction
8. Publish events
9. Map DTO
```

---

## Shared schemas (`packages/shared/src/validation/`)

```typescript
confirmOccurrenceSchema = z.object({
  version: z.number().int().positive(),
  reason: z.enum(['still_there', 'verified_locally', ...]).optional(),
}).strict();

denyOccurrenceSchema = z.object({
  version: z.number().int().positive(),
  reason: z.enum(['false_alarm', 'duplicate', ...]).optional(),
}).strict();

addCommentSchema = z.object({
  text: z.string().min(1).max(1000),
  parentCommentId: z.string().uuid().optional(),
}).strict();
```

---

## Database (migration 0003 — planned)

```sql
CREATE TABLE validation_votes (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  occurrence_id UUID NOT NULL REFERENCES occurrences(id),
  city_id UUID NOT NULL,
  voter_reputation_id UUID NOT NULL,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('confirm', 'deny')),
  reason TEXT,
  trust_weight_applied NUMERIC(3,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (occurrence_id, voter_reputation_id)
);

CREATE TABLE occurrence_comments (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  occurrence_id UUID NOT NULL REFERENCES occurrences(id),
  city_id UUID NOT NULL,
  author_reputation_id UUID NOT NULL,
  parent_comment_id UUID REFERENCES occurrence_comments(id),
  text TEXT NOT NULL,
  author_display_policy TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_validation_votes_occurrence ON validation_votes(occurrence_id);
CREATE INDEX idx_comments_occurrence ON occurrence_comments(occurrence_id, created_at);
```

RLS on both tables: `city_id = current_setting('app.city_id')`.

---

## Folder layout

```text
packages/domain/src/validation/
├── occurrence-comment.entity.ts
├── occurrence-comment.entity.spec.ts
├── value-objects/
│   ├── validation-vote-type.vo.ts
│   ├── comment-text.vo.ts
│   ├── trust-weight.vo.ts
│   └── validation-policy.vo.ts
├── services/
│   ├── confidence-calculator.ts
│   ├── confidence-calculator.spec.ts
│   ├── status-transition.service.ts
│   ├── self-validation.policy.ts
│   └── duplicate-vote.policy.ts
├── events/
│   ├── occurrence-confirmed.event.ts
│   ├── occurrence-denied.event.ts
│   └── comment-added.event.ts
└── ports/
    ├── validation-vote.repository.port.ts
    ├── occurrence-comment.repository.port.ts
    ├── reputation.port.ts
    └── validation-policy.port.ts

packages/domain/src/occurrences/
├── occurrence.entity.ts          # + recordConfirmation, recordDenial
└── occurrence.entity.spec.ts     # validation tests
```

---

## Cross-module contracts

| Module | Contract |
|--------|----------|
| Occurrence creation | Occurrence must exist in `unverified` or later state |
| Anonymity | `ContributorRef`, `ContentPolicyPort`, sensitive display |
| Reputation | `ReputationPort` — see [reputation module](../reputation/README.md) |
| Media (future) | Evidence does not replace votes; may boost weight v2 — [media upload](../media-upload/README.md) |

---

## Related docs

- [Business rules](business-rules.md)
- [TDD plan](tdd-plan.md)
- [Occurrence domain model](../occurrence-creation/domain-model.md)
