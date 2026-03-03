"""manual_fix_columns"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = 'manual_fix_columns'
down_revision = 'f5cf49589157'  # Depend on phase 2 tables which creates loan_applications
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Add columns if they don't exist
    conn = op.get_bind()
    columns = conn.execute(sa.text("SELECT column_name FROM information_schema.columns WHERE table_name='loan_applications'")).fetchall()
    existing_cols = [c[0] for c in columns]
    
    # Check for each column and add only if missing
    for col_name in ['outstanding_balance', 'next_due_date', 'months_paid', 'disbursed_at']:
        if col_name not in existing_cols:
            if col_name == 'outstanding_balance':
                op.add_column('loan_applications', sa.Column('outstanding_balance', sa.Numeric(precision=14, scale=2), nullable=True))
            elif col_name == 'next_due_date':
                op.add_column('loan_applications', sa.Column('next_due_date', sa.DateTime(timezone=True), nullable=True))
            elif col_name == 'months_paid':
                op.add_column('loan_applications', sa.Column('months_paid', sa.Integer(), nullable=True, server_default='0'))
            elif col_name == 'disbursed_at':
                op.add_column('loan_applications', sa.Column('disbursed_at', sa.DateTime(timezone=True), nullable=True))
    
    # Do NOT drop the alembic_version table - this breaks migrations

def downgrade() -> None:
    pass
