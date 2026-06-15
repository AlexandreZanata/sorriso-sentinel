# User Account — Business Rules

Business rules for the optional email account. Complements [Anonymity](../anonymity/business-rules.md) — does not replace anonymous sessions.

## Actors

| Actor | Description | Authentication |
|-------|-------------|----------------|
| **Ghost contributor** | Session without account | Local key + session token |
| **Registered user** | Account with verified email | JWT + active `UserAccount` |
| **Pending user** | Registration started, email not verified | Limited token (no public actions) |
| **Moderator** | Content moderation | JWT + `moderator` |
| **DPO / LGPD officer** | Data subject rights handling | JWT + `lgpd_officer` |

> **Rule U0:** Creating an account is **never** a prerequisite for civic actions (Principle 1).

---

## Permissions matrix

Legend: ✅ allowed · ❌ forbidden · ⚠️ conditional

### Account lifecycle

| Action | Ghost | Pending | Registered | Moderator |
|--------|-------|---------|------------|-----------|
| Use app without account | ✅ | — | — | — |
| Start registration (link email) | ⚠️ upgrade | — | ❌ already exists | — |
| Verify email | ❌ | ✅ | ❌ | — |
| Resend verification email | ❌ | ⚠️ rate limit | ❌ | — |
| Activate `public` mode | ❌ | ❌ | ✅ | — |
| Display real name on report | ❌ | ❌ | ⚠️ opt-in | — |
| Export personal data (LGPD Art. 18) | ⚠️ local only | ⚠️ partial | ✅ | — |
| Request erasure (LGPD Art. 18) | ⚠️ local key | ✅ | ✅ | — |
| Recover session via email | ❌ | ❌ | ✅ | — |

### Abuse prevention (logical guards)

| Action | Ghost | Pending | Registered |
|--------|-------|---------|------------|
| Create 2nd account on same device | — | ❌ INV-U3 | ❌ INV-U3 |
| Create account with email already used in city | — | ❌ INV-U4 | ❌ |
| Register without LGPD consent | — | ❌ INV-U5 | — |
| Register without PQC device proof | — | ❌ INV-U6 | — |

---

## Domain invariants

| ID | Invariant |
|----|-----------|
| **INV-U1** | Account can only be created for an existing `ContributorIdentity` in the same `cityId` |
| **INV-U2** | Email must be verified before `status = active` |
| **INV-U3** | At most **one** active or pending account per `DeviceBindingDigest` per `cityId` |
| **INV-U4** | Normalized email is unique per `cityId` (case-insensitive) |
| **INV-U5** | Registration requires `LgpdConsent` with current terms and privacy policy versions |
| **INV-U6** | Device binding requires valid **ML-DSA-65** signature over nonce + `contributorId` |
| **INV-U7** | Raw IP, browser fingerprint, and device model are **never** persisted |
| **INV-U8** | Only irreversible digest (`DeviceBindingDigest`) with TTL ≤ 72h may be used for INV-U3 |
| **INV-U9** | Domain events and logs **never** include email, IP, or device digest |
| **INV-U10** | Erasure (LGPD) anonymizes email and revokes tokens; `reputationId` remains (Principle 3) |
| **INV-U11** | Anti-doxxing (INV-A8) applies to `DisplayName` |
| **INV-U12** | Sensitive categories still force ghost display (INV-A3) — public account does not override |

---

## LGPD — Brazilian General Data Protection Law

### Legal bases (Art. 7)

| Purpose | Legal basis | Minimum data |
|---------|-------------|--------------|
| Optional account creation | Art. 7, I — consent | email, displayName, consentRecord |
| Email verification | Art. 7, I — consent | email, token hash |
| Fraud prevention (1 account/device) | Art. 7, IX — legitimate interest | `DeviceBindingDigest` (TTL 72h) |
| Session security | Art. 7, IX — legitimate interest | rate-limit key (Redis TTL) |
| Data subject rights handling | Art. 7, II — legal obligation | request record |

### Personal data categories

| Category | Examples | Retention | Encryption |
|----------|----------|-----------|------------|
| Identification | normalized email | Until erasure or 2 years inactivity | `pgcrypto` / app-level AES-256-GCM |
| Profile | displayName | Until erasure | plain text (no sensitive PII) |
| Consent | terms version, timestamp | 5 years (compliance) | append-only audit |
| Anti-abuse signal | DeviceBindingDigest | ≤ 72h Redis | irreversible hash |
| **Never collected** | IP history, contributor GPS, IMEI, persistent fingerprint | — | — |

### Data subject rights (Art. 18)

| Right | Domain implementation | SLA |
|-------|----------------------|-----|
| Confirmation and access | `UserAccount.exportPersonalData()` | 15 days |
| Correction | `UserAccount.updateDisplayName()` | 15 days |
| Anonymization / erasure | `UserAccount.requestErasure()` | 15 days |
| Portability | structured JSON export | 15 days |
| Consent withdrawal | `UserAccount.revokeConsent()` → blocks use until new consent | immediate |
| Objection (anti-abuse signal) | opt-out blocks registration; anonymous use remains | immediate |

### LGPD principles applied (Art. 6)

| Principle | How the domain enforces it |
|-----------|---------------------------|
| Purpose | Account only for optional public profile — no scoring, no ads |
| Adequacy | Data limited to email + display name |
| Necessity | No phone, CPF, or address in v1 |
| Free access | Export via dedicated handler |
| Data quality | VOs validate format before persist |
| Transparency | terms versions recorded in `LgpdConsent` |
| Security | PQC + encryption at rest + events without PII |
| Prevention | guards before `registerNew()` |
| Non-discrimination | optional account — ghost never penalized |
| Accountability | audit trail for consent and erasure |

### DPO and incidents

- DPO channel documented in public privacy policy (outside code).
- Email breach: notify ANPD + data subjects within 72h (operational process).

---

## Data the system NEVER stores

| Data | Enforcement |
|------|-------------|
| Raw IP | Hash at edge → disposable digest; INV-U7 |
| IP history | No table; Redis TTL only |
| Full browser fingerprint | Not collected |
| Persistent device model | Not collected |
| Contributor GPS | INV-A4 (Anonymity) |
| Email in logs or event bus | INV-U9 |

---

## Permitted metadata (minimal)

| Data | TTL | Purpose |
|------|-----|---------|
| `DeviceBindingDigest` | 72h (Redis) | INV-U3 — 1 account / device |
| Rate-limit key (registration) | 1h | anti-spam registration |
| Email verification token (hash) | 24h | INV-U2 |
| `pqcPublicKeyRef` | account lifetime | ML-DSA cryptographic proof |

---

## Explicit non-goals (v1)

- Verification via CPF or government ID
- OAuth as the sole identity path
- "Verified citizen" badge tied to real-world ID
- Sharing device digest with moderators
- History of devices linked to the account

---

## Enforcement layers

| Rule | Domain | API | Database |
|------|--------|-----|----------|
| INV-U3 unique device | `SingleAccountPerDevicePolicy` | 409 `DEVICE_ALREADY_REGISTERED` | Redis SET NX + TTL |
| INV-U4 unique email | `UserAccount.registerNew()` | 409 `EMAIL_ALREADY_USED` | UNIQUE (`city_id`, `email_normalized`) |
| INV-U2 verification | `EmailVerificationPolicy` | 403 until verified | `email_verification_state` |
| INV-U5 consent | `LgpdConsent` VO | 400 without consent | `consent_record` JSONB |
| INV-U7 no IP | `DeviceBindingDigest` VO | handler hashes at edge | no IP column |
| LGPD erasure | `requestErasure()` | soft delete + anonymization | `deleted_at`, email null |

---

## Related docs

- [Flows](flows.md)
- [Domain model](domain-model.md)
- [TDD plan](tdd-plan.md)
- [Anonymity business rules](../anonymity/business-rules.md)
- [Privacy principles](../../system/privacy-and-identity.md)
- [Secrets and data protection](../../security/secrets-logging-and-data.md)
