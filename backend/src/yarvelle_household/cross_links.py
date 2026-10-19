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

"""Cross-Domain Typed Links Domain Service (YV-X-2)."""

from __future__ import annotations

import uuid
from typing import Dict, List, Optional, Set
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from yarvelle_household.db.models import CrossDomainLink, Household, HouseholdMember
from yarvelle_household.schemas import CrossDomainLinkCreate, CrossDomainLinkResponse
from yarvelle_household.timeline import has_domain_read_access


VALID_LINK_TYPES = frozenset({
    "visit_to_bill",
    "school_form_to_cost",
    "iep_to_neuro_checkup",
    "form_to_activity",
    "receipt_to_hsa",
    "maintenance_to_warranty",
    "event_to_fee",
    "reconciled_with",
})


class CrossLinksService:
    """Manages creation, query, and deletion of typed cross-domain links with dual-read scoping."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_household_toggles_for_profile(self, profile_id: str) -> Dict[str, bool]:
        """Loads domain toggles for profile's household."""
        try:
            m_stmt = select(HouseholdMember.household_id).where(HouseholdMember.profile_id == profile_id)
            hh_id = (await self.db.execute(m_stmt)).scalar_one_or_none()
            if not hh_id:
                return {"health": True, "finance": True, "education": True, "household": True}

            h_stmt = select(Household).where(Household.id == hh_id)
            hh = (await self.db.execute(h_stmt)).scalar_one_or_none()
            if not hh or not hh.domain_toggles:
                return {"health": True, "finance": True, "education": True, "household": True}
            return hh.domain_toggles
        except Exception:
            return {"health": True, "finance": True, "education": True, "household": True}

    async def create_link(self, data: CrossDomainLinkCreate) -> CrossDomainLinkResponse:
        """Creates a new typed cross-domain link."""
        link_id = str(uuid.uuid4())
        link = CrossDomainLink(
            id=link_id,
            source_domain=data.source_domain.strip().lower(),
            source_entity_type=data.source_entity_type.strip(),
            source_entity_id=data.source_entity_id.strip(),
            target_domain=data.target_domain.strip().lower(),
            target_entity_type=data.target_entity_type.strip(),
            target_entity_id=data.target_entity_id.strip(),
            link_type=data.link_type.strip(),
            profile_id=data.profile_id.strip(),
            description=data.description,
        )
        self.db.add(link)
        await self.db.commit()
        await self.db.refresh(link)
        return CrossDomainLinkResponse.model_validate(link)

    async def list_links(
        self,
        caller_scopes: Set[str],
        profile_id: Optional[str] = None,
        entity_id: Optional[str] = None,
        domain: Optional[str] = None,
        link_type: Optional[str] = None,
    ) -> List[CrossDomainLinkResponse]:
        """Retrieves cross-domain links enforcing the Dual-Read Scope Invariant."""
        stmt = select(CrossDomainLink)
        if profile_id:
            stmt = stmt.where(CrossDomainLink.profile_id == profile_id)
        if entity_id:
            stmt = stmt.where(
                or_(
                    CrossDomainLink.source_entity_id == entity_id,
                    CrossDomainLink.target_entity_id == entity_id,
                )
            )
        if domain:
            d_clean = domain.strip().lower()
            stmt = stmt.where(
                or_(
                    CrossDomainLink.source_domain == d_clean,
                    CrossDomainLink.target_domain == d_clean,
                )
            )
        if link_type:
            stmt = stmt.where(CrossDomainLink.link_type == link_type)

        raw_links = (await self.db.execute(stmt)).scalars().all()
        visible_links: List[CrossDomainLinkResponse] = []
        profile_toggles: Dict[str, Dict[str, bool]] = {}

        for lnk in raw_links:
            src_d = lnk.source_domain.strip().lower()
            tgt_d = lnk.target_domain.strip().lower()

            # 1. Dual-Read Scope Invariant: caller must possess read scope on BOTH domains
            if not has_domain_read_access(caller_scopes, src_d) or not has_domain_read_access(caller_scopes, tgt_d):
                continue

            # 2. Household Domain Toggle: neither domain can be disabled
            if lnk.profile_id not in profile_toggles:
                profile_toggles[lnk.profile_id] = await self.get_household_toggles_for_profile(lnk.profile_id)
            toggles = profile_toggles[lnk.profile_id]
            if not toggles.get(src_d, True) or not toggles.get(tgt_d, True):
                continue

            visible_links.append(CrossDomainLinkResponse.model_validate(lnk))

        return visible_links

    async def delete_link(self, link_id: str) -> bool:
        """Deletes a cross-domain link by ID (idempotent: True on first delete, False if already deleted)."""
        stmt = select(CrossDomainLink).where(CrossDomainLink.id == link_id)
        link = (await self.db.execute(stmt)).scalar_one_or_none()
        if not link:
            return False
        await self.db.delete(link)
        await self.db.commit()
        return True
