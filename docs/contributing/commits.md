# Commit Guidelines

All commit messages **must be written in English**.

## Format

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<optional scope>): <subject>

<optional body>

<optional footer>
```

### Types

| Type | When to use |
|------|-------------|
| `feat` | New feature or behavior |
| `fix` | Bug fix |
| `refactor` | Code change without behavior change |
| `test` | Add or update tests only |
| `docs` | Documentation only |
| `chore` | Tooling, deps, housekeeping |
| `ci` | CI/CD pipeline changes |
| `perf` | Performance improvement |
| `build` | Build system or packaging |

### Subject line

- Imperative mood: "add feature" not "added feature"
- Max 72 characters
- No period at the end
- English only

### Body (optional)

- Explain **why**, not just what
- Wrap at 72 characters
- Separate from subject with a blank line

### Footer (optional)

- Reference issues: `Closes #123`
- Breaking changes: `BREAKING CHANGE: description`

## Examples

```
feat(orders): add idempotent order creation endpoint
```

```
fix(auth): reject expired refresh tokens on rotation

Refresh token rotation now invalidates the previous token
immediately to prevent replay attacks.
```

```
test(inventory): cover insufficient stock rejection
```

## Rules

1. **One logical change per commit** — easy to review and revert
2. **Never commit secrets** — `.env`, credentials, API keys, certificates
3. **Tests with behavior changes** — production code without tests is not allowed (except disposable spikes)
4. **Do not skip hooks** — fix lint/test failures instead of `--no-verify`
5. **Commits only when requested** — agents and contributors create commits only when explicitly asked

## Git safety

- Never force-push to `main`/`master`
- Never amend commits that were already pushed (unless explicitly coordinated)
- Never update git config as part of automated workflows
