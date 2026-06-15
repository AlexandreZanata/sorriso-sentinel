# User Account — Domain Model (DDD)

Bounded context: **Identity & Privacy** (optional account sub-module)  
Package root: `packages/domain/src/identity/`

## Context map

```text
┌─────────────────────┐     contributorId      ┌─────────────────────┐
│  ContributorIdentity │◀──────────────────────│    UserAccount       │
│  (aggregate)         │     publicProfileId    │    (aggregate)       │
└─────────┬───────────┘────────────────────────▶└─────────┬───────────┘
          │ ContributorRef                                 │
          ▼                                                │ events (no PII)
┌─────────────────────┐                                   ▼
│    Occurrences      │                          ┌─────────────────────┐
└─────────────────────┘                          │  Audit / Outbox     │
                                                 └─────────────────────┘
```

**Integration rule:** Occurrences continues importing only `ContributorRef` — never `UserAccount` or email.

---

## Aggregates

### UserAccount (aggregate root)

Optional account linked to a contributor. Alias of `PublicProfile` in legacy Anonymity docs.

```text
UserAccount
├── id: UserAccountId (uuid v7)
├── cityId: CityId
├── contributorId: ContributorId (logical FK — INV-U1)
├── email: EmailAddress (VO — encrypted in infra)
├── displayName: DisplayName (VO)
├── status: UserAccountStatus (VO)
├── emailVerificationState: EmailVerificationState (VO)
├── showIdentityOnReports: boolean (default false)
├── pqcPublicKeyRef: PqcPublicKeyRef (VO) — ML-DSA-65 fingerprint
├── lgpdConsent: LgpdConsent (VO)
├── version (optimistic lock)
├── createdAt, updatedAt
└── deletedAt: Date | null (LGPD soft delete)
```

**Consistency boundary:** Registration, email verification, consent, and erasure happen inside this aggregate. Reputation score is **not** stored here.

### ContributorIdentity (existing)

Field `publicProfileId` links to `UserAccount.id` when account is active.

---

## Value objects

| VO | Validates | Notes |
|----|-----------|-------|
| `EmailAddress` | simplified RFC 5322, lowercase, max 254 | INV-U4 uniqueness in infra |
| `DisplayName` | 2–64 chars, INV-A8 anti-doxxing | Public mode only |
| `EmailVerificationState` | `pending` \| `verified` \| `expired` | INV-U2 |
| `UserAccountStatus` | `pending_verification` \| `active` \| `suspended` \| `deleted` | LGPD erasure |
| `DeviceBindingDigest` | 64 hex (SHA3-512 output) | INV-U7 — never raw IP |
| `LgpdConsent` | termsVersion, privacyVersion, consentedAt, purposes[] | INV-U5 |
| `PqcPublicKeyRef` | 32–128 hex fingerprint | ML-DSA-65 public key hash |

---

## Domain services and policies

### `UserAccountRegistrationGuard`

Orchestrates all guards before `UserAccount.registerNew()`:

```typescript
// Conceptual
assertCanRegister({
  cityId,
  contributorId,
  email,
  deviceBindingDigest,
  lgpdConsent,
  pqcProof,
  checkDevice: AbuseSignalPort,
  checkEmailUnique: (email) => boolean,
  verifyPqc: PqcCryptoPort,
}): void
```

### `SingleAccountPerDevicePolicy`

```typescript
assertUniqueDevice(cityId, deviceBindingDigest, port): Promise<void>
// throws DeviceAlreadyRegisteredError (INV-U3)
```

### `EmailVerificationPolicy`

```typescript
assertTokenValid(token, storedHash, issuedAt, clock): void
// TTL 24h, max 3 resends/hour (infra rate limit)
```

---

## Ports (interfaces)

| Port | Methods | Adapter location |
|------|---------|------------------|
| `AbuseSignalPort` | `isDeviceAlreadyRegistered`, `registerDeviceBinding` | `apps/api/infrastructure/redis` |
| `EmailVerificationPort` | `sendToken`, `hashToken` | `apps/api/infrastructure/email` |
| `PqcCryptoPort` | `verifyMlDsaSignature`, `verifyDeviceAttestation` | `apps/api/infrastructure/crypto/pqc` |
| `UserAccountRepositoryPort` | `save`, `findByEmail`, `findByContributorId` | `apps/api/infrastructure/database` |

---

## Post-quantum cryptography

**Hybrid post-quantum** strategy aligned with NIST FIPS 203 (ML-KEM) and FIPS 204 (ML-DSA):

| Layer | Algorithm | Use in UserAccount |
|-------|-----------|-------------------|
| Key encapsulation | **ML-KEM-768** | Key exchange at registration and session refresh |
| Digital signature | **ML-DSA-65** | Device possession proof (INV-U6) |
| Hybrid transition | X25519 + ML-KEM | Legacy clients during rollout |
| Symmetric at rest | AES-256-GCM | Email encrypted in Postgres |
| Password (optional v2) | Argon2id | Not replaced — password remains classical |

### Device binding proof (INV-U6)

```text
message = SHA3-256(contributorId || deviceNonce || cityId)
signature = ML-DSA-65.Sign(devicePrivateKey, message)
server: PqcCryptoPort.verifyMlDsaSignature(message, signature, pqcPublicKeyRef)
```

The server **never** receives the private key — only `pqcPublicKeyRef` (fingerprint) and signature.

### IP handling (INV-U7, INV-U8)

```text
// Application layer (handler) — NOT domain
digest = HMAC-SHA3-512(citySalt, ip + deviceNonce + registrationAttemptId)
domain receives: DeviceBindingDigest only
IP discarded immediately after hash
Redis TTL: 72h
```

---

## Domain events

| Event | Payload (no PII) |
|-------|-------------------|
| `UserAccountCreated` | `userAccountId`, `cityId`, `contributorId`, `status` |
| `EmailVerified` | `userAccountId`, `cityId`, `contributorId` |
| `UserAccountErasureRequested` | `userAccountId`, `cityId`, `requestedAt` |

---

## Folder layout

```text
packages/domain/src/identity/
├── user-account.entity.ts
├── user-account.entity.spec.ts
├── value-objects/
│   ├── email-address.vo.ts
│   ├── display-name.vo.ts
│   ├── email-verification-state.vo.ts
│   ├── user-account-status.vo.ts
│   ├── device-binding-digest.vo.ts
│   ├── lgpd-consent.vo.ts
│   └── pqc-public-key-ref.vo.ts
├── services/
│   ├── single-account-per-device.policy.ts
│   ├── email-verification.policy.ts
│   └── user-account-registration.guard.ts
├── events/
│   ├── user-account-created.event.ts
│   └── email-verified.event.ts
└── ports/
    ├── abuse-signal.port.ts
    ├── email-verification.port.ts
    ├── pqc-crypto.port.ts
    └── user-account.repository.port.ts
```

---

## Database sketch (spec only)

```text
user_accounts
  id, city_id, contributor_id,
  email_normalized,           -- UNIQUE per city
  email_ciphertext,           -- pgcrypto / app AES
  display_name,
  status, email_verification_state,
  show_identity_on_reports,
  pqc_public_key_ref,
  lgpd_consent JSONB,
  version, created_at, updated_at, deleted_at

-- NO ip_address, device_model, browser_fingerprint columns
-- device binding: Redis key device:{cityId}:{digest} TTL 72h
```

RLS: `user_accounts` readable only by owner session or `lgpd_officer` role.

---

## Invariant ownership

| Invariant | Enforced by |
|-----------|-------------|
| INV-U1–U12 | `UserAccount`, policies, VOs |
| INV-A3 sensitive author | `SensitiveCategoryPolicy` (unchanged) |
| INV-A8 anti-doxxing | `DisplayName` VO + `ContentPolicyService` |
| LGPD erasure | `UserAccount.requestErasure()` |

---

## Related docs

- [Business rules](business-rules.md)
- [TDD plan](tdd-plan.md)
- [Anonymity domain model](../anonymity/domain-model.md)
