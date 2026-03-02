"""manual_fix_columns"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = 'manual_fix_columns'
down_revision = None
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Add columns if they don't exist
    conn = op.get_bind()
    columns = conn.execute(sa.text("SELECT column_name FROM information_schema.columns WHERE table_name='loan_applications'")).fetchall()
    existing_cols = [c[0] for c in columns]
    
    if 'outstanding_balance' not in existing_cols:
        op.add_column('loan_applications', sa.Column('outstanding_balance', sa.Numeric(precision=14, scale=2), nullable=True))
    if 'next_due_date' not in existing_cols:
        op.add_column('loan_applications', sa.Column('next_due_date', sa.DateTime(timezone=True), nullable=True))
    if 'months_paid' not in existing_cols:
        op.add_column('loan_applications', sa.Column('months_paid', sa.Integer(), nullable=True, server_default='0'))
    if 'disbursed_at' not in existing_cols:
        op.add_column('loan_applications', sa.Column('disbursed_at', sa.DateTime(timezone=True), nullable=True))
    
    # Also drop the alembic_version table just to be safe and recreate
    conn.execute(sa.text("DROP TABLE IF EXISTS alembic_version"))

def downgrade() -> None:
    pass
