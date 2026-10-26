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
    __table_args__ = {
        "extend_existing": True,
        "comment": "Financial accounts (checking, savings, credit, investment, loan) scoped to a profile.",
    }

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        doc="Unique financial account UUID v4 identifier.",
        comment="Unique financial account UUID v4 identifier.",
    )
    profile_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("profiles.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
        doc="Owning profile UUID v4 identifier.",
        comment="Owning profile UUID v4 identifier.",
    )
    account_name: Mapped[str] = mapped_column(
        String(128),
        nullable=False,
        doc="User-facing account name (e.g. 'Primary Checking', 'College 529').",
        comment="User-facing account name (e.g. 'Primary Checking', 'College 529').",
    )
    institution_name: Mapped[str] = mapped_column(
        String(128),
        nullable=False,
        doc="Financial institution or bank display name.",
        comment="Financial institution or bank display name.",
    )
    account_type: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        default="checking",
        doc="Account classification: checking, savings, credit, investment, loan.",
        comment="Account classification: checking, savings, credit, investment, loan.",
    )
    masked_number: Mapped[str] = mapped_column(
        String(16),
        nullable=False,
        doc="Masked last-4 account digits (e.g. '****4210').",
        comment="Masked last-4 account digits (e.g. '****4210').",
    )
    current_balance: Mapped[float] = mapped_column(
        Numeric(12, 2),
        nullable=False,
        default=0.0,
        doc="Current balance in account currency (Numeric 12,2).",
        comment="Current balance in account currency (Numeric 12,2).",
    )
    currency: Mapped[str] = mapped_column(
        String(3),
        nullable=False,
        default="USD",
        doc="ISO 4217 3-letter currency code (e.g. 'USD', 'EUR', 'INR').",
        comment="ISO 4217 3-letter currency code (e.g. 'USD', 'EUR', 'INR').",
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        nullable=False,
        doc="Creation timestamp (UTC).",
        comment="Creation timestamp (UTC).",
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        onupdate=utc_now,
        nullable=False,
        doc="Last modification timestamp (UTC).",
        comment="Last modification timestamp (UTC).",
    )


class FinanceTransaction(Base, ScopedMixin):
    """Parsed and categorized financial transaction entry."""

    __tablename__ = "finance_transactions"
    __table_args__ = (
        Index(
            "ix_finance_transactions_profile_date",
            "profile_id",
            "transaction_date",
            info={"comment": "Composite index accelerating chronological transaction queries per profile."},
        ),
        Index(
            "ix_finance_transactions_category",
            "category",
            info={"comment": "Index accelerating spending aggregation and filtering by transaction category."},
        ),
        {
            "extend_existing": True,
            "comment": "Parsed and categorized financial transactions linked to a profile and optional account.",
        },
    )

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        doc="Unique transaction UUID v4 identifier.",
        comment="Unique transaction UUID v4 identifier.",
    )
    profile_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("profiles.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
        doc="Owning profile UUID v4 identifier.",
        comment="Owning profile UUID v4 identifier.",
    )
    account_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("finance_accounts.id", ondelete="SET NULL"),
        nullable=True,
        doc="Optional parent financial account UUID.",
        comment="Optional parent financial account UUID.",
    )
    amount: Mapped[float] = mapped_column(
        Numeric(12, 2),
        nullable=False,
        doc="Transaction monetary amount (Numeric 12,2).",
        comment="Transaction monetary amount (Numeric 12,2).",
    )
    currency: Mapped[str] = mapped_column(
        String(3),
        nullable=False,
        default="USD",
        doc="ISO 4217 3-letter currency code (e.g. 'USD').",
        comment="ISO 4217 3-letter currency code (e.g. 'USD').",
    )
    payee: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        doc="Merchant, vendor, or counterparty payee name.",
        comment="Merchant, vendor, or counterparty payee name.",
    )
    category: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        default="uncategorized",
        doc="Spending or income category (e.g. groceries, housing, utilities, uncategorized).",
        comment="Spending or income category (e.g. groceries, housing, utilities, uncategorized).",
    )
    transaction_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        doc="Timestamp when the transaction occurred or posted (UTC).",
        comment="Timestamp when the transaction occurred or posted (UTC).",
    )
    status: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        default="posted",
        doc="Settlement status: pending, posted, cleared, disputed.",
        comment="Settlement status: pending, posted, cleared, disputed.",
    )
    notes: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        doc="Optional user or agent annotations on the transaction.",
        comment="Optional user or agent annotations on the transaction.",
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        nullable=False,
        doc="Record creation timestamp (UTC).",
        comment="Record creation timestamp (UTC).",
    )


class FinanceBill(Base, ScopedMixin):
    """Recurring household bill and payment due reminder."""

    __tablename__ = "finance_bills"
    __table_args__ = (
        Index(
            "ix_finance_bills_profile_status_due",
            "profile_id",
            "status",
            "due_date",
            info={"comment": "Composite index accelerating upcoming bill queries by profile, status, and due_date."},
        ),
        {
            "extend_existing": True,
            "comment": "Recurring and one-time bills tracking biller, amount, due date, frequency, and payment status.",
        },
    )

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        doc="Unique bill UUID v4 identifier.",
        comment="Unique bill UUID v4 identifier.",
    )
    profile_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("profiles.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
        doc="Owning profile UUID v4 identifier.",
        comment="Owning profile UUID v4 identifier.",
    )
    biller_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        doc="Name of the utility, service provider, or creditor.",
        comment="Name of the utility, service provider, or creditor.",
    )
    amount: Mapped[float] = mapped_column(
        Numeric(12, 2),
        nullable=False,
        doc="Bill amount due (Numeric 12,2).",
        comment="Bill amount due (Numeric 12,2).",
    )
    due_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        doc="Payment due timestamp (UTC).",
        comment="Payment due timestamp (UTC).",
    )
    frequency: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        default="monthly",
        doc="Billing recurrence frequency: one_time, weekly, monthly, quarterly, annual.",
        comment="Billing recurrence frequency: one_time, weekly, monthly, quarterly, annual.",
    )
    category: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        default="utility",
        doc="Bill category: utility, housing, subscription, insurance, tuition, general.",
        comment="Bill category: utility, housing, subscription, insurance, tuition, general.",
    )
    status: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        default="pending",
        doc="Payment status: pending, paid, overdue, scheduled, cancelled.",
        comment="Payment status: pending, paid, overdue, scheduled, cancelled.",
    )
    reminder_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        nullable=True,
        doc="Optional linked reminder UUID in reminders table.",
        comment="Optional linked reminder UUID in reminders table.",
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        nullable=False,
        doc="Creation timestamp (UTC).",
        comment="Creation timestamp (UTC).",
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        onupdate=utc_now,
        nullable=False,
        doc="Last modification timestamp (UTC).",
        comment="Last modification timestamp (UTC).",
    )


class FinanceBudget(Base, ScopedMixin):
    """Monthly planned vs actual budget allocations."""

    __tablename__ = "finance_budgets"
    __table_args__ = {
        "extend_existing": True,
        "comment": "Monthly planned budget allocations by category and total planned spend per profile.",
    }

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        doc="Unique budget record UUID v4 identifier.",
        comment="Unique budget record UUID v4 identifier.",
    )
    profile_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("profiles.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
        doc="Owning profile UUID v4 identifier.",
        comment="Owning profile UUID v4 identifier.",
    )
    period_month: Mapped[str] = mapped_column(
        String(7),
        nullable=False,
        index=True,
        doc="Budget period month formatted as YYYY-MM (e.g. '2026-10').",
        comment="Budget period month formatted as YYYY-MM (e.g. '2026-10').",
    )
    categories_json: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        default="{}",
        doc="Serialized JSON mapping of category slug to planned budget amount.",
        comment="Serialized JSON mapping of category slug to planned budget amount.",
    )
    total_planned: Mapped[float] = mapped_column(
        Numeric(12, 2),
        nullable=False,
        default=0.0,
        doc="Total planned monthly budget across all categories (Numeric 12,2).",
        comment="Total planned monthly budget across all categories (Numeric 12,2).",
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        nullable=False,
        doc="Creation timestamp (UTC).",
        comment="Creation timestamp (UTC).",
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        onupdate=utc_now,
        nullable=False,
        doc="Last modification timestamp (UTC).",
        comment="Last modification timestamp (UTC).",
    )


class FinanceStatement(Base, ScopedMixin):
    """Uploaded and parsed bank/credit card statement document."""

    __tablename__ = "finance_statements"
    __table_args__ = {
        "extend_existing": True,
        "comment": "Parsed financial statement metadata linking uploaded statement attachments to statement periods.",
    }

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        doc="Unique financial statement UUID v4 identifier.",
        comment="Unique financial statement UUID v4 identifier.",
    )
    profile_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("profiles.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
        doc="Owning profile UUID v4 identifier.",
        comment="Owning profile UUID v4 identifier.",
    )
    attachment_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("attachments.id", ondelete="SET NULL"),
        nullable=True,
        doc="Optional source attachment UUID in attachments table.",
        comment="Optional source attachment UUID in attachments table.",
    )
    institution_name: Mapped[str] = mapped_column(
        String(128),
        nullable=False,
        doc="Issuing bank or financial institution name.",
        comment="Issuing bank or financial institution name.",
    )
    period_start: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        doc="Statement billing period start timestamp (UTC).",
        comment="Statement billing period start timestamp (UTC).",
    )
    period_end: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        doc="Statement billing period end timestamp (UTC).",
        comment="Statement billing period end timestamp (UTC).",
    )
    extracted_metadata_json: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        default="{}",
        doc="Serialized JSON summary of extracted statement balances, fees, and interest.",
        comment="Serialized JSON summary of extracted statement balances, fees, and interest.",
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        nullable=False,
        doc="Record creation timestamp (UTC).",
        comment="Record creation timestamp (UTC).",
    )
