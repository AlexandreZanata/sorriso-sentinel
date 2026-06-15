# User Account

**Bounded context:** Identity & Privacy  
**Status:** spec complete · domain in implementation  
**Ubiquitous language:** `UserAccount` (implementation) = `PublicProfile` (legacy name in [Anonymity](../anonymity/domain-model.md))

## One-line summary

Optional verified-email account linked to an existing `ContributorIdentity` — enables public mode and session recovery without requiring registration for civic actions.

## Why it is not mandatory

Sorriso Sentinel follows [Principle 1 — No account required](../../system/privacy-and-identity.md). A user account is a **voluntary upgrade** for contributors who want a public profile, multi-device history, or email verification — never a gate for reporting, validating, or commenting.

## Docs in this module

| File | Description |
|------|-------------|
| [business-rules.md](business-rules.md) | Permissions, invariants, LGPD compliance |
| [flows.md](flows.md) | Registration, email verification, guards |
| [domain-model.md](domain-model.md) | DDD — aggregates, VOs, PQC, ports |
| [tdd-plan.md](tdd-plan.md) | Red → Green test plan |

## Relationship with existing features

| Feature | Integration |
|---------|-------------|
| [Anonymity](../anonymity/README.md) | `ContributorIdentity.publicProfileId` points to `UserAccount.id` |
| [Occurrence creation](../occurrence-creation/README.md) | `public` mode + `showIdentityOnReports` via session |
| [Community validation](../community-validation/README.md) | Votes use `reputationId` — account does not expose PII |
| [Reputation](../reputation/README.md) | Reputation remains decoupled from email |

## Post-quantum cryptography (overview)

| Use | Algorithm (NIST FIPS 203/204) | Where |
|-----|-------------------------------|-------|
| Session key exchange | **ML-KEM-768** (Kyber) | Bootstrap + account registration |
| Device signature | **ML-DSA-65** (Dilithium3) | One account / device binding proof |
| Hybrid transition | X25519 + ML-KEM | Legacy clients during rollout |
| Password (if used) | **Argon2id** | Infra — classical hash, not replaced by PQC |

Details in [domain-model.md](domain-model.md#post-quantum-cryptography).

## Depends on

- [Anonymity](../anonymity/README.md) — `ContributorIdentity`, local session
- [ADR 0004 — Privacy by default](../../adr/0004-privacy-by-default.md)
- [Authentication & authorization](../../security/authentication-authorization.md)

## ADRs

- [ADR 0004 — Privacy by default](../../adr/0004-privacy-by-default.md)
- ADR 0005 (proposed) — Post-quantum hybrid crypto for identity binding
