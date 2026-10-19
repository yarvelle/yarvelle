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

"""SQLAlchemy 2.0 declarative database models for Household & Cross-Domain Layer."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import uuid

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship as orm_relationship

from yarvelle_core.db.base import Base


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
