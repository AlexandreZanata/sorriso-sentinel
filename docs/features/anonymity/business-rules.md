# Anonymity — Business Rules

This document defines **who can do what** under the anonymity module. Every rule maps to domain invariants, API authorization, or RLS policies.

## Actors

| Actor | Description | Authentication |
|-------|-------------|----------------|
| **Visitor** | Reads public map and stats | None |
| **Anonymous contributor** | Default — ghost session, no account | Session token or local key pair |
| **Pseudonym contributor** | Chose a handle | Local key pair + pseudonym record |
| **Public contributor** | Opted into visible profile | Optional traditional auth + profile |
| **Moderator** | Reviews flagged content | JWT + `moderator` role |
| **Security audit** | Sensitive category audit | JWT + `security_audit` role |

> **Rule A0:** Every contributor action is tied to a **reputation ID** internally, regardless of display mode.

---

## Permissions matrix

Legend: ✅ allowed · ❌ forbidden · ⚠️ conditional (see notes)

### Core civic actions (no account required)

| Action | Visitor | Ghost | Pseudonym | Public | Moderator |
|--------|---------|-------|-----------|--------|-----------|
| View public map | ✅ | ✅ | ✅ | ✅ | ✅ |
| View aggregated city stats | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create occurrence report | ❌ | ✅ | ✅ | ✅ | ✅ |
| Confirm / deny occurrence | ❌ | ✅ | ✅ | ✅ | ✅ |
| Add comment | ❌ | ✅ | ✅ | ✅ | ✅ |
| Upload photo evidence | ❌ | ✅ | ✅ | ✅ | ✅ |
| Vote on non-sensitive polls | ❌ | ✅ | ✅ | ✅ | ✅ |

### Identity and profile

| Action | Visitor | Ghost | Pseudonym | Public | Moderator |
|--------|---------|-------|-----------|--------|-----------|
| Use app without registration | ✅ | ✅ | ✅ | — | — |
| Choose ghost mode | — | ✅ (default) | ⚠️ can switch | ⚠️ can switch | — |
| Set pseudonym handle | ❌ | ⚠️ optional upgrade | ✅ | ✅ | — |
| Link email / password profile | ❌ | ❌ | ⚠️ optional | ✅ | — |
| Display real name on reports | ❌ | ❌ | ❌ | ✅ (opt-in per report) | — |
| View own contribution history | ❌ | ✅ (device only) | ✅ | ✅ | — |
| View another user's history | ❌ | ❌ | ❌ | ⚠️ public profile only | ✅ (moderation) |
| Export personal data | ❌ | ⚠️ local key only | ⚠️ | ✅ | — |
| Delete local identity | ❌ | ✅ | ✅ | ✅ | — |
| Rotate identity (new key, keep reputation) | ❌ | ✅ | ✅ | ✅ | — |

### Sensitive categories

Categories: `corruption`, `crime`, `trafficking`, `violence` (configurable per city).

| Action | Ghost | Pseudonym | Public | Moderator | Security audit |
|--------|-------|-----------|--------|-----------|----------------|
| Report sensitive occurrence | ✅ | ✅ | ✅ | ✅ | — |
| See author on sensitive report | ❌ | ❌ | ❌ | ❌ | ⚠️ audit log only |
| See author on public API/UI | ❌ | ❌ | ❌ | ❌ | ❌ |
| Comment on sensitive thread | ✅ | ✅ | ✅ | ✅ | — |
| Display commenter identity | ❌ | ❌ | ❌ | ⚠️ pseudonym hidden | — |

> **Rule S1:** Sensitive category **always** forces ghost display — even if user is in Public mode.

### Privacy levels (at report time)

| Level | Ghost | Pseudonym | Public | Map pin | Exact coordinates in API |
|-------|-------|-----------|--------|---------|--------------------------|
| Public | ✅ | ✅ | ✅ | ✅ | ✅ (problem location) |
| Neighborhood | ✅ | ✅ | ✅ | ⚠️ area only | ❌ exact point |
| Approximate | ✅ | ✅ | ✅ | ⚠️ shifted 50–200m | ❌ true point |
| Hidden | ✅ | ✅ | ✅ | ❌ | ❌ (stats only) |

> **Rule P1:** Privacy level affects **problem location** visibility — never contributor location (contributor GPS is never stored — Rule L1).

### Data the system must never store

| Data | Any actor | Enforcement |
|------|-----------|-------------|
| Contributor GPS at report time | ❌ | Domain + API reject; no DB column |
| Device location history | ❌ | No table |
| Historical IP addresses | ❌ | Redis TTL only for rate limit |
| Browser fingerprint | ❌ | Not collected |
| Device model (persistent) | ❌ | Not stored on contributor |
| Raw EXIF from photos | ❌ | Worker strips before persist |

### Metadata the system may retain (minimal)

| Data | TTL / scope | Purpose |
|------|-------------|---------|
| Session / rate-limit key | ≤ 24h Redis | Abuse prevention |
| Reputation ID | Permanent | Scoring |
| Pseudonym string | Until identity deleted | Display |
| Problem location | Permanent (per privacy level) | Territorial memory |

---

## Domain invariants

| ID | Invariant |
|----|-----------|
| **INV-A1** | Default identity mode for new session is `ghost` |
| **INV-A2** | `reputationId` is assigned before first contribution |
| **INV-A3** | Sensitive category forces `authorDisplayMode = ghost` regardless of user preference |
| **INV-A4** | Contributor coordinates are never accepted in any command payload |
| **INV-A5** | Public display name appears only when `identityMode = public` AND `showIdentityOnReport = true` |
| **INV-A6** | Pseudonym must be unique per `city_id` (case-insensitive) |
| **INV-A7** | Identity rotation must preserve `reputationId` via cryptographic proof |
| **INV-A8** | Anti-doxxing filter runs on all user-generated text before persist |

---

## Explicit non-goals (v1)

- Proving real-world identity of ghost users
- Showing IP or device info to moderators
- Mandatory phone verification
- "Verified citizen" badges tied to government ID

---

## Enforcement layers

| Rule type | Domain | API | Database |
|-----------|--------|-----|----------|
| INV-A3 sensitive author | `Occurrence` policy service | Strip author from response DTO | RLS hides `contributor_ref` |
| INV-A4 no contributor GPS | `CreateOccurrenceCommand` rejects field | 400 if field present | No column exists |
| INV-A6 pseudonym unique | `ContributorIdentity` aggregate | 409 conflict | UNIQUE (`city_id`, `pseudonym`) |
| Anti-doxxing | `ContentPolicyService` | 400 with code | — |

---

## Related docs

- [Flows](flows.md)
- [Domain model](domain-model.md)
- [TDD plan](tdd-plan.md)
- [Security — IDOR](../../security/idor-and-access-control.md)
- [Privacy principles](../../system/privacy-and-identity.md)
