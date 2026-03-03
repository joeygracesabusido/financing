"""
ENHANCED DEMO DATA SEEDER - PostgreSQL Only
============================================
This module contains enhanced seeder functions to improve demo data quality
for more realistic testing coverage. PostgreSQL-only implementation.
"""

import asyncio
import logging
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import List, Dict, Any
from sqlalchemy import select

# Setup logging
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

# Import database connections - PostgreSQL only
from ..database import get_async_session_local
from ..database.pg_core_models import User, Customer, SavingsAccount, Loan
from ..database.pg_loan_models import LoanApplication, PGLoanProduct
from ..database.pg_models import (
    Branch,
    AuditLog,
    KYCDocument,
    AMLAlert,
    Beneficiary,
    CustomerActivity,
    PEPRecord,
)
from ..database.pg_accounting_models import GLAccount, JournalEntry, JournalLine
from ..auth.security import get_password_hash


# ============================================================================
# RECOMMENDATION 1: SEED TRANSACTION HISTORY FOR SAVINGS ACCOUNTS (PG)
# ============================================================================


async def seed_savings_transactions_pg(savings_accounts: List[Dict]) -> Dict[str, Any]:
    """
    Seed realistic transaction history for all savings accounts in PostgreSQL.
    Creates deposits, withdrawals, transfers, and interest postings spanning 6 months.
    
    This enhances testing coverage for:
    - Transaction history display
    - Balance calculations
    - Interest computation
    - Account reconciliation
    """
    logger.info("Seeding savings transaction history (PostgreSQL)...")
    session_factory = get_async_session_local()
    created_transactions = 0
    
    # Skip if no savings accounts
    if not savings_accounts:
        logger.warning("No savings accounts to seed transactions for")
        return {"savings_transactions_created": 0}
    
    now = datetime.now(timezone.utc)
    
    # Generate transactions for each savings account
    for account in savings_accounts:
        account_number = account.get("account_number", "UNKNOWN")
        balance = float(account.get("balance", 50000))
        account_type = account.get("type", "regular")
        
        # Generate transactions going back 6 months
        for month_offset in range(6, -1, -1):
            txn_date = now - timedelta(days=30 * month_offset)
            
            # Monthly deposit
            deposit_amount = Decimal("5000" + str(month_offset * 100))
            if balance + deposit_amount > 500000:
                deposit_amount = balance / 2
            
            # Insert deposit into SavingsTransaction
            from sqlalchemy import insert
            deposit_data = {
                "account_id": str(account.get("id")),
                "account_number": account_number,
                "type": "deposit_cash",
                "amount": float(deposit_amount),
                "balance_after": float(balance + deposit_amount),
                "note": f"Monthly deposit - Month {6 - month_offset}",
                "reference_number": f"DEP-{txn_date.strftime('%Y%m%d')}-001",
                "created_at": txn_date,
                "processed_by": "system",
                "status": "completed",
            }
            session_factory = get_async_session_local()
            async with session_factory() as session:
                await session.execute(insert(SavingsTransaction).values(deposit_data))
                await session.flush()
                created_transactions += 1
            
            # Monthly withdrawal (for regular accounts only)
            if account_type == "regular" and month_offset % 2 == 0:
                withdrawal_amount = Decimal("1000" + str(month_offset * 50))
                if withdrawal_amount > balance + deposit_amount:
                    withdrawal_amount = (balance + deposit_amount) / 2
                
                withdrawal_data = {
                    "account_id": str(account.get("id")),
                    "account_number": account_number,
                    "type": "withdrawal_cash",
                    "amount": float(withdrawal_amount),
                    "balance_after": float(balance + deposit_amount - withdrawal_amount),
                    "note": f"Monthly withdrawal - Month {6 - month_offset}",
                    "reference_number": f"WTH-{txn_date.strftime('%Y%m%d')}-001",
                    "created_at": txn_date,
                    "processed_by": "teller_1",
                    "status": "completed",
                }
                async with session_factory() as session:
                    await session.execute(insert(SavingsTransaction).values(withdrawal_data))
                    await session.flush()
                    created_transactions += 2
            
            # Interest posting (quarterly)
            if month_offset % 3 == 0:
                interest_rate = account.get("interest_rate", 0.25) / 100
                interest_amount = (balance + deposit_amount - withdrawal_amount) * interest_rate * 3 / 100
                if interest_amount > 0:
                    interest_data = {
                        "account_id": str(account.get("id")),
                        "account_number": account_number,
                        "type": "interest_posting",
                        "amount": float(interest_amount),
                        "balance_after": float(balance + deposit_amount - withdrawal_amount + interest_amount),
                        "note": f"Interest posting (Q{6 - month_offset // 3 + 1})",
                        "reference_number": f"INT-{txn_date.strftime('%Y%m%d')}-001",
                        "created_at": txn_date,
                        "processed_by": "system",
                        "status": "completed",
                    }
                    async with session_factory() as session:
                        await session.execute(insert(SavingsTransaction).values(interest_data))
                        await session.flush()
                        created_transactions += 2
            
            # Update account balance
            current_balance = balance + deposit_amount - withdrawal_amount + interest_amount
            async with session_factory() as session:
                from sqlalchemy import update
                await session.execute(
                    update(SavingsAccount)
                    .where(SavingsAccount.account_number == account_number)
                    .values(balance=current_balance, updated_at=txn_date)
                )
    
    logger.info(f"Savings transactions seeded (PostgreSQL): {created_transactions} records")
    return {"savings_transactions_created": created_transactions}


# ============================================================================
# RECOMMENDATION 2: SEED LOAN REPAYMENT TRANSACTIONS (PG)
# ============================================================================


async def seed_loan_repayments_pg(loans: List[Dict]) -> Dict[str, Any]:
    """
    Seed repayment transactions for active loans in PostgreSQL.
    Creates monthly installments with principal and interest breakdown.
    
    This enhances testing coverage for:
    - Repayment history display
    - Amortization schedule calculations
    - Outstanding balance tracking
    - Loan closure workflows
    """
    logger.info("Seeding loan repayment transactions (PostgreSQL)...")
    session_factory = get_async_session_local()
    created_repayments = 0
    
    # Skip if no loans
    if not loans:
        logger.warning("No loans to seed repayments for")
        return {"loan_repayments_created": 0}
    
    now = datetime.now(timezone.utc)
    
    for loan in loans:
        status = loan.get("status", "")
        if status not in ["active", "paid"]:
            continue
        
        principal = loan.get("principal", 0)
        term_months = loan.get("term_months", 12)
        rate = loan.get("rate", 0) / 100 / 12
        months_paid = loan.get("months_paid", 0)
        loan_id = loan.get("id", "")
        
        if rate > 0:
            monthly_payment = principal * (rate * (1 + rate) ** term_months) / ((1 + rate) ** term_months - 1)
        else:
            monthly_payment = principal / term_months
        
        principal_per_month = monthly_payment * rate / (rate + (1 - (1 + rate) ** -term_months))
        if principal_per_month == 0:
            principal_per_month = monthly_payment / term_months
        
        # Generate repayment history for paid months
        for month_paid_num in range(1, months_paid + 1):
            repayment_date = now - timedelta(days=30 * (term_months - months_paid_num))
            
            # Calculate remaining principal
            remaining_principal = principal - (principal_per_month * month_paid_num)
            if remaining_principal < 0:
                remaining_principal = 0
            
            principal_portion = min(principal_per_month, remaining_principal)
            interest_portion = monthly_payment - principal_portion
            
            # Insert into LedgerEntry (PostgreSQL model)
            repayment_data = {
                "loan_id": loan_id,
                "account_id": loan_id,
                "type": "loan_repayment",
                "amount": float(monthly_payment),
                "principal_amount": float(principal_portion),
                "interest_amount": float(interest_portion),
                "note": f"Loan installment - Month {month_paid_num}",
                "reference_number": f"RPT-{repayment_date.strftime('%Y%m%d')}-{month_paid_num:03d}",
                "created_at": repayment_date,
                "processed_by": "customer",
                "status": "completed",
            }
            
            async with session_factory() as session:
                await session.execute(insert(LedgerEntry).values(repayment_data))
                await session.flush()
                created_repayments += 1
    
    logger.info(f"Loan repayments seeded (PostgreSQL): {created_repayments} records")
    return {"loan_repayments_created": created_repayments}


# ============================================================================
# RECOMMENDATION 3: SEED PEP RECORDS (PG)
# ============================================================================


async def seed_pep_records_comprehensive() -> Dict[str, Any]:
    """
    Seed comprehensive PEP (Politically Exposed Persons) database records in PostgreSQL.
    Includes domestic, foreign, family member, and associate PEPs.
    
    This enhances testing coverage for:
    - PEP screening alerts
    - Enhanced due diligence workflows
    - Beneficiary relationship mapping
    - Risk assessment dashboards
    """
    logger.info("Seeding comprehensive PEP records (PostgreSQL)...")
    session_factory = get_async_session_local()
    created = 0
    
    # Domestic PEPs - Government officials
    domestic_peps = [
        {
            "name": "Ernesto G. Villanueva",
            "position": "Former City Councillor",
            "country": "Philippines",
            "pep_type": "domestic_pep",
            "start_date": "2020-01-15",
            "end_date": "2023-06-30",
            "source": "Commission on Appointments",
            "risk_level": "medium"
        },
        {
            "name": "Elena Reyes-Santos",
            "position": "Regional Director, DOH",
            "country": "Philippines",
            "pep_type": "domestic_pep",
            "start_date": "2018-03-01",
            "end_date": None,
            "source": "Presidential Appointment",
            "risk_level": "high"
        },
        {
            "name": "Bonifacio T. Garcia",
            "position": "Former Congressman",
            "country": "Philippines",
            "pep_type": "domestic_pep",
            "start_date": "2016-06-30",
            "end_date": "2022-06-30",
            "source": "Congressional Records",
            "risk_level": "high"
        },
        {
            "name": "Carmela V. Cruz",
            "position": "PDEA Regional Chief (Ret.)",
            "country": "Philippines",
            "pep_type": "domestic_pep",
            "start_date": "2015-01-01",
            "end_date": "2020-12-31",
            "source": "PDEA Records",
            "risk_level": "high"
        },
    ]
    
    # Foreign PEPs
    foreign_peps = [
        {
            "name": "international_demo_pep",
            "position": "Foreign State-Owned Enterprise Director",
            "country": "International",
            "pep_type": "foreign_pep",
            "start_date": "2019-01-01",
            "end_date": None,
            "source": "OFAC List",
            "risk_level": "high"
        },
        {
            "name": "James Anderson-Smith",
            "position": "Former UK MP",
            "country": "United Kingdom",
            "pep_type": "foreign_pep",
            "start_date": "2017-07-12",
            "end_date": "2021-05-07",
            "source": "UK Parliament Records",
            "risk_level": "medium"
        },
        {
            "name": "Maria Gonzalez-Rodriguez",
            "position": "Minister of Finance",
            "country": "Spain",
            "pep_type": "foreign_pep",
            "start_date": "2021-01-01",
            "end_date": None,
            "source": "European Union Database",
            "risk_level": "high"
        },
    ]
    
    # Family Members of PEPs
    family_peps = [
        {
            "name": "Villanueva Jr., Roberto",
            "position": "Business Owner",
            "country": "Philippines",
            "pep_type": "family_member",
            "pep_relation": "son",
            "related_pep_name": "Ernesto G. Villanueva",
            "start_date": "2020-01-15",
            "end_date": "2023-06-30",
            "source": "Family Declaration",
            "risk_level": "medium"
        },
        {
            "name": "Santos, Michael",
            "position": "Real Estate Developer",
            "country": "Philippines",
            "pep_type": "family_member",
            "pep_relation": "brother",
            "related_pep_name": "Elena Reyes-Santos",
            "start_date": "2018-03-01",
            "end_date": None,
            "source": "Family Declaration",
            "risk_level": "high"
        },
    ]
    
    # Associates of PEPs
    associate_peps = [
        {
            "name": "Garcia Holdings Inc.",
            "position": "Corporation",
            "country": "Philippines",
            "pep_type": "associate",
            "pep_relation": "business_partner",
            "related_pep_name": "Bonifacio T. Garcia",
            "start_date": "2016-06-30",
            "end_date": None,
            "source": "Business Registry",
            "risk_level": "medium"
        },
        {
            "name": "Cruz Consulting Group",
            "position": "Consulting Firm",
            "country": "Philippines",
            "pep_type": "associate",
            "pep_relation": "advisor",
            "related_pep_name": "Carmela V. Cruz",
            "start_date": "2015-01-01",
            "end_date": None,
            "source": "Business Registry",
            "risk_level": "medium"
        },
    ]
    
    all_peps = domestic_peps + foreign_peps + family_peps + associate_peps
    
    async with session_factory() as session:
        for pep_data in all_peps:
            # Check if exists
            result = await session.execute(
                select(PEPRecord).filter(PEPRecord.name == pep_data["name"])
            )
            existing = result.scalar_one_or_none()
            if not existing:
                pep = PEPRecord(**pep_data)
                session.add(pep)
                created += 1
        
        await session.commit()
    
    logger.info(f"PEP records seeded (PostgreSQL): {created} new records")
    return {"pep_records_created": created}


# ============================================================================
# RECOMMENDATION 4: SEED HISTORICAL GL ENTRIES (PG)
# ============================================================================


async def seed_gl_entries_comprehensive() -> Dict[str, Any]:
    """
    Seed comprehensive GL journal entries for 12 months of financial data in PostgreSQL.
    Includes interest income, fee income, operating expenses, loan disbursements,
    and interest accruals to support Trial Balance, P&L, and Balance Sheet generation.
    
    This enhances testing coverage for:
    - Financial statement generation
    - Trial balance reports
    - Profit & Loss statements
    - Balance sheet reconciliation
    - Cash flow statements
    """
    logger.info("Seeding comprehensive GL journal entries (PostgreSQL)...")
    session_factory = get_async_session_local()
    created_entries = 0
    now = datetime.now(timezone.utc)
    
    # Ensure required GL accounts exist
    required_accounts = [
        ("1000", "Cash and Cash Equivalents", "asset"),
        ("1200", "Loans Receivable", "asset"),
        ("1300", "Fixed Assets", "asset"),
        ("2000", "Accounts Payable / Accrued Liabilities", "liability"),
        ("2100", "Customer Deposits", "liability"),
        ("3000", "Share Capital", "equity"),
        ("4100", "Interest Income", "income"),
        ("4200", "Fee Income", "income"),
        ("4300", "Other Income", "income"),
        ("5100", "Operating Expenses", "expense"),
        ("5200", "Interest Expense", "expense"),
        ("5300", "Provision for Loan Losses", "expense"),
    ]
    
    async with session_factory() as session:
        for code, name, acct_type in required_accounts:
            existing = await session.execute(
                select(GLAccount).filter(GLAccount.code == code)
            )
            if not existing.scalar_one_or_none():
                session.add(GLAccount(code=code, name=name, type=acct_type))
        await session.flush()
        
        # 12 months of historical data
        for month_offset in range(11, -1, -1):
            month_name = f"Month {month_offset + 1} 2025"
            month_date = now - timedelta(days=30 * month_offset)
            scale_factor = 1.0 + (month_offset * 0.05)
            
            interest_income = 87500.00 * scale_factor
            fee_income = 12500.00 * scale_factor
            op_expenses = 45000.00 * scale_factor
            interest_exp = 18000.00 * scale_factor
            provision = 15000.00 * scale_factor
            
            # Interest Income Entry
            interest_entry = JournalEntry(
                entry_date=month_date,
                description=f"Interest Income - {month_name}",
                journal_type="income",
                status="posted"
            )
            session.add(interest_entry)
            
            # Credit: Interest Income, Debit: Cash
            credit_line = JournalLine(
                entry_id=str(interest_entry.id),
                account_id="4100",
                debit_amount=Decimal("0.00"),
                credit_amount=interest_income,
                reference=f"INT-{month_offset:03d}"
            )
            debit_line = JournalLine(
                entry_id=str(interest_entry.id),
                account_id="1000",
                debit_amount=interest_income,
                credit_amount=Decimal("0.00"),
                reference=f"INT-{month_offset:03d}"
            )
            session.add(credit_line)
            session.add(debit_line)
            
            # Fee Income Entry
            fee_entry = JournalEntry(
                entry_date=month_date,
                description=f"Loan Fee Income - {month_name}",
                journal_type="income",
                status="posted"
            )
            session.add(fee_entry)
            
            credit_line = JournalLine(
                entry_id=str(fee_entry.id),
                account_id="4200",
                debit_amount=Decimal("0.00"),
                credit_amount=fee_income,
                reference=f"FEE-{month_offset:03d}"
            )
            debit_line = JournalLine(
                entry_id=str(fee_entry.id),
                account_id="1000",
                debit_amount=fee_income,
                credit_amount=Decimal("0.00"),
                reference=f"FEE-{month_offset:03d}"
            )
            session.add(credit_line)
            session.add(debit_line)
            
            # Operating Expenses Entry
            op_exp_entry = JournalEntry(
                entry_date=month_date,
                description=f"Operating Expenses - {month_name}",
                journal_type="expense",
                status="posted"
            )
            session.add(op_exp_entry)
            
            debit_line = JournalLine(
                entry_id=str(op_exp_entry.id),
                account_id="5100",
                debit_amount=op_expenses,
                credit_amount=Decimal("0.00"),
                reference=f"EXP-{month_offset:03d}"
            )
            credit_line = JournalLine(
                entry_id=str(op_exp_entry.id),
                account_id="1000",
                debit_amount=Decimal("0.00"),
                credit_amount=op_expenses,
                reference=f"EXP-{month_offset:03d}"
            )
            session.add(debit_line)
            session.add(credit_line)
            
            # Interest Expense Entry
            interest_exp_entry = JournalEntry(
                entry_date=month_date,
                description=f"Interest Expense - {month_name}",
                journal_type="expense",
                status="posted"
            )
            session.add(interest_exp_entry)
            
            debit_line = JournalLine(
                entry_id=str(interest_exp_entry.id),
                account_id="5200",
                debit_amount=interest_exp,
                credit_amount=Decimal("0.00"),
                reference=f"INTX-{month_offset:03d}"
            )
            credit_line = JournalLine(
                entry_id=str(interest_exp_entry.id),
                account_id="1000",
                debit_amount=Decimal("0.00"),
                credit_amount=interest_exp,
                reference=f"INTX-{month_offset:03d}"
            )
            session.add(debit_line)
            session.add(credit_line)
            
            # Provision for Loan Losses Entry
            provision_entry = JournalEntry(
                entry_date=month_date,
                description=f"Provision for Loan Losses - {month_name}",
                journal_type="expense",
                status="posted"
            )
            session.add(provision_entry)
            
            debit_line = JournalLine(
                entry_id=str(provision_entry.id),
                account_id="5300",
                debit_amount=provision,
                credit_amount=Decimal("0.00"),
                reference=f"PROV-{month_offset:03d}"
            )
            credit_line = JournalLine(
                entry_id=str(provision_entry.id),
                account_id="1200",
                debit_amount=Decimal("0.00"),
                credit_amount=provision,
                reference=f"PROV-{month_offset:03d}"
            )
            session.add(debit_line)
            session.add(credit_line)
            
            created_entries += 1
        
        await session.commit()
    
    logger.info(f"GL journal entries seeded (PostgreSQL): {created_entries} entries")
    return {"gl_entries_created": created_entries}


# ============================================================================
# RECOMMENDATION 5: SEED HISTORICAL DATA WITH DATES (PG)
# ============================================================================


async def seed_historical_data_pg() -> Dict[str, Any]:
    """
    Seed historical data with realistic date ranges spanning 2-3 years in PostgreSQL.
    Creates old customer activities, audit logs, and loan statuses.
    
    This enhances testing coverage for:
    - Historical trend analysis
    - Long-term customer journey tracking
    - Audit trail verification
    - Historical reporting
    """
    logger.info("Seeding historical data (PostgreSQL)...")
    session_factory = get_async_session_local()
    created = 0
    
    async with session_factory() as session:
        # Seed old customer activities (2 years back)
        activities = [
            "created", "kyc_submitted", "kyc_verified", "updated_profile",
            "applied_for_loan", "opened_savings_account", "made_payment",
            "loan_disbursed", "loan_closed", "account_closed"
        ]
        
        for idx, activity in enumerate(activities):
            days_ago = 730 - (idx * 60)
            if days_ago < 0:
                days_ago = 30 + idx
            
            activity_log = CustomerActivity(
                customer_id=f"CUST-{1000 + idx}",
                actor_user_id=None,
                actor_username="system",
                action=activity,
                detail=f"Sample activity: {activity}",
                created_at=datetime.now(timezone.utc) - timedelta(days=days_ago),
            )
            session.add(activity_log)
            created += 1
        
        # Seed old audit logs (2 years back)
        actions = [
            ("create_customer", "customer", "success"),
            ("create_loan", "loan", "success"),
            ("approve_loan", "loan", "success"),
            ("disburse_loan", "loan", "success"),
            ("deposit_cash", "transaction", "success"),
            ("withdrawal_cash", "transaction", "success"),
            ("reject_loan", "loan", "failure"),
            ("update_customer", "customer", "success"),
        ]
        
        for act_idx, (action, entity, status) in enumerate(actions):
            days_ago = 730 - (act_idx * 50)
            if days_ago < 0:
                days_ago = 30 + act_idx
            
            audit_log = AuditLog(
                user_id=f"USER-{100 + act_idx}",
                username=f"user_{act_idx}",
                role="various",
                action=action,
                entity=entity,
                entity_id=f"{entity}-{act_idx:06d}",
                ip_address=f"192.168.1.{100 + act_idx}",
                status=status,
                detail=f"Sample {action} action",
                created_at=datetime.now(timezone.utc) - timedelta(days=days_ago),
            )
            session.add(audit_log)
            created += 1
        
        await session.commit()
    
    logger.info(f"Historical data seeded (PostgreSQL): {created} records")
    return {"historical_data_created": created}


# ============================================================================
# ENHANCED MAIN ORCHESTRATION (PostgreSQL Only)
# ============================================================================


async def seed_demo_data_enhanced() -> Dict[str, Any]:
    """
    Main orchestration function to seed all enhanced demo data into PostgreSQL.
    Includes all 5 recommendations for better test coverage.
    """
    logger.info("=" * 70)
    logger.info("STARTING ENHANCED DEMO DATA SEEDING (PostgreSQL)")
    logger.info("=" * 70)

    results = {}

    try:
        # Recommendation 1: Seed savings transaction history
        # Note: Requires savings accounts to exist first
        results["savings_transactions"] = await seed_savings_transactions_pg([])
        
        # Recommendation 2: Seed loan repayments
        # Note: Requires loans to exist first
        results["loan_repayments"] = await seed_loan_repayments_pg([])
        
        # Recommendation 3: Seed PEP records
        results["pep_records"] = await seed_pep_records_comprehensive()
        
        # Recommendation 4: Seed GL entries
        results["gl_entries"] = await seed_gl_entries_comprehensive()
        
        # Recommendation 5: Seed historical data
        results["historical_data"] = await seed_historical_data_pg()
        
        # Summary
        logger.info("=" * 70)
        logger.info("ENHANCED DEMO DATA SEEDING COMPLETE ✅")
        logger.info("=" * 70)
        logger.info("Summary:")
        for key, value in results.items():
            if isinstance(value, dict):
                count_key = next(
                    (k for k in value if k.endswith("_created")),
                    None,
                )
                if count_key:
                    logger.info(f"  {key}: {value[count_key]} records")

        return results

    except Exception as exc:
        logger.error(f"Error during demo data seeding: {exc}", exc_info=True)
        raise


if __name__ == "__main__":
    asyncio.run(seed_demo_data_enhanced())
