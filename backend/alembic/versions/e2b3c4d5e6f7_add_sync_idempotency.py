"""add sync idempotency ledger

Revision ID: e2b3c4d5e6f7
Revises: e1a2b3c4d5e6
Create Date: 2026-09-14 22:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = 'e2b3c4d5e6f7'
down_revision = 'e1a2b3c4d5e6'
branch_labels = None
depends_on = None

def upgrade():
    op.create_table(
        'sync_idempotency_keys',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('client_mutation_id', sa.String(length=128), nullable=False, unique=True, index=True),
        sa.Column('action_type', sa.String(length=64), nullable=False),
        sa.Column('entity_id', sa.String(length=128), nullable=True),
        sa.Column('status', sa.String(length=32), nullable=False, server_default='PROCESSED'),
        sa.Column('response_payload', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False)
    )

def downgrade():
    op.drop_table('sync_idempotency_keys')
