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

"""Initial Education Pack baseline schema creating scoped education tables.

Revision ID: education_0001_baseline
Revises: None
Create Date: 2026-10-19 00:00:00.000000
"""
from typing import Sequence, Union
from alembic import context, op
import sqlalchemy as sa

revision: str = "education_0001_baseline"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = ("education",)
depends_on: Union[str, Sequence[str], None] = None

REQUIRED_CORE_REVISION = "0011_scopes"
DEFAULT_SCOPE = "education"

EDUCATION_TABLES = [
    "education_assignments",
    "education_milestones",
    "education_reading_logs",
]


def upgrade() -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind) if not context.is_offline_mode() else None
    existing_tables = set(insp.get_table_names()) if insp else set()

    # 1. Prerequisite verification
    if not context.is_offline_mode():
        if "alembic_version" not in existing_tables:
            raise RuntimeError("Core migrations must be initialized before Education Pack migrations.")
        rows = [r[0] for r in bind.exec_driver_sql("SELECT version_num FROM alembic_version;").fetchall()]
        if REQUIRED_CORE_REVISION not in rows:
            raise RuntimeError(f"Education Pack requires core migration '{REQUIRED_CORE_REVISION}', but found {rows}.")

    # 2. Table: education_assignments
    if "education_assignments" not in existing_tables:
        op.create_table(
            "education_assignments",
            sa.Column("id", sa.String(36), primary_key=True),
            sa.Column("profile_id", sa.String(36), sa.ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False),
            sa.Column("title", sa.String(255), nullable=False),
            sa.Column("subject", sa.String(128), nullable=False, server_default="General"),
            sa.Column("due_date", sa.DateTime(timezone=True), nullable=False),
            sa.Column("status", sa.String(32), nullable=False, server_default="assigned"),
            sa.Column("instructions", sa.Text(), nullable=True),
            sa.Column("scope", sa.String(64), nullable=False, server_default=DEFAULT_SCOPE),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        )
        op.create_index("ix_education_assignments_profile_id", "education_assignments", ["profile_id"])
        op.create_index("ix_education_assignments_scope", "education_assignments", ["scope"])

    # 3. Table: education_milestones
    if "education_milestones" not in existing_tables:
        op.create_table(
            "education_milestones",
            sa.Column("id", sa.String(36), primary_key=True),
            sa.Column("profile_id", sa.String(36), sa.ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False),
            sa.Column("category", sa.String(64), nullable=False, server_default="personal"),
            sa.Column("title", sa.String(255), nullable=False),
            sa.Column("achieved_on", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
            sa.Column("notes", sa.Text(), nullable=True),
            sa.Column("scope", sa.String(64), nullable=False, server_default=DEFAULT_SCOPE),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        )
        op.create_index("ix_education_milestones_profile_id", "education_milestones", ["profile_id"])
        op.create_index("ix_education_milestones_scope", "education_milestones", ["scope"])

    # 4. Table: education_reading_logs
    if "education_reading_logs" not in existing_tables:
        op.create_table(
            "education_reading_logs",
            sa.Column("id", sa.String(36), primary_key=True),
            sa.Column("profile_id", sa.String(36), sa.ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False),
            sa.Column("book_title", sa.String(255), nullable=False),
            sa.Column("author", sa.String(128), nullable=True),
            sa.Column("minutes_read", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("date_read", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
            sa.Column("reflection", sa.Text(), nullable=True),
            sa.Column("scope", sa.String(64), nullable=False, server_default=DEFAULT_SCOPE),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        )
        op.create_index("ix_education_reading_logs_profile_id", "education_reading_logs", ["profile_id"])
        op.create_index("ix_education_reading_logs_scope", "education_reading_logs", ["scope"])


def downgrade() -> None:
    for tbl in reversed(EDUCATION_TABLES):
        op.drop_table(tbl)
