.PHONY: setup check validate lint test build dev docker-up docker-down help

help:
	@echo "Sorriso Sentinel — development commands"
	@echo ""
	@echo "  make setup       Install deps and configure git hooks"
	@echo "  make check       Full local validation (branch + CI parity)"
	@echo "  make validate    OSS + version + lint + test + build"
	@echo "  make lint        Lint markdown + all packages"
	@echo "  make test        Run all package tests"
	@echo "  make build       Build all apps and packages"
	@echo "  make dev         Start all dev servers (turbo)"
	@echo "  make docker-up   Start Postgres, Redis, MinIO"

setup:
	npm run setup

check:
	npm run check

validate:
	npm run validate

lint:
	npm run lint

test:
	npm run test

build:
	npm run build

dev:
	npm run dev

docker-up:
	npm run docker:up

docker-validate:
	npm run docker:validate

docker-down:
	npm run docker:down
