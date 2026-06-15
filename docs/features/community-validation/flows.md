# Community Validation — Flows

## 1. Confirm occurrence (happy path)

```mermaid
sequenceDiagram
    participant App
    participant API
    participant Handler as ConfirmOccurrenceHandler
    participant Rep as ReputationPort
    participant Occ as Occurrence aggregate
    participant Policy as ValidationPolicyPort
    participant DB

    App->>API: POST /occurrences/:id/confirm { version }
    API->>Handler: ConfirmOccurrenceCommand
    Handler->>DB: load Occurrence + votes
    Handler->>Handler: assert not self (INV-V1)
    Handler->>Handler: assert no prior vote (INV-V2)
    Handler->>Rep: getTrustWeight(reputationId)
    Rep-->>Handler: weight
    Handler->>Occ: recordConfirmation(voter, weight)
    Occ->>Policy: thresholds(category, isSensitive)
    Occ->>Occ: recalculate confidence + status
    Occ-->>Handler: events + new version
    Handler->>DB: INSERT vote, UPDATE occurrence (version++)
    Handler-->>API: ValidationResultDto
    API-->>App: 200 { confidenceLevel, status, version }
```

---

## 2. Deny occurrence

```mermaid
sequenceDiagram
    participant Handler
    participant Occ as Occurrence

    Handler->>Occ: recordDenial(voter, weight)
    Occ->>Occ: confidence -= weighted points
    alt confidence <= floor
        Occ->>Occ: status = low_confidence
    end
    Occ-->>Handler: OccurrenceDenied, OccurrenceConfidenceChanged
```

---

## 3. Promote to active (consensus)

```mermaid
flowchart TD
    A[Confirmation recorded] --> B[Recalculate confidence]
    B --> C{distinct confirms >= min?}
    C -->|No| D[Stay under_review]
    C -->|Yes| E{weighted score >= threshold?}
    E -->|No| D
    E -->|Yes| F[status = active]
    F --> G[OccurrenceConfidenceChanged + status event]
```

---

## 4. Self-validation blocked

```mermaid
sequenceDiagram
    participant App
    participant Handler
    participant Occ

    App->>Handler: POST confirm (same reputation as author)
    Handler->>Occ: author.reputationId === voter.reputationId
    Handler-->>App: 403 SELF_VALIDATION_FORBIDDEN
```

---

## 5. Optimistic lock conflict

```mermaid
sequenceDiagram
    participant App
    participant Handler
    participant DB

    App->>Handler: POST confirm { version: 2 }
    Handler->>DB: occurrence.version = 3
    Handler-->>App: 409 VERSION_CONFLICT
    Note over App: Client refreshes and retries
```

---

## 6. Add comment

```mermaid
sequenceDiagram
    participant App
    participant API
    participant Handler as AddCommentHandler
    participant Policy as ContentPolicyService
    participant Comment as OccurrenceComment
    participant DB

    App->>API: POST /occurrences/:id/comments { text }
    API->>Policy: scanForDoxxing(text)
    alt doxxing detected
        Policy-->>API: reject
        API-->>App: 400 DOXXING_DETECTED
    else clean
        API->>Handler: AddCommentCommand
        Handler->>Comment: create(...)
        Handler->>DB: INSERT comment
        Handler-->>API: CommentDto (author per sensitive rules)
        API-->>App: 201
    end
```

Comments **do not** invoke `Occurrence.recordConfirmation`.

---

## 7. Sensitive thread — comment display

```mermaid
flowchart LR
    A[Comment created] --> B{occurrence.isSensitive?}
    B -->|Yes| C[DTO: text + timestamp only]
    B -->|No| D[DTO: + display per identity mode]
```

---

## Command catalog

| Command | HTTP | Idempotent |
|---------|------|------------|
| `ConfirmOccurrence` | `POST /occurrences/:id/confirm` | No — second call → 403 |
| `DenyOccurrence` | `POST /occurrences/:id/deny` | No |
| `AddComment` | `POST /occurrences/:id/comments` | No |
| `ListComments` | `GET /occurrences/:id/comments` | Read |

### `ConfirmOccurrence` errors

| Code | HTTP | When |
|------|------|------|
| `UNAUTHORIZED` | 401 | No session |
| `NOT_FOUND` | 404 | Unknown id or wrong tenant policy |
| `SELF_VALIDATION_FORBIDDEN` | 403 | INV-V1 |
| `ALREADY_VOTED` | 403 | INV-V2 |
| `VALIDATION_CLOSED` | 403 | resolved / deleted INV-V7 |
| `VERSION_CONFLICT` | 409 | INV-V10 |
| `RATE_LIMITED` | 429 | INV-V11 |

---

## Query catalog

| Query | Purpose |
|-------|---------|
| `GET /occurrences/:id/validation-summary` | Public counts: confirms, denies, confidence — no voter list |
| `GET /occurrences/:id/comments` | Paginated comments |

---

## Domain events

| Event | When |
|-------|------|
| `OccurrenceConfirmed` | After confirm persisted |
| `OccurrenceDenied` | After deny persisted |
| `OccurrenceConfidenceChanged` | Confidence or status changed |
| `OccurrenceStatusChanged` | Status transition (optional separate event) |
| `CommentAdded` | After comment persisted |

Event payloads exclude voter PII; sensitive threads exclude commenter identity.

---

## UI flows

### Validation sheet (mobile / web)

```text
1. User opens occurrence detail
2. Sees confidence bar + "X confirmations"
3. Actions: [Confirm] [Deny] [Comment]
4. If already voted → buttons disabled
5. If own report → "You reported this" — no vote buttons
6. Submit → optimistic UI → reconcile version on 409
```

---

## Related docs

- [Business rules](business-rules.md)
- [Domain model](domain-model.md)
- [Occurrence lifecycle](../../system/occurrence-lifecycle.md)
