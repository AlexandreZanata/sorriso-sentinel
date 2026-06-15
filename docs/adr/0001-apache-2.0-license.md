# 0001. Apache 2.0 as project license

Date: 2026-06-15
Status: accepted

## Context

Sorriso Sentinel is intended to be 100% open source with enterprise-friendly terms that allow commercial use, modification, and distribution while providing patent protection.

## Decision

Adopt the **Apache License 2.0** as the sole license for the project.

Include a `NOTICE` file for attribution as required by Apache 2.0 distributions.

## Consequences

### Positive

- Permissive license widely used in enterprise open source
- Explicit patent grant protects contributors and users
- Compatible with most OSI-approved dependency licenses
- Clear contribution licensing via Apache 2.0 CLA-free model

### Negative

- No copyleft requirement — downstream can keep modifications private
- Trademark rights are not granted (project name/logo need separate policy)

## Alternatives considered

| License | Why not chosen |
|---------|----------------|
| MIT | Simpler but no explicit patent grant |
| GPL v3 | Copyleft may limit enterprise adoption |
| AGPL | Network copyleft too restrictive for typical enterprise use |
