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

"""Comprehensive unit tests for Yarvelle Education Pack."""

from pathlib import Path
import pytest
from yarvelle_core.db.base import Base
from yarvelle_core.db.models import Profile
from yarvelle_core.db.session import get_engine, get_session_factory
from yarvelle_core.engine.safety_policy import SafetyContext
from yarvelle_core.pack.validator import validate_pack_spec, validate_pack_yaml_file
import yarvelle_education
from yarvelle_education.safety.policy import EducationSafetyPolicy
from yarvelle_education.tools import (
    execute_manage_assignments,
    execute_manage_reading_logs,
    execute_manage_school_forms,
    execute_milestone_tracker,
    execute_school_assignment_sync,
    execute_study_quiz_helper,
    get_education_tool_specs,
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


def test_education_pack_spec_valid():
    """Verifies that Education pack passes full Pack API v1 validation."""
    pack = yarvelle_education.get_pack()
    validate_pack_spec(pack)
    assert pack.id == "education"
    assert pack.domain == "education"
    assert pack.risk_tier_max == "T2"
    assert len(pack.tools) == 6
    assert len(pack.routers) == 4
    assert len(pack.scoped_models) == 3
    for model in pack.scoped_models:
        assert model.__tablename__.startswith("education_")


def test_education_pack_manifest_valid():
    """Verifies that src/yarvelle_education/pack.yaml passes validator."""
    pack_yaml = Path(__file__).resolve().parent.parent / "src" / "yarvelle_education" / "pack.yaml"
    manifest = validate_pack_yaml_file(str(pack_yaml))
    assert manifest.id == "education"
    assert manifest.domain == "education"


class TestEducationSafetyPolicy:
    """Tests EducationSafetyPolicy boundaries, hard refusals, COPPA, and allowed inputs."""

    def setup_method(self):
        self.policy = EducationSafetyPolicy()

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

    def test_auto_submit_form_refusal(self):
        verdict = self.policy.check_input("auto submit school form for tomorrow's field trip")
        assert verdict.refused is True
        assert verdict.reason == "forbidden_intent:auto_submit_school_form"
        assert verdict.is_hard is False

    def test_allowed_study_practice_inputs(self):
        verdict = self.policy.check_input("create a 3-question practice quiz on photosynthesis")
        assert verdict.refused is False

        verdict_log = self.policy.check_input("record that I read 25 minutes of Charlotte's Web today")
        assert verdict_log.refused is False


@pytest.mark.asyncio
async def test_education_tools_execution():
    """Tests execution of education tools and safety boundary enforcement."""
    # Assignment creation
    res_asgn = await execute_manage_assignments({
        "action": "add",
        "title": "Science Fair Poster",
        "subject": "Biology",
    })
    assert res_asgn.success is True
    assert res_asgn.output["status"] == "created"

    # Reading log entry
    res_read = await execute_manage_reading_logs({
        "action": "log",
        "book_title": "The Giver",
        "minutes": 30,
        "author": "Lois Lowry",
    })
    assert res_read.success is True
    assert res_read.output["status"] == "logged"

    # Anti-ranking safety at tool level
    res_rank = await execute_manage_reading_logs({
        "action": "log",
        "query": "rank reading speed",
        "percentile": True,
    })
    assert res_rank.success is False
    assert "Anti-Ranking Refusal" in res_rank.error

    # School form drafting (draft only)
    res_form = await execute_manage_school_forms({
        "form_type": "permission_slip",
        "student_name": "Maya",
        "activity": "Zoo Excursion",
    })
    assert res_form.success is True
    assert res_form.output["draft_only"] is True
    assert res_form.output["auto_submitted"] is False

    # Study quiz helper
    res_quiz = await execute_study_quiz_helper({"topic": "Chemistry", "count": 2})
    assert res_quiz.success is True
    assert len(res_quiz.output["practice_questions"]) == 2

    # Assignment sync
    res_sync = await execute_school_assignment_sync({"source": "canvas_lms"})
    assert res_sync.success is True
    assert res_sync.output["status"] == "synchronized"

    # Milestone celebration
    res_ms = await execute_milestone_tracker({
        "action": "add",
        "title": "Completed First Chapter Book",
        "category": "reading",
    })
    assert res_ms.success is True
    assert res_ms.output["status"] == "celebrated"
