# Architecture Decision Records (ADRs)

ADRs document significant architecture decisions. **All ADRs must be written in English.**

## When to write an ADR

- Choosing between architectural patterns (CQRS, event-driven, etc.)
- Database or persistence strategy changes
- Authentication/authorization approach
- Multitenancy model
- Breaking API or schema changes
- Adopting a new external service or library with broad impact

## File naming

```
docs/adr/NNNN-short-title-in-kebab-case.md
```

Example: `docs/adr/0001-use-vertical-slice-architecture.md`

## Template

```markdown
# NNNN. Title in English

Date: YYYY-MM-DD
Status: proposed | accepted | deprecated | superseded

## Context

What is the issue or decision drivers?

## Decision

What was decided?

## Consequences

What becomes easier or harder? What are the trade-offs?

## Alternatives considered

What other options were evaluated and why rejected?
```

## Status lifecycle

1. **proposed** — under discussion
2. **accepted** — approved and in effect
3. **deprecated** — no longer recommended
4. **superseded** — replaced by a newer ADR (link to it)
