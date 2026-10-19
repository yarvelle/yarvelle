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

"""Pydantic v2 schemas for Household & Cross-Domain platform services."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, ConfigDict, Field


# -----------------------------------------------------------------------------
# Household & Member Governance Schemas
# -----------------------------------------------------------------------------

class HouseholdResponse(BaseModel):
    id: str
    name: str
    domain_toggles: Dict[str, bool]
    two_guardian_rules: Dict[str, str]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CreateHouseholdRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    domain_toggles: Optional[Dict[str, bool]] = None
    two_guardian_rules: Optional[Dict[str, str]] = None


class UpdateTogglesRequest(BaseModel):
    health: Optional[bool] = None
    finance: Optional[bool] = None
    education: Optional[bool] = None
    household: Optional[bool] = None


class HouseholdMemberResponse(BaseModel):
    id: str
    household_id: str
    profile_id: str
    user_id: Optional[str] = None
    role: Literal["admin", "member", "guest", "dependent"]
    relationship: str
    age_band: Literal["child_u13", "teen_13_17", "adult", "older_adult"]
    is_private: bool
    delegated_scopes: List[str]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AddMemberRequest(BaseModel):
    profile_id: str
    user_id: Optional[str] = None
    role: Literal["admin", "member", "guest", "dependent"] = "member"
    relationship: str = "self"
    age_band: Literal["child_u13", "teen_13_17", "adult", "older_adult"] = "adult"
    is_private: bool = False
    delegated_scopes: List[str] = Field(default_factory=list)


class UpdateMemberRequest(BaseModel):
    role: Optional[Literal["admin", "member", "guest", "dependent"]] = None
    relationship: Optional[str] = None
    age_band: Optional[Literal["child_u13", "teen_13_17", "adult", "older_adult"]] = None
    is_private: Optional[bool] = None
    delegated_scopes: Optional[List[str]] = None


# -----------------------------------------------------------------------------
# Unified Timeline Schemas (YV-X-1)
# -----------------------------------------------------------------------------

class TimelineItem(BaseModel):
    id: str
    domain: Literal["health", "finance", "education", "household", "cross"]
    item_type: str  # "appointment", "reminder", "school_form", "bill", "chore", "maintenance", "assignment", "travel", "note", "attachment"
    date_time: datetime
    end_time: Optional[datetime] = None
    title: str
    description: Optional[str] = None
    status: str = "pending"  # "scheduled", "pending", "completed", "due", "draft", "expired"
    profile_id: Optional[str] = None  # Crucial Bug 2 fix: must be Optional[str] to prevent crash on null attachment profile
    profile_name: Optional[str] = None
    household_id: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    links: List[Dict[str, Any]] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class TimelineResponse(BaseModel):
    items: List[TimelineItem]
    total_count: int
    domains_included: List[str]
    has_more: bool = False


# -----------------------------------------------------------------------------
# Cross-Domain Links Schemas (YV-X-2)
# -----------------------------------------------------------------------------

class CrossDomainLinkCreate(BaseModel):
    source_domain: str
    source_entity_type: str
    source_entity_id: str
    target_domain: str
    target_entity_type: str
    target_entity_id: str
    link_type: str
    profile_id: str
    description: Optional[str] = None


class CrossDomainLinkResponse(BaseModel):
    id: str
    source_domain: str
    source_entity_type: str
    source_entity_id: str
    target_domain: str
    target_entity_type: str
    target_entity_id: str
    link_type: str
    profile_id: str
    created_at: datetime
    description: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# -----------------------------------------------------------------------------
# Conflict & Deadline Cluster Schemas (YV-X-3)
# -----------------------------------------------------------------------------

class ConflictItem(BaseModel):
    id: str
    type: str  # "schedule_overlap", "travel_deficit", "bill_due_cluster", "medical_prep_conflict", "deadline_cluster", "physical_expired"
    severity: Literal["info", "warning", "critical"]
    title: str
    description: str
    event_ids: List[str] = Field(default_factory=list)
    profiles_involved: List[str] = Field(default_factory=list)
    domains_involved: List[str] = Field(default_factory=list)
    suggested_action: Optional[str] = None


class ConflictResponse(BaseModel):
    window: str
    conflicts_count: int
    conflicts: List[ConflictItem]


# -----------------------------------------------------------------------------
# Scoped Shredding & Export Schemas (YV-X-8)
# -----------------------------------------------------------------------------

class PurgeDomainRequest(BaseModel):
    profile_id: str
    domain: str


class PurgeDomainResponse(BaseModel):
    purged: bool
    domain: str
    profile_id: str


class CryptoShredResponse(BaseModel):
    shredded: bool
    profile_id: str
    message: str
