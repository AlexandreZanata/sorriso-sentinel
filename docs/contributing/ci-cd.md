# CI/CD Guidelines

Pipeline configuration and all CI-related documentation **must be written in English**.

## Pipeline stages (every PR)

| Stage | Purpose | Must pass |
|-------|---------|-----------|
| Lint | Code style, complexity, static analysis | Yes |
| Unit tests | Domain and application logic | Yes |
| Integration tests | Repos, adapters, DB (Test Containers) | Yes |
| Build | Compile/bundle artifacts | Yes |
| Security scan | Dependencies, SAST (when configured) | Yes (critical) |

## Branch strategy

- `main` — protected; deployable at all times
- Feature branches — `feat/<short-description>`, `fix/<short-description>`
- PRs required to merge into `main`
- No direct pushes to `main` (except hotfix policy if defined)

## Required checks before merge

```
lint → unit-tests → integration-tests → build → (security-scan)
```

Pipeline **fails** on:

- Lint errors or warnings above configured threshold
- Any test failure
- Build failure
- Critical/high security findings (when scanner is enabled)

## Docker

- `Dockerfile` for reproducible builds
- `docker-compose` for local dev (app, DB, cache, queues as needed)
- Multi-stage builds for smaller production images
- No secrets baked into images — use env vars / secret manager

## Deployment

- Automated deploy from protected branches only
- **Feature flags** for gradual rollout
- **Blue-green** or **canary** for critical releases
- Rollback procedure documented and tested

## Infrastructure as Code

- All infra defined in version control (Terraform, Pulumi, CDK, etc.)
- Changes via PR with plan output in CI
- Separate environments: dev, staging, production

## Observability in production

- Structured JSON logs with correlation ID
- Metrics: latency, error rate, throughput
- Health endpoints: `/health`, `/ready`, `/live`
- Alerts on SLO breaches

## Disaster recovery

- Backup strategy documented in `docs/`
- Recovery procedure tested periodically
- RPO/RTO targets defined when production goes live

## Local parity

Contributors should be able to run the same checks locally before pushing:

```bash
# Example — adjust when stack is defined
# npm run lint && npm test && npm run build
# docker compose up -d && npm run test:integration
```

## CI file location

GitHub Actions workflows (active):

| Workflow | File | Trigger |
|----------|------|---------|
| CI | `.github/workflows/ci.yml` | Push/PR to `main` |
| Release | `.github/workflows/release.yml` | Push tag `v*.*.*` |

When the stack is chosen, uncomment lint/test/build steps in `ci.yml` and add stack-specific jobs.

## Release automation

Releases are cut by tagging a commit that matches [VERSION](../../VERSION):

```bash
git tag -a v0.1.0 -m "v0.1.0"
git push origin v0.1.0
```

See [versioning.md](versioning.md) for the full release process.
