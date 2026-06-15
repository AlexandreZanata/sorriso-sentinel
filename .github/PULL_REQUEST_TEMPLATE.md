## Summary

<!-- 1-3 bullet points describing what changed and why -->

-

## Test plan

- [ ] CI passes locally
- [ ] Tests added/updated for new behavior
- [ ] Manual verification (if applicable)

## Security

- Phase gate completed: <!-- Universal + Phase N — see docs/security/phase-gate-checklist.md -->
- [ ] Authorization tested (401/403) for new/changed routes
- [ ] Tenant / `city_id` isolation verified
- [ ] No new SQL injection surface
- [ ] IDOR paths reviewed

## Checklist

- [ ] English-only code and comments
- [ ] CHANGELOG updated under `[Unreleased]` (if user-facing change)
- [ ] No secrets or credentials committed
- [ ] ADR added for architecture decisions (`docs/adr/`)
- [ ] [Security phase gate](docs/security/phase-gate-checklist.md) sections marked for this change

## Related issues

<!-- Closes #123 -->
