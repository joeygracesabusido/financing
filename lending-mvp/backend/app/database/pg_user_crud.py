from typing import List, Optional, Any
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from ..auth.security import get_password_hash, verify_password
from ..models import UserCreate, UserUpdate
from .pg_core_models import User


class UserCRUD:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_user(self, user: UserCreate) -> Any:
        hashed_password = get_password_hash(user.password)
        db_user = User(
            email=user.email,
            username=user.username,
            full_name=user.full_name,
            hashed_password=hashed_password,
            role=user.role,
            branch_id=user.branch_id,
            branch_code=user.branch_code,
            is_active=True,
        )
        self.db.add(db_user)
        await self.db.commit()
        await self.db.refresh(db_user)
        return db_user

    async def get_user_by_id(self, user_id: str) -> Optional[Any]:
        result = await self.db.execute(
            select(User).where(User.id == user_id)
        )
        return result.scalar_one_or_none()

    async def get_user_by_email(self, email: str) -> Optional[Any]:
        result = await self.db.execute(
            select(User).where(User.email == email)
        )
        return result.scalar_one_or_none()

    async def get_user_by_username(self, username: str) -> Optional[Any]:
        result = await self.db.execute(
            select(User).where(User.username == username)
        )
        return result.scalar_one_or_none()

    async def get_users(self, skip: int = 0, limit: int = 100) -> List[Any]:
        result = await self.db.execute(
            select(User).offset(skip).limit(limit)
        )
        return result.scalars().all()

    async def count_users(self) -> int:
        result = await self.db.execute(select(select(User).alias().count()))
        return result.scalar()

    async def update_user(self, user_id: str, user_update: UserUpdate) -> Optional[Any]:
        db_user = await self.get_user_by_id(user_id)
        if not db_user:
            return None

        update_data = user_update.model_dump(exclude_none=True)
        if "password" in update_data:
            update_data["hashed_password"] = get_password_hash(user_update.password)
            del update_data["password"]

        for field, value in update_data.items():
            setattr(db_user, field, value)

        await self.db.commit()
        await self.db.refresh(db_user)
        return db_user

    async def delete_user(self, user_id: str) -> bool:
        db_user = await self.get_user_by_id(user_id)
        if not db_user:
            return False
        await self.db.delete(db_user)
        await self.db.commit()
        return True