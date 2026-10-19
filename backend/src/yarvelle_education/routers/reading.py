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

"""REST API endpoints for education reading logs."""

from __future__ import annotations

from datetime import datetime
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, Query, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from yarvelle_core.api.deps import get_db
from yarvelle_education.db.models import EducationReadingLog

router = APIRouter(tags=["education_reading"])


class ReadingLogResponse(BaseModel):
    id: str
    profile_id: str
    book_title: str
    author: Optional[str]
    minutes_read: int
    date_read: datetime
    reflection: Optional[str]


@router.get("", response_model=List[ReadingLogResponse])
async def list_reading_logs(
    profile_id: str = Query(..., description="Target profile ID"),
    db: AsyncSession = Depends(get_db),
) -> List[ReadingLogResponse]:
    """Lists reading log entries for the given profile."""
    stmt = select(EducationReadingLog).where(EducationReadingLog.profile_id == profile_id)
    result = await db.execute(stmt)
    logs = result.scalars().all()
    return [
        ReadingLogResponse(
            id=l.id,
            profile_id=l.profile_id,
            book_title=l.book_title,
            author=l.author,
            minutes_read=l.minutes_read,
            date_read=l.date_read,
            reflection=l.reflection,
        )
        for l in logs
    ]
