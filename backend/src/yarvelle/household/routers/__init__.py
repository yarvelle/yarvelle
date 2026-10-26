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

"""Router contributions for Yarvelle Household Pack."""

from __future__ import annotations

from typing import List

from yarvelle_core.pack.spec import RouterContribution
from yarvelle.household.routers.activities import router as activities_router
from yarvelle.household.routers.chores import router as chores_router
from yarvelle.household.routers.meals import router as meals_router


def get_household_router_contributions() -> List[RouterContribution]:
    """Returns the Household Pack router contributions."""
    return [
        RouterContribution(
            chores_router,
            prefix="/household/chores",
            pack_id="household",
            scope="household.chores",
            level="read",
        ),
        RouterContribution(
            meals_router,
            prefix="/household/meals",
            pack_id="household",
            scope="household.meals",
            level="read",
        ),
        RouterContribution(
            activities_router,
            prefix="/household/activities",
            pack_id="household",
            scope="household.activities",
            level="read",
        ),
    ]


__all__ = [
    "activities_router",
    "chores_router",
    "meals_router",
    "get_household_router_contributions",
]
