# Anonymity — Domain Model (DDD)

Bounded context: **Identity & Privacy**  
Package root: `packages/domain/src/identity/`

## Context map

```text
┌─────────────────────┐         ContributorRef          ┌─────────────────────┐
│  Identity & Privacy │ ──────────────────────────────▶ │    Occurrences      │
│  (this module)      │   { reputationId, displayPolicy}│                     │
└─────────┬───────────┘                                   └─────────────────────┘
          │ events
          ▼
┌─────────────────────┐
│    Reputation       │  consumes ReputationIdentityAssigned — [reputation module](../reputation/README.md)
└─────────────────────┘
```

**Integration rule:** Occurrences imports only `ContributorRef` and `AuthorDisplayPolicy` types — not `ContributorIdentity` entity.

---

## Aggregates

### ContributorIdentity (aggregate root)

Owns session identity, mode, pseudonym, and link to reputation. One aggregate per logical contributor per `city_id`.

```text
ContributorIdentity
├── id: ContributorId (uuid v7)
├── cityId: CityId
├── reputationId: ReputationId (immutable after creation)
├── identityMode: IdentityMode (VO)
├── pseudonym: Pseudonym | null
├── publicProfileId: PublicProfileId | null
├── localKeyRef: LocalKeyReference (VO) — fingerprint only, not private key
├── createdAt, updatedAt
└── version (optimistic lock)
```

**Consistency boundary:** Changing mode, pseudonym, or rotation happens inside this aggregate. Reputation score is **not** stored here.

### PublicProfile (aggregate root — optional)

Only exists when user opts into traditional auth. Implemented as **`UserAccount`** — see [User account module](../user-account/README.md).

```text
UserAccount (PublicProfile)
├── id: PublicProfileId
├── cityId: CityId
├── contributorId: ContributorId (FK logical ref)
├── email: EmailAddress (VO, encrypted at rest)
├── displayName: DisplayName (VO)
├── pqcPublicKeyRef: PqcPublicKeyRef (ML-DSA-65 fingerprint)
├── lgpdConsent: LgpdConsent (VO)
└── showIdentityOnReports: boolean (default false)
```

---

## Value objects

| VO | Validates | Notes |
|----|-----------|-------|
| `IdentityMode` | enum: `ghost`, `pseudonym`, `public` | Default `ghost` |
| `ReputationId` | format `Rep-[A-Z0-9]{5}` or uuid internal | Opaque to clients in v1 |
| `Pseudonym` | 3–32 chars, unique per city, no doxxing | INV-A6, INV-A8 |
| `DisplayName` | 2–64 chars, no doxxing | Public mode only |
| `LocalKeyReference` | hash of public key | Never store private key |
| `ContributorRef` | reputationId + displayPolicy | Passed to Occurrences |
| `AuthorDisplayPolicy` | `ghost` \| `pseudonym` \| `public` \| `forced_ghost` | `forced_ghost` for sensitive |
| `SensitiveCategory` | enum subset | Triggers INV-A3 |

---

## Domain services

### `SensitiveCategoryPolicy`

```typescript
// Conceptual — lives in packages/domain/src/identity/
applyAuthorDisplay(
  category: OccurrenceCategory,
  requestedMode: IdentityMode,
): AuthorDisplayPolicy
```

Returns `forced_ghost` when category ∈ sensitive list.

### `ContentPolicyService`

```typescript
validateUserText(text: string): Result<SanitizedText, DoxxingDetected>
```

Used by Identity and Validation contexts via port.

### `IdentityRotationService`

Verifies cryptographic proof between old and new local keys; delegates to `ContributorIdentity.rotate()`.

---

## Ports (interfaces)

| Port | Methods | Adapter location |
|------|---------|------------------|
| `ContributorIdentityRepository` | `save`, `findById`, `findByReputationId`, `findByPseudonym` | `apps/api/infrastructure/database` |
| `SessionTokenIssuer` | `issue`, `revoke` | `apps/api/infrastructure/auth` |
| `CryptographicProofVerifier` | `verifyRotationProof` | `apps/api/infrastructure/crypto` |
| `ContentPolicyPort` | `scanForDoxxing` | `packages/domain` default + infra override |

---

## Domain events

| Event | Payload (no PII) |
|-------|-------------------|
| `ContributorSessionCreated` | `contributorId`, `cityId`, `reputationId` |
| `ReputationIdentityAssigned` | `reputationId`, `cityId` |
| `IdentityModeChanged` | `contributorId`, `from`, `to` |
| `PseudonymSet` | `contributorId`, `cityId` — **no pseudonym in event bus** (privacy) |
| `IdentityRotated` | `contributorId`, `reputationId` |
| `SensitiveDisplayPolicyApplied` | `occurrenceId`, `policy: forced_ghost` |

Events for public bus exclude pseudonyms and display names.

---

## Folder layout (planned)

```text
packages/domain/src/identity/
├── contributor-identity.entity.ts
├── contributor-identity.entity.spec.ts
├── public-profile.entity.ts
├── value-objects/
│   ├── identity-mode.vo.ts
│   ├── reputation-id.vo.ts
│   ├── pseudonym.vo.ts
│   ├── contributor-ref.vo.ts
│   └── author-display-policy.vo.ts
├── services/
│   ├── sensitive-category-policy.ts
│   ├── sensitive-category-policy.spec.ts
│   └── content-policy.service.ts
├── events/
│   ├── contributor-session-created.event.ts
│   └── identity-mode-changed.event.ts
└── ports/
    ├── contributor-identity.repository.port.ts
    └── content-policy.port.ts

packages/shared/src/identity/
├── bootstrap-session.schema.ts
├── change-identity-mode.schema.ts
└── pseudonym.schema.ts
```

---

## Application layer (API vertical slice)

```text
apps/api/src/features/identity/
├── bootstrap-session/
│   ├── bootstrap-session.controller.ts
│   ├── bootstrap-session.handler.ts
│   └── bootstrap-session.handler.spec.ts
├── change-identity-mode/
├── rotate-identity/
└── identity.module.ts
```

Handlers: load aggregate → call domain method → persist → publish events.

---

## Database sketch (not migration — spec only)

```text
contributors
  id, city_id, reputation_id, identity_mode, pseudonym,
  public_profile_id, local_key_fingerprint, version, ...

public_profiles
  id, city_id, contributor_id, display_name, credentials_ref, ...

-- NO contributor_latitude, contributor_longitude, ip_history, device_model
```

RLS: contributors readable only by same session role or admin; sensitive audit via `security_audit` role only.

---

## Invariant ownership

| Invariant | Enforced by |
|-----------|-------------|
| INV-A1–A8 | `ContributorIdentity`, domain services |
| No contributor GPS | `CreateOccurrence` in Occurrences + shared Zod `.strict()` |
| Sensitive author hidden | `SensitiveCategoryPolicy` + Occurrences read mapper |

---

## Related docs

- [Business rules](business-rules.md)
- [TDD plan](tdd-plan.md)
- [Monorepo structure](../../architecture/monorepo-structure.md)
