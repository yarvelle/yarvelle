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

"""Finance Pack factory for Yarvelle (delegating to yarvelle_finance or starter spec)."""

from __future__ import annotations

from yarvelle_core.pack.spec import PackEvalsSpec, PackSpec
from yarvelle_core.schemas.routing import RoutingHints


def get_pack() -> PackSpec:
    """Factory discovered via 'yarvelle.packs' entry point."""
    try:
        from yarvelle_finance import get_pack as _finance_pack
        return _finance_pack()
    except ImportError:
        pass

    evals = PackEvalsSpec(
        golden_path="evals/golden.jsonl",
        min_pass_rate=0.90,
        eval_suites=["financial_refusal", "read_only_budget", "statement_privacy"],
    )
    routing = RoutingHints(
        domain="finance",
        description="Household budgeting, receipt filing, bills calendar, and statement organization",
        default_agent="finance-organizer",
    )
    return PackSpec(
        pack_api=1,
        id="finance",
        name="Finance",
        version="0.1.0",
        domain="finance",
        requires_core=">=0.1.0,<0.2.0",
        owned_scopes=["finance.*", "finance.accounts", "finance.budget"],
        declared_reads=["health.paperwork"],
        risk_tier_max="T2",
        tools=[],
        routers=[],
        safety_policy=None,
        migration_branch="finance",
        evals=evals,
        description="Household finance, bills, receipts, and budgeting pack",
        license="PolyForm-Noncommercial-1.0.0 + Yarvelle Additional Terms",
        maintainers=["spectrayan/yarvelle-maintainers"],
        routing_hints=routing,
        scoped_models=[],
    )
