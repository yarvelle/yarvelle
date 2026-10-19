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

"""4-Pack Cross-Scope Conformance Suite in Yarvelle.

Verifies zero cross-pack data leakage across all 12 ordered pairs of genuine installed packs:
1. (health, finance)
2. (health, education)
3. (health, household)
4. (finance, health)
5. (finance, education)
6. (finance, household)
7. (education, health)
8. (education, finance)
9. (education, household)
10. (household, health)
11. (household, finance)
12. (household, education)

Covers all 11 isolation layers:
1. ORM Loader Criteria & ScopeContext
2. Write Ownership Guard
3. Partitioned CAS Paths (<user>/<profile>/<scope>/<sha256>)
4. FTS5 Search Scope Isolation
5. Scoped Memory Namespaces (scope:<scope>/profile:<id>/)
6. Vault HKDF Sub-Key Derivation (scope-derived DEKs)
7. ToolExecutionGate Step 2.5 Scope Authorization
8. LLM Context Prompt Isolation & RoutingHints
9. API Route-Walk & Scope Middleware (100% of pack routes carry require_scope)
10. Dual-Scope Cross-Domain Links & Scoped Shredding
11. Audit Events Scope, Pack ID, Tier & Preimage Hash Integrity
"""

from __future__ import annotations

import asyncio
from datetime import datetime, timezone
import hashlib
from pathlib import Path
import shutil
from typing import Any, Dict, List, Tuple

import pytest
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import event, select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import Session, sessionmaker

from carefold_health.models import Appointment
from yarvelle.household.cross_links import CrossLinksService
from yarvelle.household.schemas import CrossDomainLinkCreate
from yarvelle.household.shred import ExportDeleteService
from yarvelle.main import build_app
from yarvelle_core.config import settings as core_settings
from yarvelle_core.conformance import (
    ConformancePackProtocol,
    IsolationLayer,
    run_conformance_matrix,
    run_multi_pack_conformance_matrix,
)
from yarvelle_core.db.base import Base
from yarvelle_core.db.models import Note, Profile
from yarvelle_core.db.scoped_session import (
    _enforce_before_flush,
    _enforce_do_orm_execute,
)
from yarvelle_core.engine.tool_registry import DataFlows, ToolSpec
from yarvelle_core.pack.loader import discover_and_load_packs
from yarvelle_core.schemas.tool import ToolResult
from yarvelle_core.scope.context import (
    ScopeViolationError,
    require_scope,
    scope_context,
)
from yarvelle.education.db.models import EducationAssignment
from yarvelle.finance.db.models import FinanceAccount
from yarvelle.household.db.models import HouseholdChore

# Detach global listeners from base Session so un-scoped household/pack unit tests are not polluted
if event.contains(Session, "before_flush", _enforce_before_flush):
    event.remove(Session, "before_flush", _enforce_before_flush)
if event.contains(Session, "do_orm_execute", _enforce_do_orm_execute):
    event.remove(Session, "do_orm_execute", _enforce_do_orm_execute)


@pytest.fixture(autouse=True)
def manage_conformance_isolation(tmp_path: Path):
    """Enables scoped ORM interception for conformance tests and cleans up test artifacts."""
    old_home = core_settings.home_dir
    core_settings.home_dir = tmp_path
    if not event.contains(Session, "before_flush", _enforce_before_flush):
        event.listen(Session, "before_flush", _enforce_before_flush)
    if not event.contains(Session, "do_orm_execute", _enforce_do_orm_execute):
        event.listen(Session, "do_orm_execute", _enforce_do_orm_execute)
    try:
        yield
    finally:
        core_settings.home_dir = old_home
        if event.contains(Session, "before_flush", _enforce_before_flush):
            event.remove(Session, "before_flush", _enforce_before_flush)
        if event.contains(Session, "do_orm_execute", _enforce_do_orm_execute):
            event.remove(Session, "do_orm_execute", _enforce_do_orm_execute)
        logs_dir = Path(__file__).resolve().parent.parent / "logs"
        if logs_dir.exists():
            shutil.rmtree(logs_dir, ignore_errors=True)


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


# ============================================================================
# Section 1: Genuine Conformance Fixtures for Installed Packs
# ============================================================================


class GenuineHealthPackFixture(ConformancePackProtocol):
    """Genuine conformance fixture representing carefold-health pack."""

    pack_id: str = "health"
    domain: str = "health"
    owned_scopes: List[str] = ["health.clinical", "health.paperwork"]
    declared_reads: List[str] = []

    def create_orm_record(
        self, session: Any, profile_id: str, scope: str = "health.clinical"
    ) -> Appointment:
        return Appointment(
            id=f"appt-{profile_id[:8]}",
            profile_id=profile_id,
            scope=scope,
            title="Cardiology Specialty Consultation",
            specialty="Cardiology",
            start_time=utc_now(),
            end_time=utc_now(),
            status="scheduled",
        )

    def create_cas_file(
        self, cas_root: Any, profile_id: str, scope: str = "health.clinical"
    ) -> Tuple[str, bytes]:
        content = b"CLINICAL LAB RESULTS: A1C 6.4%, Blood Pressure 120/80 mmHg, Glucose 98 mg/dL"
        return hashlib.sha256(content).hexdigest(), content

    def create_search_document(
        self, profile_id: str, scope: str = "health.clinical"
    ) -> Tuple[str, str]:
        return "doc-health-001", "Cardiology consultation notes with prescribed Metformin medication"

    def create_memory_entry(
        self, profile_id: str, scope: str = "health.clinical"
    ) -> Tuple[str, str]:
        return (
            f"scope:{scope}/profile:{profile_id}/working",
            "Patient reports mild fatigue after morning exercise",
        )

    def create_vault_secret(
        self, profile_id: str, scope: str = "health.clinical"
    ) -> bytes:
        return b"HEALTH_PORTAL_OAUTH_REFRESH_TOKEN_332211"

    def get_test_tool(self) -> ToolSpec:
        async def _exec(args: Dict[str, Any] = None, ctx: Any = None) -> ToolResult:
            return ToolResult(success=True, output={"status": "recorded", "vital": "bp_120_80"})

        return ToolSpec(
            name="health_record_vitals",
            description="Record patient clinical vitals for conformance testing",
            risk_tier="write_local",
            data_flows=DataFlows(),
            scopes={"health.clinical"},
            executor=_exec,
        )

    def get_test_router(self) -> APIRouter:
        router = APIRouter(prefix="/health-conformance", tags=["health"])

        def _check_scope() -> None:
            try:
                require_scope("health.clinical", level="read")
            except Exception as exc:
                raise HTTPException(status_code=403, detail=str(exc))

        @router.get("/vitals", dependencies=[Depends(_check_scope)])
        async def _endpoint():
            return {"status": "ok", "vitals": [{"type": "blood_pressure", "value": "120/80"}]}

        return router

    def get_exportable_dossier(
        self, profile_id: str, scope: str = "health.clinical"
    ) -> Dict[str, Any]:
        return {
            "domain": "health",
            "scope": scope,
            "profile_id": profile_id,
            "vitals": {"blood_pressure": "120/80", "heart_rate": 72},
            "medications": ["Metformin 500mg"],
        }


class GenuineFinancePackFixture(ConformancePackProtocol):
    """Genuine conformance fixture representing yarvelle-pack-finance pack."""

    pack_id: str = "finance"
    domain: str = "finance"
    owned_scopes: List[str] = [
        "finance.accounts",
        "finance.transactions",
        "finance.bills",
        "finance.budget",
    ]
    declared_reads: List[str] = ["health.paperwork"]

    def create_orm_record(
        self, session: Any, profile_id: str, scope: str = "finance.accounts"
    ) -> FinanceAccount:
        return FinanceAccount(
            id=f"acc-{profile_id[:8]}",
            profile_id=profile_id,
            scope=scope,
            account_name="Primary Checking Account",
            institution_name="First National Bank",
            masked_number="****1234",
            current_balance=15420.50,
            currency="USD",
        )

    def create_cas_file(
        self, cas_root: Any, profile_id: str, scope: str = "finance.accounts"
    ) -> Tuple[str, bytes]:
        content = b"SYNTHETIC BANK STATEMENT: Checking Balance $15,420.50, APR 4.25%"
        return hashlib.sha256(content).hexdigest(), content

    def create_search_document(
        self, profile_id: str, scope: str = "finance.accounts"
    ) -> Tuple[str, str]:
        return "doc-fin-001", "Mortgage loan statement balance 320000 at fixed interest rate"

    def create_memory_entry(
        self, profile_id: str, scope: str = "finance.accounts"
    ) -> Tuple[str, str]:
        return (
            f"scope:{scope}/profile:{profile_id}/working",
            "User requested monthly savings budget calculation",
        )

    def create_vault_secret(
        self, profile_id: str, scope: str = "finance.accounts"
    ) -> bytes:
        return b"FINANCE_PLAID_ACCESS_TOKEN_SECRET_998811"

    def get_test_tool(self) -> ToolSpec:
        async def _exec(args: Dict[str, Any] = None, ctx: Any = None) -> ToolResult:
            return ToolResult(success=True, output={"accounts": [{"id": "acc-1", "balance": 15420.50}]})

        return ToolSpec(
            name="finance_list_accounts",
            description="List financial accounts for conformance testing",
            risk_tier="read",
            data_flows=DataFlows(),
            scopes={"finance.accounts"},
            executor=_exec,
        )

    def get_test_router(self) -> APIRouter:
        router = APIRouter(prefix="/finance-conformance", tags=["finance"])

        def _check_scope() -> None:
            try:
                require_scope("finance.accounts", level="read")
            except Exception as exc:
                raise HTTPException(status_code=403, detail=str(exc))

        @router.get("/accounts", dependencies=[Depends(_check_scope)])
        async def _endpoint():
            return {"status": "ok", "accounts": [{"institution": "FirstBank", "balance": 15420}]}

        return router

    def get_exportable_dossier(
        self, profile_id: str, scope: str = "finance.accounts"
    ) -> Dict[str, Any]:
        return {
            "domain": "finance",
            "scope": scope,
            "profile_id": profile_id,
            "accounts": [{"institution": "FirstBank", "balance": 15420.50}],
        }


class GenuineEducationPackFixture(ConformancePackProtocol):
    """Genuine conformance fixture representing yarvelle-education pack."""

    pack_id: str = "education"
    domain: str = "education"
    owned_scopes: List[str] = [
        "education.assignments",
        "education.milestones",
        "education.reading",
        "education.forms",
    ]
    declared_reads: List[str] = ["health.clinical", "household.calendar"]

    def create_orm_record(
        self, session: Any, profile_id: str, scope: str = "education.assignments"
    ) -> EducationAssignment:
        return EducationAssignment(
            id=f"asgn-{profile_id[:8]}",
            profile_id=profile_id,
            scope=scope,
            title="Biology Science Fair Project",
            subject="Biology",
            due_date=utc_now(),
            status="in_progress",
        )

    def create_cas_file(
        self, cas_root: Any, profile_id: str, scope: str = "education.assignments"
    ) -> Tuple[str, bytes]:
        content = b"EDUCATION SCHOOL REPORT: Academic Progress and Honor Roll Certificate"
        return hashlib.sha256(content).hexdigest(), content

    def create_search_document(
        self, profile_id: str, scope: str = "education.assignments"
    ) -> Tuple[str, str]:
        return "doc-edu-001", "Algebra problem set and homework assignment chapter 5 due next Monday"

    def create_memory_entry(
        self, profile_id: str, scope: str = "education.assignments"
    ) -> Tuple[str, str]:
        return (
            f"scope:{scope}/profile:{profile_id}/working",
            "Student completed reading log chapter 3 and summary notes",
        )

    def create_vault_secret(
        self, profile_id: str, scope: str = "education.assignments"
    ) -> bytes:
        return b"EDUCATION_SCHOOL_PORTAL_OAUTH_TOKEN_554433"

    def get_test_tool(self) -> ToolSpec:
        async def _exec(args: Dict[str, Any] = None, ctx: Any = None) -> ToolResult:
            return ToolResult(success=True, output={"assignments": [{"id": "asgn-1", "title": "Math"}]})

        return ToolSpec(
            name="education_manage_assignments",
            description="Manage student assignments for conformance testing",
            risk_tier="read",
            data_flows=DataFlows(),
            scopes={"education.assignments"},
            executor=_exec,
        )

    def get_test_router(self) -> APIRouter:
        router = APIRouter(prefix="/education-conformance", tags=["education"])

        def _check_scope() -> None:
            try:
                require_scope("education.assignments", level="read")
            except Exception as exc:
                raise HTTPException(status_code=403, detail=str(exc))

        @router.get("/assignments", dependencies=[Depends(_check_scope)])
        async def _endpoint():
            return {"status": "ok", "assignments": [{"subject": "Math", "title": "HW 5"}]}

        return router

    def get_exportable_dossier(
        self, profile_id: str, scope: str = "education.assignments"
    ) -> Dict[str, Any]:
        return {
            "domain": "education",
            "scope": scope,
            "profile_id": profile_id,
            "assignments": [{"title": "Biology Fair Project", "grade": "A"}],
        }


class GenuineHouseholdPackFixture(ConformancePackProtocol):
    """Genuine conformance fixture representing yarvelle-household pack."""

    pack_id: str = "household"
    domain: str = "household"
    owned_scopes: List[str] = [
        "household.chores",
        "household.meals",
        "household.activities",
        "household.members",
        "household.governance",
    ]
    declared_reads: List[str] = ["health.clinical", "finance.accounts", "education.assignments"]

    def create_orm_record(
        self, session: Any, profile_id: str, scope: str = "household.chores"
    ) -> HouseholdChore:
        return HouseholdChore(
            id=f"chore-{profile_id[:8]}",
            profile_id=profile_id,
            scope=scope,
            title="Clean Kitchen Counters",
            assigned_to="all",
            frequency="daily",
            streak=0,
        )

    def create_cas_file(
        self, cas_root: Any, profile_id: str, scope: str = "household.chores"
    ) -> Tuple[str, bytes]:
        content = b"HOUSEHOLD ROSTER: Family Chore Rotation and Weekend Schedule"
        return hashlib.sha256(content).hexdigest(), content

    def create_search_document(
        self, profile_id: str, scope: str = "household.chores"
    ) -> Tuple[str, str]:
        return "doc-hh-001", "Weekly grocery list and Sunday family dinner meal prep schedule"

    def create_memory_entry(
        self, profile_id: str, scope: str = "household.chores"
    ) -> Tuple[str, str]:
        return (
            f"scope:{scope}/profile:{profile_id}/working",
            "Family agreed on Saturday morning chore routine",
        )

    def create_vault_secret(
        self, profile_id: str, scope: str = "household.chores"
    ) -> bytes:
        return b"HOUSEHOLD_SMART_HOME_GATEWAY_TOKEN_112233"

    def get_test_tool(self) -> ToolSpec:
        async def _exec(args: Dict[str, Any] = None, ctx: Any = None) -> ToolResult:
            return ToolResult(success=True, output={"chores": [{"id": "chore-1", "title": "Kitchen"}]})

        return ToolSpec(
            name="household_manage_chores",
            description="Manage family chores for conformance testing",
            risk_tier="read",
            data_flows=DataFlows(),
            scopes={"household.chores"},
            executor=_exec,
        )

    def get_test_router(self) -> APIRouter:
        router = APIRouter(prefix="/household-conformance", tags=["household"])

        def _check_scope() -> None:
            try:
                require_scope("household.chores", level="read")
            except Exception as exc:
                raise HTTPException(status_code=403, detail=str(exc))

        @router.get("/chores", dependencies=[Depends(_check_scope)])
        async def _endpoint():
            return {"status": "ok", "chores": [{"title": "Clean Kitchen Counters", "status": "pending"}]}

        return router

    def get_exportable_dossier(
        self, profile_id: str, scope: str = "household.chores"
    ) -> Dict[str, Any]:
        return {
            "domain": "household",
            "scope": scope,
            "profile_id": profile_id,
            "chores": [{"title": "Clean Counters", "status": "pending"}],
        }


# ============================================================================
# Section 2: Full 4-Pack Mesh Conformance Matrix (All 12 Ordered Pairs)
# ============================================================================


@pytest.mark.asyncio
async def test_all_four_packs_conformance_matrix(tmp_path: Path):
    """Executes the full 4-pack mesh conformance matrix across all 12 ordered pairs."""
    packs = [
        GenuineHealthPackFixture(),
        GenuineFinancePackFixture(),
        GenuineEducationPackFixture(),
        GenuineHouseholdPackFixture(),
    ]
    result = await run_multi_pack_conformance_matrix(packs, work_dir=tmp_path / "mesh_conformance")

    assert result.passed is True, f"Conformance violations detected: {result.violations}"
    assert len(result.violations) == 0

    # Verify all 12 ordered pairs are covered
    expected_pairs = {
        ("health", "finance"),
        ("health", "education"),
        ("health", "household"),
        ("finance", "health"),
        ("finance", "education"),
        ("finance", "household"),
        ("education", "health"),
        ("education", "finance"),
        ("education", "household"),
        ("household", "health"),
        ("household", "finance"),
        ("household", "education"),
    }
    tested_pairs_set = set(result.tested_pairs)
    assert expected_pairs.issubset(tested_pairs_set), f"Missing pairs in test matrix: {expected_pairs - tested_pairs_set}"

    # Verify all 11 isolation layers passed
    for layer in IsolationLayer:
        assert result.layer_results.get(layer) is True, f"Layer {layer.value} failed in 4-pack conformance matrix"


# ============================================================================
# Section 3: Parameterized Tests for Each of the 12 Ordered Pack Pairs
# ============================================================================


@pytest.mark.parametrize(
    "pack_a,pack_b",
    [
        (GenuineHealthPackFixture(), GenuineFinancePackFixture()),
        (GenuineHealthPackFixture(), GenuineEducationPackFixture()),
        (GenuineHealthPackFixture(), GenuineHouseholdPackFixture()),
        (GenuineFinancePackFixture(), GenuineHealthPackFixture()),
        (GenuineFinancePackFixture(), GenuineEducationPackFixture()),
        (GenuineFinancePackFixture(), GenuineHouseholdPackFixture()),
        (GenuineEducationPackFixture(), GenuineHealthPackFixture()),
        (GenuineEducationPackFixture(), GenuineFinancePackFixture()),
        (GenuineEducationPackFixture(), GenuineHouseholdPackFixture()),
        (GenuineHouseholdPackFixture(), GenuineHealthPackFixture()),
        (GenuineHouseholdPackFixture(), GenuineFinancePackFixture()),
        (GenuineHouseholdPackFixture(), GenuineEducationPackFixture()),
    ],
    ids=[
        "health->finance",
        "health->education",
        "health->household",
        "finance->health",
        "finance->education",
        "finance->household",
        "education->health",
        "education->finance",
        "education->household",
        "household->health",
        "household->finance",
        "household->education",
    ],
)
@pytest.mark.asyncio
async def test_pairwise_mesh_isolation(pack_a, pack_b, tmp_path: Path):
    """Executes bidirectional 11-layer isolation verification between a specific pair of genuine packs."""
    work_dir = tmp_path / f"pair_{pack_a.pack_id}_to_{pack_b.pack_id}"
    res = await run_conformance_matrix(pack_a, pack_b, work_dir=work_dir)
    assert res.passed is True, f"Violations between {pack_a.pack_id} and {pack_b.pack_id}: {res.violations}"
    assert len(res.violations) == 0


# ============================================================================
# Section 4: Dedicated Tests for the 11 Isolation Layers
# ============================================================================


@pytest.mark.asyncio
async def test_layer_01_orm_loader_criteria_and_scope_context(tmp_path: Path):
    """Layer 1: Verifies ORM loader criteria strictly scopes SELECT queries across packs."""
    health_pack = GenuineHealthPackFixture()
    finance_pack = GenuineFinancePackFixture()
    res = await run_conformance_matrix(
        health_pack,
        finance_pack,
        work_dir=tmp_path / "orm_loader",
    )
    assert res.layer_results[IsolationLayer.ORM] is True


@pytest.mark.asyncio
async def test_layer_02_write_ownership_guard():
    """Layer 2: Verifies ScopedSession before_flush guard blocks cross-scope writes."""
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    from yarvelle_core.db.scoped_session import ScopedAsyncSession

    Session = sessionmaker(engine, class_=ScopedAsyncSession, expire_on_commit=False)
    profile_id = "prof-test-write-guard"

    async with Session() as session:
        # 1. Seed user & profile
        p = Profile(id=profile_id, name="Test Profile", created_at=utc_now(), updated_at=utc_now())
        session.add(p)
        await session.commit()

        # 2. Attempt cross-scope write: Health actor attempts to write FinanceAccount
        with scope_context(
            profile_id=profile_id,
            pack_id="health",
            scope="health.clinical",
            granted_scopes={"health.clinical", "health.*"},
            pack_declared_scopes={"health.clinical", "health.*"},
        ):
            unauthorized_account = FinanceAccount(
                id="acc-unauthorized",
                profile_id=profile_id,
                scope="finance.accounts",
                account_name="Hacked Account",
                institution_name="Evil Bank",
                masked_number="****0000",
                current_balance=9999.0,
                currency="USD",
            )
            session.add(unauthorized_account)
            with pytest.raises(ScopeViolationError):
                await session.flush()
            await session.rollback()

    await engine.dispose()


@pytest.mark.asyncio
async def test_layer_03_partitioned_cas_paths(tmp_path: Path):
    """Layer 3: Verifies CAS file storage partitions physical paths by scope."""
    res = await run_conformance_matrix(
        GenuineHealthPackFixture(),
        GenuineEducationPackFixture(),
        work_dir=tmp_path / "cas_paths",
    )
    assert res.layer_results[IsolationLayer.CAS] is True


@pytest.mark.asyncio
async def test_layer_04_fts5_search_scope_isolation(tmp_path: Path):
    """Layer 4: Verifies FTS5 full-text index strictly scopes search queries."""
    res = await run_conformance_matrix(
        GenuineFinancePackFixture(),
        GenuineHouseholdPackFixture(),
        work_dir=tmp_path / "fts5_search",
    )
    assert res.layer_results[IsolationLayer.FTS5] is True


@pytest.mark.asyncio
async def test_layer_05_scoped_memory_namespaces(tmp_path: Path):
    """Layer 5: Verifies MemoryPort enforces canonical scope prefixing and prevents cross-scope recall."""
    res = await run_conformance_matrix(
        GenuineEducationPackFixture(),
        GenuineHealthPackFixture(),
        work_dir=tmp_path / "memory_namespaces",
    )
    assert res.layer_results[IsolationLayer.MEMORY] is True


@pytest.mark.asyncio
async def test_layer_06_vault_hkdf_sub_keys(tmp_path: Path):
    """Layer 6: Verifies Vault derives scope-isolated DEKs and refuses cross-scope decryption."""
    res = await run_conformance_matrix(
        GenuineHealthPackFixture(),
        GenuineFinancePackFixture(),
        work_dir=tmp_path / "vault_sub_keys",
    )
    assert res.layer_results[IsolationLayer.VAULT] is True


@pytest.mark.asyncio
async def test_layer_07_tool_execution_gate_authorization(tmp_path: Path):
    """Layer 7: Verifies ToolExecutionGate Step 2.5 rejects out-of-scope tools."""
    res = await run_conformance_matrix(
        GenuineHouseholdPackFixture(),
        GenuineHealthPackFixture(),
        work_dir=tmp_path / "tool_gate",
    )
    assert res.layer_results[IsolationLayer.TOOL_GATE] is True


@pytest.mark.asyncio
async def test_layer_08_prompt_context_tool_filtering_and_routing_hints(tmp_path: Path):
    """Layer 8: Verifies prompt context assembly only exposes tools matching active scopes and hints."""
    res = await run_conformance_matrix(
        GenuineHouseholdPackFixture(),
        GenuineFinancePackFixture(),
        work_dir=tmp_path / "prompt_filter",
    )
    assert res.layer_results[IsolationLayer.PROMPT] is True

    # Routing hints check across all 4 packs
    registry = discover_and_load_packs(enabled_pack_ids=["health", "finance", "education", "household"])
    for pack_id in ("health", "finance", "education", "household"):
        pack = registry.get_pack(pack_id)
        assert pack is not None
        assert pack.routing_hints is not None
        assert pack.routing_hints.domain == pack_id


@pytest.mark.asyncio
async def test_layer_09_api_route_walk_and_scope_middleware():
    """Layer 9: Verifies 100% of pack-contributed routers carry scope declarations and middleware."""
    registry = discover_and_load_packs(enabled_pack_ids=["health", "finance", "education", "household"])
    assert len(registry.router_contributions) >= 19, f"Expected >= 19 routers, got {len(registry.router_contributions)}"

    for contrib in registry.router_contributions:
        assert contrib.pack_id in ("health", "finance", "education", "household"), f"Invalid pack_id on router {contrib}"
        assert contrib.scope is not None, f"Router contribution {contrib} missing required scope"
        assert contrib.level in ("read", "write", "approve"), f"Router contribution {contrib} missing access level"

    app = build_app()
    assert app is not None


@pytest.mark.asyncio
async def test_layer_10_dual_scope_cross_domain_links_and_scoped_shredding():
    """Layer 10: Verifies cross-domain links require dual read scopes and domain shredding isolates data."""
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    Session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    now = utc_now()

    async with Session() as session:
        profile = Profile(id="prof-cross-test", name="Cross Domain User", created_at=now, updated_at=now)
        session.add(profile)
        await session.commit()

        # 1. Dual-scope link test: Health to Finance link requires both scopes to view
        links_svc = CrossLinksService(session)
        link = await links_svc.create_link(
            CrossDomainLinkCreate(
                profile_id=profile.id,
                source_domain="health",
                source_entity_type="appointment",
                source_entity_id="appt-99",
                target_domain="finance",
                target_entity_type="account",
                target_entity_id="acc-99",
                link_type="visit_to_bill",
            )
        )
        assert link is not None

        # Health-only caller cannot see link
        assert len(await links_svc.list_links(caller_scopes={"health:read"}, entity_id="appt-99")) == 0
        # Finance-only caller cannot see link
        assert len(await links_svc.list_links(caller_scopes={"finance:read"}, entity_id="appt-99")) == 0
        # Dual-grant caller sees link
        assert len(await links_svc.list_links(caller_scopes={"health:read", "finance:read"}, entity_id="appt-99")) == 1

        # 2. Scoped shredding test: Purging finance domain preserves health, education, and household data
        session.sync_session.info["skip_scope_guard"] = True
        with scope_context(scope="*", granted_scopes={"*"}, active_scopes={"*"}):
            n_health = Note(id="n-h1", profile_id=profile.id, scope="health", slug="nh-slug", title="H", content="v", created_at=now, updated_at=now)
            n_finance = Note(id="n-f1", profile_id=profile.id, scope="finance", slug="nf-slug", title="F", content="c", created_at=now, updated_at=now)
            n_education = Note(id="n-e1", profile_id=profile.id, scope="education", slug="ne-slug", title="E", content="s", created_at=now, updated_at=now)
            n_household = Note(id="n-hh1", profile_id=profile.id, scope="household", slug="nhh-slug", title="HH", content="m", created_at=now, updated_at=now)
            session.add_all([n_health, n_finance, n_education, n_household])
            await session.commit()

            shred_svc = ExportDeleteService(session)
            res = await shred_svc.purge_domain(profile_id=profile.id, domain="finance")
            assert res["purged"] is True

            remaining_notes = (
                await session.execute(
                    select(Note).where(Note.profile_id == profile.id),
                    execution_options={"include_all_scopes": True},
                )
            ).scalars().all()
            remaining_scopes = {n.scope for n in remaining_notes}
            assert "finance" not in remaining_scopes
            assert "health" in remaining_scopes
            assert "education" in remaining_scopes
            assert "household" in remaining_scopes

    await engine.dispose()


@pytest.mark.asyncio
async def test_layer_11_audit_events_scope_tagging_and_chain_integrity(tmp_path: Path):
    """Layer 11: Verifies audit events record scope, pack_id, and preserve SHA-256 hash-chain integrity."""
    res = await run_conformance_matrix(
        GenuineHealthPackFixture(),
        GenuineFinancePackFixture(),
        work_dir=tmp_path / "audit_chain",
    )
    assert res.layer_results[IsolationLayer.AUDIT] is True
    assert res.layer_results[IsolationLayer.REDACTION] is True
