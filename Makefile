.PHONY: setup check validate lint test build dev docker-up docker-down help

help:
	@echo "Sorriso Sentinel — development commands"
	@echo ""
	@echo "  make setup       Install deps and configure git hooks"
  @echo "  make check       Full local validation (branch + CI parity + prod docker)"
	@echo "  make validate    OSS + version + lint + test + build"
	@echo "  make lint        Lint markdown + all packages"
	@echo "  make test        Run all package tests"
	@echo "  make build       Build all apps and packages"
	@echo "  make dev         Start all dev servers (turbo)"
	@echo "  make docker-up   Start Postgres, Redis, MinIO"

setup:
	pnpm run setup

check:
	pnpm run check

validate:
	pnpm run validate

lint:
	pnpm run lint

test:
	pnpm run test

build:
	pnpm run build

dev:
	pnpm run dev

docker-up:
	pnpm run docker:up

docker-validate:
	pnpm run docker:validate

docker-down:
	pnpm run docker:down
