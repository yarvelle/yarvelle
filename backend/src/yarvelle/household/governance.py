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

"""Family governance service enforcing age bands, RBAC, two-guardian approvals, and delegation."""

from __future__ import annotations

from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession

from yarvelle.household.models import Household


AGE_BANDS = ("child_u13", "teen_13_17", "adult", "older_adult")
ROLES = ("admin", "member", "guest", "dependent")


class FamilyGovernanceService:
    """Enforces profile age bands, role-based access, and two-guardian approvals."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    @staticmethod
    def classify_age_band(dob_str: Optional[str], reference_year: int = 2026) -> str:
        """Classifies date of birth string (YYYY-MM-DD) into canonical age band (YV-FAM-2)."""
        if not dob_str or len(dob_str) < 4:
            return "adult"
        try:
            birth_year = int(dob_str[:4])
            age = reference_year - birth_year
            if age < 13:
                return "child_u13"
            elif 13 <= age <= 17:
                return "teen_13_17"
            elif age >= 65:
                return "older_adult"
            return "adult"
        except (ValueError, IndexError):
            return "adult"

    @staticmethod
    def evaluate_two_guardian_approval(
        household: Household,
        domain: str,
        approved_by: List[str],
    ) -> bool:
        """Evaluates whether domain action satisfies household's two-guardian approval rule (YV-FAM-6)."""
        clean_domain = domain.strip().lower()
        rules = household.two_guardian_rules or {}
        rule = rules.get(clean_domain, "any_guardian")

        if rule == "both_guardians":
            return len(set(approved_by)) >= 2
        return len(set(approved_by)) >= 1

    @staticmethod
    def can_access_domain(
        caller_role: str,
        caller_age_band: str,
        target_domain: str,
        is_private: bool = False,
    ) -> bool:
        """Validates default privacy invariants across age bands and roles (YV-FAM-5 & YV-FAM-7)."""
        clean_dom = target_domain.strip().lower()
        # 1. Teen privacy boundary: teens cannot access adult finance
        if caller_age_band in ("teen", "teen_13_17") and clean_dom == "finance":
            return False

        # 2. Guest role restricted from default financial and medical records unless delegated
        if caller_role == "guest" and clean_dom in ("finance", "health"):
            return False

        # 3. Confidential/private profile protection
        if is_private and caller_role not in ("admin", "member"):
            return False

        return True
