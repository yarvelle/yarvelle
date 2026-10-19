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

"""REST API endpoints for finance bills."""

from __future__ import annotations

from datetime import datetime
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from yarvelle_core.api.deps import get_db
from yarvelle_finance.db.models import FinanceBill

router = APIRouter(tags=["finance_bills"])


class BillResponse(BaseModel):
    id: str
    profile_id: str
    biller_name: str
    amount: float
    due_date: datetime
    frequency: str
    category: str
    status: str


@router.get("", response_model=List[BillResponse])
async def list_bills(
    profile_id: str = Query(..., description="Target profile ID"),
    db: AsyncSession = Depends(get_db),
) -> List[BillResponse]:
    """Lists recurring bills for the given profile."""
    stmt = select(FinanceBill).where(FinanceBill.profile_id == profile_id)
    result = await db.execute(stmt)
    bills = result.scalars().all()
    return [
        BillResponse(
            id=b.id,
            profile_id=b.profile_id,
            biller_name=b.biller_name,
            amount=float(b.amount),
            due_date=b.due_date,
            frequency=b.frequency,
            category=b.category,
            status=b.status,
        )
        for b in bills
    ]
