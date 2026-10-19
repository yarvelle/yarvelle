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

"""REST API endpoints for kids assignments."""

from __future__ import annotations

from datetime import datetime
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from yarvelle_core.api.deps import get_db
from yarvelle_kids.db.models import KidsAssignment

router = APIRouter(tags=["kids_assignments"])


class AssignmentResponse(BaseModel):
    id: str
    profile_id: str
    title: str
    subject: str
    due_date: datetime
    status: str
    instructions: Optional[str]


@router.get("", response_model=List[AssignmentResponse])
async def list_assignments(
    profile_id: str = Query(..., description="Target profile ID"),
    db: AsyncSession = Depends(get_db),
) -> List[AssignmentResponse]:
    """Lists homework assignments and deadlines for the given profile."""
    stmt = select(KidsAssignment).where(KidsAssignment.profile_id == profile_id)
    result = await db.execute(stmt)
    assignments = result.scalars().all()
    return [
        AssignmentResponse(
            id=a.id,
            profile_id=a.profile_id,
            title=a.title,
            subject=a.subject,
            due_date=a.due_date,
            status=a.status,
            instructions=a.instructions,
        )
        for a in assignments
    ]
