# Sorriso Sentinel — Documentation

All project documentation **must be written in English**.

## Contributing

| Guide | Description |
|-------|-------------|
| [Commits](contributing/commits.md) | Commit message format and git rules |
| [Pull Requests](contributing/pull-requests.md) | PR template, review criteria, merge requirements |
| [CI/CD](contributing/ci-cd.md) | Pipeline stages, deployment, and infrastructure |
| [Versioning](contributing/versioning.md) | SemVer, changelog, and release process |

## Open source

| Guide | Description |
|-------|-------------|
| [Governance](open-source/governance.md) | License, policies, branch protection, dependency rules |

## Architecture

| Guide | Description |
|-------|-------------|
| [ADRs](adr/README.md) | Architecture Decision Records — how to write and store them |

## Language policy

- **Code, comments, tests, commits, PRs, docs**: English only
- **User prompts**: any language — agent output in artifacts remains English
- **End-user UI**: localized via i18n when needed; keys and default strings in English

Cursor rules enforcing these standards live in `.cursor/rules/`.
