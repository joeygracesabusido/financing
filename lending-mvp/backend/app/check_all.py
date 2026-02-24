import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

async def check_all():
    client = AsyncIOMotorClient("mongodb://mongodb:27017")
    db = client["financing"]
    
    print("--- CUSTOMERS ---")
    customers = await db["customers"].find({}).to_list(length=10)
    for c in customers:
        print(f"  - {c.get('display_name')}, ID: {c['_id']}")
    
    print("\n--- LOANS ---")
    loans = await db["loans"].find({}).to_list(length=10)
    for l in loans:
        print(f"  - LoanID: {l.get('loan_id', l.get('loanId'))}, Status: {l.get('status')}, BorrowerID: {l.get('borrower_id')}")

    # Specific search by regex
    customer = await db["customers"].find_one({"display_name": {"$regex": "SABUSIDO", "$options": "i"}})
    if customer:
        print(f"\nSpecific Customer search (SABUSIDO): {customer.get('display_name')}, ID: {customer['_id']}")
    else:
        print("\nSpecific Customer search (SABUSIDO): Not found")

if __name__ == "__main__":
    asyncio.run(check_all())
