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

"""Kids domain SafetyPolicy enforcing COPPA, child protection, anti-ranking, and academic integrity."""

from __future__ import annotations

import re
from typing import Any, Optional, Sequence, Set

from yarvelle_core.engine.safety_policy import (
    EmergencyDirective,
    SafetyContext,
    SafetyPolicy,
    SafetyVerdict,
)

ACADEMIC_DISHONESTY_PATTERNS = (
    r"\bwrite\s+(?:.*)?essay\b",
    r"\bwrite\s+.*(?:essay|paper|assignment)\b",
    r"\bdo\s+my\s+homework\b",
    r"\bsolve\s+my\s+test\b",
    r"\bsolve\s+.*(?:test|exam|quiz|homework|problem)\b",
    r"\bcomplete\s+my\s+assignment\b",
    r"\bwrite\s+the\s+answer\s+for\s+my\s+graded\b",
    r"\bfinish\s+my\s+homework\s+for\s+me\b",
    r"\bwrite\s+essay\b",
)

CHILD_RANKING_PATTERNS = (
    r"\bpercentile\s+rank\b",
    r"\biq\s+score\b",
    r"\brank\s+my\s+child\b",
    r"\brank\s+(?:my\s+)?(?:\w+\s+)?(?:kids|children|sons|daughters|students)\b",
    r"\bis\s+my\s+(?:kid|child|son|daughter)\s+smarter\s+than\b",
    r"\bpeer[s]?\s+percentile\b",
    r"\bsmarter\s+than\s+.*peers?\b",
    r"\bcompare\s+to\s+other\s+.*graders\b",
    r"\bchild\s+percentile\b",
    r"\bbelow\s+average\s+intelligence\b",
    r"\breading\s+percentile\b",
)

LEARNING_DISABILITY_DIAGNOSTIC_PATTERNS = (
    r"\bdiagnose\s+adhd\b",
    r"\bdiagnose\s+.*(?:dyslexia|adhd|autism|add)\b",
    r"\bdiagnose\s+my\s+(?:daughter|son|child|kid)\b",
    r"\bdoes\s+.*have\s+dyslexia\b",
    r"\bautism\s+diagnosis\b",
    r"\bdiagnose\s+my\s+child\b",
    r"\beval\s+for\s+learning\s+disability\b",
    r"\bdoes\s+.*have\s+adhd\b",
)

COVERT_MONITORING_PATTERNS = (
    r"\bspy\s+on\s+my\s+kid\b",
    r"\bsecretly\s+track\b",
    r"\bcovert\s+monitoring\b",
    r"\bhidden\s+surveillance\b",
    r"\blisten\s+in\s+on\s+my\s+teen\b",
    r"\btrack\s+without\s+them\s+knowing\b",
    r"\bsecretly\s+spy\b",
    r"\b(?:track|spy\s+on|monitor)\s+.*(?:secretly|covertly)\b",
    r"\b(?:secretly|covertly)\s+.*(?:track|spy|monitor)\b",
)

AUTO_SUBMIT_FORM_PATTERNS = (
    r"\bauto\s+submit\s+school\s+form\b",
    r"\bsubmit\s+permission\s+slip\s+online\s+automatically\b",
    r"\bsign\s+and\s+send\s+without\s+reviewing\b",
)

KIDS_FORBIDDEN_INTENTS: Set[str] = {
    "forbidden_intent:rank_child",
    "forbidden_intent:diagnose_learning_disability",
    "forbidden_intent:complete_graded_work",
    "forbidden_intent:contact_minor",
    "forbidden_intent:covert_monitoring",
    "forbidden_intent:auto_submit_school_form",
    "coppa_local_egress_required",
}

SAFE_KIDS_REFUSAL_TEMPLATE = """### Child Safety & Academic Integrity Notice

Yarvelle is committed to child data privacy, developmental safety, and ethical learning:
1. **Academic Integrity**: Yarvelle helps explain concepts, create practice quizzes, and brainstorm outlines, but will **never do homework or write graded assignments** on a student's behalf.
2. **Anti-Ranking & Non-Diagnostic**: We do not score children comparatively, rank by percentile, or diagnose learning disabilities (ADHD, dyslexia, ASD). For developmental assessments, consult a licensed educational psychologist or pediatrician.
3. **No Covert Surveillance**: Yarvelle strictly prohibits covert tracking or hidden monitoring of minors.
4. **Drafts Only for School Forms**: School permission slips and camp forms are generated as drafts for human guardian review and signature, never automatically submitted.
5. **COPPA / Minor Privacy**: For children under 13, all data is processed strictly locally without external cloud telemetry unless explicit per-chat guardian opt-in is granted.
"""


class KidsSafetyPolicy:
    """SafetyPolicy implementation for the Yarvelle Kids Pack."""

    def check_input(
        self, text: Optional[str], ctx: Optional[SafetyContext] = None
    ) -> SafetyVerdict:
        if not text:
            return SafetyVerdict(refused=False)

        lower = text.lower()

        # 0. COPPA Under-13 Cloud Egress Enforcement (YV-EDU-7)
        if ctx is not None:
            metadata = getattr(ctx, "metadata", None)
            if metadata is None:
                metadata = {}
                try:
                    ctx.metadata = metadata
                except Exception:
                    pass
            age_band = metadata.get("age_band") or getattr(ctx, "age_band", None)
            if age_band in ("child_u13", "child"):
                metadata["local_execution_enforced"] = True
                if metadata.get("is_cloud_model", False) and not metadata.get("cloud_guardian_opt_in", False):
                    return SafetyVerdict(
                        refused=True,
                        reason="coppa_local_egress_required",
                        safe_response="COPPA under-13 requires local-first processing unless guardian opt-in is granted.",
                        category="coppa_local_egress",
                        is_hard=True,
                    )

        # 1. Academic Dishonesty (YV-EDU-2)
        for pat in ACADEMIC_DISHONESTY_PATTERNS:
            if re.search(pat, lower):
                return SafetyVerdict(
                    refused=True,
                    reason="forbidden_intent:complete_graded_work",
                    safe_response=SAFE_KIDS_REFUSAL_TEMPLATE,
                    category="academic_integrity",
                    is_hard=True,
                )

        # 2. Child Ranking & Scoring (YV-EDU-3)
        for pat in CHILD_RANKING_PATTERNS:
            if re.search(pat, lower):
                return SafetyVerdict(
                    refused=True,
                    reason="forbidden_intent:rank_child",
                    safe_response=SAFE_KIDS_REFUSAL_TEMPLATE,
                    category="anti_ranking",
                    is_hard=True,
                )

        # 3. Learning Disability Diagnosis (YV-EDU-4)
        for pat in LEARNING_DISABILITY_DIAGNOSTIC_PATTERNS:
            if re.search(pat, lower):
                return SafetyVerdict(
                    refused=True,
                    reason="forbidden_intent:diagnose_learning_disability",
                    safe_response=SAFE_KIDS_REFUSAL_TEMPLATE,
                    category="diagnostic_refusal",
                    is_hard=True,
                )

        # 4. Covert Monitoring (YV-SAFE-2)
        for pat in COVERT_MONITORING_PATTERNS:
            if re.search(pat, lower):
                return SafetyVerdict(
                    refused=True,
                    reason="forbidden_intent:covert_monitoring",
                    safe_response=SAFE_KIDS_REFUSAL_TEMPLATE,
                    category="child_protection",
                    is_hard=True,
                )

        # 5. Automated Form Submission (YV-EDU-5)
        for pat in AUTO_SUBMIT_FORM_PATTERNS:
            if re.search(pat, lower):
                return SafetyVerdict(
                    refused=True,
                    reason="forbidden_intent:auto_submit_school_form",
                    safe_response=SAFE_KIDS_REFUSAL_TEMPLATE,
                    category="drafts_only",
                    is_hard=False,
                )

        return SafetyVerdict(refused=False)

    def check_output(
        self, text: Optional[str], ctx: Optional[SafetyContext] = None
    ) -> SafetyVerdict:
        return self.check_input(text, ctx)

    def check_emergency(self, text: Optional[str]) -> Optional[EmergencyDirective]:
        # Defers to core emergency / red flags
        return None

    def get_preamble(self, agent: Any = None, skills: Sequence[Any] = ()) -> str:
        return (
            "You are a supportive, ethical learning and family activities companion for kids and guardians. "
            "You uphold academic integrity (explaining concepts and giving practice questions, never doing "
            "homework for students). You never rank children by percentile, diagnose learning disabilities, "
            "or support covert surveillance. All forms are prefilled drafts only."
        )

    def get_refusal_template(self, reason: Optional[str] = None) -> str:
        return SAFE_KIDS_REFUSAL_TEMPLATE

    def is_hard_refusal_reason(self, reason: Optional[str]) -> bool:
        return reason in {
            "forbidden_intent:rank_child",
            "forbidden_intent:complete_graded_work",
            "forbidden_intent:covert_monitoring",
            "forbidden_intent:contact_minor",
            "forbidden_intent:diagnose_learning_disability",
            "coppa_local_egress_required",
        }

    def get_forbidden_intents(self) -> Set[str]:
        return set(KIDS_FORBIDDEN_INTENTS)
