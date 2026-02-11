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
    
    async def get_all_savings_accounts(self, search_term: Optional[str] = None) -> List[SavingsAccountBase]:
        pipeline = []

        if search_term:
            # Add import for ObjectId from bson at the top if not already there
            # Assuming 'db' instance is available globally or passed around, 
            # and 'customers' collection is part of it.
            # This aggregation is run on the 'savings' collection (self.collection).

            # First, lookup customer details
            pipeline.append({
                "$lookup": {
                    "from": "customers",  # The collection to join with (assuming 'customers' is the collection name)
                    "localField": "user_id",  # Field from the input documents (savings)
                    "foreignField": "_id",  # Field from the "from" documents (customers)
                    "as": "customer_info"  # Output array field
                }
            })
            # Unwind the customer_info array. Since user_id is a single value, this will be at most one element.
            pipeline.append({
                "$unwind": {
                    "path": "$customer_info",
                    "preserveNullAndEmptyArrays": True  # Keep accounts even if no matching customer
                }
            })

            # Then, apply the search filter
            pipeline.append({
                "$match": {
                    "$or": [
                        {"account_number": {"$regex": search_term, "$options": "i"}},
                        {"customer_info.display_name": {"$regex": search_term, "$options": "i"}}
                    ]
                }
            })
        
        # Add a projection stage to reshape the documents back to SavingsAccountBase structure
        # (or as close as possible for Pydantic parsing)
        # We need to make sure the _id is an ObjectId again if it was converted to string during lookup,
        # and remove the temporary 'customer_info' if it's not part of SavingsAccountBase
        pipeline.append({
            "$project": {
                "_id": "$_id",
                "account_number": "$account_number",
                "user_id": "$user_id",
                "type": "$type",
                "balance": "$balance",
                "currency": "$currency",
                "opened_at": "$opened_at",
                "created_at": "$created_at",
                "updated_at": "$updated_at",
                "status": "$status",
                # Do not project customer_info into the SavingsAccountBase directly
                # It's only used for matching. The customer will be resolved by the GraphQL resolver.
            }
        })

        accounts_data_list = await self.collection.aggregate(pipeline).to_list(length=100)
        
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