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

"""Zero-tolerance verification for legacy 'k-i-d-s' naming in Yarvelle."""

from pathlib import Path
import re

BANNED_PATTERN = re.compile("".join(["k", "i", "d", "s"]), re.IGNORECASE)

EXCLUDED_DIRS = {
    ".git",
    "__pycache__",
    ".pytest_cache",
    ".venv",
    "venv",
    "node_modules",
    ".next",
    "build",
    "dist",
    ".changeset",
}

EXCLUDED_EXTENSIONS = {
    ".pyc",
    ".png",
    ".jpg",
    ".jpeg",
    ".ico",
    ".webp",
    ".svg",
    ".woff",
    ".woff2",
    ".tar",
    ".gz",
    ".whl",
}


def test_zero_legacy_domain_naming():
    """Scans all repository files and paths asserting exactly 0 occurrences of the retired legacy domain name."""
    repo_root = Path(__file__).resolve().parent.parent.parent

    violations = []

    for path in repo_root.rglob("*"):
        # Check if any parent or self is in EXCLUDED_DIRS
        parts = set(path.parts)
        if parts & EXCLUDED_DIRS:
            continue

        rel_path = path.relative_to(repo_root)

        # Skip test_zero_kids_naming.py itself from self-scan
        if path.name == "test_zero_kids_naming.py":
            continue

        # 1. Check path name itself
        if BANNED_PATTERN.search(path.name):
            violations.append(f"Filename violation: {rel_path}")

        # 2. Check file content if it is a text file
        if path.is_file() and path.suffix.lower() not in EXCLUDED_EXTENSIONS:

            try:
                content = path.read_text(encoding="utf-8", errors="replace")
            except Exception:
                continue

            lines = content.splitlines()
            for line_no, line in enumerate(lines, start=1):
                line_to_check = line.replace("test_zero_kids_naming", "")
                if BANNED_PATTERN.search(line_to_check):
                    violations.append(f"{rel_path}:{line_no}: {line.strip()[:120]}")

    assert len(violations) == 0, (
        f"Found {len(violations)} legacy domain occurrences across repository:\n"
        + "\n".join(violations[:50])
    )
