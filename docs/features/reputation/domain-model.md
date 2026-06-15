# Reputation — Domain Model (DDD)

Bounded context: **Identity & Reputation**  
Package root: `packages/domain/src/reputation/`

## Context map

```text
┌─────────────────┐  ReputationIdentityAssigned   ┌─────────────────┐
│    Identity     │ ────────────────────────────▶ │   Reputation    │
│   (Anonymity)   │                               │  (this module)  │
└─────────────────┘                               └────────┬────────┘
                                                             │
                    getTrustWeight / getPublicLabel          │
┌─────────────────┐◀─────────────────────────────────────────┤
│   Validation    │                                          │
└─────────────────┘                                          │
┌─────────────────┐                                          │
│  Occurrences    │◀──────── getPublicLabel for author ──────┘
│  (DTO mapper)   │
└─────────────────┘
        ▲
        │ OccurrenceStatusChanged, etc.
┌─────────────────┐
│     Worker      │  RecordReputationOutcome (async)
└─────────────────┘
```

---

## Aggregate: ReputationProfile (root)

One profile per `reputationId` per `city_id`.

```text
ReputationProfile (aggregate root)
├── id: ReputationProfileId (uuid v7)
├── reputationId: ReputationId (immutable)
├── cityId: CityId
├── trustScore: TrustScore (VO) — 0–100 internal
├── correctOutcomes: number
├── incorrectOutcomes: number
├── totalOutcomes: number
├── maturity: ReputationMaturity (VO)
├── publicLabel: TrustedSourceLabel (VO)
├── specialistTags: SpecialistTag[] (value objects, v1 optional)
├── createdAt, updatedAt
└── version
```

### Factory

```typescript
ReputationProfile.createForNewContributor(params: {
  reputationId: ReputationId;
  cityId: CityId;
  clock: () => Date;
}): { profile: ReputationProfile; event: ReputationProfileCreated }
```

### Methods

```typescript
recordOutcome(outcome: ReputationOutcome): DomainResult<ReputationScoreUpdated>
recalculateScore(window: RollingWindowPolicy): TrustScore
computeTrustWeight(context?: SpecialistContext): TrustWeight
resolvePublicLabel(): TrustedSourceLabel
```

---

## Entity: ReputationOutcome (child / separate table)

Append-only record of a scored event.

```text
ReputationOutcome
├── id: OutcomeId
├── reputationId: ReputationId
├── cityId: CityId
├── outcomeType: OutcomeType — report_validated | report_rejected | vote_correct | vote_incorrect
├── sourceOccurrenceId: OccurrenceId
├── sourceEventId: string — idempotency key (INV-R5)
├── isCorrect: boolean
├── recordedAt: Date
```

---

## Value objects

| VO | Validates | Notes |
|----|-----------|-------|
| `TrustScore` | 0–100 integer | Internal only |
| `TrustWeight` | 0.1–1.0 | Passed to Validation |
| `TrustedSourceLabel` | `new_source` \| `trusted_source` \| `trusted_local_source` | Public |
| `ReputationMaturity` | `new` \| `mature` | From age + outcome count |
| `OutcomeType` | enum | See business rules |
| `SpecialistTag` | type + geo/category ref | v1 neighborhood |
| `RollingWindowPolicy` | max outcomes = 50 | Configurable |

---

## Domain services

### `TrustWeightCalculator`

```typescript
calculate(profile: ReputationProfile, context?: SpecialistContext): TrustWeight
```

| Input | Weight |
|-------|--------|
| `maturity = new` | `min(0.5, scoreBasedWeight)` |
| `trustScore < 50` | 0.5 |
| `trustScore 50–79` | 0.75 |
| `trustScore ≥ 80` | 1.0 |
| `specialist in context` | 1.0 cap for that geo |

### `AccuracyCalculator`

```typescript
fromOutcomes(outcomes: ReputationOutcome[], window: RollingWindowPolicy): TrustScore
```

### `PublicLabelResolver`

Maps score + maturity + specialist → `TrustedSourceLabel` — **INV-R3**.

---

## Ports

| Port | Methods | Implemented by |
|------|---------|----------------|
| `ReputationRepository` | `save`, `findByReputationId` | Drizzle |
| `ReputationOutcomeRepository` | `append`, `existsByEventId`, `listRolling` | Drizzle |
| `ReputationPort` (facade for other contexts) | `getTrustWeight`, `getPublicLabel` | Application service |
| `NeighborhoodLookupPort` | `resolveNeighborhood(lat, lng)` | PostGIS adapter (specialist v1) |
| `RollingWindowPolicyPort` | `getPolicy(cityId)` | Config |

### `ReputationPort` contract (used by Validation)

```typescript
interface ReputationPort {
  getTrustWeight(reputationId: ReputationId, cityId: CityId): Promise<TrustWeight>;
  getPublicLabel(reputationId: ReputationId, cityId: CityId): Promise<TrustedSourceLabel>;
}
```

---

## Domain events

| Event | Payload |
|-------|---------|
| `ReputationProfileCreated` | `reputationId`, `cityId` |
| `ReputationScoreUpdated` | `reputationId`, `cityId`, `previousScore`, `newScore` — **internal** |
| `TrustedSourceLabelChanged` | `reputationId`, `cityId`, `newLabel` |
| `ReputationOutcomeRecorded` | `outcomeId`, `reputationId`, `outcomeType`, `isCorrect` |

Public event bus must not include exact scores.

---

## Application layer

```text
apps/api/src/features/reputation/
├── on-reputation-assigned/
│   └── on-reputation-assigned.handler.ts    # event subscriber
├── get-my-reputation/
│   ├── get-my-reputation.controller.ts    # GET /me/reputation
│   └── get-my-reputation.handler.ts
├── reputation.module.ts
└── reputation.port.adapter.ts             # implements ReputationPort

apps/worker/src/jobs/
└── recalculate-reputation-on-status.ts    # consumes OccurrenceStatusChanged
```

---

## Shared schemas (`packages/shared/src/reputation/`)

```typescript
// Response only — no write schema from public users
myReputationSummarySchema = z.object({
  trustedSourceLabel: z.enum(['new_source', 'trusted_source', 'trusted_local_source']),
  privateSummary: z.object({
    accuracyPercent: z.number().int().min(0).max(100),
    resolvedContributions: z.number().int().nonnegative(),
  }),
});
```

---

## Database (migration 0004 — planned)

```sql
CREATE TABLE reputation_profiles (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  reputation_id UUID NOT NULL,
  city_id UUID NOT NULL,
  trust_score SMALLINT NOT NULL DEFAULT 0 CHECK (trust_score BETWEEN 0 AND 100),
  correct_outcomes INT NOT NULL DEFAULT 0,
  incorrect_outcomes INT NOT NULL DEFAULT 0,
  total_outcomes INT NOT NULL DEFAULT 0,
  public_label TEXT NOT NULL DEFAULT 'new_source',
  specialist_tags JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  version INT NOT NULL DEFAULT 1,
  UNIQUE (city_id, reputation_id)
);

CREATE TABLE reputation_outcomes (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  reputation_id UUID NOT NULL,
  city_id UUID NOT NULL,
  outcome_type TEXT NOT NULL,
  source_occurrence_id UUID NOT NULL,
  source_event_id TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (source_event_id)
);

CREATE INDEX idx_reputation_outcomes_rolling
  ON reputation_outcomes (reputation_id, recorded_at DESC);
```

RLS: profiles readable by owner session or admin; **no** public SELECT on scores.

---

## Folder layout

```text
packages/domain/src/reputation/
├── reputation-profile.entity.ts
├── reputation-profile.entity.spec.ts
├── reputation-outcome.entity.ts
├── value-objects/
│   ├── trust-score.vo.ts
│   ├── trust-weight.vo.ts
│   ├── trusted-source-label.vo.ts
│   ├── reputation-maturity.vo.ts
│   └── outcome-type.vo.ts
├── services/
│   ├── trust-weight-calculator.ts
│   ├── trust-weight-calculator.spec.ts
│   ├── accuracy-calculator.ts
│   └── public-label-resolver.ts
├── events/
│   ├── reputation-profile-created.event.ts
│   └── reputation-score-updated.event.ts
└── ports/
    ├── reputation.repository.port.ts
    ├── reputation-outcome.repository.port.ts
    └── reputation.port.ts
```

---

## Cross-module updates

| Module | Change |
|--------|--------|
| [Community validation](../community-validation/domain-model.md) | Replace `ReputationPort` stub with real adapter |
| [Anonymity](../anonymity/domain-model.md) | Emit `ReputationIdentityAssigned` → create profile |
| [Occurrence creation](../occurrence-creation/domain-model.md) | DTO mapper calls `getPublicLabel` |

---

## Related docs

- [Business rules](business-rules.md)
- [TDD plan](tdd-plan.md)
- [System reputation doc](../../system/reputation-and-trust.md)
