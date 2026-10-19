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

"""REST API endpoints for education milestones."""

from __future__ import annotations

from datetime import datetime
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, Query, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from yarvelle_core.api.deps import get_db
from yarvelle_education.db.models import EducationMilestone

router = APIRouter(tags=["education_milestones"])


class MilestoneResponse(BaseModel):
    id: str
    profile_id: str
    category: str
    title: str
    achieved_on: datetime
    notes: Optional[str]


@router.get("", response_model=List[MilestoneResponse])
async def list_milestones(
    profile_id: str = Query(..., description="Target profile ID"),
    db: AsyncSession = Depends(get_db),
) -> List[MilestoneResponse]:
    """Lists developmental growth milestones for the given profile."""
    stmt = select(EducationMilestone).where(EducationMilestone.profile_id == profile_id)
    result = await db.execute(stmt)
    milestones = result.scalars().all()
    return [
        MilestoneResponse(
            id=m.id,
            profile_id=m.profile_id,
            category=m.category,
            title=m.title,
            achieved_on=m.achieved_on,
            notes=m.notes,
        )
        for m in milestones
    ]
