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

"""Finance domain SafetyPolicy enforcing non-advisory boundaries and money movement prohibitions."""

from __future__ import annotations

import re
from typing import Any, Optional, Sequence, Set

from yarvelle_core.engine.safety_policy import (
    EmergencyDirective,
    SafetyContext,
    SafetyPolicy,
    SafetyVerdict,
)

FORBIDDEN_MONEY_PATTERNS = (
    r"\bpay\s+bill\b",
    r"\bpay\s+.*bill\b",
    r"\bpay\s+credit\s+card\b",
    r"\bpay\s+\$?\d+",
    r"\bpayment\s+to\b",
    r"\btransfer\s+money\b",
    r"\bwire\s+funds\b",
    r"\bach\s+transfer\b",
    r"\bsend\s+money\b",
    r"\binitiate\s+payment\b",
    r"\bmove\s+money\b",
    r"\btrade\s+stock\b",
    r"\bexecute\s+transaction\b",
    r"\bpay\b",
    r"\btransfer\b",
    r"\bwire\b",
)

INVESTMENT_ADVICE_PATTERNS = (
    r"\bstock\s+pick\b",
    r"\bwhich\s+stock\b",
    r"\bcryptocurrency\s+trading\b",
    r"\bportfolio\s+allocation\b",
    r"\bbest\s+stock\b",
    r"\bmarket\s+timing\b",
    r"\binvestment\s+recommendation\b",
    r"\bpick\s+(?:top\s+\d+|stocks)\b",
    r"\bstocks?\s+to\s+buy\b",
    r"\bbuy\s+stock\b",
    r"\binvest\s+in\b",
    r"\bcrypto_invest\b",
)

TAX_LEGAL_ADVICE_PATTERNS = (
    r"\bfile\s+my\s+taxes\b",
    r"\blegal\s+advice\b",
    r"\btax\s+deduction\s+claim\b",
    r"\baudit\s+representation\b",
)

CREDIT_DECISION_PATTERNS = (
    r"\bapprove\s+loan\b",
    r"\bcredit\s+decision\b",
    r"\bunderwriting\b",
    r"\bfico\s+score\s+approval\b",
)

FINANCE_FORBIDDEN_INTENTS: Set[str] = {
    "forbidden_intent:execute_financial_transaction",
    "forbidden_intent:investment_advice",
    "forbidden_intent:tax_advice",
    "forbidden_intent:credit_decision",
    "forbidden_intent:move_money",
}

SAFE_FINANCE_REFUSAL_TEMPLATE = """### Financial Safety & Non-Advisory Notice

Yarvelle is an organizational and document management cognitive aid. It strictly does not:
1. **Move money or initiate payments**: All fund transfers, bill payments, and banking transactions must be performed directly through your licensed financial institution.
2. **Provide formal financial, investment, or tax advice**: For investment decisions, asset management, or tax filings, please consult a certified financial planner (CFP) or licensed CPA.
3. **Make credit or loan decisions**: Yarvelle cannot evaluate creditworthiness or underwrite loans.

**How Yarvelle can help instead:**
- Organizing recurring bill due dates on your local household calendar
- Filing receipts and parsing account statements with grounded citations
- Maintaining monthly planned vs. actual budget categories
"""


class FinanceSafetyPolicy:
    """SafetyPolicy implementation for the Yarvelle Finance Pack."""

    def check_input(
        self, text: Optional[str], ctx: Optional[SafetyContext] = None
    ) -> SafetyVerdict:
        if not text:
            return SafetyVerdict(refused=False)

        lower = text.lower()

        # 1. Money Movement Prohibition (YV-FIN-9)
        for pat in FORBIDDEN_MONEY_PATTERNS:
            if re.search(pat, lower):
                return SafetyVerdict(
                    refused=True,
                    reason="forbidden_intent:execute_financial_transaction",
                    safe_response=SAFE_FINANCE_REFUSAL_TEMPLATE,
                    category="money_movement",
                    is_hard=True,
                )

        # 2. Investment Advice Prohibition (YV-FIN-10)
        for pat in INVESTMENT_ADVICE_PATTERNS:
            if re.search(pat, lower):
                return SafetyVerdict(
                    refused=True,
                    reason="forbidden_intent:investment_advice",
                    safe_response=SAFE_FINANCE_REFUSAL_TEMPLATE,
                    category="investment_advice",
                    is_hard=True,
                )

        # 3. Tax / Legal Advice Prohibition
        for pat in TAX_LEGAL_ADVICE_PATTERNS:
            if re.search(pat, lower):
                return SafetyVerdict(
                    refused=True,
                    reason="forbidden_intent:tax_advice",
                    safe_response=SAFE_FINANCE_REFUSAL_TEMPLATE,
                    category="tax_advice",
                    is_hard=False,
                )

        # 4. Credit Decisioning Prohibition
        for pat in CREDIT_DECISION_PATTERNS:
            if re.search(pat, lower):
                return SafetyVerdict(
                    refused=True,
                    reason="forbidden_intent:credit_decision",
                    safe_response=SAFE_FINANCE_REFUSAL_TEMPLATE,
                    category="credit_decision",
                    is_hard=True,
                )

        return SafetyVerdict(refused=False)

    def check_output(
        self, text: Optional[str], ctx: Optional[SafetyContext] = None
    ) -> SafetyVerdict:
        return self.check_input(text, ctx)

    def check_emergency(self, text: Optional[str]) -> Optional[EmergencyDirective]:
        # Finance pack defers crisis emergencies to core baseline
        return None

    def get_preamble(self, agent: Any = None, skills: Sequence[Any] = ()) -> str:
        return (
            "You are a personal financial organizer. You help catalog bills, parse receipts, "
            "and track budgets. You NEVER give investment advice, pick stocks, give formal tax advice, "
            "or attempt to move money or initiate bank transactions."
        )

    def get_refusal_template(self, reason: Optional[str] = None) -> str:
        return SAFE_FINANCE_REFUSAL_TEMPLATE

    def is_hard_refusal_reason(self, reason: Optional[str]) -> bool:
        return reason in {
            "forbidden_intent:execute_financial_transaction",
            "forbidden_intent:investment_advice",
            "forbidden_intent:move_money",
        }

    def get_forbidden_intents(self) -> Set[str]:
        return set(FINANCE_FORBIDDEN_INTENTS)
