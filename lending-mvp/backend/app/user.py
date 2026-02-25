import strawberry
from typing import List, Optional
from fastapi import HTTPException, status
from strawberry.types import Info
from datetime import datetime

# Import models and schemas
from .models import UserInDB, UserCreate, UserUpdate, PyObjectId
from .schema import UserType, UserCreateInput, UserUpdateInput, LoginInput, LoginResponse, UserResponse, UsersResponse, LogoutResponse
from .database import get_users_collection
from .database.crud import UserCRUD
from .auth.security import verify_password, create_access_token

def convert_user_db_to_user_type(user_db: UserInDB) -> UserType:
    """Convert UserInDB to UserType schema"""
    return UserType(
        id=str(user_db.id),
        email=user_db.email,
        username=user_db.username,
        full_name=user_db.full_name,
        is_active=user_db.is_active,
        role=user_db.role,
        created_at=user_db.created_at,
        updated_at=user_db.updated_at
    )

@strawberry.type
class Query:
    @strawberry.field
    async def me(self, info: Info) -> Optional[UserType]:
        """Get currently authenticated user"""
        current_user: UserInDB = info.context.get("current_user")
        if not current_user:
            return None
        return convert_user_db_to_user_type(current_user)

    @strawberry.field
    async def users(self, info: Info, skip: int = 0, limit: int = 100) -> UsersResponse:
        """Get all users"""
        current_user: UserInDB = info.context.get("current_user")
        if not current_user or current_user.role != "admin":
            raise Exception("Not authorized")

        try:
            users_collection = get_users_collection()
            user_crud = UserCRUD(users_collection)
            
            users_db = await user_crud.get_users(skip=skip, limit=limit)
            total = await user_crud.count_users()
            
            users = [convert_user_db_to_user_type(user_db) for user_db in users_db]
            
            return UsersResponse(
                success=True,
                message="Users retrieved successfully",
                users=users,
                total=total
            )
        except Exception as e:
            return UsersResponse(
                success=False,
                message=f"Error retrieving users: {str(e)}",
                users=[],
                total=0
            )

    @strawberry.field
    async def user(self, info: Info, user_id: str) -> UserResponse:
        """Get user by ID"""
        current_user: UserInDB = info.context.get("current_user")
        if not current_user or (current_user.role != "admin" and str(current_user.id) != user_id):
            raise Exception("Not authorized")

        try:
            users_collection = get_users_collection()
            user_crud = UserCRUD(users_collection)
            
            user_db = await user_crud.get_user_by_id(user_id)
            if not user_db:
                return UserResponse(
                    success=False,
                    message="User not found"
                )
            
            user = convert_user_db_to_user_type(user_db)
            return UserResponse(
                success=True,
                message="User retrieved successfully",
                user=user
            )
        except Exception as e:
            return UserResponse(
                success=False,
                message=f"Error retrieving user: {str(e)}"
            )

@strawberry.type
class Mutation:
    @strawberry.field
    async def login(self, info: Info, input: LoginInput) -> LoginResponse:
        """User login"""
        print(f"--- Login attempt for username: {input.username} ---")
        
        request = info.context.get("request")
        redis = request.app.state.redis
        
        if redis:
            # Simple rate limiting by username
            # Key expires after 5 minutes
            rate_limit_key = f"login_limit:{input.username}"
            attempts = redis.get(rate_limit_key)
            if attempts and int(attempts) >= 5:
                print(f"--- Rate limit exceeded for {input.username} ---")
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Too many login attempts. Please try again later."
                )
            
            # Increment attempts and set expiry for 5 minutes
            redis.incr(rate_limit_key)
            redis.expire(rate_limit_key, 300)

        users_collection = get_users_collection()
        user_crud = UserCRUD(users_collection)

        # Get user by username or email
        user_db = await user_crud.get_user_by_username(input.username)
        if not user_db:
            user_db = await user_crud.get_user_by_email(input.username)

        print(f"User found in DB: {'Yes' if user_db else 'No'}")

        if user_db:
            password_ok = verify_password(input.password, user_db.hashed_password)
            print(f"Password verification result: {password_ok}")
            if password_ok:
                # Clear rate limit on successful login
                if redis:
                    redis.delete(f"login_limit:{input.username}")
            else:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Incorrect username or password"
                )
        else:
            # Still raise the same error to avoid user enumeration
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password"
            )

        if not user_db.is_active:
            print(f"User is inactive.")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Inactive user"
            )

        print("--- Login successful ---")
        access_token = create_access_token(data={"sub": str(user_db.id)})
        user = convert_user_db_to_user_type(user_db)

        return LoginResponse(
            access_token=access_token,
            token_type="bearer",
            user=user
        )

    @strawberry.field
    async def create_user(self, info: Info, input: UserCreateInput) -> UserResponse:
        """Create a new user"""
        # current_user: UserInDB = info.context.get("current_user")
        # if not current_user or current_user.role != "admin":
        #     raise Exception("Not authorized")

        try:
            users_collection = get_users_collection()
            user_crud = UserCRUD(users_collection)

            # Check if user already exists
            existing_user = await user_crud.get_user_by_email(input.email)
            if existing_user:
                return UserResponse(
                    success=False,
                    message="User with this email already exists"
                )

            existing_user = await user_crud.get_user_by_username(input.username)
            if existing_user:
                return UserResponse(
                    success=False,
                    message="User with this username already exists"
                )

            user_create = UserCreate(
                email=input.email,
                username=input.username,
                full_name=input.full_name,
                password=input.password,
                role=input.role
            )

            user_db = await user_crud.create_user(user_create)
            print(f"--- User created successfully: Email={user_db.email}, Username={user_db.username} ---")
            user = convert_user_db_to_user_type(user_db)

            return UserResponse(
                success=True,
                message="User created successfully",
                user=user
            )
        except Exception as e:
            return UserResponse(
                success=False,
                message=f"Error creating user: {str(e)}"
            )

    @strawberry.field
    async def update_user(self, info: Info, user_id: str, input: UserUpdateInput) -> UserResponse:
        """Update a user"""
        current_user: UserInDB = info.context.get("current_user")
        if not current_user or (current_user.role != "admin" and str(current_user.id) != user_id):
            raise Exception("Not authorized")

        try:
            users_collection = get_users_collection()
            user_crud = UserCRUD(users_collection)

            user_update = UserUpdate(
                email=input.email,
                username=input.username,
                full_name=input.full_name,
                is_active=input.is_active,
                role=input.role,
                password=input.password
            )

            user_db = await user_crud.update_user(user_id, user_update)
            if not user_db:
                return UserResponse(
                    success=False,
                    message="User not found"
                )

            user = convert_user_db_to_user_type(user_db)
            return UserResponse(
                success=True,
                message="User updated successfully",
                user=user
            )
        except Exception as e:
            return UserResponse(
                success=False,
                message=f"Error updating user: {str(e)}"
            )

    @strawberry.field
    async def delete_user(self, info: Info, user_id: str) -> UserResponse:
        """Delete a user"""
        current_user: UserInDB = info.context.get("current_user")
        if not current_user or current_user.role != "admin":
            raise Exception("Not authorized")

        try:
            users_collection = get_users_collection()
            user_crud = UserCRUD(users_collection)

            success = await user_crud.delete_user(user_id)
            if not success:
                return UserResponse(
                    success=False,
                    message="User not found"
                )

            return UserResponse(
                success=True,
                message="User deleted successfully"
            )
        except Exception as e:
            return UserResponse(
                success=False,
                message=f"Error deleting user: {str(e)}"
            )

    @strawberry.field
    async def logout(self, info: Info) -> LogoutResponse:
        """User logout - blacklist the token"""
        token = info.context.get("token")
        request = info.context.get("request")
        
        if not token:
            return LogoutResponse(success=False, message="No active session found")
            
        try:
            # Get redis from app state
            redis = request.app.state.redis
            if redis:
                # Blacklist the token for 30 minutes (matching token expiry)
                # In a real app, you might want to calculate remaining TTL
                redis.setex(f"blacklist:{token}", 1800, "true")
                print(f"--- Token blacklisted: {token} ---")
            
            return LogoutResponse(success=True, message="Logged out successfully")
        except Exception as e:
            print(f"Error during logout: {e}")
            return LogoutResponse(success=False, message=f"Logout failed: {str(e)}")
    