# Security Policy

## Supported versions

| Version | Supported |
|---------|-----------|
| latest release | yes |
| older releases | security fixes at maintainer discretion |

See [VERSION](VERSION) and [releases](https://github.com/AlexandreZanata/sorriso-sentinel/releases) for the current version.

## Reporting a vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

Please report security issues privately:

1. Use [GitHub Private Vulnerability Reporting](https://github.com/AlexandreZanata/sorriso-sentinel/security/advisories/new) (preferred)
2. Or contact the repository maintainer directly

Include:

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

## Response timeline

| Stage | Target |
|-------|--------|
| Acknowledgment | within 3 business days |
| Initial assessment | within 7 business days |
| Fix or mitigation plan | depends on severity |

## Disclosure policy

- We follow coordinated disclosure
- Credit will be given to reporters unless they prefer to remain anonymous
- A security advisory and patched release will be published after a fix is available

## Secure development

This project follows practices documented in:

- [.cursor/rules/04-security.mdc](.cursor/rules/04-security.mdc)
- [docs/contributing/ci-cd.md](docs/contributing/ci-cd.md) (security scanning in CI)

Never commit secrets, credentials, or API keys to the repository.
