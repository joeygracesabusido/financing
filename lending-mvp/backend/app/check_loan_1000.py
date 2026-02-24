import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

async def check_loan_1000():
    client = AsyncIOMotorClient("mongodb://mongodb:27017")
    db = client["financing"]
    
    # Check loan
    loan = await db["loans"].find_one({"$or": [{"loan_id": "1000"}, {"loanId": "1000"}, {"loanId": 1000}, {"loan_id": 1000}]})
    print(f"Loan 1000: {loan}")
    
    if loan:
        # Check transactions
        transactions = await db["loan_transactions"].find({"loan_id": str(loan.get("loan_id", loan.get("loanId", "1000")))}).to_list(length=100)
        print(f"Transactions for loan 1000: {len(transactions)}")
        for t in transactions:
            print(f"  - Type: {t.get('transaction_type')}, Status: {t.get('disbursement_status')}, Amount: {t.get('amount')}")

if __name__ == "__main__":
    asyncio.run(check_loan_1000())
