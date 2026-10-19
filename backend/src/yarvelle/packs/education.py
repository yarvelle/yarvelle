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

"""Education Pack factory for Yarvelle (delegating to yarvelle_education or starter spec)."""

from __future__ import annotations

from yarvelle_core.pack.spec import PackEvalsSpec, PackSpec
from yarvelle_core.schemas.routing import RoutingHints


def get_pack() -> PackSpec:
    """Factory discovered via 'yarvelle.packs' entry point."""
    try:
        from yarvelle_education import get_pack as _education_pack
        return _education_pack()
    except ImportError:
        pass

    evals = PackEvalsSpec(
        golden_path="evals/golden.jsonl",
        min_pass_rate=0.90,
        eval_suites=["minor_safety", "homework_non_completion"],
    )
    routing = RoutingHints(
        domain="education",
        description="School activities, homework logs, reading trackers, and learning",
        default_agent="education-navigator",
    )
    return PackSpec(
        pack_api=1,
        id="education",
        name="Education",
        version="0.1.0",
        domain="education",
        requires_core=">=0.1.0,<0.2.0",
        owned_scopes=["education.*", "education.forms", "education.assignments"],
        declared_reads=["health.clinical"],
        risk_tier_max="T2",
        tools=[],
        routers=[],
        safety_policy=None,
        migration_branch="education",
        evals=evals,
        description="Education, homework helper, reading logs, and learning pack",
        license="PolyForm-Noncommercial-1.0.0 + Yarvelle Additional Terms",
        maintainers=["spectrayan/yarvelle-maintainers"],
        routing_hints=routing,
        scoped_models=[],
    )
