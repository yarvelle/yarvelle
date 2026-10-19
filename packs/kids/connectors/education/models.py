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

from __future__ import annotations

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class SchoolAssignment(BaseModel):
    id: str = Field(..., description="Assignment identifier")
    course_name: str = Field(..., description="Course or subject name (e.g. 5th Grade Science)")
    title: str = Field(..., description="Assignment title")
    description: Optional[str] = Field(None, description="Assignment description or prompt")
    due_at: Optional[str] = Field(None, description="Due date/time ISO string")
    points_possible: Optional[float] = Field(None, description="Maximum points possible")
    source_url: Optional[str] = Field(None, description="Link to source assignment in LMS")


class SchoolCalendarEvent(BaseModel):
    id: str = Field(..., description="Calendar event UID")
    title: str = Field(..., description="Event summary (e.g. Fall Field Trip, Parent-Teacher Conferences)")
    start_time: str = Field(..., description="Start timestamp ISO string")
    end_time: str = Field(..., description="End timestamp ISO string")
    location: Optional[str] = Field(None, description="Event location")
    description: Optional[str] = Field(None, description="Event details")
    all_day: bool = Field(False, description="Whether event is an all-day event")


class SchoolNoticeForm(BaseModel):
    id: str = Field(..., description="Notice or form identifier")
    title: str = Field(..., description="Notice title (e.g. Annual Field Trip Permission Slip)")
    due_date: Optional[str] = Field(None, description="Form submission deadline")
    form_type: str = Field("permission_slip", description="permission_slip, physical, general")
    institution_name: str = Field(..., description="School or organization name")
    prefill_data: Dict[str, Any] = Field(default_factory=dict, description="Extracted prefill fields")
