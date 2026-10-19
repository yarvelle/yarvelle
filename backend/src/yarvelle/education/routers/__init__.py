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

"""Router contributions for Yarvelle Education Pack."""

from __future__ import annotations

from typing import List

from yarvelle_core.pack.spec import RouterContribution
from yarvelle.education.routers.assignments import router as assignments_router
from yarvelle.education.routers.forms import router as forms_router
from yarvelle.education.routers.milestones import router as milestones_router
from yarvelle.education.routers.reading import router as reading_router


def get_education_router_contributions() -> List[RouterContribution]:
    """Returns the 4 Education Pack router contributions."""
    return [
        RouterContribution(
            assignments_router,
            prefix="/api/v1/education/assignments",
            pack_id="education",
            scope="education.assignments",
            level="read",
        ),
        RouterContribution(
            milestones_router,
            prefix="/api/v1/education/milestones",
            pack_id="education",
            scope="education.milestones",
            level="read",
        ),
        RouterContribution(
            reading_router,
            prefix="/api/v1/education/reading",
            pack_id="education",
            scope="education.reading",
            level="read",
        ),
        RouterContribution(
            forms_router,
            prefix="/api/v1/education/forms",
            pack_id="education",
            scope="education.forms",
            level="read",
        ),
    ]


__all__ = [
    "assignments_router",
    "forms_router",
    "milestones_router",
    "reading_router",
    "get_education_router_contributions",
]
