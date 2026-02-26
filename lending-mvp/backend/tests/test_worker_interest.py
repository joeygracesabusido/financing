import pytest
from datetime import datetime
from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock, patch

# Test daily interest computation logic
def test_daily_interest_computation_logic():
    """Test the mathematical logic for daily interest calculation"""
    # Test case 1: Regular savings account
    balance = Decimal("10000.00")
    annual_rate = Decimal("0.50")  # 0.50% annual interest
    
    daily_rate = annual_rate / Decimal("365")
    daily_interest = (balance * daily_rate) / Decimal("100")
    
    assert float(daily_interest) == pytest.approx(0.137, rel=1e-3)
    assert float(daily_rate) == pytest.approx(0.00137, rel=1e-4)
    
    # Test case 2: High-yield savings account
    balance2 = Decimal("50000.00")
    annual_rate2 = Decimal("4.00")  # 4% annual interest
    
    daily_rate2 = annual_rate2 / Decimal("365")
    daily_interest2 = (balance2 * daily_rate2) / Decimal("100")
    
    assert float(daily_interest2) == pytest.approx(5.479, rel=1e-3)
    assert float(daily_rate2) == pytest.approx(0.01096, rel=1e-4)
    
    # Test case 3: Time deposit account
    balance3 = Decimal("100000.00")
    annual_rate3 = Decimal("5.50")  # 5.5% annual interest
    
    daily_rate3 = annual_rate3 / Decimal("365")
    daily_interest3 = (balance3 * daily_rate3) / Decimal("100")
    
    assert float(daily_interest3) == pytest.approx(15.068, rel=1e-3)


@pytest.mark.asyncio
async def test_accrue_daily_interest_integration():
    """Test the accrue_daily_interest worker function"""
    with patch('app.worker.get_savings_collection') as mock_get_savings_collection, \
         patch('app.worker.SavingsCRUD') as mock_savings_crud_class, \
         patch('app.worker.post_transaction') as mock_post_transaction:
        
        # Mock the savings collection
        mock_savings_collection = MagicMock()
        mock_get_savings_collection.return_value = mock_savings_collection
        
        # Create mock savings account with interest rate
        mock_account = MagicMock()
        mock_account.id = "60d5f48c8f1d7c5a4b8e3d21"
        mock_account.account_number = "SAV001234567"
        mock_account.balance = 10000.00
        mock_account.currency = "PHP"
        mock_account.status = "active"
        mock_account.interest_rate = 0.50  # 0.50% annual
        
        # Mock the CRUD operations
        mock_savings_crud = MagicMock()
        mock_savings_crud.get_all_savings_accounts = AsyncMock(return_value=[mock_account])
        mock_savings_crud.update_balance = AsyncMock(return_value=True)
        mock_savings_crud_class.return_value = mock_savings_crud
        
        # Import after patching
        from app.worker import accrue_daily_interest
        
        # Create context
        ctx = {
            'redis': MagicMock(),
            'db': MagicMock()
        }
        
        # Run the function
        result = await accrue_daily_interest(ctx)
        
        # Verify results
        assert result['status'] == 'success'
        assert result['accounts_processed'] == 1
        assert Decimal(result['total_interest_posted']) > Decimal('0')
        
        # Verify update_balance was called
        mock_savings_crud.update_balance.assert_called_once()
        
        # Verify post_transaction was called
        mock_post_transaction.assert_called_once()


def test_interest_computation_edge_cases():
    """Test edge cases for interest computation"""
    # Edge case 1: Zero balance
    balance = Decimal("0.00")
    annual_rate = Decimal("0.50")
    daily_rate = annual_rate / Decimal("365")
    daily_interest = (balance * daily_rate) / Decimal("100")
    assert daily_interest == Decimal("0.00")
    
    # Edge case 2: Very small balance
    balance = Decimal("100.00")
    annual_rate = Decimal("0.50")
    daily_rate = annual_rate / Decimal("365")
    daily_interest = (balance * daily_rate) / Decimal("100")
    assert float(daily_interest) == pytest.approx(0.00137, rel=1e-2)
    
    # Edge case 3: Large balance
    balance = Decimal("1000000.00")
    annual_rate = Decimal("0.50")
    daily_rate = annual_rate / Decimal("365")
    daily_interest = (balance * daily_rate) / Decimal("100")
    assert float(daily_interest) == pytest.approx(13.699, rel=1e-2)


if __name__ == "__main__":
    # Run tests
    test_daily_interest_computation_logic()
    test_interest_computation_edge_cases()
    print("All interest computation tests passed!")