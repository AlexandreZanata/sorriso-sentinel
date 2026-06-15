# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Phase 7 admin slice: `occurrence_audit` table, audit summary read model, `GET /admin/audit-summary`
- `GET /admin/moderation-queue` with `moderator` / `city_admin` RBAC
- Anonymity Step 7 RLS integration tests and `docker-validate` RLS checks
- `sentinel_app` non-superuser runtime DB role so RLS applies in Docker and local API
- Roles `security_audit` and `moderator` wired to admin routes with 401/403 integration tests
- Local development environment: Node tooling, Husky git hooks, commitlint, Makefile
- `docs/contributing/development-setup.md` and `docs/contributing/branches.md`
- CI parity via `npm run validate` and `make check`
- Turborepo monorepo: domain, shared, geo, database packages + api, worker, web, mobile apps
- Docker Compose for Postgres 18 (PostGIS), Redis, MinIO — pinned images, `docker:validate` in CI
- Production and Docker deployment docs (`docs/deployment/`)
- Expo SDK 54 (React Native 0.81, React 19.1)
- Fix markdownlint scanning nested `node_modules` in workspaces

### Changed

- `GET /admin/audit-summary` returns real audit metrics (requires `security_audit` or `city_admin`)
- Phase gate checklist: Phases 2–6 marked complete; Phase 7 opened

## [0.1.0] - 2026-06-15

### Added

- Apache 2.0 open source license and NOTICE file
- Project documentation (`docs/`) with contributing, CI/CD, and ADR guides
- Cursor rules for enterprise architecture, TDD, and English-only artifacts
- GitHub workflows: CI validation and release automation
- Issue and pull request templates
- Semantic versioning (`VERSION` file) and changelog policy
- Code of Conduct, Security Policy, and Contributing guide

[Unreleased]: https://github.com/AlexandreZanata/sorriso-sentinel/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/AlexandreZanata/sorriso-sentinel/releases/tag/v0.1.0
