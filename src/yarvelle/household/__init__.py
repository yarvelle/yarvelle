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

"""Yarvelle Household & Cross-Domain Layer package."""

from yarvelle.household.conflicts import ConflictDetector
from yarvelle.household.cross_links import CrossLinksService
from yarvelle.household.governance import FamilyGovernanceService
from yarvelle.household.models import CrossDomainLink, Household, HouseholdMember
from yarvelle.household.router import router
from yarvelle.household.shred import ExportDeleteService
from yarvelle.household.timeline import TimelineService, extract_caller_scopes, has_domain_read_access

__all__ = [
    "Household",
    "HouseholdMember",
    "CrossDomainLink",
    "FamilyGovernanceService",
    "TimelineService",
    "CrossLinksService",
    "ConflictDetector",
    "ExportDeleteService",
    "extract_caller_scopes",
    "has_domain_read_access",
    "router",
]
