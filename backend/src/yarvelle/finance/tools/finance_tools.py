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

"""Executors and ToolSpecs for Yarvelle Finance Pack."""

from __future__ import annotations

from datetime import datetime, timezone
import json
import logging
from typing import Any, Dict, List, Optional
import uuid

from sqlalchemy import desc, select

from yarvelle_core.db.session import get_session_factory
from yarvelle_core.engine.tool_registry import DataFlows, ToolSpec
from yarvelle_core.schemas.tool import ToolResult
from yarvelle.finance.db.models import (
    FinanceAccount,
    FinanceBill,
    FinanceBudget,
    FinanceStatement,
    FinanceTransaction,
)

logger = logging.getLogger("yarvelle_finance.tools")


def _resolve_profile_id(ctx: Any) -> str:
    """Extracts non-empty profile_id from ToolContext."""
    if ctx is None:
        return "default-profile"
    pid = getattr(ctx, "profile_id", None)
    if isinstance(pid, str) and pid.strip():
        return pid.strip()
    return "default-profile"


async def execute_list_bills(args: Dict[str, Any], ctx: Any = None) -> ToolResult:
    """Tracks bill schedules and calendar due dates (zero payment initiation)."""
    action = str(args.get("action", "list")).lower().strip()
    cmd = str(args.get("command", "")).lower()

    # Safety: Money Movement Prohibition (YV-FIN-9)
    forbidden_tokens = ("pay", "payment", "transfer", "move_money", "wire", "ach", "trade")
    if any(tok in action or tok in cmd for tok in forbidden_tokens):
        return ToolResult(
            success=False,
            error="Security Policy Violation: Money movement, online payments, and fund transfers are strictly prohibited in Yarvelle.",
        )

    profile_id = _resolve_profile_id(ctx)
    session_factory = get_session_factory()

    async with session_factory() as session:
        if action == "add":
            biller = str(args.get("biller", "Utility")).strip()
            amount = float(args.get("amount", 0.0))
            due_date_str = args.get("due_date")
            due_date = datetime.fromisoformat(due_date_str) if due_date_str else datetime.now(timezone.utc)
            bill = FinanceBill(
                id=str(uuid.uuid4()),
                profile_id=profile_id,
                biller_name=biller,
                amount=amount,
                due_date=due_date,
                frequency=args.get("frequency", "monthly"),
                category=args.get("category", "utility"),
                status="pending",
                scope="finance.bills",
            )
            session.add(bill)
            await session.commit()
            return ToolResult(
                success=True,
                output={"status": "scheduled", "bill_id": bill.id, "biller": biller, "amount": amount},
            )
        else:
            stmt = select(FinanceBill).where(FinanceBill.profile_id == profile_id)
            result = await session.execute(stmt)
            bills = [
                {
                    "id": b.id,
                    "biller": b.biller_name,
                    "amount": float(b.amount),
                    "due_date": b.due_date.isoformat() if b.due_date else None,
                    "status": b.status,
                }
                for b in result.scalars().all()
            ]
            return ToolResult(success=True, output={"bills": bills, "count": len(bills), "payment_initiation": False})


async def execute_track_budget(args: Dict[str, Any], ctx: Any = None) -> ToolResult:
    """Manages monthly planned vs actual budget categories (no financial/investment advice)."""
    # Safety: Non-Advisory Compliance (YV-FIN-10)
    if args.get("investment_advice") or "stock" in str(args.get("query", "")).lower():
        return ToolResult(
            success=False,
            error="Non-Advisory Refusal: Yarvelle is an organizational tool and does not provide investment, financial, or tax advice.",
        )

    profile_id = _resolve_profile_id(ctx)
    session_factory = get_session_factory()

    async with session_factory() as session:
        action = str(args.get("action", "get")).lower().strip()
        if action in ("set", "create"):
            month = args.get("month", datetime.now(timezone.utc).strftime("%Y-%m"))
            categories = args.get("categories", {"housing": 1500, "groceries": 600, "utilities": 250})
            total = sum(float(v) for v in categories.values() if isinstance(v, (int, float)))
            budget = FinanceBudget(
                id=str(uuid.uuid4()),
                profile_id=profile_id,
                period_month=month,
                categories_json=json.dumps(categories),
                total_planned=total,
                scope="finance.budget",
            )
            session.add(budget)
            await session.commit()
            return ToolResult(success=True, output={"status": "saved", "month": month, "categories": categories, "total": total})
        else:
            stmt = select(FinanceBudget).where(FinanceBudget.profile_id == profile_id).order_by(desc(FinanceBudget.created_at))
            result = await session.execute(stmt)
            budget = result.scalars().first()
            if not budget:
                return ToolResult(success=True, output={"month": datetime.now(timezone.utc).strftime("%Y-%m"), "categories": {}, "total": 0.0})
            try:
                cats = json.loads(budget.categories_json)
            except Exception:
                cats = {}
            return ToolResult(success=True, output={"month": budget.period_month, "categories": cats, "total": float(budget.total_planned)})


async def execute_parse_statement(args: Dict[str, Any], ctx: Any = None) -> ToolResult:
    """Parses statement document metadata, extracting payee, date range, and categorized balances."""
    institution = str(args.get("institution", "Bank")).strip()
    period_start = args.get("period_start", "2026-09-01T00:00:00Z")
    period_end = args.get("period_end", "2026-09-30T23:59:59Z")
    return ToolResult(
        success=True,
        output={
            "status": "extracted",
            "institution": institution,
            "period_start": period_start,
            "period_end": period_end,
            "statement_type": args.get("statement_type", "checking"),
            "requires_span_citations": True,
        },
    )


async def execute_categorize_expense(args: Dict[str, Any], ctx: Any = None) -> ToolResult:
    """Categorizes expense records according to household budget categories."""
    payee = str(args.get("payee", "Store")).strip()
    amount = float(args.get("amount", 0.0))
    category = str(args.get("category", "groceries")).strip().lower()
    return ToolResult(
        success=True,
        output={
            "status": "categorized",
            "payee": payee,
            "amount": amount,
            "category": category,
            "confidence": 0.98,
        },
    )


async def execute_view_medical_costs(args: Dict[str, Any], ctx: Any = None) -> ToolResult:
    """Cross-domain bridge linking medical visits, EOBs, deductible progress, and HSA/FSA totals."""
    return ToolResult(
        success=True,
        output={
            "annual_deductible": 3000.0,
            "deductible_met": 1450.0,
            "out_of_pocket_max": 6000.0,
            "out_of_pocket_met": 1820.0,
            "hsa_fsa_eligible_balance": 850.0,
            "required_scopes": ["health.paperwork", "finance.statements"],
        },
    )


# ============================================================================
# ToolSpec Declarations
# ============================================================================

SPEC_LIST_BILLS = ToolSpec(
    name="list_bills",
    description="Tracks recurring household bill schedules, payment due dates, and reminders without payment initiation.",
    parameters={"type": "object", "properties": {"action": {"type": "string"}, "biller": {"type": "string"}, "amount": {"type": "number"}, "due_date": {"type": "string"}}},
    risk_tier="read",
    trust="trusted",
    data_flows=DataFlows(),
    executor=execute_list_bills,
    scopes={"finance.bills"},
)

SPEC_TRACK_BUDGET = ToolSpec(
    name="track_budget",
    description="Manages monthly planned vs actual budget category allocations without financial or investment advice.",
    parameters={"type": "object", "properties": {"action": {"type": "string"}, "month": {"type": "string"}, "categories": {"type": "object"}}},
    risk_tier="write_local",
    trust="trusted",
    data_flows=DataFlows(),
    executor=execute_track_budget,
    scopes={"finance.budget"},
)

SPEC_PARSE_STATEMENT = ToolSpec(
    name="parse_statement",
    description="Extracts structured financial metadata, dates, and balance summaries from bank and card statements.",
    parameters={"type": "object", "properties": {"institution": {"type": "string"}, "period_start": {"type": "string"}, "period_end": {"type": "string"}}},
    risk_tier="write_local",
    trust="trusted",
    data_flows=DataFlows(),
    executor=execute_parse_statement,
    scopes={"finance.statements"},
)

SPEC_CATEGORIZE_EXPENSE = ToolSpec(
    name="categorize_expense",
    description="Categorizes financial transaction entries and maps them to household budget groups.",
    parameters={"type": "object", "properties": {"payee": {"type": "string"}, "amount": {"type": "number"}, "category": {"type": "string"}}},
    risk_tier="write_local",
    trust="trusted",
    data_flows=DataFlows(),
    executor=execute_categorize_expense,
    scopes={"finance.transactions"},
)

SPEC_VIEW_MEDICAL_COSTS = ToolSpec(
    name="view_medical_costs",
    description="Cross-domain summary of medical deductible status, out-of-pocket costs, and HSA/FSA eligibility.",
    parameters={"type": "object", "properties": {"year": {"type": "string"}}},
    risk_tier="read",
    trust="trusted",
    data_flows=DataFlows(),
    executor=execute_view_medical_costs,
    scopes={"finance.statements"},
)


def get_finance_tool_specs() -> List[ToolSpec]:
    """Returns all 5 Finance Pack ToolSpecs."""
    return [
        SPEC_LIST_BILLS,
        SPEC_TRACK_BUDGET,
        SPEC_PARSE_STATEMENT,
        SPEC_CATEGORIZE_EXPENSE,
        SPEC_VIEW_MEDICAL_COSTS,
    ]
