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

"""Household Pack factory for Yarvelle (delegating to yarvelle_household or starter spec)."""

from __future__ import annotations

from yarvelle_core.pack.spec import PackEvalsSpec, PackSpec
from yarvelle_core.schemas.routing import RoutingHints


def get_pack() -> PackSpec:
    """Factory discovered via 'yarvelle.packs' entry point."""
    try:
        from yarvelle_household import get_pack as _household_pack
        return _household_pack()
    except ImportError:
        pass

    evals = PackEvalsSpec(
        golden_path="evals/golden.jsonl",
        min_pass_rate=0.90,
        eval_suites=["family_privacy", "chore_coordination", "anti_covert_monitoring"],
    )
    routing = RoutingHints(
        domain="household",
        description="Household routines, chores, meal planning, and family stewardship",
        default_agent="household-steward",
    )
    return PackSpec(
        pack_api=1,
        id="household",
        name="Household",
        version="0.1.0",
        domain="household",
        requires_core=">=0.1.0,<0.2.0",
        owned_scopes=["household.*", "household.chores", "household.meals"],
        declared_reads=["health.paperwork", "finance.bills", "education.calendar"],
        risk_tier_max="T2",
        tools=[],
        routers=[],
        safety_policy=None,
        migration_branch="household",
        evals=evals,
        description="Household chores, meals, activities, and family stewardship pack",
        license="PolyForm-Noncommercial-1.0.0 + Yarvelle Additional Terms",
        maintainers=["spectrayan/yarvelle-maintainers"],
        routing_hints=routing,
        scoped_models=[],
    )
