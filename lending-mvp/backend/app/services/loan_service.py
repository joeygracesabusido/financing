from decimal import Decimal
from . import accounting_service

async def disburse_loan(loan_id: str):
    """
    1. Find the loan by ID and check if it's 'approved'.
    2. Post the accounting transaction.
    3. Update the loan status to 'active'.
    """
    # This is a placeholder for the actual logic.
    # We'll simulate finding a loan and disbursing it.
    print(f"Attempting to disburse loan {loan_id}")
    
    # In a real app, you would fetch the loan amount from the database
    loan_amount = Decimal("5000.00")

    success = await accounting_service.post_transaction(
        debit_account="Loans Receivable",
        credit_account="Cash", # Or a funding source account
        amount=loan_amount,
        tx_id=f"disbursement-{loan_id}"
    )
    
    if success:
        # Here you would update the loan status in the database
        print(f"Loan {loan_id} disbursed and status updated.")
        return True
    else:
        print(f"Failed to post accounting transaction for loan {loan_id}.")
        return False
