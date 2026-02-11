import motor.motor_asyncio
from ..config import settings

client = motor.motor_asyncio.AsyncIOMotorClient(settings.DATABASE_URL)
db = client[settings.DATABASE_NAME]

# Collections
users_collection = db["users"]
loans_collection = db["loans"]
ledger_collection = db["ledger_entries"]
customers_collection = db["customers"] # Added customers collection
loan_transactions_collection = db["loan_transactions"] # Added loan_transactions collection
loan_products_collection = db["loan_products"] # Added loan_products collection

def get_users_collection():
    return users_collection

def get_loans_collection():
    return loans_collection

def get_ledger_collection():
    return ledger_collection

def get_customers_collection(): # Added getter for customers collection
    return customers_collection

def get_loan_transactions_collection(): # Added getter for loan_transactions collection
    return loan_transactions_collection

def get_loan_products_collection(): # Added getter for loan_products collection
    return loan_products_collection

def get_db(): # Added getter for the database client
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