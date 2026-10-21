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

"""Comprehensive unit and integration test suite for Yarvelle Household & Cross-Domain Layer."""

from __future__ import annotations

from datetime import datetime as dt, timedelta, timezone
from pathlib import Path
from types import SimpleNamespace
import uuid
import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from yarvelle_core.auth.ports import UserProfile
from yarvelle_core.db.base import Base
from yarvelle_core.db.models import Attachment, AuditEventRecord, Note, Profile, Reminder
from carefold_health.models import Appointment, SchoolForm
from yarvelle.household.conflicts import ConflictDetector
from yarvelle.household.cross_links import CrossLinksService
from yarvelle.household.governance import FamilyGovernanceService
from yarvelle.household.db.models import CrossDomainLink, Household, HouseholdMember
from yarvelle.household.schemas import CrossDomainLinkCreate
from yarvelle.household.shred import ExportDeleteService
from yarvelle.household.timeline import TimelineService, extract_caller_scopes


@pytest.fixture
async def async_db(tmp_path: Path):
    """Provides isolated in-memory SQLite database with declarative schema."""
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    session_factory = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with session_factory() as session:
        yield session
    await engine.dispose()


class TestFamilyGovernance:
    """Multi-Profile Family Management (YV-FAM-1..9)."""

    def test_age_band_classification(self):
        svc = FamilyGovernanceService
        assert svc.classify_age_band("2015-05-12", reference_year=2026) == "child_under_13"
        assert svc.classify_age_band("2010-08-20", reference_year=2026) == "teen_13_17"
        assert svc.classify_age_band("1990-01-01", reference_year=2026) == "adult"
        assert svc.classify_age_band("1955-11-30", reference_year=2026) == "older_adult"
        assert svc.classify_age_band(None) == "adult"

    def test_two_guardian_approvals_evaluation(self):
        hh = Household(
            id="hh-1", name="Miller Family",
            two_guardian_rules={"finance": "both_guardians", "education": "any_guardian"},
        )
        svc = FamilyGovernanceService
        assert svc.evaluate_two_guardian_approval(hh, "finance", ["g1"]) is False
        assert svc.evaluate_two_guardian_approval(hh, "finance", ["g1", "g2"]) is True
        assert svc.evaluate_two_guardian_approval(hh, "education", ["g1"]) is True

    def test_domain_privacy_boundaries(self):
        svc = FamilyGovernanceService
        # Teen denied adult finance
        assert svc.can_access_domain(caller_role="member", caller_age_band="teen_13_17", target_domain="finance") is False
        # Adult allowed finance
        assert svc.can_access_domain(caller_role="member", caller_age_band="adult", target_domain="finance") is True
        # Guest denied health without delegation
        assert svc.can_access_domain(caller_role="guest", caller_age_band="adult", target_domain="health") is False


class TestUnifiedTimeline:
    """Unified Timeline Service (YV-X-1)."""

    @pytest.mark.asyncio
    async def test_timeline_scope_and_toggle_filtering(self, async_db: AsyncSession):
        now = dt.now(timezone.utc)
        hh = Household(id="hh-t1", name="Toggle HH", domain_toggles={"health": True, "finance": False})
        p = Profile(id="p-t1", name="Alice", created_at=now, updated_at=now)
        m = HouseholdMember(id="m-t1", household_id="hh-t1", profile_id=p.id, role="admin", age_band="adult")
        rem_health = Reminder(id="r-h", profile_id=p.id, scope="health", title="Pill Due", next_due_at=now, created_at=now, updated_at=now)
        rem_fin = Reminder(id="r-f", profile_id=p.id, scope="finance", title="Bill Due", next_due_at=now, created_at=now, updated_at=now)
        async_db.add_all([hh, p, m, rem_health, rem_fin])
        await async_db.commit()

        svc = TimelineService(async_db)
        # Finance toggle is disabled, so finance item is excluded
        res = await svc.fetch_timeline(caller_scopes={"*"}, household_id="hh-t1")
        assert len(res.items) == 1
        assert res.items[0].id == "r-h"

    @pytest.mark.asyncio
    async def test_timeline_null_profile_id_attachment_safe(self, async_db: AsyncSession):
        """Regression test for Bug 2: Attachment with profile_id=None must not fail validation."""
        now = dt.now(timezone.utc)
        att = Attachment(
            id="att-null",
            profile_id=None,
            scope="health",
            filename="flyer.pdf",
            original_name="flyer.pdf",
            created_at=now,
            updated_at=now,
        )
        async_db.add(att)
        await async_db.commit()

        svc = TimelineService(async_db)
        res = await svc.fetch_timeline(caller_scopes={"health:read"})
        assert any(it.id == "att-null" for it in res.items)

    def test_extract_caller_scopes_zero_grant_no_universal_escalation(self):
        """Regression test for Bug 6: user with domain_scopes=[] must not receive universal *."""
        now = dt.now(timezone.utc)
        user = UserProfile(
            id="u-zero",
            email="zero@example.com",
            username="zero",
            role="member",
            domain_scopes=[],
            created_at=now,
            updated_at=now,
        )
        scopes = extract_caller_scopes(user)
        assert "*" not in scopes

    def test_extract_caller_scopes_header_injection_prevention(self):
        """Regression test: untrusted X-Domain-Scopes cannot escalate beyond authenticated grants."""
        # 1. Non-empty domain_scopes cannot be expanded by header
        user_finance = SimpleNamespace(
            id="u-fin",
            role="member",
            domain_scopes=["finance:read"],
        )
        # Attempted injection of health:read and universal *
        scopes = extract_caller_scopes(user_finance, header_scopes="health:read,finance:read,*")
        assert "health:read" not in scopes
        assert "*" not in scopes
        assert scopes == {"finance:read"}

        # 2. Zero-grant user cannot escalate via header
        user_zero = SimpleNamespace(
            id="u-zero2",
            role="member",
            domain_scopes=[],
        )
        scopes_zero = extract_caller_scopes(user_zero, header_scopes="health:read,finance:read,*")
        assert scopes_zero == set()

        # 3. Authorized scopes can be narrowed / filtered by header
        user_multi = SimpleNamespace(
            id="u-multi",
            role="member",
            domain_scopes=["health:read", "finance:read", "education:read"],
        )
        scopes_filtered = extract_caller_scopes(user_multi, header_scopes="health:read")
        assert scopes_filtered == {"health:read"}

    @pytest.mark.asyncio
    async def test_timeline_appointment_rendering(self, async_db: AsyncSession):
        """Verifies health Appointment fixture renders in unified household timeline."""
        now = dt.now(timezone.utc)
        hh = Household(id="hh-appt", name="Appt HH", domain_toggles={"health": True})
        p = Profile(id="p-appt", name="Emma", created_at=now, updated_at=now)
        m = HouseholdMember(id="m-appt", household_id=hh.id, profile_id=p.id, role="member", age_band="child_u13")
        appt = Appointment(
            id="appt-pediatric",
            profile_id=p.id,
            scope="health",
            title="Annual Pediatric Wellness Exam",
            start_time=now + timedelta(days=2),
            end_time=now + timedelta(days=2, hours=1),
            created_at=now,
            updated_at=now,
        )
        async_db.add_all([hh, p, m, appt])
        await async_db.commit()

        svc = TimelineService(async_db)
        res = await svc.fetch_timeline(caller_scopes={"health:read"}, household_id="hh-appt")
        assert any(it.id == "appt-pediatric" and it.item_type == "appointment" for it in res.items)


class TestCrossDomainLinks:
    """Typed Cross-Domain Links (YV-X-2)."""

    @pytest.mark.asyncio
    async def test_dual_read_scope_invariant(self, async_db: AsyncSession):
        now = dt.now(timezone.utc)
        hh = Household(id="hh-l1", name="Link HH", domain_toggles={"health": True, "finance": True})
        p = Profile(id="p-l1", name="Bob", created_at=now, updated_at=now)
        m = HouseholdMember(id="m-l1", household_id="hh-l1", profile_id=p.id, role="member", age_band="adult")
        async_db.add_all([hh, p, m])
        await async_db.commit()

        svc = CrossLinksService(async_db)
        link = await svc.create_link(CrossDomainLinkCreate(
            profile_id=p.id,
            source_domain="health", source_entity_type="appointment", source_entity_id="appt-1",
            target_domain="finance", target_entity_type="reminder", target_entity_id="bill-1",
            link_type="visit_to_bill",
        ))

        # Caller with only health:read cannot view link to finance
        assert len(await svc.list_links(caller_scopes={"health:read"}, entity_id="appt-1")) == 0
        # Caller with both scopes can view link
        assert len(await svc.list_links(caller_scopes={"health:read", "finance:read"}, entity_id="appt-1")) == 1

    @pytest.mark.asyncio
    async def test_concurrent_link_deletion_idempotent(self, async_db: AsyncSession):
        svc = CrossLinksService(async_db)
        link = await svc.create_link(CrossDomainLinkCreate(
            profile_id="p1", source_domain="health", source_entity_type="a", source_entity_id="1",
            target_domain="finance", target_entity_type="b", target_entity_id="2", link_type="visit_to_bill",
        ))
        assert await svc.delete_link(link.id) is True
        assert await svc.delete_link(link.id) is False


class TestConflictDetector:
    """Cross-Domain Conflict Detection (YV-X-3)."""

    @pytest.mark.asyncio
    async def test_bill_cluster_regex_calendar_year_fix(self, async_db: AsyncSession):
        """Regression test for Bug 3: Year 2026 in date string must not trigger bill cluster."""
        now = dt.now(timezone.utc)
        hh = Household(id="hh-c1", name="Conflict HH")
        p = Profile(id="p-c1", name="Charlie", created_at=now, updated_at=now)
        m = HouseholdMember(id="m-c1", household_id="hh-c1", profile_id=p.id, role="member", age_band="adult")
        bill = Reminder(
            id="bill-copay", profile_id=p.id, scope="finance", title="Clinic Copay",
            next_due_at=now + timedelta(hours=10), description="Due 2026-10-25. Copay $40.00",
            status="pending", created_at=now, updated_at=now,
        )
        setattr(bill, "category", "bill")
        async_db.add_all([hh, p, m, bill])
        await async_db.commit()

        detector = ConflictDetector(async_db)
        res = await detector.detect_conflicts(household_id="hh-c1", window="7d")
        assert len([c for c in res.conflicts if c.type == "bill_due_cluster"]) == 0

    @pytest.mark.asyncio
    async def test_sports_event_expired_physical_triggers_conflict(self, async_db: AsyncSession):
        """Verifies an expired sports physical triggers a ConflictDetector warning on athletic events."""
        now = dt.now(timezone.utc)
        hh = Household(id="hh-sports", name="Sports HH")
        child = Profile(id="p-athlete", name="Athlete Kid", created_at=now, updated_at=now)
        m = HouseholdMember(id="m-ath", household_id=hh.id, profile_id=child.id, role="dependent", age_band="child_u13")
        expired_form = SchoolForm(
            id="form-phys-exp",
            profile_id=child.id,
            scope="health",
            title="Pre-Participation Sports Physical",
            form_type="physical",
            expires_at=now - timedelta(days=15),
            status="active",
            created_at=now,
            updated_at=now,
        )
        soccer_practice = Appointment(
            id="appt-soccer",
            profile_id=child.id,
            scope="health",
            title="Youth Soccer Practice & Conditioning",
            start_time=now + timedelta(days=1),
            end_time=now + timedelta(days=1, hours=2),
            created_at=now,
            updated_at=now,
        )
        grocery_trip = Appointment(
            id="appt-grocery",
            profile_id=child.id,
            scope="health",
            title="Family Grocery Shopping",
            start_time=now + timedelta(days=3),
            end_time=now + timedelta(days=3, hours=1),
            created_at=now,
            updated_at=now,
        )
        async_db.add_all([hh, child, m, expired_form, soccer_practice, grocery_trip])
        await async_db.commit()

        detector = ConflictDetector(async_db)
        res = await detector.detect_conflicts(household_id=hh.id, window="7d")

        # Only soccer practice should conflict, grocery shopping ignored
        physical_conflicts = [c for c in res.conflicts if c.type == "physical_expired"]
        assert len(physical_conflicts) == 1
        conflict = physical_conflicts[0]
        assert "appt-soccer" in conflict.event_ids
        assert "form-phys-exp" in conflict.event_ids
        assert "appt-grocery" not in conflict.event_ids
        assert conflict.severity == "warning"


class TestScopedShreddingAndErasure:
    """Scoped Shredding & Cryptographic Erasure (YV-X-8)."""

    @pytest.mark.asyncio
    async def test_non_existent_profile_export_tenant_isolation(self, async_db: AsyncSession):
        """Regression test for Bug 1: Non-existent profile export returns 0 records without leaking others."""
        now = dt.now(timezone.utc)
        victim = Profile(id="p-victim", name="Victim", created_at=now, updated_at=now)
        secret_note = Note(
            id="n-sec",
            profile_id=victim.id,
            scope="health",
            slug="sec-slug",
            title="Secret",
            content="Private info",
            created_at=now,
            updated_at=now,
        )
        async_db.add_all([victim, secret_note])
        await async_db.commit()

        svc = ExportDeleteService(async_db)
        export_dict, _ = await svc.export_data(profile_id="nonexistent-attacker-probe", include_files=False)
        assert len(export_dict["notes"]) == 0
        assert len(export_dict["profiles"]) == 0

    @pytest.mark.asyncio
    async def test_domain_purge_emits_audit_and_drops_records(self, async_db: AsyncSession):
        now = dt.now(timezone.utc)
        p = Profile(id="p-purge", name="Dana", created_at=now, updated_at=now)
        note = Note(
            id="n-fin",
            profile_id=p.id,
            scope="finance",
            slug="fin-slug",
            title="Fin Note",
            content="Cash",
            created_at=now,
            updated_at=now,
        )
        async_db.add_all([p, note])
        await async_db.commit()

        svc = ExportDeleteService(async_db)
        res = await svc.purge_domain(profile_id=p.id, domain="finance")
        assert res["purged"] is True

        assert (await async_db.execute(select(Note).where(Note.id == "n-fin"))).scalar_one_or_none() is None
        audit = (await async_db.execute(select(AuditEventRecord).where(AuditEventRecord.profile_id == p.id))).scalar_one()
        assert audit.event == "domain_purged"
        assert audit.tier == "T1"
