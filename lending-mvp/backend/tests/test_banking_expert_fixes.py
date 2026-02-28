import asyncio
import pytest
from decimal import Decimal
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
from lending_mvp.backend.app.basemodel.savings_model import RegularSavings
from lending_mvp.backend.app.basemodel.transaction_model import TransactionBase
from lending_mvp.backend.app.database.savings_crud import SavingsCRUD
from lending_mvp.backend.app.database.transaction_crud import TransactionCRUD
from lending_mvp.backend.app.models import PyObjectId

# Setup MongoDB for testing
MONGODB_URL = "mongodb://localhost:27017"
DB_NAME = "test_lending_db"

async def test_decimal_precision_and_min_balance():
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DB_NAME]
    savings_collection = db["savings"]
    transactions_collection = db["transactions"]
    
    # Clear test data
    await savings_collection.delete_many({})
    await transactions_collection.delete_many({})
    
    savings_crud = SavingsCRUD(savings_collection)
    transaction_crud = TransactionCRUD(transactions_collection, savings_crud)
    
    user_id = PyObjectId()
    
    # 1. Create a regular savings account with 1000.00 balance
    account = RegularSavings(
        account_number="12345678",
        user_id=user_id,
        balance=Decimal("1000.00"),
        min_balance=Decimal("500.00")
    )
    created_account = await savings_crud.create_savings_account(account)
    assert created_account.balance == Decimal("1000.00")
    
    # 2. Attempt a withdrawal that would violate min balance (1000 - 600 = 400 < 500)
    violation_transaction = TransactionBase(
        account_id=created_account.id,
        transaction_type="withdrawal",
        amount=Decimal("600.00"),
        notes="Testing min balance violation"
    )
    result = await transaction_crud.create_transaction(violation_transaction)
    assert result is None, "Should have failed due to min balance violation"
    
    # 3. Perform a valid withdrawal (1000 - 400 = 600 >= 500)
    valid_transaction = TransactionBase(
        account_id=created_account.id,
        transaction_type="withdrawal",
        amount=Decimal("400.00"),
        notes="Valid withdrawal"
    )
    result = await transaction_crud.create_transaction(valid_transaction)
    assert result is not None, "Valid withdrawal should have succeeded"
    
    # 4. Verify balance in DB
    updated_account = await savings_crud.get_savings_account_by_id(str(created_account.id))
    assert updated_account.balance == Decimal("600.00")
    
    # 5. Test precision (10.001 should not be rounded if we use Decimals properly)
    # However, our models use 2 decimal places by convention in financial apps, 
    # but Decimal itself preserves whatever we give it.
    precision_deposit = TransactionBase(
        account_id=created_account.id,
        transaction_type="deposit",
        amount=Decimal("10.001"),
        notes="Testing precision"
    )
    await transaction_crud.create_transaction(precision_deposit)
    updated_account = await savings_crud.get_savings_account_by_id(str(created_account.id))
    assert updated_account.balance == Decimal("610.001")

    print("All tests passed!")
    client.close()

if __name__ == "__main__":
    asyncio.run(test_decimal_precision_and_min_balance())
