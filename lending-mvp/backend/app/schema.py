import strawberry
from typing import List, Optional
from decimal import Decimal
from .services import accounting_service, loan_service

# --- Strawberry Types (mirroring Pydantic models) ---

@strawberry.type
class LoanType:
    borrower_id: str
    amount_requested: Decimal
    status: str

@strawberry.type
class LedgerEntryType:
    transaction_id: str
    account: str
    amount: Decimal
    entry_type: str
    timestamp: str

# --- GraphQL Queries ---

@strawberry.type
class Query:
    @strawberry.field
    async def get_loan_by_id(self, loan_id: str) -> Optional[LoanType]:
        # Placeholder for fetching loan
        # In a real app, you'd call a service function
        return LoanType(borrower_id="some_user", amount_requested=Decimal("1000"), status="pending")

    @strawberry.field
    async def get_borrower_ledger(self, borrower_id: str) -> List[LedgerEntryType]:
        # This is where GraphQL shines: complex, nested queries
        entries = await accounting_service.get_ledger_for_borrower(borrower_id)
        return [
            LedgerEntryType(
                transactionId=e["transaction_id"],
                account=e["account"],
                amount=e["amount"],
                entryType=e["entry_type"],
                timestamp=str(e["timestamp"])
            ) for e in entries
        ]

# --- GraphQL Mutations ---

@strawberry.type
class Mutation:
    @strawberry.mutation
    async def disburse_loan(self, loan_id: str) -> str:
        # Business logic should be a service layer
        success = await loan_service.disburse_loan(loan_id)
        return "Disbursement successful" if success else "Disbursement failed"
