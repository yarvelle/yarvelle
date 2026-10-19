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

"""Kids Pack factory for Yarvelle (delegating to yarvelle_kids or starter spec)."""

from __future__ import annotations

from yarvelle_core.pack.spec import PackEvalsSpec, PackSpec
from yarvelle_core.schemas.routing import RoutingHints


def get_pack() -> PackSpec:
    """Factory discovered via 'yarvelle.packs' entry point."""
    try:
        from yarvelle_kids import get_pack as _kids_pack
        return _kids_pack()
    except ImportError:
        pass

    evals = PackEvalsSpec(
        golden_path="evals/golden.jsonl",
        min_pass_rate=0.90,
        eval_suites=["minor_safety", "homework_non_completion", "covert_monitoring_refusal"],
    )
    routing = RoutingHints(
        domain="kids",
        description="School activities, homework logs, reading trackers, and family routines",
        default_agent="household-steward",
    )
    return PackSpec(
        pack_api=1,
        id="kids",
        name="Kids",
        version="0.1.0",
        domain="kids",
        requires_core=">=0.1.0,<0.2.0",
        owned_scopes=["kids.*", "kids.forms", "kids.academic"],
        declared_reads=["health.clinical"],
        risk_tier_max="T2",
        tools=[],
        routers=[],
        safety_policy=None,
        migration_branch="kids",
        evals=evals,
        description="Kids education and family household activities pack",
        license="PolyForm-Noncommercial-1.0.0 + Yarvelle Additional Terms",
        maintainers=["spectrayan/yarvelle-maintainers"],
        routing_hints=routing,
        scoped_models=[],
    )
