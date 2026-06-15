# Open Source Governance

Sorriso Sentinel is **100% open source** under the [Apache License 2.0](../../LICENSE).

## Principles

| Principle | Policy |
|-----------|--------|
| License | Apache 2.0 — permissive, patent grant, enterprise-friendly |
| Transparency | All development in public on GitHub |
| No lock-in | No proprietary dependencies required to build or run |
| Contributions | Welcome via PR; all contributors license under Apache 2.0 |
| Security | Responsible disclosure via [SECURITY.md](../../SECURITY.md) |
| Conduct | [Contributor Covenant](../../CODE_OF_CONDUCT.md) |

## Repository structure

```
.
├── LICENSE              # Apache 2.0 full text
├── NOTICE               # Attribution (required for Apache 2.0 distributions)
├── VERSION              # Current SemVer
├── CHANGELOG.md         # Release history
├── README.md            # Project overview
├── CONTRIBUTING.md      # How to contribute
├── CODE_OF_CONDUCT.md   # Community standards
├── SECURITY.md          # Vulnerability reporting
├── docs/                # All documentation (English)
├── .github/             # CI, release, templates, dependabot
└── .cursor/rules/       # AI agent development standards
```

## Decision making

| Change type | Process |
|-------------|---------|
| Bug fix, docs, tests | PR + review + CI green |
| New feature | Issue/PR + review + CI green |
| Architecture decision | ADR in `docs/adr/` + PR |
| Breaking change | ADR + MAJOR version bump + migration guide |
| Security fix | Private report → patch → advisory → release |

## Maintainers

Maintainers are responsible for:

- Reviewing and merging PRs
- Cutting releases (tags matching `VERSION`)
- Triaging issues and security reports
- Enforcing Code of Conduct

Initial maintainer: repository owner ([AlexandreZanata](https://github.com/AlexandreZanata)).

## Branch protection (recommended GitHub settings)

Configure on `main`:

- [ ] Require pull request before merging
- [ ] Require status checks: `ci / validate`
- [ ] Require branches to be up to date
- [ ] Do not allow bypassing the above settings
- [ ] Restrict force pushes
- [ ] Restrict deletions

## Intellectual property

- All contributions are licensed under Apache 2.0 (see [CONTRIBUTING.md](../../CONTRIBUTING.md))
- Do not submit code you do not have the right to license
- Third-party code must include compatible license and attribution in `NOTICE`

## Trademarks

"Sorriso Sentinel" name and logo (when defined) are not granted by the Apache 2.0 license. Use the name fairly to refer to the project; do not imply endorsement.

## Dependencies policy (when stack is defined)

- Prefer OSI-approved licenses (MIT, Apache 2.0, BSD, ISC)
- Avoid copyleft (GPL) in core runtime unless explicitly decided via ADR
- Document all licenses in dependency audit (CI)
- Use Dependabot for automated security updates

## Open source checklist

- [x] LICENSE (Apache 2.0)
- [x] NOTICE
- [x] README with license badge
- [x] CONTRIBUTING.md
- [x] CODE_OF_CONDUCT.md
- [x] SECURITY.md
- [x] CHANGELOG.md
- [x] VERSION file
- [x] CI workflow
- [x] Release workflow
- [x] Issue templates
- [x] PR template
- [x] Dependabot config
- [ ] Stack-specific license audit (when dependencies exist)
- [ ] Docker images published (when application exists)
