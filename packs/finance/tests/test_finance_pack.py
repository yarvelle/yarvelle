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

"""Comprehensive unit tests for Yarvelle Finance Pack."""

import pytest
from yarvelle_core.pack.validator import validate_pack_spec, validate_pack_yaml_file
import yarvelle_finance
from yarvelle_finance.safety.policy import FinanceSafetyPolicy
from yarvelle_finance.tools import (
    execute_categorize_expense,
    execute_list_bills,
    execute_parse_statement,
    execute_track_budget,
    execute_view_medical_costs,
    get_finance_tool_specs,
)


def test_finance_pack_spec_valid():
    """Verifies that Finance pack passes full Pack API v1 validation."""
    pack = yarvelle_finance.get_pack()
    validate_pack_spec(pack)
    assert pack.id == "finance"
    assert pack.domain == "finance"
    assert pack.risk_tier_max == "T3"
    assert len(pack.tools) == 5
    assert len(pack.routers) == 4
    assert len(pack.scoped_models) == 5
    for model in pack.scoped_models:
        assert model.__tablename__.startswith("finance_")


def test_finance_pack_manifest_valid():
    """Verifies that packs/finance/pack.yaml passes validator."""
    manifest = validate_pack_yaml_file("packs/finance/pack.yaml")
    assert manifest.id == "finance"
    assert manifest.domain == "finance"


class TestFinanceSafetyPolicy:
    """Tests FinanceSafetyPolicy boundaries, hard refusals, and allowed inputs."""

    def setup_method(self):
        self.policy = FinanceSafetyPolicy()

    def test_money_movement_refusal(self):
        verdict = self.policy.check_input("pay electric bill $140 from checking")
        assert verdict.refused is True
        assert verdict.reason == "forbidden_intent:execute_financial_transaction"
        assert verdict.is_hard is True

        verdict_wire = self.policy.check_input("wire funds to landlord account")
        assert verdict_wire.refused is True
        assert verdict_wire.reason == "forbidden_intent:execute_financial_transaction"

    def test_investment_advice_refusal(self):
        verdict = self.policy.check_input("pick top 5 tech stocks to buy")
        assert verdict.refused is True
        assert verdict.reason == "forbidden_intent:investment_advice"
        assert verdict.is_hard is True

        verdict_crypto = self.policy.check_input("is cryptocurrency trading recommended now")
        assert verdict_crypto.refused is True

    def test_tax_advice_refusal(self):
        verdict = self.policy.check_input("file my taxes and claim home office deduction")
        assert verdict.refused is True
        assert verdict.reason == "forbidden_intent:tax_advice"

    def test_credit_decision_refusal(self):
        verdict = self.policy.check_input("approve loan application for auto financing")
        assert verdict.refused is True
        assert verdict.reason == "forbidden_intent:credit_decision"

    def test_allowed_budget_and_filing_inputs(self):
        verdict = self.policy.check_input("calculate monthly grocery budget")
        assert verdict.refused is False

        verdict_bills = self.policy.check_input("show upcoming bills due next week")
        assert verdict_bills.refused is False


@pytest.mark.asyncio
async def test_finance_tools_execution():
    """Tests execution of finance tools and safety refusal at tool level."""
    # Money movement refusal in bill tracking
    res_pay = await execute_list_bills({"action": "pay", "biller": "Water", "amount": 40})
    assert res_pay.success is False
    assert "strictly prohibited" in res_pay.error

    # Categorize expense
    res_cat = await execute_categorize_expense({"payee": "Trader Joe's", "amount": 65.5, "category": "groceries"})
    assert res_cat.success is True
    assert res_cat.output["status"] == "categorized"
    assert res_cat.output["amount"] == 65.5

    # Parse statement
    res_stmt = await execute_parse_statement({"institution": "Chase", "period_start": "2026-10-01", "period_end": "2026-10-31"})
    assert res_stmt.success is True
    assert res_stmt.output["institution"] == "Chase"

    # View medical costs
    res_med = await execute_view_medical_costs({"year": "2026"})
    assert res_med.success is True
    assert res_med.output["annual_deductible"] == 3000.0
