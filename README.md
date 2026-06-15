# Sorriso Sentinel

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![CI](https://github.com/AlexandreZanata/sorriso-sentinel/actions/workflows/ci.yml/badge.svg)](https://github.com/AlexandreZanata/sorriso-sentinel/actions/workflows/ci.yml)
[![Version](https://img.shields.io/badge/version-0.1.0-blue)](VERSION)

Open source monitoring and sentinel platform. Built with enterprise-grade architecture, test-driven development, and full transparency.

## Status

Early development. Stack and domain model are defined. Application monorepo scaffolding is next.

## Features (planned)

- **Occurrence-centric domain** — one lifecycle for all report types
- **Territorial memory** — historical intelligence per street, neighborhood, rural route
- **Privacy by default** — anonymous contribution, optional identity, RLS
- **Community validation** — consensus-based confidence, invisible trust scores
- **City health** — neighborhood indicators and trend analytics
- Enterprise architecture: Clean Architecture, DDD, Vertical Slice
- TDD-first development workflow
- Full open source under Apache 2.0

## Documentation

| Topic | Link |
|-------|------|
| System logic | [docs/system/README.md](docs/system/README.md) |
| Technology stack | [docs/architecture/stack.md](docs/architecture/stack.md) |
| All docs | [docs/README.md](docs/README.md) |

## Quick start

```bash
git clone https://github.com/AlexandreZanata/sorriso-sentinel.git
cd sorriso-sentinel
nvm use          # optional — matches .nvmrc (Node 20+)
make setup       # install deps, git hooks, validate
cp .env.example .env
make docker-up   # optional — Postgres, Redis, MinIO
```

Create a topic branch before making changes — see [development setup](docs/contributing/development-setup.md).

```bash
git checkout main && git pull origin main
git checkout -b feat/your-feature
make check       # run before opening a PR
```

Application runtime setup will be added when the stack is chosen.

## Documentation

| Topic | Link |
|-------|------|
| All docs | [docs/README.md](docs/README.md) |
| Development setup | [docs/contributing/development-setup.md](docs/contributing/development-setup.md) |
| Branches & workflow | [docs/contributing/branches.md](docs/contributing/branches.md) |
| Contributing | [CONTRIBUTING.md](CONTRIBUTING.md) |
| Versioning | [docs/contributing/versioning.md](docs/contributing/versioning.md) |
| Open source governance | [docs/open-source/governance.md](docs/open-source/governance.md) |
| Security | [SECURITY.md](SECURITY.md) |

## Contributing

We welcome contributions. Please read:

1. [CONTRIBUTING.md](CONTRIBUTING.md)
2. [Code of Conduct](CODE_OF_CONDUCT.md)
3. [docs/contributing/commits.md](docs/contributing/commits.md)
4. [docs/contributing/pull-requests.md](docs/contributing/pull-requests.md)

All code, comments, commits, and documentation must be in **English**.

## Versioning

This project follows [Semantic Versioning](https://semver.org/). The current version is in [VERSION](VERSION). Release notes are in [CHANGELOG.md](CHANGELOG.md).

## License

Licensed under the Apache License, Version 2.0. See [LICENSE](LICENSE).
