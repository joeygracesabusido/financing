"""add_review_note_to_loan_applications

Revision ID: add_review_note
Revises: f5cf49589157
Create Date: 2026-02-20 16:05:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'add_review_note'
down_revision: Union[str, Sequence[str], None] = 'f5cf49589157'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add review_note column to loan_applications table
    op.add_column('loan_applications', sa.Column('review_note', sa.Text(), nullable=True))
    # Add disbursement_method column to loan_applications table
    op.add_column('loan_applications', sa.Column('disbursement_method', sa.String(length=50), nullable=True))
    # Add reviewed_by column to loan_applications table
    op.add_column('loan_applications', sa.Column('reviewed_by', sa.String(length=64), nullable=True))
    # Add approved_by column to loan_applications table
    op.add_column('loan_applications', sa.Column('approved_by', sa.String(length=64), nullable=True))
    # Add rejected_reason column to loan_applications table
    op.add_column('loan_applications', sa.Column('rejected_reason', sa.Text(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    # Remove columns added in this migration
    op.drop_column('loan_applications', 'rejected_reason')
    op.drop_column('loan_applications', 'approved_by')
    op.drop_column('loan_applications', 'reviewed_by')
    op.drop_column('loan_applications', 'disbursement_method')
    op.drop_column('loan_applications', 'review_note')
