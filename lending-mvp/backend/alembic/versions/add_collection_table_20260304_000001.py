"""add collection table

Revision ID: add_collection_table
Revises: 002_create_users
Create Date: 2026-03-04

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'add_collection_table'
down_revision: Union[str, None] = '002_create_users'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create collections table
    op.create_table('collections',
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('customer_id', sa.String(length=64), nullable=False),
        sa.Column('amount', sa.Float(), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('due_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('collection_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('collected_by', sa.String(length=64), nullable=True),
        sa.Column('reference_number', sa.String(length=100), nullable=True),
        sa.Column('collection_type', sa.String(length=50), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.Index('ix_collections_due_date', 'due_date'),
        sa.Index('ix_collections_status', 'status')
    )


def downgrade() -> None:
    op.drop_table('collections')
