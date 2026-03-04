"""create_phase2_core_tables_users

Revision ID: 002_create_users_customers_transactions
Revises: 660db17c429a
Create Date: 2026-03-03

This migration creates only the users table for Phase 2.
Customers, savings_accounts, and transaction_ledger are created by the app's
create_tables() (ORM metadata) so the schema matches pg_core_models exactly.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "002_create_users"
down_revision: Union[str, Sequence[str], None] = "660db17c429a"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create users table only. branches must exist (from 001)."""
    
    op.create_table(
        "users",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("uuid", sa.String(length=36), nullable=True, unique=True),
        sa.Column("email", sa.String(length=200), nullable=False, unique=True),
        sa.Column("username", sa.String(length=100), nullable=False, unique=True),
        sa.Column("full_name", sa.String(length=200), nullable=False),
        sa.Column("hashed_password", sa.String(length=200), nullable=False),
        sa.Column("role", sa.String(length=50), nullable=False),
        sa.Column("branch_id", sa.Integer(), sa.ForeignKey("branches.id"), nullable=True),
        sa.Column("branch_code", sa.String(length=20), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("is_superuser", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("uuid"),
        sa.UniqueConstraint("email"),
        sa.UniqueConstraint("username"),
    )
    op.create_index("ix_users_email", "users", ["email"])
    op.create_index("ix_users_username", "users", ["username"])
    op.create_index("ix_users_branch", "users", ["branch_id"])
    op.create_index("ix_users_uuid", "users", ["uuid"])


def downgrade() -> None:
    """Drop users table only."""
    op.drop_index("ix_users_uuid", table_name="users")
    op.drop_index("ix_users_branch", table_name="users")
    op.drop_index("ix_users_username", table_name="users")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")
