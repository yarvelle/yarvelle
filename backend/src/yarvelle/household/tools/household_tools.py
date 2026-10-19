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

"""Executors and ToolSpecs for Yarvelle Household Pack."""

from __future__ import annotations

from datetime import datetime, timezone
import json
import logging
from typing import Any, Dict, List, Optional
import uuid

from sqlalchemy import desc, select

from yarvelle_core.db.session import get_session_factory
from yarvelle_core.engine.tool_registry import DataFlows, ToolSpec
from yarvelle_core.schemas.tool import ToolResult
from yarvelle.household.db.models import (
    HouseholdActivity,
    HouseholdChore,
    HouseholdMealPlan,
)

logger = logging.getLogger("yarvelle_household.tools")


def _resolve_profile_id(ctx: Any) -> str:
    """Extracts non-empty profile_id from ToolContext."""
    if ctx is None:
        return "default-profile"
    pid = getattr(ctx, "profile_id", None)
    if isinstance(pid, str) and pid.strip():
        return pid.strip()
    return "default-profile"


async def execute_manage_chores(args: Dict[str, Any], ctx: Any = None) -> ToolResult:
    """Manages chore rotations, routine check-offs, and streaks."""
    action = str(args.get("action", "list")).lower().strip()
    profile_id = _resolve_profile_id(ctx)

    # Safety: Refuse covert monitoring
    if args.get("covert") or "secret" in str(args.get("description", "")).lower():
        return ToolResult(
            success=False,
            error="Safety Violation: Covert monitoring of family members is strictly prohibited in Yarvelle.",
        )

    session_factory = get_session_factory()
    async with session_factory() as session:
        if action == "add":
            title = str(args.get("title", "Chore")).strip()
            chore = HouseholdChore(
                id=str(uuid.uuid4()),
                profile_id=profile_id,
                title=title,
                assigned_to=args.get("assigned_to", "all"),
                frequency=args.get("frequency", "daily"),
                streak=0,
                notes=args.get("notes"),
                scope="household.chores",
            )
            session.add(chore)
            await session.commit()
            return ToolResult(
                success=True,
                output={"status": "created", "chore_id": chore.id, "title": title, "assigned_to": chore.assigned_to},
            )
        elif action == "complete":
            chore_id = args.get("chore_id")
            stmt = select(HouseholdChore).where(HouseholdChore.profile_id == profile_id)
            if chore_id:
                stmt = stmt.where(HouseholdChore.id == chore_id)
            result = await session.execute(stmt)
            chore = result.scalars().first()
            if not chore:
                return ToolResult(success=False, error="Chore not found.")
            chore.streak += 1
            chore.last_completed_at = datetime.now(timezone.utc)
            await session.commit()
            return ToolResult(
                success=True,
                output={"status": "completed", "chore_id": chore.id, "title": chore.title, "streak": chore.streak},
            )
        else:
            stmt = select(HouseholdChore).where(HouseholdChore.profile_id == profile_id)
            result = await session.execute(stmt)
            chores = [
                {
                    "id": c.id,
                    "title": c.title,
                    "assigned_to": c.assigned_to,
                    "frequency": c.frequency,
                    "streak": c.streak,
                    "last_completed_at": c.last_completed_at.isoformat() if c.last_completed_at else None,
                }
                for c in result.scalars().all()
            ]
            return ToolResult(success=True, output={"chores": chores, "count": len(chores)})


async def execute_manage_meal_plan(args: Dict[str, Any], ctx: Any = None) -> ToolResult:
    """Manages weekly family meal planning, allergen rules, and grocery checklists."""
    action = str(args.get("action", "view")).lower().strip()
    profile_id = _resolve_profile_id(ctx)
    session_factory = get_session_factory()

    async with session_factory() as session:
        if action == "save":
            week = args.get("week", datetime.now(timezone.utc).strftime("%Y-W%W"))
            meals = args.get("meals", {})
            groceries = args.get("groceries", [])
            allergens = args.get("allergens", [])
            plan = HouseholdMealPlan(
                id=str(uuid.uuid4()),
                profile_id=profile_id,
                week_identifier=week,
                meals_json=json.dumps(meals),
                groceries_json=json.dumps(groceries),
                allergens_json=json.dumps(allergens),
                scope="household.meals",
            )
            session.add(plan)
            await session.commit()
            return ToolResult(
                success=True,
                output={"status": "saved", "plan_id": plan.id, "week": week, "meals_count": len(meals)},
            )
        else:
            stmt = select(HouseholdMealPlan).where(HouseholdMealPlan.profile_id == profile_id).order_by(desc(HouseholdMealPlan.created_at))
            result = await session.execute(stmt)
            plan = result.scalars().first()
            if not plan:
                return ToolResult(success=True, output={"week": "current", "meals": {}, "groceries": [], "allergens": []})
            try:
                meals = json.loads(plan.meals_json)
                groceries = json.loads(plan.groceries_json)
                allergens = json.loads(plan.allergens_json)
            except Exception:
                meals, groceries, allergens = {}, [], []
            return ToolResult(
                success=True,
                output={"week": plan.week_identifier, "meals": meals, "groceries": groceries, "allergens": allergens},
            )


async def execute_activity_schedule(args: Dict[str, Any], ctx: Any = None) -> ToolResult:
    """Schedules extracurricular sports, music lessons, and clubs."""
    action = str(args.get("action", "list")).lower().strip()
    profile_id = _resolve_profile_id(ctx)
    session_factory = get_session_factory()

    async with session_factory() as session:
        if action == "add":
            name = str(args.get("activity_name", "Soccer")).strip()
            start = datetime.fromisoformat(args["start_time"]) if args.get("start_time") else datetime.now(timezone.utc)
            end = datetime.fromisoformat(args["end_time"]) if args.get("end_time") else start
            act = HouseholdActivity(
                id=str(uuid.uuid4()),
                profile_id=profile_id,
                activity_name=name,
                category=args.get("category", "sports"),
                location=args.get("location"),
                start_time=start,
                end_time=end,
                coach_or_leader=args.get("coach_or_leader"),
                scope="household.activities",
            )
            session.add(act)
            await session.commit()
            return ToolResult(success=True, output={"status": "scheduled", "activity_id": act.id, "name": name})
        else:
            stmt = select(HouseholdActivity).where(HouseholdActivity.profile_id == profile_id)
            result = await session.execute(stmt)
            activities = [
                {"id": a.id, "name": a.activity_name, "category": a.category, "start": a.start_time.isoformat()}
                for a in result.scalars().all()
            ]
            return ToolResult(success=True, output={"activities": activities, "count": len(activities)})


# ============================================================================
# ToolSpec Declarations
# ============================================================================

SPEC_ACTIVITY_SCHEDULE = ToolSpec(
    name="activity_schedule",
    description="Schedules extracurricular sports, music, and after-school clubs.",
    parameters={"type": "object", "properties": {"action": {"type": "string"}, "activity_name": {"type": "string"}}},
    risk_tier="write_local",
    trust="trusted",
    data_flows=DataFlows(),
    executor=execute_activity_schedule,
    scopes={"household.activities"},
)

SPEC_MANAGE_CHORES = ToolSpec(
    name="manage_chores",
    description="Manages household chore rotations, daily check-offs, streaks, and family reminders.",
    parameters={"type": "object", "properties": {"action": {"type": "string"}, "title": {"type": "string"}, "assigned_to": {"type": "string"}}},
    risk_tier="write_local",
    trust="trusted",
    data_flows=DataFlows(),
    executor=execute_manage_chores,
    scopes={"household.chores"},
)

SPEC_MANAGE_MEAL_PLAN = ToolSpec(
    name="manage_meal_plan",
    description="Manages weekly family meal planning, allergen rules, and grocery lists.",
    parameters={"type": "object", "properties": {"action": {"type": "string"}, "week": {"type": "string"}}},
    risk_tier="write_local",
    trust="trusted",
    data_flows=DataFlows(),
    executor=execute_manage_meal_plan,
    scopes={"household.meals"},
)


def get_household_tool_specs() -> List[ToolSpec]:
    """Returns all 3 Household Pack ToolSpecs."""
    return [
        SPEC_ACTIVITY_SCHEDULE,
        SPEC_MANAGE_CHORES,
        SPEC_MANAGE_MEAL_PLAN,
    ]
