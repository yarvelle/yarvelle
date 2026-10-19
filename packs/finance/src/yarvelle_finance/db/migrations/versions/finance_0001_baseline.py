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

"""Initial Finance Pack baseline schema creating scoped finance tables.

Revision ID: finance_0001_baseline
Revises: None
Create Date: 2026-10-19 00:00:00.000000
"""
from typing import Sequence, Union
from alembic import context, op
import sqlalchemy as sa

revision: str = "finance_0001_baseline"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = ("finance",)
depends_on: Union[str, Sequence[str], None] = None

REQUIRED_CORE_REVISION = "0011_scopes"
DEFAULT_SCOPE = "finance"

FINANCE_TABLES = [
    "finance_accounts",
    "finance_transactions",
    "finance_bills",
    "finance_budgets",
    "finance_statements",
]


def upgrade() -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind) if not context.is_offline_mode() else None
    existing_tables = set(insp.get_table_names()) if insp else set()

    # 1. Prerequisite verification
    if not context.is_offline_mode():
        if "alembic_version" not in existing_tables:
            raise RuntimeError("Core migrations must be initialized before Finance Pack migrations.")
        rows = [r[0] for r in bind.exec_driver_sql("SELECT version_num FROM alembic_version;").fetchall()]
        if REQUIRED_CORE_REVISION not in rows:
            raise RuntimeError(f"Finance Pack requires core migration '{REQUIRED_CORE_REVISION}', but found {rows}.")

    # 2. Table: finance_accounts
    if "finance_accounts" not in existing_tables:
        op.create_table(
            "finance_accounts",
            sa.Column("id", sa.String(36), primary_key=True),
            sa.Column("profile_id", sa.String(36), sa.ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False),
            sa.Column("account_name", sa.String(128), nullable=False),
            sa.Column("institution_name", sa.String(128), nullable=False),
            sa.Column("account_type", sa.String(32), nullable=False, server_default="checking"),
            sa.Column("masked_number", sa.String(16), nullable=False),
            sa.Column("current_balance", sa.Numeric(12, 2), nullable=False, server_default="0.0"),
            sa.Column("currency", sa.String(3), nullable=False, server_default="USD"),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("scope", sa.String(64), nullable=False, server_default="finance.accounts"),
        )
        op.create_index("ix_finance_accounts_profile_id", "finance_accounts", ["profile_id"], unique=False)
        op.create_index("ix_finance_accounts_scope", "finance_accounts", ["scope"], unique=False)

    # 3. Table: finance_transactions
    if "finance_transactions" not in existing_tables:
        op.create_table(
            "finance_transactions",
            sa.Column("id", sa.String(36), primary_key=True),
            sa.Column("profile_id", sa.String(36), sa.ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False),
            sa.Column("account_id", sa.String(36), sa.ForeignKey("finance_accounts.id", ondelete="SET NULL"), nullable=True),
            sa.Column("amount", sa.Numeric(12, 2), nullable=False),
            sa.Column("currency", sa.String(3), nullable=False, server_default="USD"),
            sa.Column("payee", sa.String(255), nullable=False),
            sa.Column("category", sa.String(64), nullable=False, server_default="uncategorized"),
            sa.Column("transaction_date", sa.DateTime(timezone=True), nullable=False),
            sa.Column("status", sa.String(32), nullable=False, server_default="posted"),
            sa.Column("notes", sa.Text(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("scope", sa.String(64), nullable=False, server_default="finance.transactions"),
        )
        op.create_index("ix_finance_transactions_profile_id", "finance_transactions", ["profile_id"], unique=False)
        op.create_index("ix_finance_transactions_date", "finance_transactions", ["transaction_date"], unique=False)
        op.create_index("ix_finance_transactions_scope", "finance_transactions", ["scope"], unique=False)

    # 4. Table: finance_bills
    if "finance_bills" not in existing_tables:
        op.create_table(
            "finance_bills",
            sa.Column("id", sa.String(36), primary_key=True),
            sa.Column("profile_id", sa.String(36), sa.ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False),
            sa.Column("biller_name", sa.String(255), nullable=False),
            sa.Column("amount", sa.Numeric(12, 2), nullable=False),
            sa.Column("due_date", sa.DateTime(timezone=True), nullable=False),
            sa.Column("frequency", sa.String(32), nullable=False, server_default="monthly"),
            sa.Column("category", sa.String(64), nullable=False, server_default="utility"),
            sa.Column("status", sa.String(32), nullable=False, server_default="pending"),
            sa.Column("reminder_id", sa.String(36), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("scope", sa.String(64), nullable=False, server_default="finance.bills"),
        )
        op.create_index("ix_finance_bills_profile_id", "finance_bills", ["profile_id"], unique=False)
        op.create_index("ix_finance_bills_due_date", "finance_bills", ["due_date"], unique=False)
        op.create_index("ix_finance_bills_scope", "finance_bills", ["scope"], unique=False)

    # 5. Table: finance_budgets
    if "finance_budgets" not in existing_tables:
        op.create_table(
            "finance_budgets",
            sa.Column("id", sa.String(36), primary_key=True),
            sa.Column("profile_id", sa.String(36), sa.ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False),
            sa.Column("period_month", sa.String(7), nullable=False),
            sa.Column("categories_json", sa.Text(), nullable=False, server_default="{}"),
            sa.Column("total_planned", sa.Numeric(12, 2), nullable=False, server_default="0.0"),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("scope", sa.String(64), nullable=False, server_default="finance.budget"),
        )
        op.create_index("ix_finance_budgets_profile_month", "finance_budgets", ["profile_id", "period_month"], unique=True)
        op.create_index("ix_finance_budgets_scope", "finance_budgets", ["scope"], unique=False)

    # 6. Table: finance_statements
    if "finance_statements" not in existing_tables:
        op.create_table(
            "finance_statements",
            sa.Column("id", sa.String(36), primary_key=True),
            sa.Column("profile_id", sa.String(36), sa.ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False),
            sa.Column("attachment_id", sa.String(36), sa.ForeignKey("attachments.id", ondelete="SET NULL"), nullable=True),
            sa.Column("institution_name", sa.String(128), nullable=False),
            sa.Column("period_start", sa.DateTime(timezone=True), nullable=False),
            sa.Column("period_end", sa.DateTime(timezone=True), nullable=False),
            sa.Column("extracted_metadata_json", sa.Text(), nullable=False, server_default="{}"),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("scope", sa.String(64), nullable=False, server_default="finance.statements"),
        )
        op.create_index("ix_finance_statements_profile_id", "finance_statements", ["profile_id"], unique=False)
        op.create_index("ix_finance_statements_scope", "finance_statements", ["scope"], unique=False)


def downgrade() -> None:
    for tbl in reversed(FINANCE_TABLES):
        op.drop_table(tbl)
