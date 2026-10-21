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

"""Yarvelle writes the canonical core age band so core under-13 gates fire."""

from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
from types import SimpleNamespace
import importlib.util

from alembic.migration import MigrationContext
from alembic.operations import Operations

import pytest
import sqlalchemy as sa

from yarvelle.education.safety.policy import EducationSafetyPolicy
from yarvelle.household.governance import AGE_BANDS, FamilyGovernanceService
from yarvelle.household.schemas import AddMemberRequest, HouseholdMemberResponse, UpdateMemberRequest
from yarvelle_core.engine.safety_policy import SafetyContext
from yarvelle_core.engine.tool_exec import ToolContext, evaluate_policy_gate
from yarvelle_core.engine.tool_registry import ToolSpec
from yarvelle_core.schemas.age_band import AGE_BANDS as CORE_AGE_BANDS, CHILD_UNDER_13

MIGRATION = (
    Path(__file__).resolve().parents[1]
    / "src/yarvelle/household/db/migrations/versions/household_0002_canonical_age_band.py"
)


def test_vocabulary_is_the_core_vocabulary() -> None:
    assert AGE_BANDS == CORE_AGE_BANDS
    assert FamilyGovernanceService.classify_age_band("2016-01-01", reference_year=2026) == CHILD_UNDER_13


@pytest.mark.parametrize("legacy", ["child_u13", "child", "CHILD_U13"])
def test_requests_accept_legacy_and_store_canonical(legacy) -> None:
    assert AddMemberRequest(profile_id="p", age_band=legacy).age_band == CHILD_UNDER_13
    assert UpdateMemberRequest(age_band=legacy).age_band == CHILD_UNDER_13


def test_legacy_rows_are_served_canonically() -> None:
    now = datetime.now(timezone.utc)
    row = SimpleNamespace(
        id="m", household_id="h", profile_id="p", user_id=None, role="dependent", relationship="child",
        age_band="child_u13", is_private=False, delegated_scopes=[], created_at=now, updated_at=now,
    )
    assert HouseholdMemberResponse.model_validate(row).age_band == CHILD_UNDER_13


def test_core_gate_blocks_external_write_for_yarvelle_child() -> None:
    band = FamilyGovernanceService.classify_age_band("2018-06-01", reference_year=2026)
    ctx = ToolContext(user_id="u", profile_id="p", autonomy="A2", extra={"age_band": band})
    decision = evaluate_policy_gate(ctx, ToolSpec(name="send", risk_tier="write_external"), {})
    assert decision.decision == "blocked"


@pytest.mark.parametrize("band", ["child_under_13", "child_u13"])
def test_education_policy_coppa_rule_fires_for_canonical_and_legacy(band) -> None:
    ctx = SafetyContext(profile_id="c1", metadata={"age_band": band, "is_cloud_model": True})
    verdict = EducationSafetyPolicy().check_input("help me with math homework", ctx)
    assert verdict.refused is True
    assert verdict.reason == "coppa_local_egress_required"


def test_data_migration_rewrites_legacy_rows() -> None:
    spec = importlib.util.spec_from_file_location("household_0002", MIGRATION)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    assert module.down_revision == "household_0001_baseline"

    engine = sa.create_engine("sqlite://")
    with engine.begin() as conn:
        conn.execute(sa.text("CREATE TABLE household_members (id TEXT PRIMARY KEY, age_band TEXT NOT NULL)"))
        conn.execute(
            sa.text("INSERT INTO household_members VALUES ('a', 'child_u13'), ('b', 'child'), ('c', 'teen'), ('d', 'adult')")
        )
        with Operations.context(MigrationContext.configure(conn)):
            module.upgrade()
        rows = dict(conn.execute(sa.text("SELECT id, age_band FROM household_members")).all())
    assert rows == {"a": CHILD_UNDER_13, "b": CHILD_UNDER_13, "c": "teen_13_17", "d": "adult"}
