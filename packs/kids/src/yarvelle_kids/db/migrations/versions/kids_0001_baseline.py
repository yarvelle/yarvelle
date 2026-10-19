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

"""Initial Kids Pack baseline schema creating scoped kids tables.

Revision ID: kids_0001_baseline
Revises: None
Create Date: 2026-10-19 00:00:00.000000
"""
from typing import Sequence, Union
from alembic import context, op
import sqlalchemy as sa

revision: str = "kids_0001_baseline"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = ("kids",)
depends_on: Union[str, Sequence[str], None] = None

REQUIRED_CORE_REVISION = "0011_scopes"
DEFAULT_SCOPE = "kids"

KIDS_TABLES = [
    "kids_assignments",
    "kids_activities",
    "kids_milestones",
    "kids_reading_logs",
    "kids_chores",
    "kids_meal_plans",
]


def upgrade() -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind) if not context.is_offline_mode() else None
    existing_tables = set(insp.get_table_names()) if insp else set()

    # 1. Prerequisite verification
    if not context.is_offline_mode():
        if "alembic_version" not in existing_tables:
            raise RuntimeError("Core migrations must be initialized before Kids Pack migrations.")
        rows = [r[0] for r in bind.exec_driver_sql("SELECT version_num FROM alembic_version;").fetchall()]
        if REQUIRED_CORE_REVISION not in rows:
            raise RuntimeError(f"Kids Pack requires core migration '{REQUIRED_CORE_REVISION}', but found {rows}.")

    # 2. Table: kids_assignments
    if "kids_assignments" not in existing_tables:
        op.create_table(
            "kids_assignments",
            sa.Column("id", sa.String(36), primary_key=True),
            sa.Column("profile_id", sa.String(36), sa.ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False),
            sa.Column("title", sa.String(255), nullable=False),
            sa.Column("subject", sa.String(128), nullable=False, server_default="General"),
            sa.Column("due_date", sa.DateTime(timezone=True), nullable=False),
            sa.Column("status", sa.String(32), nullable=False, server_default="assigned"),
            sa.Column("instructions", sa.Text(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("scope", sa.String(64), nullable=False, server_default="kids.assignments"),
        )
        op.create_index("ix_kids_assignments_profile_id", "kids_assignments", ["profile_id"], unique=False)
        op.create_index("ix_kids_assignments_due_date", "kids_assignments", ["due_date"], unique=False)
        op.create_index("ix_kids_assignments_scope", "kids_assignments", ["scope"], unique=False)

    # 3. Table: kids_activities
    if "kids_activities" not in existing_tables:
        op.create_table(
            "kids_activities",
            sa.Column("id", sa.String(36), primary_key=True),
            sa.Column("profile_id", sa.String(36), sa.ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False),
            sa.Column("activity_name", sa.String(255), nullable=False),
            sa.Column("category", sa.String(64), nullable=False, server_default="sports"),
            sa.Column("location", sa.String(255), nullable=True),
            sa.Column("start_time", sa.DateTime(timezone=True), nullable=False),
            sa.Column("end_time", sa.DateTime(timezone=True), nullable=False),
            sa.Column("recurrence_rrule", sa.String(255), nullable=True),
            sa.Column("coach_or_leader", sa.String(128), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("scope", sa.String(64), nullable=False, server_default="kids.activities"),
        )
        op.create_index("ix_kids_activities_profile_id", "kids_activities", ["profile_id"], unique=False)
        op.create_index("ix_kids_activities_start_time", "kids_activities", ["start_time"], unique=False)
        op.create_index("ix_kids_activities_scope", "kids_activities", ["scope"], unique=False)

    # 4. Table: kids_milestones
    if "kids_milestones" not in existing_tables:
        op.create_table(
            "kids_milestones",
            sa.Column("id", sa.String(36), primary_key=True),
            sa.Column("profile_id", sa.String(36), sa.ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False),
            sa.Column("category", sa.String(64), nullable=False, server_default="personal"),
            sa.Column("title", sa.String(255), nullable=False),
            sa.Column("achieved_on", sa.DateTime(timezone=True), nullable=False),
            sa.Column("notes", sa.Text(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("scope", sa.String(64), nullable=False, server_default="kids.milestones"),
        )
        op.create_index("ix_kids_milestones_profile_id", "kids_milestones", ["profile_id"], unique=False)
        op.create_index("ix_kids_milestones_scope", "kids_milestones", ["scope"], unique=False)

    # 5. Table: kids_reading_logs
    if "kids_reading_logs" not in existing_tables:
        op.create_table(
            "kids_reading_logs",
            sa.Column("id", sa.String(36), primary_key=True),
            sa.Column("profile_id", sa.String(36), sa.ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False),
            sa.Column("book_title", sa.String(255), nullable=False),
            sa.Column("author", sa.String(128), nullable=True),
            sa.Column("minutes_read", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("date_read", sa.DateTime(timezone=True), nullable=False),
            sa.Column("reflection", sa.Text(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("scope", sa.String(64), nullable=False, server_default="kids.reading"),
        )
        op.create_index("ix_kids_reading_logs_profile_id", "kids_reading_logs", ["profile_id"], unique=False)
        op.create_index("ix_kids_reading_logs_scope", "kids_reading_logs", ["scope"], unique=False)

    # 6. Table: kids_chores
    if "kids_chores" not in existing_tables:
        op.create_table(
            "kids_chores",
            sa.Column("id", sa.String(36), primary_key=True),
            sa.Column("profile_id", sa.String(36), sa.ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False),
            sa.Column("title", sa.String(255), nullable=False),
            sa.Column("assigned_to", sa.String(128), nullable=False, server_default="all"),
            sa.Column("frequency", sa.String(32), nullable=False, server_default="daily"),
            sa.Column("streak", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("last_completed_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("notes", sa.Text(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("scope", sa.String(64), nullable=False, server_default="kids.chores"),
        )
        op.create_index("ix_kids_chores_profile_id", "kids_chores", ["profile_id"], unique=False)
        op.create_index("ix_kids_chores_scope", "kids_chores", ["scope"], unique=False)

    # 7. Table: kids_meal_plans
    if "kids_meal_plans" not in existing_tables:
        op.create_table(
            "kids_meal_plans",
            sa.Column("id", sa.String(36), primary_key=True),
            sa.Column("profile_id", sa.String(36), sa.ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False),
            sa.Column("week_identifier", sa.String(16), nullable=False),
            sa.Column("meals_json", sa.Text(), nullable=False, server_default="{}"),
            sa.Column("groceries_json", sa.Text(), nullable=False, server_default="[]"),
            sa.Column("allergens_json", sa.Text(), nullable=False, server_default="[]"),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("scope", sa.String(64), nullable=False, server_default="kids.meals"),
        )
        op.create_index("ix_kids_meal_plans_profile_week", "kids_meal_plans", ["profile_id", "week_identifier"], unique=True)
        op.create_index("ix_kids_meal_plans_scope", "kids_meal_plans", ["scope"], unique=False)


def downgrade() -> None:
    for tbl in reversed(KIDS_TABLES):
        op.drop_table(tbl)
