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

"""Router contributions for Yarvelle Kids Pack."""

from __future__ import annotations

from typing import List

from yarvelle_core.pack.spec import RouterContribution
from yarvelle_kids.routers.activities import router as activities_router
from yarvelle_kids.routers.assignments import router as assignments_router
from yarvelle_kids.routers.chores import router as chores_router
from yarvelle_kids.routers.forms import router as forms_router
from yarvelle_kids.routers.milestones import router as milestones_router
from yarvelle_kids.routers.reading import router as reading_router


def get_kids_router_contributions() -> List[RouterContribution]:
    """Returns the 6 Kids Pack router contributions."""
    return [
        RouterContribution(
            assignments_router,
            prefix="/api/v1/kids/assignments",
            pack_id="kids",
            scope="kids.assignments",
            level="read",
        ),
        RouterContribution(
            activities_router,
            prefix="/api/v1/kids/activities",
            pack_id="kids",
            scope="kids.activities",
            level="read",
        ),
        RouterContribution(
            milestones_router,
            prefix="/api/v1/kids/milestones",
            pack_id="kids",
            scope="kids.milestones",
            level="read",
        ),
        RouterContribution(
            reading_router,
            prefix="/api/v1/kids/reading",
            pack_id="kids",
            scope="kids.reading",
            level="read",
        ),
        RouterContribution(
            forms_router,
            prefix="/api/v1/kids/forms",
            pack_id="kids",
            scope="kids.forms",
            level="read",
        ),
        RouterContribution(
            chores_router,
            prefix="/api/v1/kids/chores",
            pack_id="kids",
            scope="kids.chores",
            level="read",
        ),
    ]


__all__ = [
    "activities_router",
    "assignments_router",
    "chores_router",
    "forms_router",
    "milestones_router",
    "reading_router",
    "get_kids_router_contributions",
]
