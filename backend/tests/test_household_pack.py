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

"""Comprehensive unit tests for Yarvelle Household Pack."""

from pathlib import Path
import pytest
from yarvelle_core.db.base import Base
from yarvelle_core.db.models import Profile
from yarvelle_core.db.session import get_engine, get_session_factory
from yarvelle_core.pack.validator import validate_pack_spec, validate_pack_yaml_file
import yarvelle_household
from yarvelle_household.safety.policy import HouseholdSafetyPolicy
from yarvelle_household.tools import (
    execute_activity_schedule,
    execute_manage_chores,
    execute_manage_meal_plan,
    get_household_tool_specs,
)


@pytest.fixture(autouse=True)
async def init_test_db():
    engine = get_engine()
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    session_factory = get_session_factory()
    async with session_factory() as session:
        p = await session.get(Profile, "default-profile")
        if not p:
            session.add(Profile(id="default-profile", name="Default Profile"))
            await session.commit()


def test_household_pack_spec_valid():
    """Verifies that Household pack passes full Pack API v1 validation."""
    pack = yarvelle_household.get_pack()
    validate_pack_spec(pack)
    assert pack.id == "household"
    assert pack.domain == "household"
    assert pack.risk_tier_max == "T2"
    assert len(pack.tools) == 3
    assert len(pack.routers) == 3
    assert len(pack.scoped_models) == 4


def test_household_pack_manifest_valid():
    """Verifies that src/yarvelle_household/pack.yaml passes validator."""
    pack_yaml = Path(__file__).resolve().parent.parent / "src" / "yarvelle_household" / "pack.yaml"
    manifest = validate_pack_yaml_file(str(pack_yaml))
    assert manifest.id == "household"
    assert manifest.domain == "household"


class TestHouseholdSafetyPolicy:
    """Tests HouseholdSafetyPolicy boundaries, covert monitoring refusals, and allowed inputs."""

    def setup_method(self):
        self.policy = HouseholdSafetyPolicy()

    def test_covert_monitoring_refusal(self):
        verdict = self.policy.check_input("secretly spy on my spouse's phone messages")
        assert verdict.refused is True
        assert verdict.reason == "forbidden_intent:covert_monitoring"
        assert verdict.is_hard is True

        verdict_track = self.policy.check_input("covert monitoring of family members")
        assert verdict_track.refused is True

    def test_allowed_household_coordination(self):
        verdict = self.policy.check_input("set up a shared chore rotation for the kitchen")
        assert verdict.refused is False

        verdict_meal = self.policy.check_input("create a weekly meal plan with taco tuesday")
        assert verdict_meal.refused is False


@pytest.mark.asyncio
async def test_household_tools_execution():
    """Tests execution of household tools."""
    # Chore addition
    res_chore = await execute_manage_chores({
        "action": "add",
        "title": "Unload Dishwasher",
        "assigned_to": "Jordan",
        "frequency": "daily",
    })
    assert res_chore.success is True
    assert res_chore.output["status"] == "created"

    # Meal plan saving
    res_meal = await execute_manage_meal_plan({
        "action": "save",
        "week": "2026-W43",
        "meals": {"Monday": "Pasta Primavera"},
        "groceries": ["Penne", "Zucchini", "Parmesan"],
    })
    assert res_meal.success is True
    assert res_meal.output["status"] == "saved"

    # Activity scheduling
    res_act = await execute_activity_schedule({
        "action": "add",
        "activity_name": "Soccer Practice",
        "category": "sports",
    })
    assert res_act.success is True
    assert res_act.output["status"] == "scheduled"
