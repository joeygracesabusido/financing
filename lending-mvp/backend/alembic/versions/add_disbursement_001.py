"""Add disbursement fields to loan_transactions

Revision ID: add_disbursement_001
Revises: bd5fc274f62c
Create Date: 2026-03-07
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

revision: str = "add_disbursement_001"
down_revision: Union[str, Sequence[str], None] = "bd5fc274f62c"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def column_exists(table, column):
    """Check if column exists in table."""
    bind = op.get_bind()
    inspector = inspect(bind)
    columns = [c['name'] for c in inspector.get_columns(table)]
    return column in columns

def upgrade() -> None:
    # Add disbursement-related fields to loan_transactions (only if they don't exist)
    if not column_exists('loan_transactions', 'commercial_bank'):
        op.add_column('loan_transactions', sa.Column('commercial_bank', sa.String(100), nullable=True))
    if not column_exists('loan_transactions', 'servicing_branch'):
        op.add_column('loan_transactions', sa.Column('servicing_branch', sa.String(100), nullable=True))
    if not column_exists('loan_transactions', 'region'):
        op.add_column('loan_transactions', sa.Column('region', sa.String(100), nullable=True))
    if not column_exists('loan_transactions', 'loan_product_id'):
        op.add_column('loan_transactions', sa.Column('loan_product_id', sa.String(50), nullable=True))
    if not column_exists('loan_transactions', 'debit_account'):
        op.add_column('loan_transactions', sa.Column('debit_account', sa.String(50), nullable=True))
    if not column_exists('loan_transactions', 'credit_account'):
        op.add_column('loan_transactions', sa.Column('credit_account', sa.String(50), nullable=True))
    if not column_exists('loan_transactions', 'disbursement_method'):
        op.add_column('loan_transactions', sa.Column('disbursement_method', sa.String(50), nullable=True))
    if not column_exists('loan_transactions', 'disbursement_status'):
        op.add_column('loan_transactions', sa.Column('disbursement_status', sa.String(50), nullable=True))
    if not column_exists('loan_transactions', 'cheque_number'):
        op.add_column('loan_transactions', sa.Column('cheque_number', sa.String(50), nullable=True))
    if not column_exists('loan_transactions', 'beneficiary_bank'):
        op.add_column('loan_transactions', sa.Column('beneficiary_bank', sa.String(100), nullable=True))
    if not column_exists('loan_transactions', 'beneficiary_account'):
        op.add_column('loan_transactions', sa.Column('beneficiary_account', sa.String(100), nullable=True))
    if not column_exists('loan_transactions', 'approved_by'):
        op.add_column('loan_transactions', sa.Column('approved_by', sa.String(100), nullable=True))
    if not column_exists('loan_transactions', 'borrower_name'):
        op.add_column('loan_transactions', sa.Column('borrower_name', sa.String(255), nullable=True))
    if not column_exists('loan_transactions', 'created_by'):
        op.add_column('loan_transactions', sa.Column('created_by', sa.String(100), nullable=True))
    if not column_exists('loan_transactions', 'updated_by'):
        op.add_column('loan_transactions', sa.Column('updated_by', sa.String(100), nullable=True))
    if not column_exists('loan_transactions', 'is_eft'):
        op.add_column('loan_transactions', sa.Column('is_eft', sa.Boolean(), nullable=True, server_default='false'))
    if not column_exists('loan_transactions', 'created_at'):
        op.add_column('loan_transactions', sa.Column('created_at', sa.DateTime(timezone=True), nullable=True, server_default=sa.func.now()))
    if not column_exists('loan_transactions', 'updated_at'):
        op.add_column('loan_transactions', sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True, server_default=sa.func.now()))
    
    # Add payment_date to amortization_schedules if it doesn't exist
    if not column_exists('amortization_schedules', 'payment_date'):
        op.add_column('amortization_schedules', sa.Column('payment_date', sa.DateTime(timezone=True), nullable=True))

def downgrade() -> None:
    op.drop_column('loan_transactions', 'borrower_name')
    op.drop_column('loan_transactions', 'approved_by')
    op.drop_column('loan_transactions', 'beneficiary_account')
    op.drop_column('loan_transactions', 'beneficiary_bank')
    op.drop_column('loan_transactions', 'cheque_number')
    op.drop_column('loan_transactions', 'disbursement_status')
    op.drop_column('loan_transactions', 'disbursement_method')
    op.drop_column('loan_transactions', 'credit_account')
    op.drop_column('loan_transactions', 'debit_account')
    op.drop_column('loan_transactions', 'loan_product_id')
    op.drop_column('loan_transactions', 'region')
    op.drop_column('loan_transactions', 'servicing_branch')
    op.drop_column('loan_transactions', 'commercial_bank')
    op.drop_column('amortization_schedules', 'payment_date')
