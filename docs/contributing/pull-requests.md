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
- [ ] [Security phase gate](../security/phase-gate-checklist.md) completed for current phase (universal gates + phase section)

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

## Security
- Phase gate sections completed: <!-- e.g. Universal + Phase 2 -->
- [ ] Authorization tested (401/403)
- [ ] Tenant isolation verified
- [ ] No new SQL injection surface ([sql-injection](../security/sql-injection.md))
- [ ] IDOR / object-level access reviewed ([idor](../security/idor-and-access-control.md))
- [ ] Rate limits considered for new public endpoints

## Checklist
- [ ] English-only code and comments
- [ ] No N+1 / query count reviewed for new endpoints
- [ ] Security considerations addressed — see [security docs](../security/README.md)
- [ ] Tenant isolation verified (if applicable)
```

## Review criteria

Reviewers and agents should verify:

| Area | What to check |
|------|----------------|
| Architecture | Vertical Slice, ports/adapters, domain isolation |
| Database | Soft delete, audit, constraints, query count per route |
| Code quality | Complexity ≤ 10, functions ≤ 40 lines, no king files |
| Security | Phase gate, IDOR, SQLi, CORS, upload limits, chain failures — [security/](../security/README.md) |
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
