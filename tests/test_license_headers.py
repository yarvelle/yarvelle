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

"""Verifies that all Python files in the Yarvelle repository carry the official header."""

import subprocess
import sys
from pathlib import Path


def test_license_headers_compliance():
    root = Path(__file__).resolve().parent.parent
    script_path = root / "scripts" / "check_licenses.py"
    res = subprocess.run([sys.executable, str(script_path)], capture_output=True, text=True)
    assert res.returncode == 0, f"License check failed:\n{res.stdout}\n{res.stderr}"
