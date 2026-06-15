# 0004. Privacy by default, identity optional

Date: 2026-06-15
Status: accepted

## Context

Civic reporting platforms fail when contributors fear identification — especially for safety, crime, and corruption reports. Sorriso Sentinel targets sensitive local intelligence that requires community trust.

## Decision

Adopt **anonymity as the default** and **identity as an explicit opt-in** (Ghost, Pseudonym, or Public mode).

Core rules:

1. No account required to contribute
2. Reputation is mandatory; real identity is optional
3. Never store contributor GPS — only problem location
4. Server-side media anonymization before persistence
5. Sensitive categories never expose author
6. Privacy levels (public, neighborhood, approximate, hidden) enforced via RLS

Authentication: local cryptographic identity (device key pair) as primary; traditional auth optional for Public mode.

## Consequences

### Positive

- Enables honest reporting on sensitive urban and rural issues
- Aligns with Signal-style trust model
- RLS + encryption provide defense in depth

### Negative

- Harder to combat sybil attacks — mitigated by consensus validation and trust weighting
- Support and account recovery are limited for ghost users — by design
- Media anonymization pipeline adds latency and infrastructure

## Alternatives considered

| Alternative | Why rejected |
|-------------|--------------|
| OAuth-only social login | Creates identity barrier; excludes anonymous contributors |
| Real-name policy | Kills sensitive reporting — opposite of mission |
| Client-only EXIF stripping | Unreliable — users unaware of metadata risks |

## Reference

Full specification: [docs/system/privacy-and-identity.md](../system/privacy-and-identity.md)
