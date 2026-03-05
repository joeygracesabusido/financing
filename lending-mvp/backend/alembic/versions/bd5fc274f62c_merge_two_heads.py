"""merge_two_heads

Revision ID: bd5fc274f62c
Revises: 002_create_users, add_collection_table
Create Date: 2026-03-04 11:51:47.431751

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'bd5fc274f62c'
down_revision: Union[str, Sequence[str], None] = ('002_create_users', 'add_collection_table')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
