# Privacy and Identity

Anonymity is the **default**. Identity is **optional**. If this is wrong, nobody reports sensitive issues. If right, the platform becomes a powerful urban intelligence network.

Design reference: **Wikipedia + Waze + Signal**.

> **Implementation detail:** See the [Anonymity feature module](../features/anonymity/README.md) for permissions matrix, flows, domain model, and TDD plan. Optional email accounts: [User account module](../features/user-account/README.md).

## Three layers

```text
┌─────────────────────────────────────────────┐
│  PUBLIC LAYER                               │
│  Map, occurrences, aggregated stats         │
│  Everyone can view and contribute           │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│  REPUTATION LAYER (system only)             │
│  Trust scores, validation weights           │
│  Community sees "trusted source" — not IDs  │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│  PRIVATE LAYER (user only)                  │
│  Local keys, identity mode, personal history│
└─────────────────────────────────────────────┘
```

## The 15 principles

### Principle 1 — No account required

```text
Use the system without registration.
```

| Action | Anonymous allowed |
|--------|-------------------|
| Report | Yes |
| Comment | Yes |
| View | Yes |
| Vote / validate | Yes |

### Principle 2 — Identity is optional

| Mode | Display |
|------|---------|
| **Ghost** | Anonymous |
| **Pseudonym** | JoaoDoCentro |
| **Public** | João Silva |

### Principle 3 — Separate person from reputation

Reputation ID (e.g. `Rep-8F29A`) is mandatory for scoring. Real name is optional. See [reputation and trust](reputation-and-trust.md).

### Principle 4 — Never store user location

| Store | Do not store |
|-------|--------------|
| Problem location | Contributor GPS at report time |
| Approximated point (per privacy level) | Device location history |

### Principle 5 — Minimal metadata

Do **not** retain:

- Historical IP addresses
- Browser fingerprint
- Device model

Retain only what security absolutely requires (rate limiting token, short-lived session) with minimal TTL.

### Principle 6 — Anonymized photos

Every uploaded photo passes through a **server-side worker** before persistence:

| Removed | Why |
|---------|-----|
| GPS / EXIF coordinates | Deanonymization risk |
| Device model | Fingerprinting |
| Author metadata | Identity leak |
| Original capture timestamp | Correlation attack |

Client-side stripping is **not trusted** — always re-process in worker.

> **Implementation detail:** [Media upload feature module](../features/media-upload/README.md)

### Principle 7 — Sensitive report mode

Categories: corruption, crime, trafficking, violence.

- Author is **never** displayed — enforced at API, DB (RLS), and UI
- Higher validation thresholds
- Audit access restricted to security role

### Principle 8 — Invisible trust score

System knows contributor trust. Community sees:

```text
"Trusted source" / "New source"
```

Never raw scores tied to visible names.

### Principle 9 — Consensus validation

An occurrence gains strength only with **independent confirmations** (default: 5+). Single reports are never promoted alone.

### Principle 10 — Encrypt sensitive fields

Fields requiring encryption at rest (`pgcrypto` or application-level):

- Sensitive report content
- Private messages
- Contact details (if ever collected)

### Principle 11 — Privacy levels at report time

| Level | Behavior |
|-------|----------|
| **Public** | Full visibility on map |
| **Neighborhood** | Only neighborhood name shown, not exact point |
| **Approximate** | Point shifted 50m / 100m / 200m from real location |
| **Hidden** | Statistics only — no map pin |

Enforced via PostGIS functions + Row Level Security policies.

### Principle 12 — Anti-doxxing

Block in comments and free text:

- Full names, CPF, phone, license plates, residential addresses

Content filter runs server-side on write.

### Principle 13 — Disposable local identity

User creates a **local identity** (cryptographic key pair) without email or phone. Receives a key only — wallet model.

### Principle 14 — Transferable reputation

Identity rotation preserves reputation via cryptographic proof between old and new keys.

### Principle 15 — Proof without exposure

Photos and videos are validated by the system. Attribution is never exposed publicly for sensitive content.

## Authentication model

| Mechanism | Use case |
|-----------|----------|
| Local key pair (device-generated) | Default anonymous/pseudonym contributors |
| Optional traditional auth | Public mode users who want a linked profile |
| Short-lived JWT | Session tokens — rotate frequently |
| Refresh tokens | Separate, revocable |

No OAuth-only access — external providers are optional, not the sole path.

## Database enforcement

| Mechanism | Applies to |
|-----------|------------|
| Row Level Security (RLS) | Tenant/city isolation + privacy levels |
| `pgcrypto` | Sensitive column encryption |
| Soft delete | All business records |
| Audit trail | State changes — without PII in logs |

## Implementation checklist

- [ ] Server-side media anonymization worker (before S3 persist)
- [ ] RLS policies per privacy level
- [ ] Anti-doxxing content filter on `CommentAdded`
- [ ] Sensitive category author suppression at all layers
- [ ] No contributor GPS column in any table
- [ ] Rate limiting (Redis) without IP history retention

## Related docs

- [Anonymity feature module](../features/anonymity/README.md) — detailed business rules and TDD
- [Reputation and trust](reputation-and-trust.md)
- [Occurrence lifecycle](occurrence-lifecycle.md)
- [Technology stack](../architecture/stack.md)
