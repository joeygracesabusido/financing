"""Merge all heads

Revision ID: 660db17c429a
Revises: add_loan_tracking_fields, add_phase2_1_fields, add_review_note, branch_scoping_rbac_001
Create Date: 2026-03-03 05:27:35.048643

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '660db17c429a'
down_revision: Union[str, Sequence[str], None] = ('add_loan_tracking_fields', 'add_phase2_1_fields', 'add_review_note', 'branch_scoping_rbac_001')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
