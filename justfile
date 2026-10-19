# Yarvelle — Personal & Family AI Assistant Application
# Copyright 2026 Spectrayan (https://spectrayan.com)
#
# Licensed under the PolyForm Noncommercial License 1.0.0 and the
# Yarvelle Additional Terms (see LICENSE and ADDITIONAL-TERMS.md).
# Personal and household local use only. Commercial use, hosted service
# offering, rebranding, white-labeling, and redistribution of modified
# forks are prohibited without a written commercial license from Spectrayan.
#
# Required Notice: Copyright 2026 Spectrayan (https://spectrayan.com)

default:
    @just --list

# Start development environments for backend and frontend
dev:
    @echo "Starting Yarvelle development environment..."
    pnpm install
    PYTHONPATH=backend/src backend/.venv/bin/python -m uvicorn yarvelle.main:app --host 127.0.0.1 --port 8000 --reload

# Run full test suite across backend and frontend
test:
    @echo "Running backend test suite..."
    PYTHONPATH=backend/src backend/.venv/bin/pytest backend/tests/
    @echo "Running frontend test suite..."
    pnpm --filter @yarvelle/web test

# Run all linters and integrity checks
lint:
    @echo "Checking license headers..."
    pnpm run check:licenses
    @echo "Checking zero legacy naming..."
    PYTHONPATH=backend/src backend/.venv/bin/pytest backend/tests/test_zero_kids_naming.py -v
    @echo "Checking no git dependencies..."
    python3 scripts/check_no_git_deps.py
    @echo "Running frontend typecheck..."
    pnpm --filter @yarvelle/web typecheck

# Build release artifacts (backend wheel, frontend Next.js production build)
build:
    @echo "Building backend wheel..."
    python3 -m build --wheel backend/
    @echo "Building frontend Next.js production app..."
    pnpm --filter @yarvelle/web build

# Prepare release dry run
release:
    @echo "Evaluating changesets dry run..."
    pnpm exec changeset status || true
