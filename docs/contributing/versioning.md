# Versioning

This project uses [Semantic Versioning 2.0.0](https://semver.org/) (SemVer).

## Version format

```
MAJOR.MINOR.PATCH
```

| Bump | When |
|------|------|
| **MAJOR** | Breaking API, schema, or behavior changes |
| **MINOR** | New backward-compatible features |
| **PATCH** | Backward-compatible bug fixes |

Pre-release versions use suffixes: `1.0.0-alpha.1`, `1.0.0-rc.1`.

## Source of truth

| File | Purpose |
|------|---------|
| [VERSION](../VERSION) | Current released version (single line, e.g. `0.1.0`) |
| [CHANGELOG.md](../CHANGELOG.md) | Human-readable release notes ([Keep a Changelog](https://keepachangelog.com/)) |
| Git tags | Immutable release markers: `v0.1.0` |

When the application stack is added, the version in `VERSION` must stay in sync with the package manifest (e.g. `package.json`, `pyproject.toml`, `Cargo.toml`).

## Development workflow

1. Add changes under `## [Unreleased]` in `CHANGELOG.md`
2. Merge to `main` via PR
3. Maintainer cuts a release (see below)

## Cutting a release

Releases are automated via [`.github/workflows/release.yml`](../.github/workflows/release.yml).

### Manual release (maintainers)

```bash
# 1. Update CHANGELOG — move Unreleased items to a new version section with date
# 2. Update VERSION file
echo "0.2.0" > VERSION

# 3. Commit
git add VERSION CHANGELOG.md
git commit -m "chore(release): v0.2.0"

# 4. Tag and push
git tag -a v0.2.0 -m "v0.2.0"
git push origin main --tags
```

The release workflow will:

- Validate that the tag matches `VERSION`
- Create a GitHub Release with changelog notes
- Attach release artifacts (when build artifacts exist)

### Tag rules

- Tags **must** be prefixed with `v`: `v0.1.0`
- Tag **must** match `VERSION` file (without `v` prefix)
- Never retag or force-push release tags

## Conventional Commits and versioning

Commit messages follow [Conventional Commits](commits.md). This enables future automation with tools like [release-please](https://github.com/googleapis/release-please) or [semantic-release](https://semantic-release.gitbook.io/).

| Commit type | Default SemVer bump |
|-------------|---------------------|
| `feat` | MINOR |
| `fix` | PATCH |
| `feat!` or `BREAKING CHANGE` | MAJOR |

## Pre-1.0 policy

While version is `0.x.y`:

- `0.x` increments may include breaking changes
- Document breaking changes clearly in CHANGELOG
- Move to `1.0.0` when the public API is considered stable
