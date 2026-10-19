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

"""Yarvelle Kids Pack entry point."""

from __future__ import annotations

from typing import List

from yarvelle_core.pack.spec import PackEvalsSpec, PackSpec, RouterContribution
from yarvelle_core.schemas.routing import RoutingHints
from yarvelle_kids.db.models import (
    KidsActivity,
    KidsAssignment,
    KidsChore,
    KidsMealPlan,
    KidsMilestone,
    KidsReadingLog,
)
from yarvelle_kids.routers import get_kids_router_contributions
from yarvelle_kids.safety.policy import KidsSafetyPolicy
from yarvelle_kids.tools import get_kids_tool_specs

__version__ = "0.1.0"


def get_pack() -> PackSpec:
    """Pack factory discovered by yarvelle_core via entry point 'yarvelle.packs'."""
    safety_policy = KidsSafetyPolicy()
    tools = get_kids_tool_specs()
    routers = get_kids_router_contributions()

    scoped_models = [
        KidsAssignment,
        KidsActivity,
        KidsMilestone,
        KidsReadingLog,
        KidsChore,
        KidsMealPlan,
    ]

    routing_hints = RoutingHints(
        domain="kids",
        description="Education navigation, homework assistance, reading logs, extracurricular activities, and chore coordination",
        default_agent="school-guide",
        patterns_path="resources/routing_patterns.yaml",
    )

    evals = PackEvalsSpec(
        golden_path="evals/golden.jsonl",
        min_pass_rate=0.95,
        eval_suites=["academic_integrity", "anti_ranking", "child_protection", "coppa_egress"],
    )

    return PackSpec(
        pack_api=1,
        id="kids",
        name="Yarvelle Kids Pack",
        version=__version__,
        domain="kids",
        requires_core=">=0.1.0,<0.2.0",
        owned_scopes=[
            "kids.*",
            "kids.assignments",
            "kids.activities",
            "kids.milestones",
            "kids.reading",
            "kids.forms",
            "kids.chores",
            "kids.meals",
            "kids.calendar",
        ],
        declared_reads=["health.clinical", "household.calendar"],
        risk_tier_max="T2",
        tools=tools,
        routers=routers,
        safety_policy=safety_policy,
        migration_branch="kids",
        evals=evals,
        description="Child education, homework helper, reading logs, school forms, and household activities pack",
        license="PolyForm-Noncommercial-1.0.0",
        maintainers=["yarvelle/kids-maintainers"],
        routing_hints=routing_hints,
        scoped_models=scoped_models,
    )


__all__ = ["get_pack", "__version__"]
