import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

async def check_loan_by_borrower():
    client = AsyncIOMotorClient("mongodb://mongodb:27017")
    db = client["financing"]
    
    # 1. Find customer
    customer = await db["customers"].find_one({"display_name": "SABUSIDO, JEROME RECALDE"})
    print(f"Customer: {customer}")
    
    if customer:
        # 2. Find loans for this customer
        loans = await db["loans"].find({"borrower_id": customer["_id"]}).to_list(length=100)
        print(f"Loans for customer: {len(loans)}")
        for l in loans:
            print(f"  - Loan: {l.get('loan_id', l.get('loanId'))}, ID: {l['_id']}, Status: {l.get('status')}")
            
            # Check transactions for this loan (using the internal ID or loan_id field)
            # Try to match by loan_id string (like '1000' in image)
            lid = l.get('loan_id', l.get('loanId'))
            transactions = await db["loan_transactions"].find({"loan_id": str(lid)}).to_list(length=100)
            print(f"    Transactions (by lid {lid}): {len(transactions)}")
            for t in transactions:
                print(f"      - Type: {t.get('transaction_type')}, Status: {t.get('disbursement_status')}, Amount: {t.get('amount')}")

if __name__ == "__main__":
    asyncio.run(check_loan_by_borrower())
