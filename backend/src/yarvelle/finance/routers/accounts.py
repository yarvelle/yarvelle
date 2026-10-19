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

"""REST API endpoints for finance accounts."""

from __future__ import annotations

from typing import Any, List, Optional
from fastapi import APIRouter, Depends, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from yarvelle_core.api.deps import get_db
from yarvelle.finance.db.models import FinanceAccount

router = APIRouter(tags=["finance_accounts"])


class AccountResponse(BaseModel):
    id: str
    profile_id: str
    account_name: str
    institution_name: str
    account_type: str
    masked_number: str
    current_balance: float
    currency: str


@router.get("", response_model=List[AccountResponse])
async def list_accounts(
    profile_id: str = Query(..., description="Target profile ID"),
    db: AsyncSession = Depends(get_db),
) -> List[AccountResponse]:
    """Lists financial accounts for the given profile."""
    stmt = select(FinanceAccount).where(FinanceAccount.profile_id == profile_id)
    result = await db.execute(stmt)
    accounts = result.scalars().all()
    return [
        AccountResponse(
            id=a.id,
            profile_id=a.profile_id,
            account_name=a.account_name,
            institution_name=a.institution_name,
            account_type=a.account_type,
            masked_number=a.masked_number,
            current_balance=float(a.current_balance),
            currency=a.currency,
        )
        for a in accounts
    ]
