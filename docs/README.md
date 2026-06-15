# Sorriso Sentinel — Documentation

All project documentation **must be written in English**.

## Contributing

| Guide | Description |
|-------|-------------|
| [Development setup](contributing/development-setup.md) | Local environment, git hooks, commands |
| [Branches](contributing/branches.md) | Branch strategy, development flow, where to commit |
| [Commits](contributing/commits.md) | Commit message format and git rules |
| [Pull Requests](contributing/pull-requests.md) | PR template, review criteria, merge requirements |
| [CI/CD](contributing/ci-cd.md) | Pipeline stages, deployment, and infrastructure |
| [Versioning](contributing/versioning.md) | SemVer, changelog, and release process |

## Open source

| Guide | Description |
|-------|-------------|
| [Governance](open-source/governance.md) | License, policies, branch protection, dependency rules |

## Deployment

| Guide | Description |
|-------|-------------|
| [Production](deployment/production.md) | Deploy checklist, architecture, rollback |
| [Docker](deployment/docker.md) | Local infra, validation, pinned images |

## Architecture

| Guide | Description |
|-------|-------------|
| [Technology stack](architecture/stack.md) | NestJS, PostgreSQL 18.1, Redis, clients |
| [Monorepo structure](architecture/monorepo-structure.md) | Turborepo layout, Vertical Slice modules |
| [ADRs](adr/README.md) | Architecture Decision Records |

## System logic

| Guide | Description |
|-------|-------------|
| [System docs](system/README.md) | Domain model, lifecycle, privacy, intelligence |

## Language policy

- **Code, comments, tests, commits, PRs, docs**: English only
- **User prompts**: any language — agent output in artifacts remains English
- **End-user UI**: localized via i18n when needed; keys and default strings in English

Cursor rules enforcing these standards live in `.cursor/rules/`.
