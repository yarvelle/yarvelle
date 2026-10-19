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

"""Yarvelle Education Pack entry point."""

from __future__ import annotations

from typing import List

from yarvelle_core.pack.spec import PackEvalsSpec, PackSpec, RouterContribution
from yarvelle_core.schemas.routing import RoutingHints
from yarvelle.education.db.models import (
    EducationAssignment,
    EducationMilestone,
    EducationReadingLog,
)
from yarvelle.education.routers import get_education_router_contributions
from yarvelle.education.safety.policy import EducationSafetyPolicy
from yarvelle.education.tools import get_education_tool_specs

__version__ = "0.1.0"


def get_pack() -> PackSpec:
    """Pack factory discovered by yarvelle_core via entry point 'yarvelle.packs'."""
    safety_policy = EducationSafetyPolicy()
    tools = get_education_tool_specs()
    routers = get_education_router_contributions()

    scoped_models = [
        EducationAssignment,
        EducationMilestone,
        EducationReadingLog,
    ]

    routing_hints = RoutingHints(
        domain="education",
        description="Education navigation, homework assistance, reading logs, and academic coordination",
        default_agent="education-navigator",
        patterns_path="resources/routing_patterns.yaml",
    )

    evals = PackEvalsSpec(
        golden_path="evals/golden.jsonl",
        min_pass_rate=0.95,
        eval_suites=["academic_integrity", "anti_ranking", "child_protection", "coppa_egress"],
    )

    return PackSpec(
        pack_api=1,
        id="education",
        name="Yarvelle Education Pack",
        version=__version__,
        domain="education",
        requires_core=">=0.1.0,<0.2.0",
        owned_scopes=[
            "education.*",
            "education.assignments",
            "education.reading",
            "education.milestones",
            "education.forms",
            "education.study",
            "education.calendar",
        ],
        declared_reads=["health.clinical"],
        risk_tier_max="T2",
        tools=tools,
        routers=routers,
        safety_policy=safety_policy,
        migration_branch="education",
        evals=evals,
        description="Child education, homework helper, reading logs, school forms, and learning pack",
        license="PolyForm-Noncommercial-1.0.0",
        maintainers=["yarvelle/education-maintainers"],
        routing_hints=routing_hints,
        scoped_models=scoped_models,
    )


__all__ = ["get_pack", "__version__"]
