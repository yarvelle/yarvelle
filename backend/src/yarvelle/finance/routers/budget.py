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

"""REST API endpoints for finance budgets."""

from __future__ import annotations

import json
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from yarvelle_core.api.deps import get_db
from yarvelle.finance.db.models import FinanceBudget

router = APIRouter(tags=["finance_budget"])


class BudgetResponse(BaseModel):
    id: Optional[str] = None
    profile_id: str
    period_month: str
    categories: Dict[str, float]
    total_planned: float


@router.get("", response_model=BudgetResponse)
async def get_budget(
    profile_id: str = Query(..., description="Target profile ID"),
    month: Optional[str] = Query(None, description="Month in YYYY-MM format"),
    db: AsyncSession = Depends(get_db),
) -> BudgetResponse:
    """Gets monthly budget planned vs actual for the given profile."""
    stmt = select(FinanceBudget).where(FinanceBudget.profile_id == profile_id)
    if month:
        stmt = stmt.where(FinanceBudget.period_month == month)
    stmt = stmt.order_by(desc(FinanceBudget.created_at))
    result = await db.execute(stmt)
    b = result.scalars().first()
    if not b:
        return BudgetResponse(
            profile_id=profile_id,
            period_month=month or "current",
            categories={},
            total_planned=0.0,
        )
    try:
        cats = json.loads(b.categories_json)
    except Exception:
        cats = {}
    return BudgetResponse(
        id=b.id,
        profile_id=b.profile_id,
        period_month=b.period_month,
        categories=cats,
        total_planned=float(b.total_planned),
    )
