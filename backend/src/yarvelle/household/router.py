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

"""FastAPI REST router for Household & Cross-Domain Layer."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Literal, Optional
import uuid

from fastapi import APIRouter, Depends, Header, HTTPException, Query, Response, status
from fastapi.responses import JSONResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from yarvelle_core.api.deps import get_current_user, get_user_profile_access, resolve_owner_user_id
from yarvelle_core.auth.ports import UserProfile
from yarvelle_core.db.models import Profile
from yarvelle_core.db.session import get_db
from yarvelle.household.conflicts import ConflictDetector
from yarvelle.household.cross_links import CrossLinksService
from yarvelle.household.db.models import CrossDomainLink, Household, HouseholdMember
from yarvelle.household.schemas import (
    AddMemberRequest,
    ConflictResponse,
    CreateHouseholdRequest,
    CrossDomainLinkCreate,
    CrossDomainLinkResponse,
    CryptoShredResponse,
    HouseholdMemberResponse,
    HouseholdResponse,
    PurgeDomainRequest,
    PurgeDomainResponse,
    TimelineResponse,
    UpdateMemberRequest,
    UpdateTogglesRequest,
)
from yarvelle.household.shred import ExportDeleteService
from yarvelle.household.timeline import TimelineService, extract_caller_scopes


router = APIRouter(tags=["household"])


# -----------------------------------------------------------------------------
# Household Management (YV-FAM-1)
# -----------------------------------------------------------------------------

async def _membership(db: AsyncSession, household_id: str, user: UserProfile) -> Optional[HouseholdMember]:
    stmt = select(HouseholdMember).where(
        HouseholdMember.household_id == household_id,
        HouseholdMember.user_id == user.id,
    )
    return (await db.execute(stmt)).scalars().first()


def _is_single_user_mode(user: UserProfile) -> bool:
    """Local single-user mode (auth disabled / default steward) owns everything."""
    return resolve_owner_user_id(user) is None


async def _load_household(db: AsyncSession, household_id: str) -> Household:
    hh = (await db.execute(select(Household).where(Household.id == household_id))).scalar_one_or_none()
    if not hh:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Household '{household_id}' not found")
    return hh


async def require_household_member(db: AsyncSession, household_id: str, user: UserProfile) -> Household:
    """Returns the household if user is a member; non-members get 404 (no enumeration)."""
    hh = await _load_household(db, household_id)
    if _is_single_user_mode(user):
        return hh
    if await _membership(db, household_id, user) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Household '{household_id}' not found")
    return hh


async def require_household_admin(db: AsyncSession, household_id: str, user: UserProfile) -> Household:
    """Returns the household if user is one of its admins (YV-FAM-3)."""
    hh = await require_household_member(db, household_id, user)
    if _is_single_user_mode(user):
        return hh
    member = await _membership(db, household_id, user)
    if member is None or member.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only household admins can change members, roles or settings",
        )
    return hh


async def _require_profile_manage(db: AsyncSession, profile_id: str, user: UserProfile) -> Profile:
    profile = await db.get(Profile, profile_id)
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Profile '{profile_id}' not found")
    if not _is_single_user_mode(user) and await get_user_profile_access(profile, user, db) != "manage":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only add profiles you manage to a household",
        )
    return profile


_WRITE_ACCESS = frozenset({"manage", "self", "guardian"})


async def require_profile_access(
    db: AsyncSession,
    profile_id: str,
    user: UserProfile,
    *,
    need: Literal["read", "write", "manage"] = "read",
) -> Profile:
    """Authorizes the caller against one profile; unknown or inaccessible profiles are 404.

    ``read`` accepts any grant, ``write`` requires manage/self/guardian and
    ``manage`` requires full management access. Single-user mode owns everything.
    """
    profile = await db.get(Profile, profile_id)
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Profile '{profile_id}' not found")
    if _is_single_user_mode(user):
        return profile
    access = await get_user_profile_access(profile, user, db)
    if access is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Profile '{profile_id}' not found")
    if (need == "write" and access not in _WRITE_ACCESS) or (need == "manage" and access != "manage"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"'{need}' access to this profile is required",
        )
    return profile


async def authorize_household_target(
    db: AsyncSession,
    user: UserProfile,
    *,
    household_id: Optional[str],
    profile_id: Optional[str],
    profile_need: Literal["read", "write", "manage"] = "read",
    household_admin: bool = False,
) -> None:
    """Authorizes a household and/or profile target for cross-domain views and data operations.

    In multi-user mode a target is mandatory: requests naming neither a
    household nor a profile would otherwise read every household's data.
    """
    if _is_single_user_mode(user):
        return
    if not household_id and not profile_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="household_id or profile_id is required",
        )
    if household_id:
        if household_admin:
            await require_household_admin(db, household_id, user)
        else:
            await require_household_member(db, household_id, user)
    if profile_id:
        await require_profile_access(db, profile_id, user, need=profile_need)


async def _caller_primary_profile_id(db: AsyncSession, user: UserProfile) -> Optional[str]:
    stmt = select(Profile.id).where(Profile.user_id == user.id).order_by(Profile.is_primary.desc())
    return (await db.execute(stmt)).scalars().first()


@router.get("", response_model=List[HouseholdResponse])
async def list_households(
    user: UserProfile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> List[Household]:
    stmt = select(Household)
    if not _is_single_user_mode(user):
        stmt = stmt.join(HouseholdMember, HouseholdMember.household_id == Household.id).where(
            HouseholdMember.user_id == user.id
        ).distinct()
    return list((await db.execute(stmt)).scalars().all())


@router.post("", response_model=HouseholdResponse, status_code=status.HTTP_201_CREATED)
async def create_household(
    request: CreateHouseholdRequest,
    user: UserProfile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Household:
    admin_profile_id = request.profile_id
    if admin_profile_id:
        await _require_profile_manage(db, admin_profile_id, user)
    elif not _is_single_user_mode(user):
        admin_profile_id = await _caller_primary_profile_id(db, user)
        if admin_profile_id is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Create your profile before creating a household",
            )

    new_hh = Household(
        id=str(uuid.uuid4()),
        name=request.name.strip(),
        domain_toggles=request.domain_toggles or {"health": True, "finance": True, "education": True, "household": True},
        two_guardian_rules=request.two_guardian_rules or {
            "finance": "both_guardians",
            "education": "any_guardian",
            "health": "any_guardian",
            "household": "any_guardian",
        },
    )
    db.add(new_hh)
    if admin_profile_id:
        await db.flush()
        db.add(
            HouseholdMember(
                id=str(uuid.uuid4()),
                household_id=new_hh.id,
                profile_id=admin_profile_id,
                user_id=None if _is_single_user_mode(user) else user.id,
                role="admin",
                relationship="self",
            )
        )
    await db.commit()
    await db.refresh(new_hh)
    return new_hh


# -----------------------------------------------------------------------------
# Household Members & RBAC (YV-FAM-1..3)
# -----------------------------------------------------------------------------

@router.get("/members", response_model=List[HouseholdMemberResponse])
async def list_my_household_members(
    user: UserProfile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> List[HouseholdMember]:
    """Members of the households the caller belongs to (never other households)."""
    stmt = select(HouseholdMember)
    if not _is_single_user_mode(user):
        mine = select(HouseholdMember.household_id).where(HouseholdMember.user_id == user.id)
        stmt = stmt.where(HouseholdMember.household_id.in_(mine))
    return list((await db.execute(stmt)).scalars().all())


@router.get("/{household_id}/members", response_model=List[HouseholdMemberResponse])
async def list_household_members(
    household_id: str,
    user: UserProfile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> List[HouseholdMember]:
    await require_household_member(db, household_id, user)
    stmt = select(HouseholdMember).where(HouseholdMember.household_id == household_id)
    return list((await db.execute(stmt)).scalars().all())


@router.post("/{household_id}/members", response_model=HouseholdMemberResponse, status_code=status.HTTP_201_CREATED)
async def add_household_member(
    household_id: str,
    request: AddMemberRequest,
    user: UserProfile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> HouseholdMember:
    await require_household_admin(db, household_id, user)
    await _require_profile_manage(db, request.profile_id, user)

    member = HouseholdMember(
        id=str(uuid.uuid4()),
        household_id=household_id,
        profile_id=request.profile_id,
        user_id=request.user_id,
        role=request.role,
        relationship=request.relationship,
        age_band=request.age_band,
        is_private=request.is_private,
        delegated_scopes=request.delegated_scopes,
    )
    db.add(member)
    await db.commit()
    await db.refresh(member)
    return member


# -----------------------------------------------------------------------------
# Unified Timeline (YV-X-1)
# -----------------------------------------------------------------------------

@router.get("/timeline", response_model=TimelineResponse)
async def get_timeline(
    household_id: Optional[str] = Query(None),
    profile_id: Optional[str] = Query(None),
    domain: Optional[str] = Query(None),
    domains: Optional[str] = Query(None),
    window: Optional[str] = Query(None),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    x_domain_scopes: Optional[str] = Header(None, alias="X-Domain-Scopes"),
    user: UserProfile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TimelineResponse:
    await authorize_household_target(db, user, household_id=household_id, profile_id=profile_id)
    caller_scopes = extract_caller_scopes(user, header_scopes=x_domain_scopes)
    sd = start_date
    ed = end_date
    if window and not sd and not ed:
        now = datetime.now(timezone.utc)
        win_lower = window.strip().lower()
        if win_lower == "24h":
            sd, ed = now - timedelta(hours=12), now + timedelta(hours=24)
        elif win_lower == "48h":
            sd, ed = now - timedelta(hours=24), now + timedelta(hours=48)
        elif win_lower == "7d":
            sd, ed = now - timedelta(days=2), now + timedelta(days=7)

    domain_list = [d.strip() for d in domains.split(",") if d.strip()] if domains else None
    age_band = getattr(user, "age_band", "adult") or "adult"

    service = TimelineService(db)
    return await service.fetch_timeline(
        caller_scopes=caller_scopes,
        household_id=household_id,
        profile_id=profile_id,
        domain=domain,
        domains=domain_list,
        window=window,
        start_date=sd,
        end_date=ed,
        limit=limit,
        age_band=age_band,
    )


# -----------------------------------------------------------------------------
# Typed Cross-Domain Links (YV-X-2)
# -----------------------------------------------------------------------------

@router.post("/links", response_model=CrossDomainLinkResponse, status_code=status.HTTP_201_CREATED)
async def create_link(
    request: CrossDomainLinkCreate,
    user: UserProfile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CrossDomainLinkResponse:
    await require_profile_access(db, request.profile_id.strip(), user, need="write")
    service = CrossLinksService(db)
    return await service.create_link(request)


@router.get("/links", response_model=List[CrossDomainLinkResponse])
async def list_links(
    profile_id: Optional[str] = Query(None),
    entity_id: Optional[str] = Query(None),
    domain: Optional[str] = Query(None),
    link_type: Optional[str] = Query(None),
    x_domain_scopes: Optional[str] = Header(None, alias="X-Domain-Scopes"),
    user: UserProfile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> List[CrossDomainLinkResponse]:
    if not _is_single_user_mode(user):
        if not profile_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="profile_id is required")
        await require_profile_access(db, profile_id, user)
    caller_scopes = extract_caller_scopes(user, header_scopes=x_domain_scopes)
    service = CrossLinksService(db)
    return await service.list_links(
        caller_scopes=caller_scopes,
        profile_id=profile_id,
        entity_id=entity_id,
        domain=domain,
        link_type=link_type,
    )


@router.delete("/links/{link_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_link(
    link_id: str,
    user: UserProfile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    link = await db.get(CrossDomainLink, link_id)
    if link is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Link '{link_id}' not found")
    try:
        await require_profile_access(db, link.profile_id, user, need="write")
    except HTTPException as exc:
        if exc.status_code == status.HTTP_404_NOT_FOUND:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Link '{link_id}' not found") from exc
        raise
    service = CrossLinksService(db)
    if not await service.delete_link(link_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Link '{link_id}' not found")


# -----------------------------------------------------------------------------
# Cross-Domain Conflict Detection (YV-X-3)
# -----------------------------------------------------------------------------

@router.get("/conflicts", response_model=ConflictResponse)
async def get_conflicts(
    household_id: str = Query(...),
    profile_id: Optional[str] = Query(None),
    window: Literal["24h", "48h", "7d"] = Query("7d"),
    user: UserProfile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ConflictResponse:
    await authorize_household_target(db, user, household_id=household_id, profile_id=profile_id)
    detector = ConflictDetector(db)
    return await detector.detect_conflicts(household_id=household_id, profile_id=profile_id, window=window)


# -----------------------------------------------------------------------------
# Scoped Shredding & Export (YV-X-8)
# -----------------------------------------------------------------------------

@router.get("/export")
async def export_data(
    household_id: Optional[str] = Query(None),
    profile_id: Optional[str] = Query(None),
    domain: Optional[str] = Query(None),
    include_files: bool = Query(True),
    user: UserProfile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Response:
    # Exports leave the system: household-wide exports need a household admin,
    # profile exports need full management of that profile.
    await authorize_household_target(
        db,
        user,
        household_id=household_id,
        profile_id=profile_id,
        profile_need="manage",
        household_admin=True,
    )
    service = ExportDeleteService(db)
    export_dict, zip_bytes = await service.export_data(
        household_id=household_id, profile_id=profile_id, domain=domain, include_files=include_files
    )
    if include_files and zip_bytes:
        return Response(
            content=zip_bytes,
            media_type="application/zip",
            headers={"Content-Disposition": 'attachment; filename="yarvelle_export.zip"'},
        )
    return JSONResponse(content=export_dict)


@router.post("/purge/domain", response_model=PurgeDomainResponse)
async def purge_domain(
    request: PurgeDomainRequest,
    user: UserProfile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    await require_profile_access(db, request.profile_id, user, need="manage")
    service = ExportDeleteService(db)
    return await service.purge_domain(profile_id=request.profile_id, domain=request.domain)


@router.delete("/shred/{profile_id}", response_model=CryptoShredResponse)
async def shred_profile(
    profile_id: str,
    user: UserProfile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    await require_profile_access(db, profile_id, user, need="manage")
    service = ExportDeleteService(db)
    try:
        return await service.crypto_shred_profile(profile_id=profile_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# -----------------------------------------------------------------------------
# Single-household routes. Declared last: "/{household_id}" would otherwise
# shadow the static paths above (/members, /timeline, /links, /conflicts, ...).
# -----------------------------------------------------------------------------

@router.get("/{household_id}", response_model=HouseholdResponse)
async def get_household(
    household_id: str,
    user: UserProfile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Household:
    return await require_household_member(db, household_id, user)


@router.get("/{household_id}/toggles", response_model=Dict[str, bool])
async def get_household_toggles(
    household_id: str,
    user: UserProfile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, bool]:
    hh = await require_household_member(db, household_id, user)
    return hh.domain_toggles


@router.patch("/{household_id}/toggles", response_model=Dict[str, bool])
async def update_household_toggles(
    household_id: str,
    request: UpdateTogglesRequest,
    user: UserProfile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, bool]:
    hh = await require_household_admin(db, household_id, user)
    current = dict(hh.domain_toggles)
    for k, v in request.model_dump(exclude_unset=True).items():
        if v is not None:
            current[k] = v
    hh.domain_toggles = current
    await db.commit()
    await db.refresh(hh)
    return hh.domain_toggles
