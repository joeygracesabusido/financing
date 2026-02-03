import motor.motor_asyncio
from ..config import settings

client = motor.motor_asyncio.AsyncIOMotorClient(settings.DATABASE_URL)
db = client[settings.DATABASE_NAME]

# Collections
users_collection = db["users"]
loans_collection = db["loans"]
ledger_collection = db["ledger_entries"]
customers_collection = db["customers"]

async def create_indexes():
    """Create indexes on MongoDB collections"""
    await customers_collection.create_index([("display_name", 1)], unique=True)

def get_users_collection():
    return users_collection

def get_loans_collection():
    return loans_collection

def get_ledger_collection():
    return ledger_collection

def get_customers_collection():
    return customers_collection