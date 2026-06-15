# Reputation — Flows

## 1. Profile creation (session bootstrap)

Triggered by `ReputationIdentityAssigned` from [Anonymity](../anonymity/flows.md).

```mermaid
sequenceDiagram
    participant Identity as Identity context
    participant Handler as OnReputationAssignedHandler
    participant Rep as ReputationProfile
    participant DB

    Identity->>Handler: ReputationIdentityAssigned
    Handler->>Rep: ReputationProfile.create(reputationId, cityId)
    Rep-->>Handler: ReputationProfileCreated
    Handler->>DB: INSERT reputation_profiles
```

Initial state: `trustScore = 0`, `totalOutcomes = 0`, label = `new_source`.

---

## 2. Trust weight lookup (validation path)

Consumed by [Community validation](../community-validation/flows.md).

```mermaid
sequenceDiagram
    participant Val as ConfirmOccurrenceHandler
    participant Port as ReputationPort
    participant Rep as ReputationProfile

    Val->>Port: getTrustWeight(reputationId, cityId)
    Port->>Rep: load profile
    Rep->>Rep: computeWeight(maturity, trustScore, specialist?)
    Port-->>Val: TrustWeight (e.g. 0.75)
```

**Query:** internal — not HTTP public in v1 (in-process port).

---

## 3. Record outcome — author report validated

When occurrence status becomes `active`:

```mermaid
sequenceDiagram
    participant Outbox as Event bus
    participant Worker as ReputationWorker
    participant Rep as ReputationProfile
    participant DB

    Outbox->>Worker: OccurrenceStatusChanged → active
    Worker->>Worker: resolve author reputationId
    Worker->>Rep: recordOutcome(correct, author)
    Rep->>Rep: recalculate trustScore
    Rep-->>Worker: ReputationScoreUpdated
    Worker->>DB: INSERT outcome + UPDATE profile
```

Idempotent on `occurrenceId + outcomeType`.

---

## 4. Record outcome — author report rejected

When occurrence lands `low_confidence` and author was reporter:

```mermaid
flowchart TD
    A[Occurrence → low_confidence] --> B{author reputationId}
    B --> C[recordOutcome incorrect]
    C --> D[recalculate trustScore]
    D --> E[may downgrade public label]
```

---

## 5. Record validator outcome

When validator's confirm/deny is later proven right or wrong:

```mermaid
sequenceDiagram
    participant Worker
    participant Rep as ReputationProfile

    Note over Worker: Occurrence reaches terminal validation state
    Worker->>Worker: load votes with reputationIds
    Worker->>Rep: recordOutcome per voter
    Rep->>Rep: apply rolling window
```

Example: voter confirmed, occurrence → `low_confidence` → voter outcome **incorrect**.

---

## 6. Public label on occurrence DTO

```mermaid
sequenceDiagram
    participant API
    participant Port as ReputationPort
    participant Mapper

    API->>Port: getPublicLabel(authorReputationId)
    Port-->>API: trusted_source_label enum
    API->>Mapper: attach label only — no score
    Mapper-->>API: OccurrenceDto
```

For sensitive categories: label may show `trusted_source` — **never** identity.

---

## 7. Identity rotation (score preserved)

```mermaid
sequenceDiagram
    participant Identity
    participant Rep as ReputationProfile

    Identity->>Identity: rotate keys, same reputationId
    Note over Rep: No new profile — INV-R1
    Identity->>Rep: optional IdentityRotated audit hook
```

---

## 8. Private summary for contributor

```mermaid
sequenceDiagram
    participant App
    participant API
    participant Rep

    App->>API: GET /me/reputation (session)
    API->>Rep: load by session reputationId
    Rep-->>API: label + privateSummary
    API-->>App: 200 (no other users' data)
```

---

## Command catalog

| Command | Trigger | Actor |
|---------|---------|-------|
| `CreateReputationProfile` | `ReputationIdentityAssigned` | system |
| `RecordReputationOutcome` | domain events / worker | system |
| `RecalculateTrustScore` | after outcome batch | system |

No user-facing command to set score.

---

## Query catalog

| Query | HTTP | Actor |
|-------|------|-------|
| `GetTrustWeight` | internal port | Validation handlers |
| `GetPublicLabel` | internal port | DTO mappers |
| `GetMyReputationSummary` | `GET /me/reputation` | authenticated contributor |
| `GetReputationForAudit` | `GET /admin/reputation/:id` | security_audit role (v2) |

---

## Domain events consumed

| Event | Source | Action |
|-------|--------|--------|
| `ReputationIdentityAssigned` | Anonymity | create profile |
| `OccurrenceStatusChanged` | Occurrences | author outcomes |
| `OccurrenceConfidenceChanged` | Validation | threshold side effects |
| `OccurrenceConfirmed` / `Denied` | Validation | defer until terminal |
| `IdentityRotated` | Anonymity | audit only — same profile |

## Domain events emitted

| Event | Consumers |
|-------|-----------|
| `ReputationProfileCreated` | Analytics (aggregated) |
| `ReputationScoreUpdated` | Internal metrics — not public bus |
| `TrustedSourceLabelChanged` | Read model cache invalidate |

Payloads: **no PII**, no precise score on public bus.

---

## Related docs

- [Business rules](business-rules.md)
- [Domain model](domain-model.md)
- [Anonymity flows](../anonymity/flows.md)
