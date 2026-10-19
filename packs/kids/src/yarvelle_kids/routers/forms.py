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

"""REST API endpoints for kids draft school forms."""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, Query, status
from pydantic import BaseModel, Field

router = APIRouter(tags=["kids_forms"])


class SchoolFormDraftResponse(BaseModel):
    form_type: str
    student_name: str
    activity: str
    draft_only: bool = True
    requires_guardian_signature: bool = True
    auto_submitted: bool = False


@router.get("", response_model=List[SchoolFormDraftResponse])
async def list_school_forms(
    profile_id: str = Query(..., description="Target profile ID"),
) -> List[SchoolFormDraftResponse]:
    """Lists draft prefilled school forms requiring guardian review."""
    return [
        SchoolFormDraftResponse(
            form_type="permission_slip",
            student_name="Student",
            activity="Science Field Trip",
            draft_only=True,
            requires_guardian_signature=True,
            auto_submitted=False,
        )
    ]
