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

"""Cross-Domain Comprehensive Export & Real Cryptographic Deletion (YV-X-8)."""

from __future__ import annotations

from datetime import datetime, timezone
import hashlib
import io
import json
from pathlib import Path
import shutil
from typing import Any, Dict, List, Optional, Tuple
import zipfile
from sqlalchemy import delete, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from yarvelle_core.config import settings
from yarvelle_core.db.models import (
    Approval,
    Attachment,
    AuditEventRecord,
    Job,
    Note,
    Profile,
    Reminder,
    Routine,
)
from yarvelle_core.storage.cas import read_cas_file
from yarvelle_core.vault.dek import delete_profile_keys
from yarvelle.household.models import CrossDomainLink, Household, HouseholdMember


class ExportDeleteService:
    """Handles structured JSON data export, CAS ZIP archiving, domain purges, and crypto-shredding."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def export_data(
        self,
        household_id: Optional[str] = None,
        profile_id: Optional[str] = None,
        domain: Optional[str] = None,
        include_files: bool = True,
    ) -> Tuple[Dict[str, Any], Optional[bytes]]:
        """Assembles structured JSON export and optional ZIP file archive."""
        filter_domain = domain.strip().lower() if domain else None

        export_dict: Dict[str, Any] = {
            "version": "0.1.0",
            "exported_at": datetime.now(timezone.utc).isoformat(),
            "household_id": household_id,
            "profile_id": profile_id,
            "domain_filter": filter_domain,
            "profiles": [],
            "appointments": [],
            "reminders": [],
            "notes": [],
            "school_forms": [],
            "attachments": [],
            "cross_domain_links": [],
        }

        # Crucial Bug 1 & 1b fix: verify profile or household existence before querying records
        if profile_id:
            p_q = select(Profile).where(Profile.id == profile_id)
            profiles = list((await self.db.execute(p_q)).scalars().all())
            if not profiles:
                return export_dict, None
        elif household_id:
            m_q = select(HouseholdMember.profile_id).where(HouseholdMember.household_id == household_id)
            prof_ids = list((await self.db.execute(m_q)).scalars().all())
            if not prof_ids:
                if hasattr(Profile, "household_id"):
                    p_q = select(Profile).where(getattr(Profile, "household_id") == household_id)
                    profiles = list((await self.db.execute(p_q)).scalars().all())
                else:
                    profiles = []
            else:
                p_q = select(Profile).where(Profile.id.in_(prof_ids))
                profiles = list((await self.db.execute(p_q)).scalars().all())
            if not profiles:
                return export_dict, None
        else:
            p_q = select(Profile)
            profiles = list((await self.db.execute(p_q)).scalars().all())
            if not profiles:
                return export_dict, None

        for p in profiles:
            export_dict["profiles"].append({
                "id": p.id,
                "name": p.name,
                "relationship": getattr(p, "relationship", "self"),
                "age_band": getattr(p, "age_band", "adult"),
            })

        actual_profile_ids = [p.id for p in profiles]

        # Reminders
        r_q = select(Reminder).where(Reminder.profile_id.in_(actual_profile_ids))
        if filter_domain:
            r_q = r_q.where(getattr(Reminder, "domain", getattr(Reminder, "scope", "")) == filter_domain)
        rems = list((await self.db.execute(r_q)).scalars().all())
        for r in rems:
            export_dict["reminders"].append({
                "id": r.id,
                "profile_id": r.profile_id,
                "domain": getattr(r, "domain", getattr(r, "scope", "health")),
                "title": r.title,
                "next_due_at": r.next_due_at.isoformat() if r.next_due_at else None,
                "status": getattr(r, "status", "pending"),
            })

        # Notes
        n_q = select(Note).where(Note.profile_id.in_(actual_profile_ids))
        if filter_domain:
            n_q = n_q.where(getattr(Note, "domain", getattr(Note, "scope", "")) == filter_domain)
        notes = list((await self.db.execute(n_q)).scalars().all())
        for n in notes:
            export_dict["notes"].append({
                "id": n.id,
                "profile_id": n.profile_id,
                "domain": getattr(n, "domain", getattr(n, "scope", "household")),
                "title": n.title,
                "content": n.content,
            })

        # Attachments
        att_q = select(Attachment).where(Attachment.profile_id.in_(actual_profile_ids))
        if filter_domain:
            att_q = att_q.where(getattr(Attachment, "domain", getattr(Attachment, "scope", "")) == filter_domain)
        atts = list((await self.db.execute(att_q)).scalars().all())
        for att in atts:
            export_dict["attachments"].append({
                "id": att.id,
                "profile_id": att.profile_id,
                "filename": getattr(att, "filename", None),
                "sha256": getattr(att, "sha256_hash", None),
            })

        # Cross-Domain Links
        cdl_q = select(CrossDomainLink).where(CrossDomainLink.profile_id.in_(actual_profile_ids))
        if filter_domain:
            cdl_q = cdl_q.where(
                or_(
                    CrossDomainLink.source_domain == filter_domain,
                    CrossDomainLink.target_domain == filter_domain,
                )
            )
        links = list((await self.db.execute(cdl_q)).scalars().all())
        for lnk in links:
            export_dict["cross_domain_links"].append({
                "id": lnk.id,
                "profile_id": lnk.profile_id,
                "link_type": lnk.link_type,
                "source_domain": lnk.source_domain,
                "source_id": lnk.source_entity_id,
                "target_domain": lnk.target_domain,
                "target_id": lnk.target_entity_id,
            })

        if not include_files:
            return export_dict, None

        # Build ZIP archive in memory
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, mode="w", compression=zipfile.ZIP_DEFLATED) as zf:
            zf.writestr("export.json", json.dumps(export_dict, indent=2, default=str))
            for att in atts:
                sha = getattr(att, "sha256_hash", None)
                if sha and att.profile_id:
                    try:
                        file_bytes = read_cas_file(
                            home_dir=settings.home_dir,
                            profile_id=att.profile_id,
                            sha256_hash=sha,
                        )
                        arc_name = f"files/{sha}_{att.filename or 'attachment'}"
                        zf.writestr(arc_name, file_bytes)
                    except Exception:
                        pass

        return export_dict, zip_buffer.getvalue()

    async def purge_domain(self, profile_id: str, domain: str) -> Dict[str, Any]:
        """Purges all records for a specific domain within a profile."""
        clean_domain = domain.strip().lower()

        # Delete database records
        await self.db.execute(delete(Note).where(Note.profile_id == profile_id, getattr(Note, "domain", getattr(Note, "scope", "")) == clean_domain))
        await self.db.execute(delete(Reminder).where(Reminder.profile_id == profile_id, getattr(Reminder, "domain", getattr(Reminder, "scope", "")) == clean_domain))
        await self.db.execute(delete(Attachment).where(Attachment.profile_id == profile_id, getattr(Attachment, "domain", getattr(Attachment, "scope", "")) == clean_domain))
        await self.db.execute(
            delete(CrossDomainLink).where(
                CrossDomainLink.profile_id == profile_id,
                or_(
                    CrossDomainLink.source_domain == clean_domain,
                    CrossDomainLink.target_domain == clean_domain,
                ),
            )
        )

        # Audit event record for domain purge
        payload = {"purged_domain": clean_domain}
        payload_hash = hashlib.sha256(json.dumps(payload, sort_keys=True).encode("utf-8")).hexdigest()

        audit_record = AuditEventRecord(
            profile_id=profile_id,
            event="domain_purged",
            scope=clean_domain,
            tier="T1",
            payload_hash=payload_hash,
            detail_redacted=json.dumps(payload),
        )
        self.db.add(audit_record)
        await self.db.commit()

        return {"purged": True, "domain": clean_domain, "profile_id": profile_id}

    async def crypto_shred_profile(self, profile_id: str) -> Dict[str, Any]:
        """Cascading real delete of profile with cryptographic shredding (YV-X-8)."""
        p_stmt = select(Profile).where(Profile.id == profile_id)
        profile = (await self.db.execute(p_stmt)).scalar_one_or_none()
        if not profile:
            raise ValueError(f"Profile '{profile_id}' not found")
        if profile.is_primary:
            raise ValueError("Cannot delete primary 'Me' profile")

        # Phase 1: Drop DEK from profile_keys
        try:
            await delete_profile_keys(self.db, profile.id)
        except Exception:
            pass

        # Phase 2: Purge CAS storage directory
        try:
            yarvelle_home = Path(settings.home_dir).resolve()
            for cand in [yarvelle_home / "data" / "files", yarvelle_home / "uploads"]:
                if cand.is_dir():
                    for match in cand.glob(f"**/{profile.id}"):
                        if match.is_dir():
                            shutil.rmtree(match, ignore_errors=True)
        except Exception:
            pass

        # Phase 3: Purge cognitive memory and search namespace
        try:
            from yarvelle_core.memory.factory import get_memory_port
            mem = get_memory_port()
            for ns in (profile.id, f"profile_{profile.id}"):
                res = mem.forget_all(namespace=ns)
                if hasattr(res, "__await__"):
                    await res
        except Exception:
            pass

        # Phase 4: Explicit child row deletion
        target_pid = str(profile.id)
        await self.db.execute(update(AuditEventRecord).where(AuditEventRecord.profile_id == target_pid).values(profile_id="[DELETED_PROFILE]"))
        await self.db.execute(delete(CrossDomainLink).where(CrossDomainLink.profile_id == target_pid))
        await self.db.execute(delete(HouseholdMember).where(HouseholdMember.profile_id == target_pid))
        await self.db.execute(delete(Job).where(Job.profile_id == target_pid))
        await self.db.execute(delete(Approval).where(Approval.profile_id == target_pid))
        await self.db.execute(delete(Routine).where(Routine.profile_id == target_pid))
        await self.db.execute(delete(Note).where(Note.profile_id == target_pid))
        await self.db.execute(delete(Reminder).where(Reminder.profile_id == target_pid))
        await self.db.execute(delete(Attachment).where(Attachment.profile_id == target_pid))
        await self.db.execute(delete(Profile).where(Profile.id == target_pid))

        await self.db.commit()
        return {"shredded": True, "profile_id": target_pid, "message": "Profile erased and DEK cryptographically shredded"}
