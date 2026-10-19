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

"""REST API endpoints for household meal plans."""

from __future__ import annotations

import json
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, Query, status
from pydantic import BaseModel
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from yarvelle_core.api.deps import get_db
from yarvelle.household.db.models import HouseholdMealPlan

router = APIRouter(tags=["household_meals"])


class MealPlanResponse(BaseModel):
    id: str
    profile_id: str
    week_identifier: str
    meals: Dict[str, Any]
    groceries: List[str]
    allergens: List[str]


@router.get("", response_model=List[MealPlanResponse])
async def list_meal_plans(
    profile_id: str = Query(..., description="Target profile ID"),
    db: AsyncSession = Depends(get_db),
) -> List[MealPlanResponse]:
    """Lists meal plans for the given profile."""
    stmt = (
        select(HouseholdMealPlan)
        .where(HouseholdMealPlan.profile_id == profile_id)
        .order_by(desc(HouseholdMealPlan.created_at))
    )
    result = await db.execute(stmt)
    plans = result.scalars().all()
    responses = []
    for p in plans:
        try:
            m = json.loads(p.meals_json)
            g = json.loads(p.groceries_json)
            a = json.loads(p.allergens_json)
        except Exception:
            m, g, a = {}, [], []
        responses.append(
            MealPlanResponse(
                id=p.id,
                profile_id=p.profile_id,
                week_identifier=p.week_identifier,
                meals=m,
                groceries=g,
                allergens=a,
            )
        )
    return responses
