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

"""Initial Household Pack baseline schema creating scoped household tables.

Revision ID: household_0001_baseline
Revises: None
Create Date: 2026-10-19 00:00:00.000000
"""
from typing import Sequence, Union
from alembic import context, op
import sqlalchemy as sa

revision: str = "household_0001_baseline"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = ("household",)
depends_on: Union[str, Sequence[str], None] = None

REQUIRED_CORE_REVISION = "0011_scopes"
DEFAULT_SCOPE = "household"

HOUSEHOLD_TABLES = [
    "households",
    "household_members",
    "cross_domain_links",
    "household_chores",
    "household_meal_plans",
    "household_activities",
]


def upgrade() -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind) if not context.is_offline_mode() else None
    existing_tables = set(insp.get_table_names()) if insp else set()

    # 1. Prerequisite verification
    if not context.is_offline_mode():
        if "alembic_version" not in existing_tables:
            raise RuntimeError("Core migrations must be initialized before Household Pack migrations.")
        rows = [r[0] for r in bind.exec_driver_sql("SELECT version_num FROM alembic_version;").fetchall()]
        if REQUIRED_CORE_REVISION not in rows:
            raise RuntimeError(f"Household Pack requires core migration '{REQUIRED_CORE_REVISION}', but found {rows}.")

    # 2. Table: households
    if "households" not in existing_tables:
        op.create_table(
            "households",
            sa.Column("id", sa.String(36), primary_key=True),
            sa.Column("name", sa.String(255), nullable=False),
            sa.Column("domain_toggles", sa.JSON(), nullable=False),
            sa.Column("two_guardian_rules", sa.JSON(), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        )

    # 3. Table: household_members
    if "household_members" not in existing_tables:
        op.create_table(
            "household_members",
            sa.Column("id", sa.String(36), primary_key=True),
            sa.Column("household_id", sa.String(36), sa.ForeignKey("households.id", ondelete="CASCADE"), nullable=False),
            sa.Column("profile_id", sa.String(36), sa.ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False),
            sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
            sa.Column("role", sa.String(32), nullable=False, server_default="member"),
            sa.Column("relationship", sa.String(64), nullable=False, server_default="self"),
            sa.Column("age_band", sa.String(32), nullable=False, server_default="adult"),
            sa.Column("is_private", sa.Boolean(), nullable=False, server_default="0"),
            sa.Column("delegated_scopes", sa.JSON(), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        )
        op.create_index("ix_household_members_household_id", "household_members", ["household_id"])
        op.create_index("ix_household_members_profile_id", "household_members", ["profile_id"])

    # 4. Table: cross_domain_links
    if "cross_domain_links" not in existing_tables:
        op.create_table(
            "cross_domain_links",
            sa.Column("id", sa.String(36), primary_key=True),
            sa.Column("source_domain", sa.String(32), nullable=False),
            sa.Column("source_entity_type", sa.String(64), nullable=False),
            sa.Column("source_entity_id", sa.String(36), nullable=False),
            sa.Column("target_domain", sa.String(32), nullable=False),
            sa.Column("target_entity_type", sa.String(64), nullable=False),
            sa.Column("target_entity_id", sa.String(36), nullable=False),
            sa.Column("link_type", sa.String(64), nullable=False),
            sa.Column("profile_id", sa.String(36), sa.ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False),
            sa.Column("description", sa.Text(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        )
        op.create_index("ix_cross_domain_links_profile_id", "cross_domain_links", ["profile_id"])
        op.create_index("ix_cross_domain_links_source_id", "cross_domain_links", ["source_entity_id"])
        op.create_index("ix_cross_domain_links_target_id", "cross_domain_links", ["target_entity_id"])

    # 5. Table: household_chores
    if "household_chores" not in existing_tables:
        op.create_table(
            "household_chores",
            sa.Column("id", sa.String(36), primary_key=True),
            sa.Column("profile_id", sa.String(36), sa.ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False),
            sa.Column("title", sa.String(255), nullable=False),
            sa.Column("assigned_to", sa.String(128), nullable=False, server_default="all"),
            sa.Column("frequency", sa.String(32), nullable=False, server_default="daily"),
            sa.Column("streak", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("last_completed_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("notes", sa.Text(), nullable=True),
            sa.Column("scope", sa.String(64), nullable=False, server_default=DEFAULT_SCOPE),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        )
        op.create_index("ix_household_chores_profile_id", "household_chores", ["profile_id"])
        op.create_index("ix_household_chores_scope", "household_chores", ["scope"])

    # 6. Table: household_meal_plans
    if "household_meal_plans" not in existing_tables:
        op.create_table(
            "household_meal_plans",
            sa.Column("id", sa.String(36), primary_key=True),
            sa.Column("profile_id", sa.String(36), sa.ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False),
            sa.Column("week_identifier", sa.String(16), nullable=False),
            sa.Column("meals_json", sa.Text(), nullable=False, server_default="{}"),
            sa.Column("groceries_json", sa.Text(), nullable=False, server_default="[]"),
            sa.Column("allergens_json", sa.Text(), nullable=False, server_default="[]"),
            sa.Column("scope", sa.String(64), nullable=False, server_default=DEFAULT_SCOPE),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        )
        op.create_index("ix_household_meal_plans_profile_id", "household_meal_plans", ["profile_id"])
        op.create_index("ix_household_meal_plans_week", "household_meal_plans", ["week_identifier"])
        op.create_index("ix_household_meal_plans_scope", "household_meal_plans", ["scope"])

    # 7. Table: household_activities
    if "household_activities" not in existing_tables:
        op.create_table(
            "household_activities",
            sa.Column("id", sa.String(36), primary_key=True),
            sa.Column("profile_id", sa.String(36), sa.ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False),
            sa.Column("activity_name", sa.String(255), nullable=False),
            sa.Column("category", sa.String(64), nullable=False, server_default="sports"),
            sa.Column("location", sa.String(255), nullable=True),
            sa.Column("start_time", sa.DateTime(timezone=True), nullable=False),
            sa.Column("end_time", sa.DateTime(timezone=True), nullable=False),
            sa.Column("recurrence_rrule", sa.String(255), nullable=True),
            sa.Column("coach_or_leader", sa.String(128), nullable=True),
            sa.Column("scope", sa.String(64), nullable=False, server_default=DEFAULT_SCOPE),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        )
        op.create_index("ix_household_activities_profile_id", "household_activities", ["profile_id"])
        op.create_index("ix_household_activities_scope", "household_activities", ["scope"])


def downgrade() -> None:
    for tbl in reversed(HOUSEHOLD_TABLES):
        op.drop_table(tbl)
