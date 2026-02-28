from typing import List, Optional, Dict, Any
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorCollection
from ..basemodel.savings_model import SavingsAccountBase
from decimal import Decimal

# Helper function to convert Decimal to str for MongoDB storage
def _convert_decimal_to_str(data: Dict[str, Any]) -> Dict[str, Any]:
    for key, value in data.items():
        if isinstance(value, Decimal):
            data[key] = str(value)
        elif isinstance(value, dict):
            data[key] = _convert_decimal_to_str(value)
        elif isinstance(value, list):
            data[key] = [_convert_decimal_to_str(item) if isinstance(item, dict) else item for item in value]
    return data

# Helper function to convert str to Decimal after MongoDB retrieval
def _convert_str_to_decimal(data: Dict[str, Any]) -> Dict[str, Any]:
    for key, value in data.items():
        if isinstance(value, str):
            try:
                # Attempt to convert to Decimal only if it looks like a number
                data[key] = Decimal(value)
            except Exception:
                pass # Keep as string if conversion fails
        elif isinstance(value, dict):
            data[key] = _convert_str_to_decimal(value)
        elif isinstance(value, list):
            data[key] = [_convert_str_to_decimal(item) if isinstance(item, dict) else item for item in value]
    return data

class SavingsCRUD:
    def __init__(self, collection: AsyncIOMotorCollection):
        self.collection = collection

    async def create_savings_account(self, account: SavingsAccountBase) -> SavingsAccountBase:
        account_data = account.model_dump(by_alias=True, exclude={"id"})
        
        # Convert Decimal fields to string before saving to MongoDB
        processed_account_data = _convert_decimal_to_str(account_data)
        
        result = await self.collection.insert_one(processed_account_data)
        
        # The returned account object should still have Decimal types
        account.id = result.inserted_id
        return account

    async def get_savings_account_by_id(self, account_id: str) -> Optional[SavingsAccountBase]:
        if not ObjectId.is_valid(account_id):
            return None
        account_data = await self.collection.find_one({"_id": ObjectId(account_id)})
        if account_data:
            # Convert string representations back to Decimal after retrieving
            processed_account_data = _convert_str_to_decimal(account_data)
            # Deserialize the dict back into a Pydantic model
            return SavingsAccountBase(**processed_account_data)
        return None

    async def get_savings_accounts_by_user_id(self, user_id: str) -> List[SavingsAccountBase]:
        # user_id is stored as a string, so query directly with the string
        accounts_data_list = await self.collection.find({"user_id": user_id}).to_list(length=100)
        
        # Convert string representations back to Decimal for each account
        processed_accounts_list = [_convert_str_to_decimal(acc_data) for acc_data in accounts_data_list]
        
        # Deserialize each dict back into a Pydantic model
        return [SavingsAccountBase(**acc_data) for acc_data in processed_accounts_list]
    
    async def get_all_savings_accounts(self, search_term: Optional[str] = None, customer_id: Optional[str] = None) -> List[SavingsAccountBase]:
        pipeline = []

        # Filter by customer_id if provided (user_id is stored as string in savings)
        if customer_id:
            pipeline.append({
                "$match": {"user_id": customer_id}
            })

        # ALWAYS prepare user_id for lookup (convert string user_id to ObjectId)
        # We need this to join with the 'customers' collection
        pipeline.append({
            "$addFields": {
                "user_id_obj": {
                    "$cond": [
                        {"$eq": [{"$type": "$user_id"}, "string"]},
                        {"$toObjectId": "$user_id"},
                        "$user_id"
                    ]
                }
            }
        })

        # ALWAYS lookup customer details so they are available for display
        pipeline.append({
            "$lookup": {
                "from": "customers",
                "localField": "user_id_obj",
                "foreignField": "_id",
                "as": "customer_info"
            }
        })
        
        # Unwind the customer_info array
        pipeline.append({
            "$unwind": {
                "path": "$customer_info",
                "preserveNullAndEmptyArrays": True
            }
        })

        if search_term:
            # Apply the search filter if provided
            pipeline.append({
                "$match": {
                    "$or": [
                        {"account_number": {"$regex": search_term, "$options": "i"}},
                        {"customer_info.display_name": {"$regex": search_term, "$options": "i"}}
                    ]
                }
            })
        
        # Projection stage
        pipeline.append({
            "$project": {
                "_id": 1,
                "account_number": 1,
                "user_id": 1,
                "type": 1,
                "balance": 1,
                "currency": 1,
                "opened_at": 1,
                "created_at": 1,
                "updated_at": 1,
                "status": 1,
                "customer_info": 1,
            }
        })

        # Use a very high length to effectively remove the limit for the current scale
        accounts_data_list = await self.collection.aggregate(pipeline).to_list(length=100000)
        
        processed_accounts_list = [_convert_str_to_decimal(acc_data) for acc_data in accounts_data_list]
        
        return [SavingsAccountBase(**acc_data) for acc_data in processed_accounts_list]
    
    async def update_balance(self, account_id: str, amount: Decimal) -> bool:
        if not ObjectId.is_valid(account_id):
            return False
        
        # Ensure the amount is converted to string for storage in MongoDB
        # Note: MongoDB's $inc operator can handle numbers directly, but if 'balance' is stored as string,
        # we might need to convert it first or use $set with a read-modify-write pattern.
        # For now, let's assume direct $inc works on numerical string if MongoDB allows that,
        # or that balance is handled consistently as a number *within* MongoDB once converted.
        # However, to be safe and consistent with storing balance as string,
        # we should ensure all balance updates convert to string.
        # A more robust solution might involve storing balance as a float/double in MongoDB
        # if precision issues are deemed acceptable for the application's scale,
        # or use MongoDB's Decimal128 type if available and supported by driver.
        # For now, converting `amount` to string when updating is the safest bet for string-stored balance.
        
        # This part requires careful consideration: if balance is stored as string, $inc won't work as expected.
        # It's better to fetch, convert to Decimal, perform arithmetic, convert back to string, and then $set.
        # Or, switch to MongoDB's Decimal128 if the driver and MongoDB version support it.
        # For the scope of this fix, let's assume balance in DB is meant to be a numerical type for $inc.
        # If it's string, then the conversion logic needs to be applied carefully to $inc or a $set.
        # Let's modify this to fetch, update, then save.

        # Ensure amount is always a Decimal
        amount_decimal = Decimal(str(amount)) # Convert to string first to handle float inputs safely
        
        # Fetch the current account
        account_data = await self.collection.find_one({"_id": ObjectId(account_id)})
        if not account_data:
            return False
        
        # Ensure current_balance is always a Decimal, handling various potential storage types
        balance_from_db = account_data.get('balance', '0.00')
        if isinstance(balance_from_db, str):
            current_balance = Decimal(balance_from_db)
        elif isinstance(balance_from_db, (int, float)):
            current_balance = Decimal(str(balance_from_db)) # Convert float/int to string then to Decimal
        elif isinstance(balance_from_db, Decimal):
            current_balance = balance_from_db
        else:
            current_balance = Decimal('0.00') # Default if type is unexpected
            
        new_balance = current_balance + amount_decimal
        
        result = await self.collection.update_one(
            {"_id": ObjectId(account_id)},
            {"$set": {"balance": str(new_balance)}}
        )
        return result.modified_count == 1