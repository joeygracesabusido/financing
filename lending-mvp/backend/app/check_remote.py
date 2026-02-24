import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os

async def check_remote():
    url = os.environ.get("DATABASE_URL")
    db_name = os.environ.get("DATABASE_NAME", "financing")
    print(f"Connecting to: {url}")
    
    client = AsyncIOMotorClient(url)
    db = client[db_name]
    
    print("--- CUSTOMERS ---")
    customers = await db["customers"].find({}).to_list(length=10)
    for c in customers:
        print(f"  - {c.get('display_name')}, ID: {c['_id']}")
    
    print("
--- LOANS ---")
    loans = await db["loans"].find({}).to_list(length=10)
    for l in loans:
        print(f"  - LoanID: {l.get('loan_id', l.get('loanId'))}, Status: {l.get('status')}, BorrowerID: {l.get('borrower_id')}")

    # Specific search
    customer = await db["customers"].find_one({"display_name": {"$regex": "SABUSIDO", "$options": "i"}})
    if customer:
        print(f"
Specific Customer search (SABUSIDO): {customer.get('display_name')}, ID: {customer['_id']}")
        # Find loan for this customer
        loan = await db["loans"].find_one({"borrower_id": customer["_id"]})
        if loan:
            print(f"  Loan for customer: {loan.get('loan_id', loan.get('loanId'))}, Status: {loan.get('status')}")
            # Check transactions
            lid = loan.get('loan_id', loan.get('loanId'))
            transactions = await db["loan_transactions"].find({"loan_id": str(lid)}).to_list(length=100)
            print(f"  Transactions (by lid {lid}): {len(transactions)}")
            for t in transactions:
                print(f"    - Type: {t.get('transaction_type')}, Status: {t.get('disbursement_status')}, Amount: {t.get('amount')}")
    else:
        print("
Specific Customer search (SABUSIDO): Not found")

if __name__ == "__main__":
    asyncio.run(check_remote())
