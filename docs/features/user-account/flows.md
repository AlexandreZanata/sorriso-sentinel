# User Account — Flows

## Primary happy path — optional account registration

```mermaid
sequenceDiagram
  participant App as Mobile/Web
  participant API as API Handler
  participant Domain as UserAccount
  participant Guard as RegistrationGuard
  participant Redis as AbuseSignal (Redis)
  participant Mail as EmailVerificationPort
  participant DB as Postgres

  App->>App: Generate ML-DSA key pair (device)
  App->>App: Sign nonce + contributorId
  App->>API: POST /user-accounts/register
  Note over App,API: email, displayName, consent, pqcSignature, deviceNonce

  API->>API: Hash IP+nonce → DeviceBindingDigest (discard IP)
  API->>Guard: assertCanRegister(digest, email, signature)
  Guard->>Redis: isDeviceAlreadyRegistered(cityId, digest)
  Redis-->>Guard: false
  Guard->>Domain: registerNew(...)
  Domain-->>API: UserAccount + UserAccountCreated
  API->>DB: persist (email encrypted)
  API->>Redis: registerDeviceBinding (TTL 72h)
  API->>Mail: sendVerificationToken (hash only stored)
  API-->>App: 201 pending_verification

  App->>API: POST /user-accounts/verify-email
  API->>Domain: verifyEmail(token)
  Domain-->>API: status = active
  API->>DB: update
  API-->>App: 200 active
```

---

## Alternative paths

### A1 — Device already has an account (INV-U3)

```text
register → Guard → Redis hit → 409 DEVICE_ALREADY_REGISTERED
```

The contributor may continue in ghost/pseudonym mode with the existing local session.

### A2 — Email already registered in city (INV-U4)

```text
register → Guard → email uniqueness → 409 EMAIL_ALREADY_USED
```

Offer session recovery flow (outside domain v1).

### A3 — Invalid PQC signature (INV-U6)

```text
register → PqcCryptoPort.verifyMlDsa → false → 400 INVALID_DEVICE_PROOF
```

### A4 — Missing or outdated LGPD consent (INV-U5)

```text
register → parseLgpdConsent → InvalidLgpdConsentError → 400
```

### A5 — Expired email token

```text
verifyEmail → EmailVerificationPolicy → 400 TOKEN_EXPIRED
Resend: rate limit 3/h per email hash
```

### A6 — LGPD erasure (Art. 18)

```mermaid
sequenceDiagram
  participant User as Registered User
  participant API as API
  participant Domain as UserAccount
  participant DB as Postgres

  User->>API: DELETE /user-accounts/me
  API->>Domain: requestErasure(clock)
  Domain->>Domain: status = deleted, anonymize email
  Note over Domain: reputationId unchanged on ContributorIdentity
  API->>DB: soft delete + revoke tokens
  API-->>User: 204
```

---

## Commands and queries

| Type | Name | Actor | Description |
|------|------|-------|-------------|
| Command | `RegisterUserAccount` | Ghost contributor | Start registration with guards |
| Command | `VerifyEmail` | Pending user | Activate account after token |
| Command | `ResendVerificationEmail` | Pending user | Resend token (rate limited) |
| Command | `UpdateDisplayName` | Active user | Update display name |
| Command | `RevokeLgpdConsent` | Active user | Suspend until new consent |
| Command | `RequestErasure` | Active user | LGPD erasure |
| Query | `GetMyAccount` | Active user | Return profile (no email in logs) |
| Query | `ExportPersonalData` | Active user | LGPD portability |

---

## Domain events emitted

| Event | When | Payload (no PII) |
|-------|------|------------------|
| `UserAccountCreated` | After register | `userAccountId`, `cityId`, `contributorId`, `status: pending_verification` |
| `EmailVerified` | After verify | `userAccountId`, `cityId`, `contributorId` |
| `UserAccountErasureRequested` | LGPD delete | `userAccountId`, `cityId`, `requestedAt` |
| `LgpdConsentRevoked` | User revokes | `userAccountId`, `cityId`, `consentVersion` |

> Event bus **never** carries email, IP, device digest, or display name.

---

## Integration with ContributorIdentity

```text
1. ContributorIdentity.bootstrap() — ghost session (implemented)
2. UserAccount.registerNew(contributorId) — optional
3. ContributorIdentity.linkPublicProfile(userAccountId) — future handler
4. changeMode('public') — only when UserAccount.status = active
```

---

## Related docs

- [Business rules](business-rules.md)
- [Domain model](domain-model.md)
- [Anonymity flows](../anonymity/flows.md)
