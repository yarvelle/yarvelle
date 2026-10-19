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

"""Cross-Domain Unified Timeline Service (YV-X-1)."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Set
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from yarvelle_core.db.models import (
    Attachment,
    Note,
    Profile,
    Reminder,
)
from yarvelle_household._dynamic import resolve_optional_model
from yarvelle_household.db.models import CrossDomainLink, Household, HouseholdMember
from yarvelle_household.schemas import TimelineItem, TimelineResponse


DEFAULT_DOMAINS = ["health", "finance", "education", "household"]


def extract_caller_scopes(user: Any, header_scopes: Optional[str] = None) -> Set[str]:
    """Resolves caller domain scopes, preventing zero-grant escalation and header injection."""
    if user is not None:
        if getattr(user, "role", "") == "admin":
            if header_scopes:
                requested_admin = {s.strip().lower() for s in header_scopes.split(",") if s.strip()}
                if requested_admin:
                    return requested_admin
            return {"*"}
        raw_scopes = getattr(user, "domain_scopes", None)
        if raw_scopes is not None:
            scopes: Set[str] = {str(s).strip().lower() for s in raw_scopes if str(s).strip()}
            if header_scopes:
                requested_header_scopes = {s.strip().lower() for s in header_scopes.split(",") if s.strip()}
                if "*" in scopes:
                    return requested_header_scopes if requested_header_scopes else scopes
                return scopes.intersection(requested_header_scopes)
            return scopes
        return set()

    if header_scopes:
        scopes = {s.strip().lower() for s in header_scopes.split(",") if s.strip()}
        if scopes:
            return scopes

    # Standalone default for local offline steward
    return {
        "health:read", "health:write",
        "finance:read", "finance:write",
        "education:read", "education:write",
        "household:read", "household:write",
        "*",
    }


def has_domain_read_access(caller_scopes: Set[str], domain: str) -> bool:
    """Checks if caller holds read permission for a specific domain."""
    clean_domain = (domain or "health").strip().lower()
    if (
        "*" in caller_scopes
        or f"{clean_domain}:*" in caller_scopes
        or f"{clean_domain}:read" in caller_scopes
        or clean_domain in caller_scopes
    ):
        return True
    return False


class TimelineService:
    """Core domain service aggregating multi-domain events into a unified feed."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_household_toggles(self, household_id: Optional[str]) -> Dict[str, bool]:
        """Loads domain toggles for household with default all-enabled fallback."""
        if not household_id:
            return {d: True for d in DEFAULT_DOMAINS}
        try:
            stmt = select(Household).where(Household.id == household_id)
            result = await self.db.execute(stmt)
            hh = result.scalar_one_or_none()
            if not hh or not hh.domain_toggles:
                return {d: True for d in DEFAULT_DOMAINS}
            return {d: hh.domain_toggles.get(d, True) for d in DEFAULT_DOMAINS}
        except Exception:
            return {d: True for d in DEFAULT_DOMAINS}

    async def fetch_timeline(
        self,
        caller_scopes: Set[str],
        household_id: Optional[str] = None,
        profile_id: Optional[str] = None,
        domain: Optional[str] = None,
        domains: Optional[List[str]] = None,
        window: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        limit: int = 100,
        age_band: str = "adult",
    ) -> TimelineResponse:
        """Fetches and normalizes chronological timeline stream across domains."""
        # 1. Inverted date check
        if start_date and end_date and start_date > end_date:
            return TimelineResponse(items=[], total_count=0, domains_included=[], has_more=False)

        domain_toggles = await self.get_household_toggles(household_id)

        # 2. Determine target domains
        requested_domains = set(domains) if domains else {domain} if domain else set(DEFAULT_DOMAINS)
        active_domains: Set[str] = set()
        for d in requested_domains:
            d_clean = d.strip().lower()
            if not domain_toggles.get(d_clean, True):
                continue
            if not has_domain_read_access(caller_scopes, d_clean):
                continue
            # Teen privacy boundary (YV-FAM-7)
            if age_band in ("teen", "teen_13_17") and d_clean == "finance":
                continue
            active_domains.add(d_clean)

        if not active_domains:
            return TimelineResponse(items=[], total_count=0, domains_included=[], has_more=False)

        # 3. Resolve target profile IDs
        target_profile_ids: Optional[List[str]] = None
        if profile_id:
            target_profile_ids = [profile_id]
        elif household_id:
            try:
                # Query HouseholdMember associations
                m_stmt = select(HouseholdMember.profile_id).where(HouseholdMember.household_id == household_id)
                m_res = await self.db.execute(m_stmt)
                target_profile_ids = list(m_res.scalars().all())
                if not target_profile_ids:
                    # Fallback to direct Profile query if household_id exists on Profile
                    if hasattr(Profile, "household_id"):
                        p_stmt = select(Profile.id).where(getattr(Profile, "household_id") == household_id)
                        p_res = await self.db.execute(p_stmt)
                        target_profile_ids = list(p_res.scalars().all())
            except Exception:
                target_profile_ids = None

        if household_id and (target_profile_ids is not None and len(target_profile_ids) == 0):
            return TimelineResponse(items=[], total_count=0, domains_included=[], has_more=False)

        items: List[TimelineItem] = []

        # 4. Optional Health Appointments (if carefold_health installed)
        try:
            Appointment = resolve_optional_model("appointments", "Appointment")
            if Appointment is not None:
                appt_stmt = select(Appointment)
                if target_profile_ids is not None:
                    appt_stmt = appt_stmt.where(Appointment.profile_id.in_(target_profile_ids))
                appts = (await self.db.execute(appt_stmt)).scalars().all()
                for a in appts:
                    d = getattr(a, "domain", "health") or "health"
                    d_clean = d.strip().lower()
                    if d_clean in active_domains:
                        dt = a.start_time
                        if dt.tzinfo is None:
                            dt = dt.replace(tzinfo=timezone.utc)
                        end_dt = a.end_time
                        if end_dt and end_dt.tzinfo is None:
                            end_dt = end_dt.replace(tzinfo=timezone.utc)
                        items.append(
                            TimelineItem(
                                id=a.id,
                                domain=d_clean,  # type: ignore
                                item_type="appointment",
                                date_time=dt,
                                end_time=end_dt,
                                title=a.title or "Scheduled Appointment",
                                description=getattr(a, "reason", None) or getattr(a, "provider_name", None),
                                status=getattr(a, "status", "scheduled") or "scheduled",
                                profile_id=a.profile_id,
                                household_id=household_id,
                                metadata={"provider_name": getattr(a, "provider_name", None)},
                            )
                        )
        except (ImportError, Exception):
            pass

        # 5. Reminders (health, finance, education, household)
        try:
            rem_stmt = select(Reminder)
            if target_profile_ids is not None:
                rem_stmt = rem_stmt.where(Reminder.profile_id.in_(target_profile_ids))
            reminders = (await self.db.execute(rem_stmt)).scalars().all()
            for r in reminders:
                d = getattr(r, "domain", getattr(r, "scope", "health")) or "health"
                d_clean = d.split(".")[0].strip().lower()
                if d_clean in active_domains:
                    dt = getattr(r, "next_due_at", None) or r.created_at
                    if dt.tzinfo is None:
                        dt = dt.replace(tzinfo=timezone.utc)
                    cat = (getattr(r, "category", "") or "").lower()
                    item_type = "bill" if cat == "bill" else "assignment" if cat in ("assignment", "homework") else "reminder"
                    items.append(
                        TimelineItem(
                            id=r.id,
                            domain=d_clean,  # type: ignore
                            item_type=item_type,
                            date_time=dt,
                            title=r.title or "Reminder",
                            description=getattr(r, "description", None),
                            status=getattr(r, "status", "pending") or "pending",
                            profile_id=r.profile_id,
                            household_id=household_id,
                            metadata={"category": getattr(r, "category", None)},
                        )
                    )
        except Exception:
            pass

        # 6. Notes (chores, meal plans, home maintenance, reading logs)
        try:
            note_stmt = select(Note)
            if target_profile_ids is not None:
                note_stmt = note_stmt.where(Note.profile_id.in_(target_profile_ids))
            notes = (await self.db.execute(note_stmt)).scalars().all()
            for n in notes:
                d = getattr(n, "domain", getattr(n, "scope", "household")) or "household"
                d_clean = d.split(".")[0].strip().lower()
                if d_clean in active_domains:
                    dt = n.created_at
                    if dt.tzinfo is None:
                        dt = dt.replace(tzinfo=timezone.utc)
                    raw_type = getattr(n, "type", "note") or "note"
                    # Safe truncation to 250 characters
                    content_str = n.content[:250] if n.content else None
                    items.append(
                        TimelineItem(
                            id=n.id,
                            domain=d_clean,  # type: ignore
                            item_type=raw_type,
                            date_time=dt,
                            title=n.title or raw_type.replace("_", " ").title(),
                            description=content_str,
                            status="completed" if raw_type in ("chore", "reading_log") else "pending",
                            profile_id=n.profile_id,
                            household_id=household_id,
                            metadata={"note_type": raw_type},
                        )
                    )
        except Exception:
            pass

        # 7. Attachments (receipts, statements, school forms, labs)
        try:
            att_stmt = select(Attachment)
            if target_profile_ids is not None:
                att_stmt = att_stmt.where(Attachment.profile_id.in_(target_profile_ids))
            attachments = (await self.db.execute(att_stmt)).scalars().all()
            for att in attachments:
                d = getattr(att, "domain", getattr(att, "scope", "health")) or "health"
                d_clean = d.split(".")[0].strip().lower()
                if d_clean in active_domains:
                    dt = att.created_at
                    if dt.tzinfo is None:
                        dt = dt.replace(tzinfo=timezone.utc)
                    items.append(
                        TimelineItem(
                            id=att.id,
                            domain=d_clean,  # type: ignore
                            item_type="attachment",
                            date_time=dt,
                            title=getattr(att, "filename", "Attached File") or "Attached File",
                            description=f"Source: {getattr(att, 'source', 'upload')}",
                            status="stored",
                            profile_id=att.profile_id,  # Fix Bug 2: Can be None
                            household_id=household_id,
                            metadata={"sha256": getattr(att, "sha256_hash", None)},
                        )
                    )
        except Exception:
            pass

        # 8. Date filtering
        if start_date:
            sd = start_date if start_date.tzinfo else start_date.replace(tzinfo=timezone.utc)
            items = [it for it in items if it.date_time >= sd]
        if end_date:
            ed = end_date if end_date.tzinfo else end_date.replace(tzinfo=timezone.utc)
            items = [it for it in items if it.date_time <= ed]

        # 9. Cross-Domain Links attachment under Dual-Read Scope Invariant (YV-X-2)
        if items:
            item_ids = {it.id for it in items}
            try:
                link_stmt = select(CrossDomainLink).where(
                    or_(
                        CrossDomainLink.source_entity_id.in_(item_ids),
                        CrossDomainLink.target_entity_id.in_(item_ids),
                    )
                )
                links = (await self.db.execute(link_stmt)).scalars().all()
            except Exception:
                links = []

            links_by_entity: Dict[str, List[Dict[str, Any]]] = {}
            for lnk in links:
                src_d = lnk.source_domain.strip().lower()
                tgt_d = lnk.target_domain.strip().lower()
                # Dual-Read Scope Invariant
                if not domain_toggles.get(src_d, True) or not domain_toggles.get(tgt_d, True):
                    continue
                if not has_domain_read_access(caller_scopes, src_d) or not has_domain_read_access(caller_scopes, tgt_d):
                    continue

                link_dict = {
                    "link_id": lnk.id,
                    "link_type": lnk.link_type,
                    "source_domain": src_d,
                    "source_id": lnk.source_entity_id,
                    "target_domain": tgt_d,
                    "target_id": lnk.target_entity_id,
                    "description": lnk.description,
                }
                links_by_entity.setdefault(lnk.source_entity_id, []).append(link_dict)
                links_by_entity.setdefault(lnk.target_entity_id, []).append(link_dict)

            for it in items:
                if it.id in links_by_entity:
                    it.links = links_by_entity[it.id]

        # 10. Chronological sort (ascending)
        items.sort(key=lambda x: x.date_time)
        total = len(items)

        return TimelineResponse(
            items=items[:limit],
            total_count=total,
            domains_included=sorted(list(active_domains)),
            has_more=total > limit,
        )
