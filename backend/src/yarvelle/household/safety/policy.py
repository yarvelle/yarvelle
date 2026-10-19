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

"""Household domain SafetyPolicy enforcing family privacy, transparency, and anti-covert monitoring."""

from __future__ import annotations

import re
from typing import Any, Optional, Sequence, Set

from yarvelle_core.engine.safety_policy import (
    EmergencyDirective,
    SafetyContext,
    SafetyPolicy,
    SafetyVerdict,
)

COVERT_MONITORING_PATTERNS = (
    r"\bspy\s+on\s+my\s+(?:kid|child|teen|spouse|husband|wife|partner|family)\b",
    r"\bsecretly\s+track\b",
    r"\bcovert\s+monitoring\b",
    r"\bhidden\s+surveillance\b",
    r"\blisten\s+in\s+on\s+my\s+teen\b",
    r"\btrack\s+without\s+them\s+knowing\b",
    r"\bsecretly\s+spy\b",
    r"\b(?:track|spy\s+on|monitor)\s+.*(?:secretly|covertly)\b",
    r"\b(?:secretly|covertly)\s+.*(?:track|spy|monitor)\b",
)

HOUSEHOLD_FORBIDDEN_INTENTS: Set[str] = {
    "forbidden_intent:covert_monitoring",
}

SAFE_HOUSEHOLD_REFUSAL_TEMPLATE = """### Household Privacy & Safety Notice

Yarvelle is committed to family trust, privacy, and consensual coordination:
1. **No Covert Surveillance**: Yarvelle strictly prohibits covert tracking, hidden surveillance, or unconsented monitoring of family members, spouses, or teenagers. All schedules, chores, and locations must be shared transparently with member consent.
2. **Transparent Family Governance**: Shared routines and permissions are governed transparently through guardian and member agreements.
"""


class HouseholdSafetyPolicy:
    """SafetyPolicy implementation for the Yarvelle Household Pack."""

    def check_input(
        self, text: Optional[str], ctx: Optional[SafetyContext] = None
    ) -> SafetyVerdict:
        if not text:
            return SafetyVerdict(refused=False)

        lower = text.lower()

        # Covert Monitoring (YV-SAFE-2)
        for pat in COVERT_MONITORING_PATTERNS:
            if re.search(pat, lower):
                return SafetyVerdict(
                    refused=True,
                    reason="forbidden_intent:covert_monitoring",
                    safe_response=SAFE_HOUSEHOLD_REFUSAL_TEMPLATE,
                    category="family_privacy",
                    is_hard=True,
                )

        return SafetyVerdict(refused=False)

    def check_output(
        self, text: Optional[str], ctx: Optional[SafetyContext] = None
    ) -> SafetyVerdict:
        return self.check_input(text, ctx)

    def check_emergency(self, text: Optional[str]) -> Optional[EmergencyDirective]:
        return None

    def get_preamble(self, agent: Any = None, skills: Sequence[Any] = ()) -> str:
        return (
            "You are a collaborative, trustworthy household steward helping family members organize "
            "routines, chores, meals, and activities transparently. You strictly refuse covert tracking "
            "or unconsented surveillance of any family member."
        )

    def get_refusal_template(self, reason: Optional[str] = None) -> str:
        return SAFE_HOUSEHOLD_REFUSAL_TEMPLATE

    def is_hard_refusal_reason(self, reason: Optional[str]) -> bool:
        return reason == "forbidden_intent:covert_monitoring"

    def get_forbidden_intents(self) -> Set[str]:
        return set(HOUSEHOLD_FORBIDDEN_INTENTS)
