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

"""Packaging test verifying wheel bundles 4 agents, 18 skills, and 3 pack entry points."""

from pathlib import Path
import subprocess
import sys
import zipfile
import pytest


def test_wheel_bundles_agents_skills_and_entry_points(tmp_path: Path):
    """Verifies that building a wheel includes all agents, skills, and pack entry points."""
    backend_dir = Path(__file__).resolve().parent.parent.parent

    # Build wheel using build module
    out_dir = tmp_path / "wheel_dist"
    out_dir.mkdir(parents=True, exist_ok=True)

    cmd = [
        sys.executable,
        "-m",
        "build",
        "--wheel",
        "--no-isolation",
        str(backend_dir),
        "--outdir",
        str(out_dir),
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0:
        # Fall back to isolated build if non-isolated fails
        cmd_isolated = [
            sys.executable,
            "-m",
            "build",
            "--wheel",
            str(backend_dir),
            "--outdir",
            str(out_dir),
        ]
        res = subprocess.run(cmd_isolated, capture_output=True, text=True)

    assert res.returncode == 0, f"Wheel build failed:\nSTDOUT:\n{res.stdout}\nSTDERR:\n{res.stderr}"

    wheels = list(out_dir.glob("*.whl"))
    assert len(wheels) == 1, f"Expected 1 wheel file, found {len(wheels)}"

    whl_path = wheels[0]
    with zipfile.ZipFile(whl_path, "r") as zf:
        namelist = zf.namelist()

        # 1. Verify 4 agents bundled in yarvelle/_content/agents/
        expected_agents = {
            "finance-organizer",
            "education-navigator",
            "household-steward",
            "study-companion",
        }
        found_agents = set()
        for name in namelist:
            if name.startswith("yarvelle/_content/agents/") and name.endswith("agent.yaml"):
                parts = name.split("/")
                if len(parts) >= 4:
                    found_agents.add(parts[3])

        assert expected_agents == found_agents, f"Mismatch in bundled agents: expected {expected_agents}, got {found_agents}"

        # 2. Verify 18 skills bundled in yarvelle/_content/skills/
        expected_skills = {
            "activity-tracker",
            "assignment-tracker",
            "bill-calendar",
            "caregiver-handover-binder",
            "chore-rotation",
            "home-maintenance",
            "household-budget",
            "meal-planning",
            "medical-cost-bridge",
            "parent-teacher-prep",
            "policy-explainer",
            "reading-log",
            "receipt-statement-filing",
            "school-calendar-sync",
            "school-forms",
            "study-quiz-helper",
            "subscription-tracker",
            "travel-prep",
        }
        found_skills = set()
        for name in namelist:
            if name.startswith("yarvelle/_content/skills/") and name.endswith("SKILL.md"):
                parts = name.split("/")
                if len(parts) >= 4:
                    found_skills.add(parts[3])

        assert expected_skills == found_skills, f"Mismatch in bundled skills: expected {expected_skills}, got {found_skills}"

        # 3. Verify entry points
        entry_point_files = [n for n in namelist if n.endswith("entry_points.txt")]
        assert len(entry_point_files) > 0, "No entry_points.txt found in wheel"

        ep_content = zf.read(entry_point_files[0]).decode("utf-8")
        assert "finance = yarvelle.finance:get_pack" in ep_content
        assert "education = yarvelle.education:get_pack" in ep_content
        assert "household = yarvelle.household:get_pack" in ep_content

        # 4. Verify packages bundled
        assert any(n.startswith("yarvelle/") for n in namelist)
        assert any(n.startswith("yarvelle/finance/") for n in namelist)
        assert any(n.startswith("yarvelle/education/") for n in namelist)
        assert any(n.startswith("yarvelle/household/") for n in namelist)
