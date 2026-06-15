.PHONY: setup check validate lint fix help

help:
	@echo "Sorriso Sentinel — development commands"
	@echo ""
	@echo "  make setup     Install deps and configure git hooks"
	@echo "  make check     Full local validation (branch + CI parity)"
	@echo "  make validate  CI parity checks (oss, version, lint)"
	@echo "  make lint      Lint markdown files"
	@echo "  make fix       Auto-fix markdown lint issues"

setup:
	npm run setup

check:
	npm run check

validate:
	npm run validate

lint:
	npm run lint

fix:
	npm run lint:fix
