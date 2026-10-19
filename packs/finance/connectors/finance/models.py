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

from __future__ import annotations
from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field

class AccountSummary(BaseModel):
    account_id: str = Field(..., description="Unique account identifier")
    institution_name: str = Field(..., description="Financial institution display name")
    account_type: Literal["checking", "savings", "credit_card", "loan", "investment_cash", "other"] = "checking"
    mask: str = Field(..., description="Last 4 digits of account number (masked)")
    current_balance: float = Field(..., description="Current balance")
    available_balance: Optional[float] = Field(None, description="Available balance")
    currency: str = Field("USD", description="ISO 4217 currency code")

class TransactionRecord(BaseModel):
    id: str = Field(..., description="Unique transaction identifier")
    account_id: str = Field(..., description="Associated account identifier")
    date: str = Field(..., description="Transaction date (YYYY-MM-DD)")
    payee: str = Field(..., description="Payee / Merchant name")
    amount: float = Field(..., description="Transaction amount (positive for expense/debit, negative for credit/deposit)")
    category: str = Field("Uncategorized", description="Expense or income category")
    pending: bool = Field(False, description="Whether transaction is pending settlement")

class StatementMetadata(BaseModel):
    statement_id: str = Field(..., description="Unique statement identifier")
    account_id: str = Field(..., description="Associated account identifier")
    period_start: str = Field(..., description="Period start date (YYYY-MM-DD)")
    period_end: str = Field(..., description="Period end date (YYYY-MM-DD)")
    file_name: str = Field(..., description="Statement document filename")
    content_hash: str = Field(..., description="SHA-256 hash of statement content")
