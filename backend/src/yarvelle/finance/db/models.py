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

"""SQLAlchemy declarative models for Yarvelle Finance Pack."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional
import uuid

from sqlalchemy import DateTime, ForeignKey, Index, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from yarvelle_core.db.base import Base
from yarvelle_core.scope.mixin import ScopedMixin


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class FinanceAccount(Base, ScopedMixin):
    """Connected or manual financial account metadata."""

    __tablename__ = "finance_accounts"
    __table_args__ = {"extend_existing": True}

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    profile_id: Mapped[str] = mapped_column(String(36), ForeignKey("profiles.id", ondelete="CASCADE"), index=True, nullable=False)
    account_name: Mapped[str] = mapped_column(String(128), nullable=False)
    institution_name: Mapped[str] = mapped_column(String(128), nullable=False)
    account_type: Mapped[str] = mapped_column(String(32), nullable=False, default="checking")
    masked_number: Mapped[str] = mapped_column(String(16), nullable=False)
    current_balance: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, default=0.0)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="USD")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)


class FinanceTransaction(Base, ScopedMixin):
    """Parsed and categorized financial transaction entry."""

    __tablename__ = "finance_transactions"
    __table_args__ = {"extend_existing": True}

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    profile_id: Mapped[str] = mapped_column(String(36), ForeignKey("profiles.id", ondelete="CASCADE"), index=True, nullable=False)
    account_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("finance_accounts.id", ondelete="SET NULL"), nullable=True)
    amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="USD")
    payee: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[str] = mapped_column(String(64), nullable=False, default="uncategorized")
    transaction_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="posted")
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)


class FinanceBill(Base, ScopedMixin):
    """Recurring household bill and payment due reminder."""

    __tablename__ = "finance_bills"
    __table_args__ = {"extend_existing": True}

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    profile_id: Mapped[str] = mapped_column(String(36), ForeignKey("profiles.id", ondelete="CASCADE"), index=True, nullable=False)
    biller_name: Mapped[str] = mapped_column(String(255), nullable=False)
    amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    due_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    frequency: Mapped[str] = mapped_column(String(32), nullable=False, default="monthly")
    category: Mapped[str] = mapped_column(String(64), nullable=False, default="utility")
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="pending")
    reminder_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)


class FinanceBudget(Base, ScopedMixin):
    """Monthly planned vs actual budget allocations."""

    __tablename__ = "finance_budgets"
    __table_args__ = {"extend_existing": True}

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    profile_id: Mapped[str] = mapped_column(String(36), ForeignKey("profiles.id", ondelete="CASCADE"), index=True, nullable=False)
    period_month: Mapped[str] = mapped_column(String(7), nullable=False, index=True)  # e.g. "2026-10"
    categories_json: Mapped[str] = mapped_column(Text, nullable=False, default="{}")
    total_planned: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)


class FinanceStatement(Base, ScopedMixin):
    """Uploaded and parsed bank/credit card statement document."""

    __tablename__ = "finance_statements"
    __table_args__ = {"extend_existing": True}

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    profile_id: Mapped[str] = mapped_column(String(36), ForeignKey("profiles.id", ondelete="CASCADE"), index=True, nullable=False)
    attachment_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("attachments.id", ondelete="SET NULL"), nullable=True)
    institution_name: Mapped[str] = mapped_column(String(128), nullable=False)
    period_start: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    period_end: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    extracted_metadata_json: Mapped[str] = mapped_column(Text, nullable=False, default="{}")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)
