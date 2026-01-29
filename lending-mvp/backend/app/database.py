import motor.motor_asyncio
from .config import settings

client = motor.motor_asyncio.AsyncIOMotorClient(settings.DATABASE_URL)
db = client[settings.DATABASE_NAME]

# Get collections
user_collection = db["users"]
loan_collection = db["loans"]
ledger_collection = db["ledger_entries"]
