"""branch_scoping_and_rbac

Revision ID: branch_scoping_rbac_001
Revises: manual_fix_columns
Create Date: 2026-03-03

Adds:
  - user_branch_assignments table (user -> branch mapping)
  - branch_code column to audit_logs
  - branch_code column to loan_applications
"""
from alembic import op
import sqlalchemy as sa

revision = 'branch_scoping_rbac_001'
down_revision = 'manual_fix_columns'
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()

    # ── 1. user_branch_assignments ──────────────────────────────────────────
    tables = conn.execute(
        sa.text("SELECT table_name FROM information_schema.tables WHERE table_schema='public'")
    ).fetchall()
    existing_tables = [t[0] for t in tables]

    if 'user_branch_assignments' not in existing_tables:
        op.create_table(
            'user_branch_assignments',
            sa.Column('id', sa.BigInteger(), primary_key=True, autoincrement=True),
            sa.Column('user_id', sa.String(64), nullable=False, unique=True, index=True),
            sa.Column('branch_id', sa.Integer(), sa.ForeignKey('branches.id', ondelete='SET NULL'), nullable=True),
            sa.Column('branch_code', sa.String(20), nullable=True),
            sa.Column('assigned_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column('assigned_by', sa.String(64), nullable=True),
        )
        op.create_index('ix_user_branch_user_id', 'user_branch_assignments', ['user_id'])
        op.create_index('ix_user_branch_branch_code', 'user_branch_assignments', ['branch_code'])

    # ── 2. audit_logs.branch_code ───────────────────────────────────────────
    audit_cols = conn.execute(
        sa.text("SELECT column_name FROM information_schema.columns WHERE table_name='audit_logs'")
    ).fetchall()
    audit_col_names = [c[0] for c in audit_cols]

    if 'branch_code' not in audit_col_names:
        op.add_column('audit_logs', sa.Column('branch_code', sa.String(20), nullable=True))
        op.create_index('ix_audit_logs_branch', 'audit_logs', ['branch_code'])

    # ── 3. loan_applications.branch_code ────────────────────────────────────
    loan_cols = conn.execute(
        sa.text("SELECT column_name FROM information_schema.columns WHERE table_name='loan_applications'")
    ).fetchall()
    loan_col_names = [c[0] for c in loan_cols]

    if 'branch_code' not in loan_col_names:
        op.add_column('loan_applications', sa.Column('branch_code', sa.String(20), nullable=True))
        op.create_index('ix_loan_applications_branch_code', 'loan_applications', ['branch_code'])


def downgrade() -> None:
    conn = op.get_bind()

    # loan_applications.branch_code
    loan_cols = conn.execute(
        sa.text("SELECT column_name FROM information_schema.columns WHERE table_name='loan_applications'")
    ).fetchall()
    if 'branch_code' in [c[0] for c in loan_cols]:
        op.drop_index('ix_loan_applications_branch_code', table_name='loan_applications')
        op.drop_column('loan_applications', 'branch_code')

    # audit_logs.branch_code
    audit_cols = conn.execute(
        sa.text("SELECT column_name FROM information_schema.columns WHERE table_name='audit_logs'")
    ).fetchall()
    if 'branch_code' in [c[0] for c in audit_cols]:
        op.drop_index('ix_audit_logs_branch', table_name='audit_logs')
        op.drop_column('audit_logs', 'branch_code')

    # user_branch_assignments
    tables = conn.execute(
        sa.text("SELECT table_name FROM information_schema.tables WHERE table_schema='public'")
    ).fetchall()
    if 'user_branch_assignments' in [t[0] for t in tables]:
        op.drop_table('user_branch_assignments')
