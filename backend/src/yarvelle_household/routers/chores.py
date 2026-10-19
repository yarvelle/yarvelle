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

"""REST API endpoints for household chores."""

from __future__ import annotations

from datetime import datetime
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, Query, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from yarvelle_core.api.deps import get_db
from yarvelle_household.db.models import HouseholdChore

router = APIRouter(tags=["household_chores"])


class ChoreResponse(BaseModel):
    id: str
    profile_id: str
    title: str
    assigned_to: str
    frequency: str
    streak: int
    last_completed_at: Optional[datetime]
    notes: Optional[str]


@router.get("", response_model=List[ChoreResponse])
async def list_chores(
    profile_id: str = Query(..., description="Target profile ID"),
    db: AsyncSession = Depends(get_db),
) -> List[ChoreResponse]:
    """Lists household chores and routine check-offs for the given profile."""
    stmt = select(HouseholdChore).where(HouseholdChore.profile_id == profile_id)
    result = await db.execute(stmt)
    chores = result.scalars().all()
    return [
        ChoreResponse(
            id=c.id,
            profile_id=c.profile_id,
            title=c.title,
            assigned_to=c.assigned_to,
            frequency=c.frequency,
            streak=c.streak,
            last_completed_at=c.last_completed_at,
            notes=c.notes,
        )
        for c in chores
    ]
