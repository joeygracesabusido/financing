import motor.motor_asyncio
from ..config import settings

client = motor.motor_asyncio.AsyncIOMotorClient(settings.MONGO_URL)
db = client[settings.MONGO_DB_NAME]

# Collections
users_collection = db["users"]
loans_collection = db["loans"]
ledger_collection = db["ledger_entries"]
customers_collection = db["customers"]
loan_transactions_collection = db["loan_transactions"]
loan_products_collection = db["loan_products"]
savings_collection = db["savings"]
transactions_collection = db["transactions"]
standing_orders_collection = db["standing_orders"]
interest_ledger_collection = db["interest_ledger"]


def get_users_collection():
    return users_collection

def get_loans_collection():
    return loans_collection

def get_ledger_collection():
    return ledger_collection

def get_customers_collection():
    return customers_collection

def get_loan_transactions_collection():
    return loan_transactions_collection

def get_loan_products_collection():
    return loan_products_collection

def get_savings_collection():
    return savings_collection

def get_transactions_collection():
    return transactions_collection

def get_standing_orders_collection():
    return standing_orders_collection

def get_interest_ledger_collection():
    return interest_ledger_collection

def get_db():
    return db

async def create_indexes():
    """
    Creates necessary indexes for the collections.
    """
    print("Creating database indexes...")
    try:
        await users_collection.create_index("email", unique=True)
        await users_collection.create_index("username", unique=True)
        await customers_collection.create_index("display_name", unique=True)
        print("Indexes created successfully.")
    except Exception as e:
        print(f"Error creating indexes: {e}")