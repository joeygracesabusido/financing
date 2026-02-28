from decimal import Decimal
from typing import Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from ..accounting import create_journal_entry

# Accounting configuration for Savings Products
# Maps account type to its respective Liability GL Account Code
# Assets are usually Cash in Bank (1010) or Cash on Hand (1000)
SAVINGS_GL_CONFIG = {
    "regular": {
        "asset": "1010",        # Cash in Bank
        "liability": "2010"     # Savings Deposits Payable
    },
    "high_yield": {
        "asset": "1010",
        "liability": "2010"
    },
    "time_deposit": {
        "asset": "1010",
        "liability": "2010"
    },
    "share_capital": {
        "asset": "1010",
        "liability": "3000"     # Share Capital (Equity)
    },
    "goal_savings": {
        "asset": "1010",
        "liability": "2010"
    },
    "minor_savings": {
        "asset": "1010",
        "liability": "2010"
    },
    "joint_account": {
        "asset": "1010",
        "liability": "2010"
    }
}

async def post_savings_transaction_accounting(
    session: AsyncSession,
    account_type: str,
    transaction_type: str,
    amount: Decimal,
    reference_no: str,
    created_by: Optional[str] = None
):
    """
    Determines and posts the double-entry accounting lines for a savings transaction.
    - Deposit: Debit Asset (Cash), Credit Liability (Savings Payable)
    - Withdrawal: Debit Liability (Savings Payable), Credit Asset (Cash)
    """
    config = SAVINGS_GL_CONFIG.get(account_type, SAVINGS_GL_CONFIG["regular"])
    asset_acct = config["asset"]
    liability_acct = config["liability"]

    lines = []
    if transaction_type == "deposit":
        # Bank receives cash (Debit Asset)
        lines.append({"account_code": asset_acct, "debit": amount, "credit": Decimal("0.00")})
        # Bank owes customer (Credit Liability)
        lines.append({"account_code": liability_acct, "debit": Decimal("0.00"), "credit": amount})
        description = f"Savings Deposit - {account_type.replace('_', ' ').capitalize()}"
    elif transaction_type == "withdrawal":
        # Bank reduces its debt to customer (Debit Liability)
        lines.append({"account_code": liability_acct, "debit": amount, "credit": Decimal("0.00")})
        # Bank gives away cash (Credit Asset)
        lines.append({"account_code": asset_acct, "debit": Decimal("0.00"), "credit": amount})
        description = f"Savings Withdrawal - {account_type.replace('_', ' ').capitalize()}"
    else:
        # For transfers or other types, specialized logic could go here
        return None

    return await create_journal_entry(
        session=session,
        reference_no=reference_no,
        description=description,
        lines=lines,
        created_by=created_by
    )
