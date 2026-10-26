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

"""SQLAlchemy 2.0 declarative database models for Household Pack & Cross-Domain Layer."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import uuid

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship as orm_relationship

from yarvelle_core.db.base import Base
from yarvelle_core.scope.mixin import ScopedMixin


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Household(Base):
    """Multi-profile household container managing family members, settings, and domain toggles (YV-FAM-1)."""

    __tablename__ = "households"
    __table_args__ = {"extend_existing": True}

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        doc="Unique household identifier (UUID v4 string)",
    )
    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        doc="Household display name (e.g. Miller Family Household)",
    )
    domain_toggles: Mapped[Dict[str, bool]] = mapped_column(
        JSON,
        default=lambda: {"health": True, "finance": True, "education": True, "household": True},
        nullable=False,
        doc="Per-domain enable/disable toggles (health, finance, education, household) (YV-X-7)",
    )
    two_guardian_rules: Mapped[Dict[str, str]] = mapped_column(
        JSON,
        default=lambda: {
            "finance": "both_guardians",
            "education": "any_guardian",
            "health": "any_guardian",
            "household": "any_guardian",
        },
        nullable=False,
        doc="Configurable two-guardian approval rules per domain (both_guardians or any_guardian) (YV-FAM-6)",
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        nullable=False,
        doc="Creation timestamp (UTC)",
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        onupdate=utc_now,
        nullable=False,
        doc="Last modification timestamp (UTC)",
    )

    # Relationships
    members: Mapped[List[HouseholdMember]] = orm_relationship(
        "HouseholdMember",
        back_populates="household",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    def __repr__(self) -> str:
        return f"<Household id={self.id!r} name={self.name!r}>"


class HouseholdMember(Base):
    """Household membership and governance association linking profiles to households (YV-FAM-1..3)."""

    __tablename__ = "household_members"
    __table_args__ = (
        Index("ix_household_members_hh_prof", "household_id", "profile_id", unique=True),
        {"extend_existing": True},
    )

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        doc="Unique membership identifier (UUID v4)",
    )
    household_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("households.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
        doc="Referenced Household container identifier",
    )
    profile_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("profiles.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
        doc="Referenced Profile identifier",
    )
    user_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="SET NULL"),
        index=True,
        nullable=True,
        doc="Associated authenticated User ID (nullable for dependents without login)",
    )
    role: Mapped[str] = mapped_column(
        String(32),
        default="member",
        nullable=False,
        doc="Role-based permission: admin, member, guest, dependent (YV-FAM-3)",
    )
    relationship: Mapped[str] = mapped_column(
        String(64),
        default="self",
        nullable=False,
        doc="Family relationship: self, spouse, partner, child, parent, senior, caregiver, other",
    )
    age_band: Mapped[str] = mapped_column(
        String(32),
        default="adult",
        nullable=False,
        doc="Age band classification: child_u13, teen_13_17, adult, older_adult (YV-FAM-2)",
    )
    is_private: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        doc="Whether teen privacy or confidential profile status is enabled (YV-FAM-5)",
    )
    delegated_scopes: Mapped[List[str]] = mapped_column(
        JSON,
        default=list,
        nullable=False,
        doc="Scoped domain permissions explicitly delegated to this member (YV-FAM-4)",
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        nullable=False,
        doc="Creation timestamp (UTC)",
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        onupdate=utc_now,
        nullable=False,
        doc="Last modification timestamp (UTC)",
    )

    # Relationships
    household: Mapped[Household] = orm_relationship("Household", back_populates="members")

    def __repr__(self) -> str:
        return f"<HouseholdMember hh={self.household_id!r} prof={self.profile_id!r} role={self.role!r}>"


class CrossDomainLink(Base):
    """Typed relationship link connecting entities across domain scopes (YV-X-2)."""

    __tablename__ = "cross_domain_links"
    __table_args__ = {"extend_existing": True}

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        doc="Unique cross-domain link identifier (UUID v4 string)",
    )
    source_domain: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        index=True,
        doc="Source entity domain (health, finance, education, household, cross)",
    )
    source_entity_type: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        doc="Source entity type (appointment, note, attachment, activity, bill, reminder, school_form)",
    )
    source_entity_id: Mapped[str] = mapped_column(
        String(36),
        nullable=False,
        index=True,
        doc="Source entity UUID",
    )
    target_domain: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        index=True,
        doc="Target entity domain (health, finance, education, household, cross)",
    )
    target_entity_type: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        doc="Target entity type (appointment, note, attachment, activity, bill, reminder, school_form)",
    )
    target_entity_id: Mapped[str] = mapped_column(
        String(36),
        nullable=False,
        index=True,
        doc="Target entity UUID",
    )
    link_type: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        index=True,
        doc="Typed link relationship (visit_to_bill, school_form_to_cost, iep_to_neuro_checkup, form_to_activity, receipt_to_hsa, maintenance_to_warranty, event_to_fee, reconciled_with)",
    )
    profile_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("profiles.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
        doc="Owning profile identifier",
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        nullable=False,
        doc="Creation timestamp (UTC)",
    )
    description: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        doc="Optional relationship notes, context, or explanation",
    )

    @property
    def source_id(self) -> str:
        return self.source_entity_id

    @property
    def target_id(self) -> str:
        return self.target_entity_id

    def __repr__(self) -> str:
        return (
            f"<CrossDomainLink {self.source_domain}:{self.source_entity_id} -> "
            f"{self.target_domain}:{self.target_entity_id} type={self.link_type!r}>"
        )


class HouseholdChore(Base, ScopedMixin):
    """Household chore assignment, streak, and check-off."""

    __tablename__ = "household_chores"
    __table_args__ = {
        "extend_existing": True,
        "comment": "Household chore assignments, recurrence frequencies, completion streaks, and timestamps.",
    }

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        doc="Unique chore UUID v4 identifier.",
        comment="Unique chore UUID v4 identifier.",
    )
    profile_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("profiles.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
        doc="Owning profile UUID v4 identifier.",
        comment="Owning profile UUID v4 identifier.",
    )
    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        doc="Chore title or task description.",
        comment="Chore title or task description.",
    )
    assigned_to: Mapped[str] = mapped_column(
        String(128),
        nullable=False,
        default="all",
        doc="Assigned family member name or 'all'.",
        comment="Assigned family member name or 'all'.",
    )
    frequency: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        default="daily",
        doc="Chore recurrence frequency: daily, weekly, monthly.",
        comment="Chore recurrence frequency: daily, weekly, monthly.",
    )
    streak: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        doc="Consecutive completion streak count.",
        comment="Consecutive completion streak count.",
    )
    last_completed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        doc="Timestamp when the chore was most recently completed (UTC).",
        comment="Timestamp when the chore was most recently completed (UTC).",
    )
    notes: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        doc="Optional chore instructions or notes.",
        comment="Optional chore instructions or notes.",
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


class HouseholdMealPlan(Base, ScopedMixin):
    """Weekly family meal schedule, allergen guard, and grocery list."""

    __tablename__ = "household_meal_plans"
    __table_args__ = {
        "extend_existing": True,
        "comment": "Weekly household meal schedules, grocery lists, and allergen constraints per profile.",
    }

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        doc="Unique meal plan UUID v4 identifier.",
        comment="Unique meal plan UUID v4 identifier.",
    )
    profile_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("profiles.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
        doc="Owning profile UUID v4 identifier.",
        comment="Owning profile UUID v4 identifier.",
    )
    week_identifier: Mapped[str] = mapped_column(
        String(16),
        nullable=False,
        index=True,
        doc="ISO week identifier formatted as YYYY-Www (e.g. '2026-W42').",
        comment="ISO week identifier formatted as YYYY-Www (e.g. '2026-W42').",
    )
    meals_json: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        default="{}",
        doc="Serialized JSON schedule of planned meals by day of week.",
        comment="Serialized JSON schedule of planned meals by day of week.",
    )
    groceries_json: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        default="[]",
        doc="Serialized JSON array of grocery list items.",
        comment="Serialized JSON array of grocery list items.",
    )
    allergens_json: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        default="[]",
        doc="Serialized JSON array of household dietary allergens to avoid.",
        comment="Serialized JSON array of household dietary allergens to avoid.",
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


class HouseholdActivity(Base, ScopedMixin):
    """Extracurricular sports, clubs, lessons, and schedules."""

    __tablename__ = "household_activities"
    __table_args__ = {
        "extend_existing": True,
        "comment": "Extracurricular sports, clubs, lessons, locations, and schedules per profile.",
    }

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        doc="Unique household activity UUID v4 identifier.",
        comment="Unique household activity UUID v4 identifier.",
    )
    profile_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("profiles.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
        doc="Owning profile UUID v4 identifier.",
        comment="Owning profile UUID v4 identifier.",
    )
    activity_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        doc="Name of the sport, club, lesson, or family activity.",
        comment="Name of the sport, club, lesson, or family activity.",
    )
    category: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        default="sports",
        doc="Activity category: sports, music, arts, club, family.",
        comment="Activity category: sports, music, arts, club, family.",
    )
    location: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
        doc="Physical venue or online location of the activity.",
        comment="Physical venue or online location of the activity.",
    )
    start_time: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        doc="Activity start timestamp (UTC).",
        comment="Activity start timestamp (UTC).",
    )
    end_time: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        doc="Activity end timestamp (UTC).",
        comment="Activity end timestamp (UTC).",
    )
    recurrence_rrule: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
        doc="Optional RFC 5545 recurrence rule string.",
        comment="Optional RFC 5545 recurrence rule string.",
    )
    coach_or_leader: Mapped[Optional[str]] = mapped_column(
        String(128),
        nullable=True,
        doc="Coach, instructor, or organizer name.",
        comment="Coach, instructor, or organizer name.",
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
