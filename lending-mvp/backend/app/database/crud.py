from typing import List, Optional
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorCollection
from ..auth.security import get_password_hash, verify_password
from ..models import UserInDB, UserCreate, UserUpdate
from ..config import settings
class UserCRUD:
    def __init__(self, collection: AsyncIOMotorCollection):
        self.collection = collection

    async def create_user(self, user: UserCreate) -> UserInDB:
        hashed_password = get_password_hash(user.password)

        # Create model WITHOUT generating a dummy id yet
        user_in_db = UserInDB(
            **user.model_dump(exclude={"password"}),
            hashed_password=hashed_password,
            # Do NOT rely on default_factory here — we'll set real id after insert
        )

        # Prepare document for insert — let MongoDB generate _id
        doc = user_in_db.model_dump(
            by_alias=True,
            exclude={"id"},           # exclude the pydantic 'id' field
            exclude_unset=True,       # optional: cleaner
        )

        result = await self.collection.insert_one(doc)

        # Now set the real _id that MongoDB created
        user_in_db.id = result.inserted_id

        # Optional: refresh timestamps if needed (but your defaults are fine)

        return user_in_db

    

    

    async def get_user_by_id(self, user_id: str) -> Optional[UserInDB]:
        if not ObjectId.is_valid(user_id):
            return None
        user_data = await self.collection.find_one({"_id": ObjectId(user_id)})
        if user_data:
            return UserInDB.model_validate(user_data)
        return None

    async def get_user_by_email(self, email: str) -> Optional[UserInDB]:
        user_data = await self.collection.find_one({"email": email})
        if user_data:
            return UserInDB.model_validate(user_data)
        return None

    async def get_user_by_username(self, username: str) -> Optional[UserInDB]:
        user_data = await self.collection.find_one({"username": username})
        if user_data:
            return UserInDB.model_validate(user_data)
        return None

    async def get_users(self, skip: int = 0, limit: int = 100) -> List[UserInDB]:
        users_data = await self.collection.find().skip(skip).limit(limit).to_list(length=limit)
        return [UserInDB.model_validate(user_data) for user_data in users_data]
    
    async def count_users(self) -> int:
        return await self.collection.count_documents({})

    async def update_user(self, user_id: str, user_update: UserUpdate) -> Optional[UserInDB]:
        if not ObjectId.is_valid(user_id):
            return None

        update_data = user_update.model_dump(exclude_unset=True)
        if "password" in update_data:
            update_data["hashed_password"] = get_password_hash(user_update.password)
            del update_data["password"]

        if update_data:
            result = await self.collection.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": update_data}
            )
            if result.modified_count == 1:
                return await self.get_user_by_id(user_id)
        return None

    async def delete_user(self, user_id: str) -> bool:
        if not ObjectId.is_valid(user_id):
            return False
        result = await self.collection.delete_one({"_id": ObjectId(user_id)})
        return result.deleted_count == 1