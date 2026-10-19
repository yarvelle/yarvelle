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

"""Cross-Domain Conflict & Deadline Cluster Detection Engine (YV-X-3)."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
import re
from typing import Any, Dict, List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from yarvelle_core.db.models import Profile, Reminder
from yarvelle.household._dynamic import resolve_optional_model
from yarvelle.household.db.models import Household, HouseholdMember
from yarvelle.household.schemas import ConflictItem, ConflictResponse


PREP_KEYWORDS = [
    "fasting",
    "npo",
    "nothing by mouth",
    "bowel prep",
    "dilation",
    "sedation",
    "clear liquids",
]

SPORTS_KEYWORDS = (
    "sports",
    "practice",
    "game",
    "match",
    "tournament",
    "athletic",
    "soccer",
    "basketball",
    "baseball",
    "football",
    "track",
    "swim",
    "tennis",
    "gymnastics",
    "martial arts",
)


class ConflictDetector:
    """Pure-logic engine evaluating cross-domain conflicts in sliding time windows."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def detect_conflicts(
        self,
        household_id: str,
        profile_id: Optional[str] = None,
        window: str = "7d",
    ) -> ConflictResponse:
        """Evaluates scheduling, travel, bill density, and prep conflicts within window."""
        now = datetime.now(timezone.utc)
        win_lower = window.strip().lower()
        if win_lower == "24h":
            end_window = now + timedelta(hours=24)
            window_label = "24h"
        elif win_lower == "48h":
            end_window = now + timedelta(hours=48)
            window_label = "48h"
        else:
            end_window = now + timedelta(days=7)
            window_label = "7d"

        # Resolve target profile IDs
        if profile_id:
            profile_ids = [profile_id]
        else:
            m_stmt = select(HouseholdMember.profile_id).where(HouseholdMember.household_id == household_id)
            profile_ids = list((await self.db.execute(m_stmt)).scalars().all())
            if not profile_ids and hasattr(Profile, "household_id"):
                p_stmt = select(Profile.id).where(getattr(Profile, "household_id") == household_id)
                profile_ids = list((await self.db.execute(p_stmt)).scalars().all())

        if not profile_ids:
            return ConflictResponse(window=window_label, conflicts_count=0, conflicts=[])

        # Fetch appointments (health or household)
        appts = []
        try:
            Appointment = resolve_optional_model("appointments", "Appointment")
            if Appointment is not None:
                appt_stmt = select(Appointment).where(
                    Appointment.profile_id.in_(profile_ids),
                    Appointment.start_time >= now - timedelta(hours=6),
                    Appointment.start_time <= end_window,
                )
                appts = list((await self.db.execute(appt_stmt)).scalars().all())
        except Exception:
            pass

        # Fetch reminders / bills
        rems = []
        try:
            rem_stmt = select(Reminder).where(
                Reminder.profile_id.in_(profile_ids),
                Reminder.status.in_(["pending", "due", "scheduled"]),
            )
            all_rems = list((await self.db.execute(rem_stmt)).scalars().all())
            rems = [
                r for r in all_rems
                if r.next_due_at
                and (
                    r.next_due_at.replace(tzinfo=timezone.utc)
                    if r.next_due_at.tzinfo is None
                    else r.next_due_at
                ) <= end_window
            ]
        except Exception:
            pass

        # Fetch school forms
        forms = []
        try:
            SchoolForm = resolve_optional_model("school_forms", "SchoolForm")
            if SchoolForm is not None:
                form_stmt = select(SchoolForm).where(
                    SchoolForm.profile_id.in_(profile_ids),
                    SchoolForm.status.in_(["draft", "pending_signature", "active"]),
                )
                forms = list((await self.db.execute(form_stmt)).scalars().all())
        except Exception:
            pass

        conflicts: List[ConflictItem] = []

        # -----------------------------------------------------------------
        # 1. Schedule Overlap & Travel Transit Deficit
        # -----------------------------------------------------------------
        timed_events: List[Dict[str, Any]] = []
        for a in appts:
            s_dt = a.start_time if a.start_time.tzinfo else a.start_time.replace(tzinfo=timezone.utc)
            e_dt = a.end_time if a.end_time and a.end_time.tzinfo else a.end_time.replace(tzinfo=timezone.utc) if a.end_time else s_dt + timedelta(minutes=60)
            loc = getattr(a, "location", None) or ""
            is_virt = bool(loc and any(k in loc.lower() for k in ["telehealth", "zoom", "virtual", "phone"]))
            timed_events.append({
                "id": a.id,
                "profile_id": a.profile_id,
                "domain": getattr(a, "domain", "health") or "health",
                "title": a.title or "Appointment",
                "start": s_dt,
                "end": e_dt,
                "location": loc,
                "is_virtual": is_virt,
                "prep_notes": (getattr(a, "preparation_notes", "") or "") + " " + (getattr(a, "reason", "") or ""),
            })

        timed_events.sort(key=lambda x: x["start"])

        for i in range(len(timed_events)):
            for j in range(i + 1, len(timed_events)):
                ev1 = timed_events[i]
                ev2 = timed_events[j]

                # Simultaneous schedule overlap: Max(start) < Min(end)
                if max(ev1["start"], ev2["start"]) < min(ev1["end"], ev2["end"]):
                    same_profile = ev1["profile_id"] == ev2["profile_id"]
                    severity = "critical" if same_profile else "warning"
                    title = f"Simultaneous Events: {ev1['title']} and {ev2['title']}"
                    desc = (
                        f"Schedule overlap between '{ev1['title']}' ({ev1['start'].strftime('%I:%M %p')}) "
                        f"and '{ev2['title']}' ({ev2['start'].strftime('%I:%M %p')})."
                    )
                    conflicts.append(
                        ConflictItem(
                            id=f"overlap-{ev1['id']}-{ev2['id']}",
                            type="schedule_overlap",
                            severity=severity,
                            title=title,
                            description=desc,
                            event_ids=[ev1["id"], ev2["id"]],
                            profiles_involved=list({ev1["profile_id"], ev2["profile_id"]}),
                            domains_involved=list({ev1["domain"], ev2["domain"]}),
                            suggested_action="Reschedule one of the conflicting events to prevent attendance collision.",
                        )
                    )
                else:
                    # Travel transit deficit (< 30 min buffer for consecutive in-person events)
                    gap_seconds = (ev2["start"] - ev1["end"]).total_seconds()
                    if 0 <= gap_seconds < 1800:
                        if not ev1["is_virtual"] and not ev2["is_virtual"] and (ev1["location"] or ev2["location"]):
                            gap_minutes = int(gap_seconds // 60)
                            conflicts.append(
                                ConflictItem(
                                    id=f"transit-{ev1['id']}-{ev2['id']}",
                                    type="travel_deficit",
                                    severity="warning",
                                    title=f"Travel Deficit: {gap_minutes}m buffer between events",
                                    description=(
                                        f"Only {gap_minutes} minutes between '{ev1['title']}' (ends at {ev1['end'].strftime('%I:%M %p')}) "
                                        f"and '{ev2['title']}' (starts at {ev2['start'].strftime('%I:%M %p')}). Recommended minimum transit buffer is 30 minutes."
                                    ),
                                    event_ids=[ev1["id"], ev2["id"]],
                                    profiles_involved=list({ev1["profile_id"], ev2["profile_id"]}),
                                    domains_involved=list({ev1["domain"], ev2["domain"]}),
                                    suggested_action="Verify transit route and arrange departure earlier.",
                                )
                            )

        # -----------------------------------------------------------------
        # 2. Medical Prep Conflict (fasting/NPO in 12h window)
        # -----------------------------------------------------------------
        for ev in timed_events:
            notes_lower = ev["prep_notes"].lower()
            if any(k in notes_lower for k in PREP_KEYWORDS):
                prep_start = ev["start"] - timedelta(hours=12)
                for other in timed_events:
                    if other["id"] == ev["id"]:
                        continue
                    if other["profile_id"] == ev["profile_id"] and prep_start <= other["start"] < ev["start"]:
                        conflicts.append(
                            ConflictItem(
                                id=f"medprep-{ev['id']}-{other['id']}",
                                type="medical_prep_conflict",
                                severity="critical",
                                title=f"Medical Preparation Conflict: {ev['title']}",
                                description=(
                                    f"Preparation instructions for '{ev['title']}' require fasting/prep during "
                                    f"time window of '{other['title']}' ({other['start'].strftime('%b %d, %I:%M %p')})."
                                ),
                                event_ids=[ev["id"], other["id"]],
                                profiles_involved=[ev["profile_id"]],
                                domains_involved=["health", other["domain"]],
                                suggested_action="Review fasting/clinical preparation instructions with healthcare provider.",
                            )
                        )

        # -----------------------------------------------------------------
        # 3. Bill Due Date Cluster (>= 3 bills or > $500 total in 72h)
        # -----------------------------------------------------------------
        bills = [r for r in rems if (getattr(r, "category", "") or "").lower() == "bill"]
        bills.sort(key=lambda x: getattr(x, "next_due_at", None) or now)

        for i in range(len(bills)):
            b_start = bills[i].next_due_at or now
            b_start_utc = b_start if b_start.tzinfo else b_start.replace(tzinfo=timezone.utc)
            cluster_window_end = b_start_utc + timedelta(hours=72)

            cluster_bills = [
                b for b in bills
                if (
                    b.next_due_at
                    if b.next_due_at and b.next_due_at.tzinfo
                    else (b.next_due_at or now).replace(tzinfo=timezone.utc)
                ) >= b_start_utc
                and (
                    b.next_due_at
                    if b.next_due_at and b.next_due_at.tzinfo
                    else (b.next_due_at or now).replace(tzinfo=timezone.utc)
                ) <= cluster_window_end
            ]

            total_amount = 0.0
            for cb in cluster_bills:
                text = (getattr(cb, "description", "") or "") + " " + (cb.title or "")
                # Crucial Bug 3 fix: match explicit $ dollar amounts or explicit decimals, avoiding 4-digit years
                match = re.search(r"\$([0-9]+(?:\.[0-9]{2})?)", text)
                if not match:
                    match = re.search(r"\b([0-9]+\.[0-9]{2})\b", text)
                if match:
                    try:
                        total_amount += float(match.group(1))
                    except ValueError:
                        pass

            if len(cluster_bills) >= 3 or total_amount > 500.0:
                if len(cluster_bills) >= 3 and total_amount > 500.0:
                    title_reason = f"{len(cluster_bills)} bills (${total_amount:.2f}) due within 72 hours"
                elif len(cluster_bills) >= 3:
                    title_reason = f"{len(cluster_bills)} bills due within 72 hours"
                else:
                    title_reason = f"${total_amount:.2f} due across {len(cluster_bills)} bills within 72 hours"

                conflicts.append(
                    ConflictItem(
                        id=f"billcluster-{bills[i].id}",
                        type="bill_due_cluster",
                        severity="warning",
                        title=f"Bill Due Cluster: {title_reason}",
                        description=(
                            f"High bill concentration: {len(cluster_bills)} bills totaling ${total_amount:.2f} due between "
                            f"{b_start_utc.strftime('%b %d')} and {cluster_window_end.strftime('%b %d')}."
                        ),
                        event_ids=[cb.id for cb in cluster_bills],
                        profiles_involved=list({cb.profile_id for cb in cluster_bills}),
                        domains_involved=["finance"],
                        suggested_action="Review upcoming cash flow and payment dates in the Bill Calendar.",
                    )
                )
                break

        # -----------------------------------------------------------------
        # 4. Deadline Cluster (>= 3 deadlines in 48h)
        # -----------------------------------------------------------------
        all_deadlines = list(rems) + list(forms)
        for i in range(len(all_deadlines)):
            item = all_deadlines[i]
            d_time = getattr(item, "next_due_at", None) or getattr(item, "expires_at", None) or now
            d_time_utc = d_time if d_time.tzinfo else d_time.replace(tzinfo=timezone.utc)
            d_window_end = d_time_utc + timedelta(hours=48)

            clustered_items = []
            for other in all_deadlines:
                o_time = getattr(other, "next_due_at", None) or getattr(other, "expires_at", None) or now
                o_time_utc = o_time if o_time.tzinfo else o_time.replace(tzinfo=timezone.utc)
                if d_time_utc <= o_time_utc <= d_window_end:
                    clustered_items.append(other)

            if len(clustered_items) >= 3:
                conflicts.append(
                    ConflictItem(
                        id=f"deadlinecluster-{getattr(item, 'id', '0')}",
                        type="deadline_cluster",
                        severity="info",
                        title=f"High Deadline Density: {len(clustered_items)} deadlines within 48 hours",
                        description=(
                            f"{len(clustered_items)} deadlines due between {d_time_utc.strftime('%b %d')} "
                            f"and {d_window_end.strftime('%b %d')}."
                        ),
                        event_ids=[getattr(x, "id", "") for x in clustered_items],
                        profiles_involved=list({getattr(x, "profile_id", "") for x in clustered_items}),
                        domains_involved=["education", "finance", "household"],
                        suggested_action="Review items in the Household Timeline to organize completion.",
                    )
                )
                break

        # -----------------------------------------------------------------
        # 5. Sports Physical Form Expiry (athletic activities only)
        # -----------------------------------------------------------------
        for a in appts:
            title_text = f"{a.title or ''} {getattr(a, 'reason', '') or ''}".lower()
            # Crucial Bug 4 fix: strictly check SPORTS_KEYWORDS, ignoring non-sports events like grocery
            if any(k in title_text for k in SPORTS_KEYWORDS):
                s_dt = a.start_time if a.start_time.tzinfo else a.start_time.replace(tzinfo=timezone.utc)
                for f in forms:
                    if f.profile_id == a.profile_id and getattr(f, "form_type", "") in ("physical", "sports_clearance"):
                        if f.expires_at:
                            f_exp = f.expires_at if f.expires_at.tzinfo else f.expires_at.replace(tzinfo=timezone.utc)
                            if f_exp <= s_dt:
                                conflicts.append(
                                    ConflictItem(
                                        id=f"physicalexp-{f.id}-{a.id}",
                                        type="physical_expired",
                                        severity="warning",
                                        title=f"Sports Physical Expired for {a.title}",
                                        description=(
                                            f"Clearance form '{f.title}' expired on {f_exp.strftime('%b %d, %Y')} "
                                            f"prior to scheduled activity '{a.title}' on {s_dt.strftime('%b %d, %Y')}."
                                        ),
                                        event_ids=[f.id, a.id],
                                        profiles_involved=[a.profile_id],
                                        domains_involved=["education", "household"],
                                        suggested_action="Schedule pediatric physical renewal to maintain athletic eligibility.",
                                    )
                                )

        return ConflictResponse(
            window=window_label,
            conflicts_count=len(conflicts),
            conflicts=conflicts,
        )
