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

"""SQLAlchemy declarative models for Yarvelle Education Pack."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional
import uuid

from sqlalchemy import DateTime, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from yarvelle_core.db.base import Base
from yarvelle_core.scope.mixin import ScopedMixin


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class EducationAssignment(Base, ScopedMixin):
    """Homework, project, and exam deadline tracker."""

    __tablename__ = "education_assignments"
    __table_args__ = (
        Index(
            "ix_education_assignments_profile_status_due",
            "profile_id",
            "status",
            "due_date",
            info={"comment": "Composite index accelerating assignment queries filtered by profile, status, and due_date."},
        ),
        {
            "extend_existing": True,
            "comment": "Academic assignments, projects, and exam deadlines tracked per student profile.",
        },
    )

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        doc="Unique assignment UUID v4 identifier.",
        comment="Unique assignment UUID v4 identifier.",
    )
    profile_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("profiles.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
        doc="Owning student profile UUID v4 identifier.",
        comment="Owning student profile UUID v4 identifier.",
    )
    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        doc="Assignment, project, or exam title.",
        comment="Assignment, project, or exam title.",
    )
    subject: Mapped[str] = mapped_column(
        String(128),
        nullable=False,
        default="General",
        doc="Academic subject or course name (e.g. Mathematics, Science, Reading, General).",
        comment="Academic subject or course name (e.g. Mathematics, Science, Reading, General).",
    )
    due_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        doc="Submission deadline timestamp (UTC).",
        comment="Submission deadline timestamp (UTC).",
    )
    status: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        default="assigned",
        doc="Completion status: assigned, in_progress, completed.",
        comment="Completion status: assigned, in_progress, completed.",
    )
    instructions: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        doc="Detailed assignment instructions, rubric notes, or study steps.",
        comment="Detailed assignment instructions, rubric notes, or study steps.",
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        nullable=False,
        doc="Creation timestamp (UTC).",
        comment="Creation timestamp (UTC).",
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        onupdate=utc_now,
        nullable=False,
        doc="Last modification timestamp (UTC).",
        comment="Last modification timestamp (UTC).",
    )


class EducationMilestone(Base, ScopedMixin):
    """Developmental milestone and growth celebration (non-comparative)."""

    __tablename__ = "education_milestones"
    __table_args__ = {
        "extend_existing": True,
        "comment": "Personal learning and developmental milestones recorded per profile.",
    }

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        doc="Unique milestone UUID v4 identifier.",
        comment="Unique milestone UUID v4 identifier.",
    )
    profile_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("profiles.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
        doc="Owning profile UUID v4 identifier.",
        comment="Owning profile UUID v4 identifier.",
    )
    category: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        default="personal",
        doc="Milestone category: reading, academic, personal, creative.",
        comment="Milestone category: reading, academic, personal, creative.",
    )
    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        doc="Milestone celebration title.",
        comment="Milestone celebration title.",
    )
    achieved_on: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=utc_now,
        doc="Timestamp when the milestone was achieved (UTC).",
        comment="Timestamp when the milestone was achieved (UTC).",
    )
    notes: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        doc="Optional narrative reflection or notes on the milestone.",
        comment="Optional narrative reflection or notes on the milestone.",
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        nullable=False,
        doc="Creation timestamp (UTC).",
        comment="Creation timestamp (UTC).",
    )


class EducationReadingLog(Base, ScopedMixin):
    """Daily reading streak and book progress log."""

    __tablename__ = "education_reading_logs"
    __table_args__ = {
        "extend_existing": True,
        "comment": "Daily reading session logs tracking book title, author, minutes read, and reflections.",
    }

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        doc="Unique reading log UUID v4 identifier.",
        comment="Unique reading log UUID v4 identifier.",
    )
    profile_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("profiles.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
        doc="Owning reader profile UUID v4 identifier.",
        comment="Owning reader profile UUID v4 identifier.",
    )
    book_title: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        doc="Title of the book or article read.",
        comment="Title of the book or article read.",
    )
    author: Mapped[Optional[str]] = mapped_column(
        String(128),
        nullable=True,
        doc="Book author name.",
        comment="Book author name.",
    )
    minutes_read: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        doc="Duration of reading session in minutes.",
        comment="Duration of reading session in minutes.",
    )
    date_read: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=utc_now,
        doc="Date/timestamp of the reading session (UTC).",
        comment="Date/timestamp of the reading session (UTC).",
    )
    reflection: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        doc="Optional reader reflection or summary note.",
        comment="Optional reader reflection or summary note.",
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        nullable=False,
        doc="Record creation timestamp (UTC).",
        comment="Record creation timestamp (UTC).",
    )
