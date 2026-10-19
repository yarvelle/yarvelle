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

"""Tests confirming zero code duplication between Yarvelle, Carefold, and Yarvelle Core."""

from pathlib import Path


def test_zero_carefold_source_code_in_yarvelle():
    """Verifies that no Carefold core or clinical agent/skill files are copied into Yarvelle."""
    root = Path(__file__).resolve().parent.parent.parent

    # 1. No backend/src/carefold directory vendored in Yarvelle backend
    assert not (root / "backend" / "src" / "carefold").exists(), (
        "carefold source directory must not be vendored in Yarvelle backend."
    )

    # 2. No duplicated clinical agents or skills in repository root
    assert not (root / "agents" / "cardiology-guide").exists()
    assert not (root / "skills" / "cardiology-prep").exists()
    assert not (root / "skills" / "preventive-care").exists()

    # 3. Only permitted top-level directories exist
    permitted_dirs = {
        ".git",
        ".github",
        ".changeset",
        ".venv",
        "venv",
        "__pycache__",
        ".pytest_cache",
        ".import_linter_cache",
        ".importlinter",
        "backend",
        "frontend",
        "agents",
        "skills",
        "deploy",
        "scripts",
        "docs",
        "logs",
        "node_modules",
    }
    for item in root.iterdir():
        if item.is_dir():
            assert item.name in permitted_dirs, f"Unpermitted directory found in Yarvelle root: {item.name}"
