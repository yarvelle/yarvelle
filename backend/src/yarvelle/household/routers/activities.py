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

"""REST API endpoints for household extracurricular activities."""

from __future__ import annotations

from datetime import datetime
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, Query, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from yarvelle_core.api.deps import get_db
from yarvelle.household.db.models import HouseholdActivity

router = APIRouter(tags=["household_activities"])


class ActivityResponse(BaseModel):
    id: str
    profile_id: str
    activity_name: str
    category: str
    location: Optional[str]
    start_time: datetime
    end_time: datetime
    coach_or_leader: Optional[str]


@router.get("", response_model=List[ActivityResponse])
async def list_activities(
    profile_id: str = Query(..., description="Target profile ID"),
    db: AsyncSession = Depends(get_db),
) -> List[ActivityResponse]:
    """Lists extracurricular activities and practices for the given profile."""
    stmt = select(HouseholdActivity).where(HouseholdActivity.profile_id == profile_id)
    result = await db.execute(stmt)
    activities = result.scalars().all()
    return [
        ActivityResponse(
            id=a.id,
            profile_id=a.profile_id,
            activity_name=a.activity_name,
            category=a.category,
            location=a.location,
            start_time=a.start_time,
            end_time=a.end_time,
            coach_or_leader=a.coach_or_leader,
        )
        for a in activities
    ]
