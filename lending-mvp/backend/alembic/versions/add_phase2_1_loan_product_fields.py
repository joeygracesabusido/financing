"""add_phase2_1_loan_product_fields

Revision ID: add_phase2_1_fields
Revises: f5cf49589157
Create Date: 2026-02-20 12:00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'add_phase2_1_fields'
down_revision: Union[str, Sequence[str], None] = 'f5cf49589157'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add Phase 2.1 enhanced fields to loan_products table."""
    # Add Phase 2.1 enhanced fields
    op.add_column('loan_products', sa.Column('principal_only_grace', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('loan_products', sa.Column('full_grace', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('loan_products', sa.Column('origination_fee_rate', sa.Numeric(precision=10, scale=4), nullable=True))
    op.add_column('loan_products', sa.Column('origination_fee_type', sa.String(length=50), nullable=True))
    op.add_column('loan_products', sa.Column('prepayment_allowed', sa.Boolean(), nullable=False, server_default='true'))
    op.add_column('loan_products', sa.Column('prepayment_penalty_rate', sa.Numeric(precision=10, scale=4), nullable=True))
    op.add_column('loan_products', sa.Column('customer_loan_limit', sa.Numeric(precision=14, scale=2), nullable=True))


def downgrade() -> None:
    """Remove Phase 2.1 enhanced fields from loan_products table."""
    op.drop_column('loan_products', 'customer_loan_limit')
    op.drop_column('loan_products', 'prepayment_penalty_rate')
    op.drop_column('loan_products', 'prepayment_allowed')
    op.drop_column('loan_products', 'origination_fee_type')
    op.drop_column('loan_products', 'origination_fee_rate')
    op.drop_column('loan_products', 'full_grace')
    op.drop_column('loan_products', 'principal_only_grace')
