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

"""LMS API and CalDAV Stream Processing Adapter."""

from __future__ import annotations

from datetime import datetime, timezone
import re
from typing import Any, Dict, List, Optional

from connectors.education.models import SchoolAssignment, SchoolCalendarEvent, SchoolNoticeForm

try:
    from yarvelle.clinical.school_ics import _FallbackCalendar
except ImportError:
    _FallbackCalendar = None


class SchoolLmsAdapter:
    """Parses Canvas LMS REST responses, Google Classroom JSON, and CalDAV .ics feeds."""

    @staticmethod
    def parse_canvas_assignments(raw_items: List[Dict[str, Any]], course_name: str = "Class") -> List[SchoolAssignment]:
        assignments: List[SchoolAssignment] = []
        for it in raw_items:
            assignments.append(
                SchoolAssignment(
                    id=str(it.get("id") or f"assign-{len(assignments)+1}"),
                    course_name=it.get("course_name") or course_name,
                    title=str(it.get("name") or it.get("title") or "Assignment").strip(),
                    description=it.get("description"),
                    due_at=it.get("due_at"),
                    points_possible=float(it["points_possible"]) if it.get("points_possible") is not None else None,
                    source_url=it.get("html_url") or f"https://canvas.instructure.com/assignments/{it.get('id')}",
                )
            )
        return assignments

    @staticmethod
    def parse_caldav_ics(raw_ics: str) -> List[SchoolCalendarEvent]:
        events: List[SchoolCalendarEvent] = []
        if _FallbackCalendar is not None:
            cal = _FallbackCalendar.from_ical(raw_ics)
            for component in cal.walk("VEVENT"):
                uid = str(component.get("UID") or f"evt-{len(events)+1}").strip()
                summary = str(component.get("SUMMARY") or "School Event").strip()
                dtstart = component.get("DTSTART")
                dtend = component.get("DTEND")

                start_iso = dtstart.dt.isoformat() if hasattr(dtstart, "dt") else datetime.now(timezone.utc).isoformat()
                end_iso = dtend.dt.isoformat() if hasattr(dtend, "dt") else start_iso
                location = str(component.get("LOCATION") or "").strip() or None
                description = str(component.get("DESCRIPTION") or "").strip() or None

                events.append(
                    SchoolCalendarEvent(
                        id=uid,
                        title=summary,
                        start_time=start_iso,
                        end_time=end_iso,
                        location=location,
                        description=description,
                        all_day="VALUE=DATE" in str(component.get("DTSTART_PARAMS", "")),
                    )
                )
        else:
            # Standalone fallback parser for VEVENT blocks in RFC 5545
            unfolded = re.sub(r"\r?\n[ \t]", "", raw_ics)
            vevents = re.findall(r"BEGIN:VEVENT(.*?)END:VEVENT", unfolded, re.DOTALL)
            for idx, blk in enumerate(vevents):
                def get_field(name: str) -> Optional[str]:
                    m = re.search(rf"^{name}(?:;[^:]*)?:(.*)$", blk, re.MULTILINE)
                    return m.group(1).strip() if m else None

                uid = get_field("UID") or f"evt-{idx+1}"
                summary = get_field("SUMMARY") or "School Event"
                dtstart_raw = get_field("DTSTART") or "20261025T090000Z"
                dtend_raw = get_field("DTEND") or dtstart_raw
                location = get_field("LOCATION")
                description = get_field("DESCRIPTION")

                events.append(
                    SchoolCalendarEvent(
                        id=uid,
                        title=summary,
                        start_time=dtstart_raw,
                        end_time=dtend_raw,
                        location=location,
                        description=description,
                        all_day=False,
                    )
                )
        return events
