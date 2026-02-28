"""add loan tracking fields

Revision ID: add_loan_tracking_fields
Revises:
Create Date: 2026-02-28

"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "add_loan_tracking_fields"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "loan_applications",
        sa.Column("outstanding_balance", sa.Numeric(14, 2), nullable=True),
    )
    op.add_column(
        "loan_applications",
        sa.Column("next_due_date", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "loan_applications",
        sa.Column("months_paid", sa.Integer(), nullable=True, server_default="0"),
    )


def downgrade() -> None:
    op.drop_column("loan_applications", "months_paid")
    op.drop_column("loan_applications", "next_due_date")
    op.drop_column("loan_applications", "outstanding_balance")
