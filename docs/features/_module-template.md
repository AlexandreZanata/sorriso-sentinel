# Feature: [Name]

> Copy this file set when adding a new module under `docs/features/<slug>/`.

## README.md

```markdown
# [Feature Name]

**Bounded context:** [Context name]
**Status:** draft | spec complete | in implementation | done

## One-line summary

[What this feature does for the user and the city.]

## Docs in this module

| File | Description |
|------|-------------|
| [business-rules.md](business-rules.md) | Permissions and policies |
| [flows.md](flows.md) | Journeys and sequences |
| [domain-model.md](domain-model.md) | DDD artifacts |
| [tdd-plan.md](tdd-plan.md) | Test plan |

## Depends on

- [Other modules]

## ADRs

- [Link if any]
```

## business-rules.md sections

1. Actors (anonymous session, ghost, pseudonym, public, moderator, …)
2. Permissions matrix (action × actor → allow / deny / conditional)
3. Domain invariants (numbered)
4. API/RLS enforcement notes
5. Edge cases and explicit non-goals

## flows.md sections

1. Primary happy path (mermaid sequence)
2. Alternative paths
3. Commands and queries list
4. Domain events emitted

## domain-model.md sections

1. Aggregate diagram
2. Entities and value objects table
3. Domain services and ports
4. Folder layout in `packages/domain`
5. Integration with other contexts

## tdd-plan.md sections

1. Implementation order (vertical slice steps)
2. Unit tests (domain) — table with test name and rule covered
3. Integration tests (API)
4. Security tests (401/403, tenant, privacy)
