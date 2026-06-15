# Development Environment Setup

This guide sets up a local environment that mirrors CI and enforces project standards (branches, commits, lint).

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| [Git](https://git-scm.com/) | 2.x+ | Version control |
| [Node.js](https://nodejs.org/) | 20+ (see `.nvmrc`) | Dev tooling, lint, hooks |
| [npm](https://www.npmjs.com/) | 10+ | Package manager |
| [Make](https://www.gnu.org/software/make/) | optional | Shortcut commands |

Optional:

- [nvm](https://github.com/nvm-sh/nvm) — `nvm use` to match `.nvmrc`
- [Docker](https://www.docker.com/) — when application services are added

## First-time setup

```bash
git clone https://github.com/AlexandreZanata/sorriso-sentinel.git
cd sorriso-sentinel

# Use project Node version (if using nvm)
nvm use

# Install deps, git hooks, and run validation
make setup
# or: npm run setup
```

This will:

1. Install dev dependencies (`markdownlint-cli2`, `husky`, `commitlint`)
2. Configure **Husky** git hooks
3. Run the same validation checks as CI

## Environment variables

```bash
cp .env.example .env
# Edit .env — never commit this file
```

## Daily workflow

Follow [branches.md](branches.md). Summary:

```bash
git checkout main
git pull origin main
git checkout -b feat/my-feature

# develop, commit (hooks run automatically)
git add .
git commit -m "feat(scope): describe change"

# before opening a PR
make check

git push -u origin feat/my-feature
# open PR → main on GitHub
```

## Available commands

| Command | Description |
|---------|-------------|
| `make setup` | First-time install + hook setup |
| `make check` | Branch guard + full validation (run before PR) |
| `make validate` | CI parity: OSS files, VERSION, markdown lint |
| `make lint` | Markdown lint only |
| `make fix` | Auto-fix markdown lint issues |
| `npm run check` | Same as `make check` |
| `npm run validate` | Same as `make validate` |

When the application stack is defined, additional commands (`test`, `build`, etc.) will be added here and in CI.

## Git hooks (automatic)

Husky runs these hooks on every commit:

| Hook | What it does |
|------|--------------|
| **pre-commit** | Blocks commits on `main`; runs `npm run validate` |
| **commit-msg** | Enforces [Conventional Commits](commits.md) via commitlint |

To bypass hooks in an emergency (discouraged): `git commit --no-verify` — only when explicitly needed.

## Editor setup

Recommended VS Code / Cursor extensions are listed in [`.vscode/extensions.json`](../../.vscode/extensions.json).

Open the project and install recommended extensions when prompted.

Shared settings in [`.vscode/settings.json`](../../.vscode/settings.json):

- LF line endings, final newline, trim trailing whitespace
- Markdown lint aligned with `.markdownlint-cli2.yaml`
- Rulers at 72 and 100 columns (commit subject / body)

## CI parity

Local `npm run validate` runs the same checks as [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml):

1. Required open source files exist
2. `VERSION` is valid SemVer
3. Markdown lint passes

Always run `make check` before opening a pull request.

## Troubleshooting

### `ERROR: Direct commits on 'main' are not allowed`

Create a topic branch:

```bash
git checkout -b feat/your-feature
```

### Commit message rejected by commitlint

Use Conventional Commits format:

```
feat(scope): short description in english
```

See [commits.md](commits.md).

### `npm ci` fails

Ensure Node 20+ (`node -v`) and run `nvm use` if applicable.

### Hooks not running

```bash
npm run prepare
chmod +x scripts/*.sh .husky/*
```

## Related guides

| Guide | Topic |
|-------|-------|
| [branches.md](branches.md) | Branch strategy and workflow |
| [commits.md](commits.md) | Commit message format |
| [pull-requests.md](pull-requests.md) | PR requirements |
| [ci-cd.md](ci-cd.md) | CI/CD pipeline |
