# Reputation and Trust

Reputation is **mandatory**. Personal identity is **optional**. These must never be conflated.

## Separate person from reputation

```text
WRONG:  User → Name → Reputation

RIGHT:  Identity (optional)     Reputation (required)
              ↓                        ↓
        Ghost / Pseudonym      Rep-8F29A
        / Public name          Trust: 92%
```

The community sees contribution quality — not necessarily who contributed.

## Reputation identity

Each contributor receives a reputation ID:

```text
Rep-8F29A
```

Properties:

| Property | Visible to community | Visible to system |
|----------|---------------------|-------------------|
| Reputation ID | No (only "trusted source" labels) | Yes |
| Accuracy rate | Aggregate label only | Yes |
| Report count | No | Yes |
| Real identity | Only if user chose Public mode | Optional |

## Accuracy-based scoring

Not likes. Not followers. **Precision.**

```text
100 occurrences reported
 92 confirmed by community
─────────────────────────
Reliability: 92%
```

Trust score influences validation weight (Principle 8 — invisible trust) but is never exposed as a leaderboard of real names.

> **Implementation detail:** [Reputation feature module](../features/reputation/README.md) — scoring, trust weight, public labels, TDD plan.

## Local specialists

The system identifies expertise from patterns:

| Specialist type | Emerges from |
|-----------------|--------------|
| Neighborhood specialist | High accuracy in a geographic area |
| Traffic specialist | Accurate traffic/accident reports |
| Rural roads specialist | Accurate rural segment reports |

No appointed moderators. **Reputation creates natural authority.**

## Natural hierarchy

```text
New contributor
      ↓ accurate reports
Trusted contributor (invisible score)
      ↓ sustained accuracy in area
Area specialist (badge: "trusted local source")
```

Specialist status affects validation weight — not censorship power. Denials still require consensus.

## Transferable reputation

A contributor may rotate identity while keeping reputation:

```text
Old identity: ABC123  →  New identity: XYZ987
Reputation transfers via cryptographic proof (local key)
```

Enables disposable identities (Principle 13) without losing earned trust.

## Local cryptographic identity

Optional **local identity** — key pair generated on device (wallet-like):

- No email or phone required
- User receives a key only they hold
- Reputation binds to key, not to PII

Traditional auth (email/password) remains optional for Public mode users.

## Anti-gaming

| Threat | Mitigation |
|--------|------------|
| Sybil attacks | Consensus required; trust weight caps for new IDs |
| Collusion rings | Independent confirmation diversity (geo + time spread) |
| Reputation farming | Category-specific accuracy; decay on false reports |

## Related docs

- [Reputation feature module](../features/reputation/README.md) — detailed business rules and TDD
- [Privacy and identity](privacy-and-identity.md)
- [Occurrence lifecycle](occurrence-lifecycle.md) — validation and confidence
