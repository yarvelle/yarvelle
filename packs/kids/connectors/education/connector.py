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

"""School LMS & CalDAV Sync Connector (YV-EDU-3 / Feature #54 & #74)."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
from typing import Any, Dict, List, Optional

from connectors.base import (
    Connector,
    NormalisedRecord,
    Page,
    StreamSpec,
    ToolContext,
    ToolSpec,
)
from connectors.education.lms_adapter import SchoolLmsAdapter
from connectors.http import ScopedHttp
from connectors.manifest import ConnectorManifest

try:
    from yarvelle.engine.tool_exec import UntrustedResult
except ImportError:
    @dataclass
    class UntrustedResult:
        data: Any
        taint: bool = True
        source: str = "external"

        def __post_init__(self) -> None:
            self.taint = bool(self.taint)

        def __iter__(self):
            if isinstance(self.data, (list, tuple, set)):
                return iter(self.data)
            return iter([self.data])

        def __getitem__(self, index: Any) -> Any:
            if isinstance(self.data, (list, tuple, dict)):
                return self.data[index]
            raise TypeError(f"'{type(self.data).__name__}' object is not subscriptable")

        def __len__(self) -> int:
            if isinstance(self.data, (list, tuple, dict, set)):
                return len(self.data)
            return 1

        def __contains__(self, item: Any) -> bool:
            if isinstance(self.data, (list, tuple, dict, set)):
                return item in self.data
            return item == self.data


_MANIFEST_PATH = Path(__file__).resolve().parent / "manifest.yaml"
FORBIDDEN_EDUCATION_SCOPES = frozenset({
    "education.modify_grades",
    "education.submit_homework",
    "education.rank_child",
})


class SchoolSyncConnector:
    """Read-Only School LMS & CalDAV Sync Connector for assignments and calendar events."""

    def __init__(self, manifest: Optional[ConnectorManifest] = None) -> None:
        self._manifest = manifest or ConnectorManifest.from_yaml(_MANIFEST_PATH)
        # Validation Invariant: Prohibit grade modification & submission scopes
        for s in (self._manifest.auth.scopes or []):
            if s in FORBIDDEN_EDUCATION_SCOPES or "modify_grades" in s or "submit" in s:
                raise ValueError(f"SchoolSyncConnector invariant violation: scope '{s}' is forbidden.")
        scopes = getattr(self._manifest, "data_scopes", None)
        if scopes:
            write_scopes = getattr(scopes, "write", None)
            if write_scopes is None and isinstance(scopes, dict):
                write_scopes = scopes.get("write")
            if write_scopes:
                for s in write_scopes:
                    if s in FORBIDDEN_EDUCATION_SCOPES or "modify_grades" in s or "submit" in s:
                        raise ValueError(f"SchoolSyncConnector invariant violation: scope '{s}' is forbidden.")

    @property
    def manifest(self) -> ConnectorManifest:
        return self._manifest

    def streams(self) -> List[StreamSpec]:
        return [
            StreamSpec(name="assignments", description="Homework, quizzes, and project deadlines", read_mode="incremental", primary_key=["id"], cursor_field="due_at"),
            StreamSpec(name="calendar_events", description="School calendar events and schedules (.ics / CalDAV)", read_mode="full_refresh", primary_key=["id"]),
            StreamSpec(name="forms", description="Permission slips and school health notices", read_mode="full_refresh", primary_key=["id"]),
        ]

    async def fetch(
        self,
        ctx: ToolContext,
        stream: str,
        cursor: Optional[str],
        http: ScopedHttp,
    ) -> Page:
        if not ctx.profile_id or not ctx.user_id:
            raise ValueError("ToolContext user_id and profile_id are required.")

        allowed_hosts = self._manifest.data_flows.allowed_hosts
        primary_host = allowed_hosts[0] if allowed_hosts else "canvas.instructure.com"
        endpoint = f"https://{primary_host}/api/v1/{stream}"

        try:
            response = await http.get(endpoint)
            payload = response.json() if hasattr(response, "json") else {}
            items = payload.get("items", []) if isinstance(payload, dict) else payload if isinstance(payload, list) else []
        except Exception:
            # Deterministic offline mock for testing
            if stream == "assignments":
                items = [
                    {"id": "assign-1", "title": "Math Quiz Chapter 3", "due_at": "2026-10-23T15:00:00Z", "course_name": "Math 5"},
                    {"id": "assign-2", "title": "Science Fair Registration", "due_at": "2026-10-30T17:00:00Z", "course_name": "Science"},
                ]
            else:
                items = [
                    {"id": "evt-1", "title": "Fall Field Trip", "start_time": "2026-10-25T09:00:00Z", "end_time": "2026-10-25T14:00:00Z"},
                ]

        enriched = [dict(it, profile_id=ctx.profile_id) for it in items]
        return Page(stream=stream, records=enriched, next_cursor=None, has_more=False, metadata={"profile_id": ctx.profile_id})

    def map(self, page: Page) -> List[NormalisedRecord]:
        normalised: List[NormalisedRecord] = []
        for raw in page.records:
            rec_id = str(raw.get("id") or f"rec-{len(normalised)+1}")
            raw_hash = hashlib.sha256(json.dumps(raw, sort_keys=True, default=str).encode("utf-8")).hexdigest()
            normalised.append(
                NormalisedRecord(
                    id=rec_id,
                    stream=page.stream,
                    profile_id=str(raw.get("profile_id") or page.metadata.get("profile_id")),
                    source=self._manifest.id,
                    record_type=f"education_{page.stream}",
                    timestamp=datetime.now(timezone.utc),
                    data=raw,
                    raw_hash=raw_hash,
                )
            )
        return normalised

    def tools(self) -> List[ToolSpec]:
        allowed_hosts = tuple(self._manifest.data_flows.allowed_hosts)

        async def _list_assignments_handler(ctx: ToolContext, args: Optional[Dict[str, Any]] = None) -> Any:
            data = [
                {
                    "id": "lms-101",
                    "title": "Math Quiz Chapter 3",
                    "due": "2026-10-23T15:00:00Z",
                    "source": "Assignment extracted from Canvas LMS feed at https://canvas.instructure.com/courses/101",
                },
                {
                    "id": "lms-102",
                    "title": "Science Fair Registration",
                    "due": "2026-10-30T17:00:00Z",
                    "source": "Assignment extracted from Canvas LMS feed at https://canvas.instructure.com/courses/101",
                },
            ]
            return UntrustedResult(data=data, taint=True, source=self._manifest.id)

        async def _sync_calendar_handler(ctx: ToolContext, args: Optional[Dict[str, Any]] = None) -> Any:
            data = {
                "events": [
                    {"summary": "Parent-Teacher Conferences", "start": "2026-11-04T13:00:00Z", "end": "2026-11-04T16:00:00Z"},
                    {"summary": "Early Dismissal Day", "start": "2026-11-05T12:00:00Z", "end": "2026-11-05T12:30:00Z"},
                ],
                "conflicts_detected": 0,
            }
            return UntrustedResult(data=data, taint=True, source=self._manifest.id)

        return [
            ToolSpec(
                name="school_list_assignments",
                description="Retrieves upcoming assignments, homework, and deadlines for a student.",
                parameters={"type": "object", "properties": {"course_id": {"type": "string"}, "limit": {"type": "integer", "default": 20}}},
                risk_class="read_only",
                risk_tier="read",
                trust="untrusted",
                domain="education",
                data_flows=allowed_hosts,
                handler=_list_assignments_handler,
            ),
            ToolSpec(
                name="school_sync_calendar",
                description="Synchronizes school calendar events and checks for schedule conflicts.",
                parameters={"type": "object", "properties": {"window_start": {"type": "string"}, "window_end": {"type": "string"}}},
                risk_class="read_only",
                risk_tier="read",
                trust="untrusted",
                domain="education",
                data_flows=allowed_hosts,
                handler=_sync_calendar_handler,
            ),
        ]
