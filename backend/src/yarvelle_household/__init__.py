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

"""Yarvelle Household Pack entry point."""

from __future__ import annotations

from typing import List

from yarvelle_core.pack.spec import PackEvalsSpec, PackSpec, RouterContribution
from yarvelle_core.schemas.routing import RoutingHints
from yarvelle_household.db.models import (
    CrossDomainLink,
    Household,
    HouseholdActivity,
    HouseholdChore,
    HouseholdMealPlan,
    HouseholdMember,
)
from yarvelle_household.routers import get_household_router_contributions
from yarvelle_household.safety.policy import HouseholdSafetyPolicy
from yarvelle_household.tools import get_household_tool_specs

__version__ = "0.1.0"


def get_pack() -> PackSpec:
    """Pack factory discovered by yarvelle_core via entry point 'yarvelle.packs'."""
    safety_policy = HouseholdSafetyPolicy()
    tools = get_household_tool_specs()
    routers = get_household_router_contributions()

    scoped_models = [
        HouseholdMember,
        HouseholdChore,
        HouseholdMealPlan,
        HouseholdActivity,
    ]

    routing_hints = RoutingHints(
        domain="household",
        description="Household routines, chore rotation, meals, and family stewardship",
        default_agent="household-steward",
        patterns_path="resources/routing_patterns.yaml",
    )

    evals = PackEvalsSpec(
        golden_path="evals/golden.jsonl",
        min_pass_rate=0.95,
        eval_suites=["family_privacy", "anti_covert_monitoring", "chore_coordination", "meal_planning"],
    )

    return PackSpec(
        pack_api=1,
        id="household",
        name="Yarvelle Household Pack",
        version=__version__,
        domain="household",
        requires_core=">=0.1.0,<0.2.0",
        owned_scopes=[
            "household.*",
            "household.chores",
            "household.meals",
            "household.activities",
            "household.maintenance",
            "household.travel",
            "household.calendar",
            "household.governance",
        ],
        declared_reads=["health.paperwork", "finance.bills", "education.calendar"],
        risk_tier_max="T2",
        tools=tools,
        routers=routers,
        safety_policy=safety_policy,
        migration_branch="household",
        evals=evals,
        description="Household governance, unified timeline, chores, meals, activities, and family stewardship pack",
        license="PolyForm-Noncommercial-1.0.0",
        maintainers=["yarvelle/household-maintainers"],
        routing_hints=routing_hints,
        scoped_models=scoped_models,
    )


__all__ = ["get_pack", "__version__"]
