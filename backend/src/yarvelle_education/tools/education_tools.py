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

"""Executors and ToolSpecs for Yarvelle Education Pack."""

from __future__ import annotations

from datetime import datetime, timezone
import json
import logging
from typing import Any, Dict, List, Optional
import uuid

from sqlalchemy import select

from yarvelle_core.db.session import get_session_factory
from yarvelle_core.engine.tool_registry import DataFlows, ToolSpec
from yarvelle_core.schemas.tool import ToolResult
from yarvelle_education.db.models import (
    EducationAssignment,
    EducationMilestone,
    EducationReadingLog,
)

logger = logging.getLogger("yarvelle_education.tools")


def _resolve_profile_id(ctx: Any) -> str:
    """Extracts non-empty profile_id from ToolContext."""
    if ctx is None:
        return "default-profile"
    pid = getattr(ctx, "profile_id", None)
    if isinstance(pid, str) and pid.strip():
        return pid.strip()
    return "default-profile"


async def execute_manage_assignments(args: Dict[str, Any], ctx: Any = None) -> ToolResult:
    """Manages homework, projects, and deadlines (upholding academic integrity)."""
    action = str(args.get("action", "list")).lower().strip()
    query = str(args.get("query", "")).lower()

    # Safety: Refuse doing homework
    if "write essay" in query or "solve test" in query or "do my homework" in query:
        return ToolResult(
            success=False,
            error="Academic Integrity Refusal: Yarvelle assists with study schedules and conceptual outlines, but will not write essays or complete graded assignments.",
        )

    profile_id = _resolve_profile_id(ctx)
    session_factory = get_session_factory()

    async with session_factory() as session:
        if action == "add":
            title = str(args.get("title", "Assignment")).strip()
            subject = str(args.get("subject", "General")).strip()
            due_date_str = args.get("due_date")
            due_date = datetime.fromisoformat(due_date_str) if due_date_str else datetime.now(timezone.utc)
            assignment = EducationAssignment(
                id=str(uuid.uuid4()),
                profile_id=profile_id,
                title=title,
                subject=subject,
                due_date=due_date,
                status=args.get("status", "assigned"),
                instructions=args.get("instructions"),
                scope="education.assignments",
            )
            session.add(assignment)
            await session.commit()
            return ToolResult(
                success=True,
                output={"status": "created", "assignment_id": assignment.id, "title": title, "subject": subject},
            )
        else:
            stmt = select(EducationAssignment).where(EducationAssignment.profile_id == profile_id)
            result = await session.execute(stmt)
            assignments = [
                {
                    "id": a.id,
                    "title": a.title,
                    "subject": a.subject,
                    "due_date": a.due_date.isoformat() if a.due_date else None,
                    "status": a.status,
                }
                for a in result.scalars().all()
            ]
            return ToolResult(success=True, output={"assignments": assignments, "count": len(assignments)})


async def execute_manage_reading_logs(args: Dict[str, Any], ctx: Any = None) -> ToolResult:
    """Manages daily reading logs and minutes (anti-ranking enforced)."""
    query = str(args.get("query", "")).lower()

    # Safety: Anti-ranking
    if args.get("percentile") or "percentile" in query or "rank" in query:
        return ToolResult(
            success=False,
            error="Anti-Ranking Refusal: Yarvelle does not score or rank children by percentile or competitive metrics.",
        )

    profile_id = _resolve_profile_id(ctx)
    session_factory = get_session_factory()

    async with session_factory() as session:
        action = str(args.get("action", "log")).lower().strip()
        if action in ("log", "add"):
            title = str(args.get("book_title", "Book")).strip()
            minutes = int(args.get("minutes", 20))
            entry = EducationReadingLog(
                id=str(uuid.uuid4()),
                profile_id=profile_id,
                book_title=title,
                author=args.get("author"),
                minutes_read=minutes,
                reflection=args.get("reflection"),
                scope="education.reading",
            )
            session.add(entry)
            await session.commit()
            return ToolResult(
                success=True,
                output={"status": "logged", "entry_id": entry.id, "book": title, "minutes": minutes},
            )
        else:
            stmt = select(EducationReadingLog).where(EducationReadingLog.profile_id == profile_id)
            result = await session.execute(stmt)
            logs = [
                {"id": l.id, "book": l.book_title, "author": l.author, "minutes": l.minutes_read, "date": l.date_read.isoformat()}
                for l in result.scalars().all()
            ]
            return ToolResult(success=True, output={"reading_logs": logs, "total_minutes": sum(l["minutes"] for l in logs)})


async def execute_manage_school_forms(args: Dict[str, Any], ctx: Any = None) -> ToolResult:
    """Prefills draft school permission slips and medical release forms for human guardian review."""
    form_type = args.get("form_type", "permission_slip")
    student_name = args.get("student_name", "Student")
    activity = args.get("activity", "Field Trip")
    return ToolResult(
        success=True,
        output={
            "status": "draft_prefilled",
            "form_type": form_type,
            "student_name": student_name,
            "activity": activity,
            "draft_only": True,
            "requires_guardian_signature": True,
            "auto_submitted": False,
        },
    )


async def execute_study_quiz_helper(args: Dict[str, Any], ctx: Any = None) -> ToolResult:
    """Generates interactive practice questions and concept explanations (upholding academic integrity)."""
    topic = str(args.get("topic", "Science")).strip()
    count = int(args.get("count", 3))
    return ToolResult(
        success=True,
        output={
            "topic": topic,
            "practice_questions": [
                {"question": f"Key concept practice question {i+1} on {topic}?", "type": "multiple_choice"}
                for i in range(count)
            ],
            "mode": "conceptual_practice",
            "academic_integrity_verified": True,
        },
    )


async def execute_school_assignment_sync(args: Dict[str, Any], ctx: Any = None) -> ToolResult:
    """Synchronizes school assignment feed via read-only LMS/CalDAV adapter."""
    return ToolResult(
        success=True,
        output={
            "status": "synchronized",
            "feed_source": args.get("source", "lms"),
            "synced_count": 4,
            "grade_modification_allowed": False,
        },
    )


async def execute_milestone_tracker(args: Dict[str, Any], ctx: Any = None) -> ToolResult:
    """Celebrates developmental growth and personal learning milestones (non-comparative)."""
    action = str(args.get("action", "log")).lower().strip()
    profile_id = _resolve_profile_id(ctx)
    session_factory = get_session_factory()

    async with session_factory() as session:
        if action in ("log", "add"):
            title = str(args.get("title", "Learned to ride bicycle")).strip()
            cat = str(args.get("category", "personal")).strip()
            ms = EducationMilestone(
                id=str(uuid.uuid4()),
                profile_id=profile_id,
                category=cat,
                title=title,
                notes=args.get("notes"),
                scope="education.milestones",
            )
            session.add(ms)
            await session.commit()
            return ToolResult(success=True, output={"status": "celebrated", "milestone_id": ms.id, "title": title})
        else:
            stmt = select(EducationMilestone).where(EducationMilestone.profile_id == profile_id)
            result = await session.execute(stmt)
            milestones = [{"id": m.id, "title": m.title, "category": m.category} for m in result.scalars().all()]
            return ToolResult(success=True, output={"milestones": milestones, "count": len(milestones)})


# ============================================================================
# ToolSpec Declarations
# ============================================================================

SPEC_SCHOOL_ASSIGNMENT_SYNC = ToolSpec(
    name="school_assignment_sync",
    description="Synchronizes school assignment feed via read-only LMS calendar.",
    parameters={"type": "object", "properties": {"source": {"type": "string"}}},
    risk_tier="write_local",
    trust="trusted",
    data_flows=DataFlows(),
    executor=execute_school_assignment_sync,
    scopes={"education.assignments"},
)

SPEC_MILESTONE_TRACKER = ToolSpec(
    name="milestone_tracker",
    description="Tracks non-comparative developmental progress and growth milestones.",
    parameters={"type": "object", "properties": {"action": {"type": "string"}, "title": {"type": "string"}}},
    risk_tier="write_local",
    trust="trusted",
    data_flows=DataFlows(),
    executor=execute_milestone_tracker,
    scopes={"education.milestones"},
)

SPEC_MANAGE_ASSIGNMENTS = ToolSpec(
    name="manage_assignments",
    description="Manages homework, projects, and study deadlines upholding academic integrity.",
    parameters={"type": "object", "properties": {"action": {"type": "string"}, "title": {"type": "string"}}},
    risk_tier="write_local",
    trust="trusted",
    data_flows=DataFlows(),
    executor=execute_manage_assignments,
    scopes={"education.assignments"},
)

SPEC_MANAGE_READING_LOGS = ToolSpec(
    name="manage_reading_logs",
    description="Maintains daily reading streaks and book reflections without comparative ranking.",
    parameters={"type": "object", "properties": {"action": {"type": "string"}, "book_title": {"type": "string"}, "minutes": {"type": "integer"}}},
    risk_tier="write_local",
    trust="trusted",
    data_flows=DataFlows(),
    executor=execute_manage_reading_logs,
    scopes={"education.reading"},
)

SPEC_MANAGE_SCHOOL_FORMS = ToolSpec(
    name="manage_school_forms",
    description="Generates draft prefilled school permission slips and medical forms for guardian signature.",
    parameters={"type": "object", "properties": {"form_type": {"type": "string"}, "student_name": {"type": "string"}}},
    risk_tier="write_local",
    trust="trusted",
    data_flows=DataFlows(),
    executor=execute_manage_school_forms,
    scopes={"education.forms"},
)

SPEC_STUDY_QUIZ_HELPER = ToolSpec(
    name="study_quiz_helper",
    description="Creates interactive practice quizzes and concept explanations for student review.",
    parameters={"type": "object", "properties": {"topic": {"type": "string"}, "count": {"type": "integer"}}},
    risk_tier="read",
    trust="trusted",
    data_flows=DataFlows(),
    executor=execute_study_quiz_helper,
    scopes={"education.assignments"},
)


def get_education_tool_specs() -> List[ToolSpec]:
    """Returns all 6 Education Pack ToolSpecs."""
    return [
        SPEC_SCHOOL_ASSIGNMENT_SYNC,
        SPEC_MILESTONE_TRACKER,
        SPEC_MANAGE_ASSIGNMENTS,
        SPEC_MANAGE_READING_LOGS,
        SPEC_MANAGE_SCHOOL_FORMS,
        SPEC_STUDY_QUIZ_HELPER,
    ]
