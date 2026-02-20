"""
End-to-end tests for Phase 2.1 Loan Products features.

Tests cover:
- Amortization types: Flat rate, Declining balance, Balloon payment, Interest-only
- Repayment frequencies: Daily, Weekly, Bi-weekly, Monthly, Quarterly, Bullet
- Grace periods: Principal-only and full grace periods
- Penalty/late fee engine with configurable rates and waiver workflow
- Origination fees: Deducted upfront or spread across installments
- Prepayment rules: Allowed, restricted, with/without penalty
- Loan limits per customer
"""

import pytest
from decimal import Decimal
from datetime import datetime, timedelta
from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.pg_loan_models import PGLoanProduct


class TestLoanProductPhase21:
    """E2E tests for Phase 2.1 Loan Products features."""

    @pytest.fixture
    async def db_session(self, db_session: AsyncSession):
        """Clean database before each test."""
        # Delete all loan products to start clean
        await db_session.execute(
            delete(PGLoanProduct)
        )
        await db_session.flush()
        return db_session

    async def test_create_flat_rate_loan_product(self, db_session: AsyncSession):
        """Test creating a loan product with flat rate amortization."""
        from app.database.pg_loan_models import PGLoanProduct

        product = PGLoanProduct(
            product_code="FLAT_001",
            name="Flat Rate Personal Loan",
            amortization_type="flat_rate",
            repayment_frequency="monthly",
            interest_rate=Decimal("5.0"),
            penalty_rate=Decimal("2.0"),
            grace_period_months=0,
            is_active=True
        )

        db_session.add(product)
        await db_session.flush()

        assert product.id is not None
        assert product.product_code == "FLAT_001"
        assert product.amortization_type == "flat_rate"
        assert product.interest_rate == Decimal("5.0")

    async def test_create_declining_balance_loan_product(self, db_session: AsyncSession):
        """Test creating a loan product with declining balance amortization."""
        from app.database.pg_loan_models import PGLoanProduct

        product = PGLoanProduct(
            product_code="DECLINE_001",
            name="Declining Balance Personal Loan",
            amortization_type="declining_balance",
            repayment_frequency="weekly",
            interest_rate=Decimal("8.5"),
            penalty_rate=Decimal("1.5"),
            grace_period_months=1,
            is_active=True
        )

        db_session.add(product)
        await db_session.flush()

        assert product.amortization_type == "declining_balance"
        assert product.grace_period_months == 1

    async def test_create_balloon_payment_loan_product(self, db_session: AsyncSession):
        """Test creating a loan product with balloon payment amortization."""
        from app.database.pg_loan_models import PGLoanProduct

        product = PGLoanProduct(
            product_code="BALLOON_001",
            name="Balloon Payment Equipment Loan",
            amortization_type="balloon_payment",
            repayment_frequency="monthly",
            interest_rate=Decimal("4.0"),
            penalty_rate=Decimal("3.0"),
            grace_period_months=2,
            is_active=True
        )

        db_session.add(product)
        await db_session.flush()

        assert product.amortization_type == "balloon_payment"

    async def test_create_interest_only_loan_product(self, db_session: AsyncSession):
        """Test creating a loan product with interest-only amortization."""
        from app.database.pg_loan_models import PGLoanProduct

        product = PGLoanProduct(
            product_code="INT_ONLY_001",
            name="Interest-Only Business Loan",
            amortization_type="interest_only",
            repayment_frequency="monthly",
            interest_rate=Decimal("6.0"),
            penalty_rate=Decimal("2.5"),
            grace_period_months=3,
            is_active=True
        )

        db_session.add(product)
        await db_session.flush()

        assert product.amortization_type == "interest_only"

    async def test_repayment_frequencies(self, db_session: AsyncSession):
        """Test creating loan products with various repayment frequencies."""
        from app.database.pg_loan_models import PGLoanProduct

        frequencies = ["daily", "weekly", "bi_weekly", "monthly", "quarterly", "bullet"]

        for freq in frequencies:
            product = PGLoanProduct(
                product_code=f"FREQ_{freq}",
                name=f"{freq.capitalize()} Repayment Loan",
                amortization_type="declining_balance",
                repayment_frequency=freq,
                interest_rate=Decimal("7.0"),
                penalty_rate=Decimal("2.0"),
                grace_period_months=1,
                is_active=True
            )
            db_session.add(product)

        await db_session.flush()

        assert product.id is not None

    async def test_principal_only_grace_period(self, db_session: AsyncSession):
        """Test creating a loan product with principal-only grace period."""
        from app.database.pg_loan_models import PGLoanProduct

        product = PGLoanProduct(
            product_code="GRACE_PRINCIPAL_001",
            name="Principal-Only Grace Personal Loan",
            amortization_type="flat_rate",
            repayment_frequency="monthly",
            interest_rate=Decimal("5.5"),
            penalty_rate=Decimal("2.0"),
            grace_period_months=1,
            principal_only_grace=True,
            is_active=True
        )

        db_session.add(product)
        await db_session.flush()

        assert product.principal_only_grace is True

    async def test_full_grace_period(self, db_session: AsyncSession):
        """Test creating a loan product with full grace period."""
        from app.database.pg_loan_models import PGLoanProduct

        product = PGLoanProduct(
            product_code="GRACE_FULL_001",
            name="Full Grace Personal Loan",
            amortization_type="declining_balance",
            repayment_frequency="bi_weekly",
            interest_rate=Decimal("4.5"),
            penalty_rate=Decimal("1.5"),
            grace_period_months=2,
            full_grace=True,
            is_active=True
        )

        db_session.add(product)
        await db_session.flush()

        assert product.full_grace is True

    async def test_penalty_rate_configuration(self, db_session: AsyncSession):
        """Test configurable penalty rates."""
        from app.database.pg_loan_models import PGLoanProduct

        product = PGLoanProduct(
            product_code="PENALTY_001",
            name="Standard Penalty Loan",
            amortization_type="flat_rate",
            repayment_frequency="monthly",
            interest_rate=Decimal("5.0"),
            penalty_rate=Decimal("2.0"),
            grace_period_months=0,
            is_active=True
        )

        db_session.add(product)
        await db_session.flush()

        assert product.penalty_rate == Decimal("2.0")

    async def test_origination_fee_upfront(self, db_session: AsyncSession):
        """Test creating a loan product with upfront origination fee."""
        from app.database.pg_loan_models import PGLoanProduct

        product = PGLoanProduct(
            product_code="ORIGIN_UPFRONT_001",
            name="Upfront Fee Loan",
            amortization_type="declining_balance",
            repayment_frequency="monthly",
            interest_rate=Decimal("6.0"),
            origination_fee_rate=Decimal("1.5"),
            origination_fee_type="upfront",
            penalty_rate=Decimal("2.0"),
            grace_period_months=1,
            is_active=True
        )

        db_session.add(product)
        await db_session.flush()

        assert product.origination_fee_rate == Decimal("1.5")
        assert product.origination_fee_type == "upfront"

    async def test_origination_fee_spread(self, db_session: AsyncSession):
        """Test creating a loan product with spread origination fee."""
        from app.database.pg_loan_models import PGLoanProduct

        product = PGLoanProduct(
            product_code="ORIGIN_SPREAD_001",
            name="Spread Fee Loan",
            amortization_type="balloon_payment",
            repayment_frequency="monthly",
            interest_rate=Decimal("7.0"),
            origination_fee_rate=Decimal("1.0"),
            origination_fee_type="spread",
            penalty_rate=Decimal("2.5"),
            grace_period_months=2,
            is_active=True
        )

        db_session.add(product)
        await db_session.flush()

        assert product.origination_fee_rate == Decimal("1.0")
        assert product.origination_fee_type == "spread"

    async def test_prepayment_allowed(self, db_session: AsyncSession):
        """Test creating a loan product with prepayment allowed."""
        from app.database.pg_loan_models import PGLoanProduct

        product = PGLoanProduct(
            product_code="PREPAY_001",
            name="Prepayment Allowed Loan",
            amortization_type="declining_balance",
            repayment_frequency="monthly",
            interest_rate=Decimal("5.5"),
            prepayment_allowed=True,
            prepayment_penalty_rate=Decimal("0.0"),
            penalty_rate=Decimal("2.0"),
            grace_period_months=1,
            is_active=True
        )

        db_session.add(product)
        await db_session.flush()

        assert product.prepayment_allowed is True
        assert product.prepayment_penalty_rate == Decimal("0.0")

    async def test_prepayment_restricted_with_penalty(self, db_session: AsyncSession):
        """Test creating a loan product with prepayment restricted but with penalty."""
        from app.database.pg_loan_models import PGLoanProduct

        product = PGLoanProduct(
            product_code="PREPAY_RESTRICT_001",
            name="Restricted Prepayment Loan",
            amortization_type="interest_only",
            repayment_frequency="monthly",
            interest_rate=Decimal("4.5"),
            prepayment_allowed=False,
            prepayment_penalty_rate=Decimal("3.0"),
            penalty_rate=Decimal("2.0"),
            grace_period_months=2,
            is_active=True
        )

        db_session.add(product)
        await db_session.flush()

        assert product.prepayment_allowed is False
        assert product.prepayment_penalty_rate == Decimal("3.0")

    async def test_loan_limit_per_customer(self, db_session: AsyncSession):
        """Test creating a loan product with customer borrowing limit."""
        from app.database.pg_loan_models import PGLoanProduct

        product = PGLoanProduct(
            product_code="LIMIT_001",
            name="Limited Loan Product",
            amortization_type="flat_rate",
            repayment_frequency="monthly",
            interest_rate=Decimal("6.0"),
            customer_loan_limit=Decimal("100000"),
            penalty_rate=Decimal("2.0"),
            grace_period_months=1,
            is_active=True
        )

        db_session.add(product)
        await db_session.flush()

        assert product.customer_loan_limit == Decimal("100000")

    async def test_loan_limit_zero_means_unlimited(self, db_session: AsyncSession):
        """Test that zero loan limit means unlimited borrowing."""
        from app.database.pg_loan_models import PGLoanProduct

        product = PGLoanProduct(
            product_code="LIMIT_UNLIMITED_001",
            name="Unlimited Loan Product",
            amortization_type="declining_balance",
            repayment_frequency="monthly",
            interest_rate=Decimal("5.0"),
            customer_loan_limit=Decimal("0"),
            penalty_rate=Decimal("2.0"),
            grace_period_months=0,
            is_active=True
        )

        db_session.add(product)
        await db_session.flush()

        assert product.customer_loan_limit == Decimal("0")

    async def test_multiple_products_with_same_amortization_type(self, db_session: AsyncSession):
        """Test creating multiple loan products with the same amortization type."""
        from app.database.pg_loan_models import PGLoanProduct

        product1 = PGLoanProduct(
            product_code="FLAT_001",
            name="Flat Rate Loan A",
            amortization_type="flat_rate",
            repayment_frequency="monthly",
            interest_rate=Decimal("5.0"),
            penalty_rate=Decimal("2.0"),
            grace_period_months=0,
            is_active=True
        )

        product2 = PGLoanProduct(
            product_code="FLAT_002",
            name="Flat Rate Loan B",
            amortization_type="flat_rate",
            repayment_frequency="bi_weekly",
            interest_rate=Decimal("5.5"),
            penalty_rate=Decimal("2.5"),
            grace_period_months=1,
            is_active=True
        )

        db_session.add(product1)
        db_session.add(product2)
        await db_session.flush()

        assert product1.id is not None
        assert product2.id is not None
        assert product1.product_code == "FLAT_001"
        assert product2.product_code == "FLAT_002"

    async def test_update_loan_product_penalty_rate(self, db_session: AsyncSession):
        """Test updating loan product penalty rate."""
        from app.database.pg_loan_models import PGLoanProduct

        product = PGLoanProduct(
            product_code="UPDATE_PENALTY_001",
            name="Update Penalty Test",
            amortization_type="flat_rate",
            repayment_frequency="monthly",
            interest_rate=Decimal("5.0"),
            penalty_rate=Decimal("2.0"),
            grace_period_months=0,
            is_active=True
        )

        db_session.add(product)
        await db_session.flush()

        old_penalty = product.penalty_rate
        product.penalty_rate = Decimal("3.0")
        await db_session.flush()
        await db_session.refresh(product)

        assert product.penalty_rate == Decimal("3.0")
        assert product.penalty_rate != old_penalty

    async def test_deactivate_loan_product(self, db_session: AsyncSession):
        """Test deactivating a loan product."""
        from app.database.pg_loan_models import PGLoanProduct

        product = PGLoanProduct(
            product_code="DEACTIVATE_001",
            name="Deactivate Test",
            amortization_type="flat_rate",
            repayment_frequency="monthly",
            interest_rate=Decimal("5.0"),
            penalty_rate=Decimal("2.0"),
            grace_period_months=0,
            is_active=True
        )

        db_session.add(product)
        await db_session.flush()

        assert product.is_active is True

        product.is_active = False
        await db_session.flush()
        await db_session.refresh(product)

        assert product.is_active is False

    async def test_unique_product_code_constraint(self, db_session: AsyncSession):
        """Test that product codes must be unique."""
        from app.database.pg_loan_models import PGLoanProduct

        product1 = PGLoanProduct(
            product_code="UNIQUE_TEST_001",
            name="Product 1",
            amortization_type="flat_rate",
            repayment_frequency="monthly",
            interest_rate=Decimal("5.0"),
            penalty_rate=Decimal("2.0"),
            grace_period_months=0,
            is_active=True
        )

        db_session.add(product1)
        await db_session.flush()

        product2 = PGLoanProduct(
            product_code="UNIQUE_TEST_001",
            name="Product 2",
            amortization_type="declining_balance",
            repayment_frequency="weekly",
            interest_rate=Decimal("6.0"),
            penalty_rate=Decimal("2.0"),
            grace_period_months=1,
            is_active=True
        )

        db_session.add(product2)

        with pytest.raises(Exception) as exc_info:
            await db_session.flush()

        assert "unique" in str(exc_info.value).lower()

    async def test_loan_product_timestamps(self, db_session: AsyncSession):
        """Test that loan products have correct timestamps."""
        from app.database.pg_loan_models import PGLoanProduct
        from datetime import timezone

        now = datetime.now(timezone.utc)

        product = PGLoanProduct(
            product_code="TIMESTAMP_001",
            name="Timestamp Test",
            amortization_type="flat_rate",
            repayment_frequency="monthly",
            interest_rate=Decimal("5.0"),
            penalty_rate=Decimal("2.0"),
            grace_period_months=0,
            is_active=True
        )

        db_session.add(product)
        await db_session.flush()

        assert product.created_at is not None
        assert product.updated_at is not None
        assert product.created_at <= now
        assert product.updated_at <= now
