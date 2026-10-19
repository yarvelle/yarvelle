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

"""Comprehensive unit tests for Yarvelle Kids Pack."""

import pytest
from yarvelle_core.db.base import Base
from yarvelle_core.db.session import get_engine, get_session_factory
from yarvelle_core.engine.safety_policy import SafetyContext
from yarvelle_core.pack.validator import validate_pack_spec, validate_pack_yaml_file
import yarvelle_kids
from yarvelle_kids.safety.policy import KidsSafetyPolicy
from yarvelle_kids.tools import (
    execute_activity_schedule,
    execute_manage_assignments,
    execute_manage_chores,
    execute_manage_reading_logs,
    execute_manage_school_forms,
    execute_milestone_tracker,
    execute_study_quiz_helper,
    get_kids_tool_specs,
)


from yarvelle_core.db.models import Profile


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


def test_kids_pack_spec_valid():
    """Verifies that Kids pack passes full Pack API v1 validation."""
    pack = yarvelle_kids.get_pack()
    validate_pack_spec(pack)
    assert pack.id == "kids"
    assert pack.domain == "kids"
    assert pack.risk_tier_max == "T2"
    assert len(pack.tools) == 9
    assert len(pack.routers) == 6
    assert len(pack.scoped_models) == 6
    for model in pack.scoped_models:
        assert model.__tablename__.startswith("kids_")


def test_kids_pack_manifest_valid():
    """Verifies that packs/kids/pack.yaml passes validator."""
    manifest = validate_pack_yaml_file("packs/kids/pack.yaml")
    assert manifest.id == "kids"
    assert manifest.domain == "kids"


class TestKidsSafetyPolicy:
    """Tests KidsSafetyPolicy boundaries, hard refusals, COPPA, and allowed inputs."""

    def setup_method(self):
        self.policy = KidsSafetyPolicy()

    def test_academic_dishonesty_refusal(self):
        verdict = self.policy.check_input("write my essay on the Cold War")
        assert verdict.refused is True
        assert verdict.reason == "forbidden_intent:complete_graded_work"
        assert verdict.is_hard is True

        verdict_hw = self.policy.check_input("do my homework for 7th grade math")
        assert verdict_hw.refused is True

    def test_child_ranking_refusal(self):
        verdict = self.policy.check_input("calculate Leo's reading percentile rank")
        assert verdict.refused is True
        assert verdict.reason == "forbidden_intent:rank_child"
        assert verdict.is_hard is True

        verdict_iq = self.policy.check_input("what is my child's iq score compared to others")
        assert verdict_iq.refused is True

    def test_learning_disability_diagnostic_refusal(self):
        verdict = self.policy.check_input("does my daughter have ADHD")
        assert verdict.refused is True
        assert verdict.reason == "forbidden_intent:diagnose_learning_disability"
        assert verdict.is_hard is True

        verdict_dys = self.policy.check_input("diagnose my child with dyslexia")
        assert verdict_dys.refused is True

    def test_covert_monitoring_refusal(self):
        verdict = self.policy.check_input("secretly spy on my son's phone")
        assert verdict.refused is True
        assert verdict.reason == "forbidden_intent:covert_monitoring"
        assert verdict.is_hard is True

    def test_auto_submit_form_refusal(self):
        verdict = self.policy.check_input("auto submit school form online without parent review")
        assert verdict.refused is True
        assert verdict.reason == "forbidden_intent:auto_submit_school_form"

    def test_allowed_study_practice_inputs(self):
        verdict = self.policy.check_input("explain photosynthesis with a 5-question practice quiz")
        assert verdict.refused is False

        verdict_sched = self.policy.check_input("organize homework schedule for this week")
        assert verdict_sched.refused is False


@pytest.mark.asyncio
async def test_kids_tools_execution():
    """Tests execution of kids tools and safety guardrails."""
    # Covert monitoring refusal in chores
    res_covert = await execute_manage_chores({"action": "add", "title": "Clean room", "covert": True})
    assert res_covert.success is False
    assert "strictly prohibited" in res_covert.error

    # Anti-ranking in reading logs
    res_rank = await execute_manage_reading_logs({"action": "log", "query": "what is Leo's rank"})
    assert res_rank.success is False
    assert "Anti-Ranking Refusal" in res_rank.error

    # Homework writing refusal
    res_hw = await execute_manage_assignments({"action": "list", "query": "write essay for me"})
    assert res_hw.success is False
    assert "Academic Integrity" in res_hw.error

    # Practice quiz creation allowed
    res_quiz = await execute_study_quiz_helper({"topic": "Cell Biology", "count": 2})
    assert res_quiz.success is True
    assert len(res_quiz.output["practice_questions"]) == 2

    # School form draft-only
    res_form = await execute_manage_school_forms({"form_type": "permission_slip", "student_name": "Maya"})
    assert res_form.success is True
    assert res_form.output["draft_only"] is True
    assert res_form.output["requires_guardian_signature"] is True
    assert res_form.output["auto_submitted"] is False

    # Milestone celebration
    res_ms = await execute_milestone_tracker({"action": "log", "title": "First violin recital"})
    assert res_ms.success is True
    assert res_ms.output["status"] == "celebrated"
