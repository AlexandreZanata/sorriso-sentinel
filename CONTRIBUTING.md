# Contributing to Sorriso Sentinel

Thank you for contributing to an open source project. All contributions must follow the guidelines below.

## Before you start

1. Read the [Code of Conduct](CODE_OF_CONDUCT.md)
2. Set up your environment: [development-setup.md](docs/contributing/development-setup.md)
3. Check existing [issues](https://github.com/AlexandreZanata/sorriso-sentinel/issues) and [pull requests](https://github.com/AlexandreZanata/sorriso-sentinel/pulls)
4. For large changes, open an issue or discussion first

## Language

**English only** for code, comments, tests, commits, PRs, and documentation — even if you communicate in another language elsewhere.

## Development workflow

1. Sync `main`: `git checkout main && git pull origin main`
2. Create a topic branch: `feat/short-description` or `fix/short-description`
3. Follow TDD: write tests first, then implement
4. Commit on the topic branch — **never directly on `main`**
5. Push, open a PR against `main`, and wait for CI + review
6. After merge, delete the topic branch

See [docs/contributing/branches.md](docs/contributing/branches.md) for the full flow.

## Detailed guides

| Guide | Description |
|-------|-------------|
| [Development setup](docs/contributing/development-setup.md) | Local environment, hooks, commands |
| [Branches](docs/contributing/branches.md) | Branch strategy and development flow |
| [Commits](docs/contributing/commits.md) | Conventional Commits format |
| [Pull requests](docs/contributing/pull-requests.md) | PR template and review criteria |
| [CI/CD](docs/contributing/ci-cd.md) | Pipeline requirements |
| [Versioning](docs/contributing/versioning.md) | SemVer and release process |
| [ADRs](docs/adr/README.md) | Architecture decision records |
| [Governance](docs/open-source/governance.md) | Open source policies |

## License

By contributing, you agree that your contributions will be licensed under the [Apache License 2.0](LICENSE).
