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

"""Router contributions for Yarvelle Finance Pack."""

from __future__ import annotations

from typing import List

from yarvelle_core.pack.spec import RouterContribution
from yarvelle.finance.routers.accounts import router as accounts_router
from yarvelle.finance.routers.bills import router as bills_router
from yarvelle.finance.routers.budget import router as budget_router
from yarvelle.finance.routers.transactions import router as transactions_router


def get_finance_router_contributions() -> List[RouterContribution]:
    """Returns the 4 Finance Pack router contributions."""
    return [
        RouterContribution(
            accounts_router,
            prefix="/api/v1/finance/accounts",
            pack_id="finance",
            scope="finance.accounts",
            level="read",
        ),
        RouterContribution(
            transactions_router,
            prefix="/api/v1/finance/transactions",
            pack_id="finance",
            scope="finance.transactions",
            level="read",
        ),
        RouterContribution(
            bills_router,
            prefix="/api/v1/finance/bills",
            pack_id="finance",
            scope="finance.bills",
            level="read",
        ),
        RouterContribution(
            budget_router,
            prefix="/api/v1/finance/budget",
            pack_id="finance",
            scope="finance.budget",
            level="read",
        ),
    ]


__all__ = [
    "accounts_router",
    "bills_router",
    "budget_router",
    "transactions_router",
    "get_finance_router_contributions",
]
