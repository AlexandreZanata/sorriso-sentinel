# Anonymity — Flows

User journeys, commands, and domain events for the Identity & Privacy bounded context.

## 1. First visit — anonymous session bootstrap

No signup screen. The app works immediately.

```mermaid
sequenceDiagram
    participant App as Mobile/Web App
    participant API as API (identity)
    participant Domain as ContributorIdentity
    participant DB as PostgreSQL

    App->>App: Generate or load local key pair
    App->>API: POST /identity/sessions (public key fingerprint)
    API->>Domain: createSession(localKeyRef)
    Domain->>Domain: assign reputationId
    Domain->>Domain: mode = ghost (default)
    Domain-->>API: SessionCreated
    API->>DB: insert contributor + reputation row
    API-->>App: sessionToken (short-lived) + reputationId (opaque)
```

**Commands:** `BootstrapAnonymousSession`  
**Events:** `ContributorSessionCreated`, `ReputationIdentityAssigned`  
**Queries:** none (write-only bootstrap)

### Outcomes

| Result | User experience |
|--------|-----------------|
| Success | User lands on map; can report immediately |
| Rate limited | 429 — try later; no account prompt |
| Invalid key | 400 — regenerate local key |

---

## 2. Create occurrence as ghost (default path)

```mermaid
sequenceDiagram
    participant App
    participant API as API (occurrences)
    participant Identity as Identity policy
    participant Occ as Occurrence aggregate
    participant DB

    App->>API: POST /occurrences (problem location, category, privacyLevel)
    Note over App,API: Payload MUST NOT include contributor GPS
    API->>Identity: resolveContributor(session)
    Identity-->>API: reputationId, displayMode=ghost
    API->>Identity: applySensitiveRules(category)
    alt sensitive category
        Identity-->>API: force ghost display
    end
    API->>Occ: create(...)
    Occ-->>API: OccurrenceCreated
    API->>DB: persist (contributor_ref = reputationId only)
    API-->>App: occurrence DTO (no author for sensitive)
```

**Cross-context rule:** Occurrences context receives `ContributorRef` (reputation ID + display policy) — never raw identity document.

---

## 3. Upgrade ghost → pseudonym

Optional; never required to contribute.

```mermaid
sequenceDiagram
    participant App
    participant API
    participant Identity as ContributorIdentity
    participant DB

    App->>API: PATCH /identity/mode { mode: pseudonym, handle: "JoaoDoCentro" }
    API->>Identity: changeMode(pseudonym, handle)
    Identity->>Identity: validate handle (INV-A6)
    Identity-->>API: IdentityModeChanged
    API->>DB: update contributor row
    API-->>App: updated identity profile
```

**Commands:** `ChangeIdentityMode`  
**Events:** `IdentityModeChanged`  
**Failures:** handle taken → 409; profanity → 400; doxxing in handle → 400

---

## 4. Upgrade to public profile (optional traditional auth)

```mermaid
sequenceDiagram
    participant App
    participant API
    participant Auth as Auth service
    participant Identity as ContributorIdentity

    App->>API: POST /identity/register (email, password, displayName) 
    API->>Auth: createCredentials (optional path)
    API->>Identity: linkProfile(credentialsId, displayName)
    Identity-->>API: ProfileLinked
    Note over Identity: reputationId unchanged (INV-A7 prep)
    API-->>App: JWT + public profile
```

OAuth providers may be linked later — never as the only path (ADR-0004).

---

## 5. Sensitive report flow

```mermaid
flowchart TD
    A[User selects category] --> B{Sensitive?}
    B -->|No| C[Apply user identity mode to display]
    B -->|Yes| D[Force ghost display INV-A3]
    D --> E[Higher validation threshold flag]
    E --> F[Encrypt description at rest]
    F --> G[Persist with RLS policy sensitive]
    C --> H[Apply privacy level to map]
    G --> H
```

**Display rule:** API response for sensitive occurrences **never** includes `author`, `pseudonym`, or `profileId` — only `trustedSourceLabel` aggregate.

---

## 6. Identity rotation (reputation preserved)

```mermaid
sequenceDiagram
    participant App
    participant API
    participant Identity as ContributorIdentity

    App->>App: Generate new key pair
    App->>API: POST /identity/rotate { oldKeyProof, newPublicKey }
    API->>Identity: rotateIdentity(proof)
    Identity->>Identity: verify cryptographic link
    Identity-->>API: IdentityRotated (same reputationId)
    API-->>App: new sessionToken
```

User escapes harassment or device loss without losing trust score.

---

## 7. Comment with anti-doxxing

```mermaid
sequenceDiagram
    participant App
    participant API
    participant Policy as ContentPolicyService
    participant Val as Validation context

    App->>API: POST /occurrences/:id/comments { text }
    API->>Policy: scanForDoxxing(text)
    alt contains CPF/phone/plate
        Policy-->>API: reject
        API-->>App: 400 DOXXING_DETECTED
    else clean
        Policy-->>API: sanitized text
        API->>Val: addComment(...)
        API-->>App: 201
    end
```

---

## Command & query catalog (Identity context)

### Commands

| Command | Actor | Description |
|---------|-------|-------------|
| `BootstrapAnonymousSession` | App | First session; assigns reputation |
| `ChangeIdentityMode` | Contributor | ghost ↔ pseudonym ↔ public |
| `SetPseudonym` | Contributor | Set/update handle |
| `LinkPublicProfile` | Contributor | Optional email/password |
| `RotateIdentity` | Contributor | New keys, same reputation |
| `RevokeSession` | Contributor | Logout / discard session |

### Queries

| Query | Actor | Description |
|-------|-------|-------------|
| `GetMyIdentity` | Contributor | Mode, pseudonym, public name |
| `GetMyContributions` | Contributor | List by reputation ID (device-bound) |
| `GetPublicProfile` | Visitor | Only if user enabled public profile |

### Domain events

| Event | Consumers |
|-------|-----------|
| `ContributorSessionCreated` | Analytics (aggregated) |
| `ReputationIdentityAssigned` | Reputation context |
| `IdentityModeChanged` | Audit (no PII) |
| `IdentityRotated` | Security log |
| `SensitiveDisplayPolicyApplied` | Occurrences read model |

---

## Related docs

- [Business rules](business-rules.md)
- [Domain model](domain-model.md)
- [Occurrence lifecycle](../../system/occurrence-lifecycle.md)
