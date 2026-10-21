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

"""Rewrite legacy household age bands to the canonical core vocabulary.

Revision ID: household_0002_canonical_age_band
Revises: household_0001_baseline
Create Date: 2026-10-21 00:00:00.000000

Core safety gates match yarvelle_core.schemas.age_band.CHILD_UNDER_13
("child_under_13"); rows written as "child_u13"/"child" never triggered them.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "household_0002_canonical_age_band"
down_revision: Union[str, None] = "household_0001_baseline"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

LEGACY_TO_CANONICAL = {"child_u13": "child_under_13", "child": "child_under_13", "teen": "teen_13_17"}


def upgrade() -> None:
    bind = op.get_bind()
    if not sa.inspect(bind).has_table("household_members"):
        return
    for legacy, canonical in LEGACY_TO_CANONICAL.items():
        op.execute(
            sa.text("UPDATE household_members SET age_band = :new WHERE age_band = :old").bindparams(
                new=canonical, old=legacy
            )
        )


def downgrade() -> None:
    bind = op.get_bind()
    if not sa.inspect(bind).has_table("household_members"):
        return
    op.execute(
        sa.text("UPDATE household_members SET age_band = 'child_u13' WHERE age_band = 'child_under_13'")
    )
