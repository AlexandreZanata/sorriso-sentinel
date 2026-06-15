# Pull Request Guidelines

All PR titles, descriptions, and review comments on code **must be written in English**.

## Before opening a PR

- [ ] Branch is up to date with the target branch (`main`)
- [ ] Lint passes locally
- [ ] Unit and integration tests pass locally
- [ ] Build succeeds
- [ ] New/changed behavior has corresponding tests (TDD)
- [ ] No secrets or sensitive files included
- [ ] Code, comments, and docs are English-only
- [ ] ADR added in `docs/adr/` if an architecture decision was made

## PR title

Use Conventional Commits format:

```
feat(orders): add idempotent order creation endpoint
```

## PR description template

```markdown
## Summary
- Brief description of what changed and why
- Mention trade-offs if relevant

## Test plan
- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] Manual verification steps (if any)

## Checklist
- [ ] English-only code and comments
- [ ] No N+1 / query count reviewed for new endpoints
- [ ] Security considerations addressed (auth, validation, OWASP)
- [ ] Tenant isolation verified (if applicable)
```

## Review criteria

Reviewers and agents should verify:

| Area | What to check |
|------|----------------|
| Architecture | Vertical Slice, ports/adapters, domain isolation |
| Database | Soft delete, audit, constraints, query count per route |
| Code quality | Complexity ≤ 10, functions ≤ 40 lines, no king files |
| Security | RBAC, input validation, no sensitive data in logs |
| Tests | Behavior-named tests, Red-Green-Refactor followed |
| Language | All artifacts in English |

## Merge requirements

- All CI checks green
- At least one approval (when team policy applies)
- No unresolved review threads on blocking issues
- Squash or merge per team convention; commit messages remain English

## Agent workflow

When creating a PR via automation:

1. Run `git status`, `git diff`, and compare with base branch
2. Push branch with `-u` if not on remote
3. Create PR with `gh pr create` using the template above
4. Return the PR URL to the user
