"""add soft delete and retention

Revision ID: e1a2b3c4d5e6
Revises: d7f3a2b1c9e0
Create Date: 2026-09-13 00:00:00
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "e1a2b3c4d5e6"
down_revision: Union[str, None] = "d7f3a2b1c9e0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add deleted_at to referrals
    op.add_column("referrals", sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True))
    op.create_index("ix_referrals_deleted_at", "referrals", ["deleted_at"], unique=False)

    # Add deleted_at to patients
    op.add_column("patients", sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True))
    op.create_index("ix_patients_deleted_at", "patients", ["deleted_at"], unique=False)

    # Add deleted_at to care_episodes
    op.add_column("care_episodes", sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True))
    op.create_index("ix_care_episodes_deleted_at", "care_episodes", ["deleted_at"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_care_episodes_deleted_at", table_name="care_episodes")
    op.drop_column("care_episodes", "deleted_at")

    op.drop_index("ix_patients_deleted_at", table_name="patients")
    op.drop_column("patients", "deleted_at")

    op.drop_index("ix_referrals_deleted_at", table_name="referrals")
    op.drop_column("referrals", "deleted_at")
