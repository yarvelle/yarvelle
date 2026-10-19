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

"""Yarvelle Finance Pack entry point."""

from __future__ import annotations

from typing import List

from yarvelle_core.pack.spec import PackEvalsSpec, PackSpec, RouterContribution
from yarvelle_core.schemas.routing import RoutingHints
from yarvelle.finance.db.models import (
    FinanceAccount,
    FinanceBill,
    FinanceBudget,
    FinanceStatement,
    FinanceTransaction,
)
from yarvelle.finance.routers import get_finance_router_contributions
from yarvelle.finance.safety.policy import FinanceSafetyPolicy
from yarvelle.finance.tools import get_finance_tool_specs

__version__ = "0.1.0"


def get_pack() -> PackSpec:
    """Pack factory discovered by yarvelle_core via entry point 'yarvelle.packs'."""
    safety_policy = FinanceSafetyPolicy()
    tools = get_finance_tool_specs()
    routers = get_finance_router_contributions()

    scoped_models = [
        FinanceAccount,
        FinanceTransaction,
        FinanceBill,
        FinanceBudget,
        FinanceStatement,
    ]

    routing_hints = RoutingHints(
        domain="finance",
        description="Personal and household financial organization, statement parsing, budgeting, and bill tracking",
        default_agent="finance-organizer",
        patterns_path="resources/routing_patterns.yaml",
    )

    evals = PackEvalsSpec(
        golden_path="evals/golden.jsonl",
        min_pass_rate=0.95,
        eval_suites=["financial_safety", "money_movement_refusal", "non_advisory_compliance"],
    )

    return PackSpec(
        pack_api=1,
        id="finance",
        name="Yarvelle Finance Pack",
        version=__version__,
        domain="finance",
        requires_core=">=0.1.0,<0.2.0",
        owned_scopes=[
            "finance.*",
            "finance.accounts",
            "finance.transactions",
            "finance.bills",
            "finance.budget",
            "finance.statements",
        ],
        declared_reads=["health.paperwork"],
        risk_tier_max="T3",
        tools=tools,
        routers=routers,
        safety_policy=safety_policy,
        migration_branch="finance",
        evals=evals,
        description="Household finance, budgeting, statement filing, and bill tracking pack",
        license="PolyForm-Noncommercial-1.0.0",
        maintainers=["yarvelle/finance-maintainers"],
        routing_hints=routing_hints,
        scoped_models=scoped_models,
    )


__all__ = ["get_pack", "__version__"]
