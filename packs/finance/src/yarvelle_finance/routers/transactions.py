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

"""REST API endpoints for finance transactions."""

from __future__ import annotations

from datetime import datetime
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from yarvelle_core.api.deps import get_db
from yarvelle_finance.db.models import FinanceTransaction

router = APIRouter(tags=["finance_transactions"])


class TransactionResponse(BaseModel):
    id: str
    profile_id: str
    account_id: Optional[str]
    amount: float
    currency: str
    payee: str
    category: str
    transaction_date: datetime
    status: str
    notes: Optional[str]


@router.get("", response_model=List[TransactionResponse])
async def list_transactions(
    profile_id: str = Query(..., description="Target profile ID"),
    db: AsyncSession = Depends(get_db),
) -> List[TransactionResponse]:
    """Lists categorized transactions for the given profile."""
    stmt = select(FinanceTransaction).where(FinanceTransaction.profile_id == profile_id)
    result = await db.execute(stmt)
    txs = result.scalars().all()
    return [
        TransactionResponse(
            id=t.id,
            profile_id=t.profile_id,
            account_id=t.account_id,
            amount=float(t.amount),
            currency=t.currency,
            payee=t.payee,
            category=t.category,
            transaction_date=t.transaction_date,
            status=t.status,
            notes=t.notes,
        )
        for t in txs
    ]
