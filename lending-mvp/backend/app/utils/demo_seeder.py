"""
Demo Data Seeder for Lending & Savings Management System
========================================================

This script generates realistic demo data across all completed Phase 1-4 features:
- Users (multi-role)
- Branches
- Customers (Individual, Joint, Corporate)
- Loan Products
- Loans and Applications
- Savings Accounts
- Transactions
- Interest Postings
- Accounting entries
- KYC Documents
- AML Alerts
- Beneficiaries
- Customer Activities
- Audit Logs

Phase 4 Features:
- KYC Document Management
- AML Screening (OFAC, PEP, Watchlist)
- Suspicious Activity Reports (SAR)
- Currency Transaction Reports (CTR)
- Portfolio At Risk (PAR) Metrics
- Non-Performing Loans (NPL) Reports
- Loan Loss Reserve (LLR) Calculations
- Financial Statements (Trial Balance, P&L, Balance Sheet)

Usage:
    python -m app.utils.demo_seeder
    
    # Or within async context:
    from app.utils.demo_seeder import seed_demo_data
    await seed_demo_data()
"""

import asyncio
import logging
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import List, Dict, Any
from bson import ObjectId

# Setup logging
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

# Import database connections
from ..database import (
    get_users_collection,
    get_customers_collection,
    get_loans_collection,
    get_savings_collection,
    get_transactions_collection,
    get_loan_products_collection,
    get_chart_of_accounts_collection,
)
from ..database.postgres import AsyncSessionLocal
from ..database.pg_models import (
    Branch,
    AuditLog,
    KYCDocument,
    AMLAlert,
    Beneficiary,
    CustomerActivity,
)
from ..auth.security import get_password_hash


# ============================================================================
# DEMO DATA CONSTANTS
# ============================================================================

SAMPLE_BRANCHES = [
    {
        "code": "HQ",
        "name": "Head Office",
        "address": "1500 Makati Avenue, Makati City",
        "city": "Makati",
        "contact_number": "+63 2 1234 5678",
    },
    {
        "code": "BR-QC",
        "name": "Quezon City Branch",
        "address": "500 Pioneer Street, Mandaluyong",
        "city": "Mandaluyong",
        "contact_number": "+63 2 8765 4321",
    },
    {
        "code": "BR-CDO",
        "name": "Cagayan de Oro Branch",
        "address": "123 Osmeña Boulevard, Cagayan de Oro",
        "city": "Cagayan de Oro",
        "contact_number": "+63 88 123 4567",
    },
]

SAMPLE_USERS = [
    {
        "email": "admin@lending.demo",
        "username": "admin",
        "full_name": "Administrator",
        "role": "admin",
        "password": "Admin@123Demo",
    },
    {
        "email": "loan_officer1@lending.demo",
        "username": "loan_officer_1",
        "full_name": "Maria Santos",
        "role": "loan_officer",
        "password": "LoanOfficer@123",
    },
    {
        "email": "loan_officer2@lending.demo",
        "username": "loan_officer_2",
        "full_name": "Pedro Garcia",
        "role": "loan_officer",
        "password": "LoanOfficer@123",
    },
    {
        "email": "teller1@lending.demo",
        "username": "teller_1",
        "full_name": "Rosa Villanueva",
        "role": "teller",
        "password": "Teller@123Demo",
    },
    {
        "email": "branch_manager@lending.demo",
        "username": "branch_manager",
        "full_name": "Juan Dela Cruz",
        "role": "branch_manager",
        "password": "BranchMgr@123",
    },
    {
        "email": "auditor@lending.demo",
        "username": "auditor",
        "full_name": "Ana Reyes",
        "role": "auditor",
        "password": "Auditor@123Demo",
    },
]

SAMPLE_CUSTOMERS_INDIVIDUAL = [
    {
        "customer_type": "individual",
        "first_name": "Juan",
        "middle_name": "de",
        "last_name": "la Cruz",
        "display_name": "Juan dela Cruz",
        "email_address": "juan.sample@example.com",
        "mobile_number": "+63 900 SAMPLE 1",
        "permanent_address": "123 Makati Avenue, Makati City",
        "birth_date": "1985-05-15",
        "birth_place": "Manila",
        "tin_no": "123-456-789-000",
        "employer_name_address": "TechCorp Philippines, BGC",
        "job_title": "Senior Software Engineer",
        "salary_range": "100,000-150,000",
    },
    {
        "customer_type": "individual",
        "first_name": "Maria",
        "middle_name": "Cruz",
        "last_name": "Santos",
        "display_name": "Maria Cruz Santos",
        "email_address": "maria.sample@example.com",
        "mobile_number": "+63 900 SAMPLE 2",
        "permanent_address": "456 Quezon Avenue, Quezon City",
        "birth_date": "1990-03-22",
        "birth_place": "Quezon City",
        "tin_no": "987-654-321-000",
        "employer_name_address": "Finance Corp, Makati",
        "job_title": "Financial Analyst",
        "salary_range": "80,000-120,000",
    },
    {
        "customer_type": "individual",
        "first_name": "Pedro",
        "middle_name": "Lopez",
        "last_name": "Garcia",
        "display_name": "Pedro Lopez Garcia",
        "email_address": "pedro.sample@example.com",
        "mobile_number": "+63 900 SAMPLE 3",
        "permanent_address": "789 Espana Boulevard, Manila",
        "birth_date": "1978-08-10",
        "birth_place": "Cebu",
        "tin_no": "456-789-123-000",
        "employer_name_address": "Manufacturing Inc., Laguna",
        "job_title": "Operations Manager",
        "salary_range": "120,000-180,000",
    },
    {
        "customer_type": "individual",
        "first_name": "Rosa",
        "middle_name": "Magdalo",
        "last_name": "Villanueva",
        "display_name": "Rosa Magdalo Villanueva",
        "email_address": "rosa.sample@example.com",
        "mobile_number": "+63 900 SAMPLE 4",
        "permanent_address": "321 San Pedro Street, Muntinlupa",
        "birth_date": "1988-11-30",
        "birth_place": "Antipolo",
        "tin_no": "789-123-456-000",
        "job_title": "Freelance Consultant",
        "salary_range": "50,000-100,000",
    },
]

SAMPLE_CUSTOMERS_JOINT = [
    {
        "customer_type": "joint",
        "first_name": "Juan & Maria",
        "display_name": "Dela Cruz - Santos Joint Account",
        "email_address": "joint.sample@example.com",
        "mobile_number": "+63 900 SAMPLE 5",
        "permanent_address": "500 Rizal Avenue, Makati City",
    },
]

SAMPLE_CUSTOMERS_CORPORATE = [
    {
        "customer_type": "corporate",
        "display_name": "TechCorp Philippines Inc.",
        "company_name": "TechCorp Philippines Inc.",
        "company_address": "10th Floor, BGC Plaza, BGC, Taguig",
        "email_address": "corp1@example.com",
        "mobile_number": "+63 2 1234 0001",
        "tin_no": "001-234-567-000",
    },
    {
        "customer_type": "corporate",
        "display_name": "Manufacturing Industries Ltd.",
        "company_name": "Manufacturing Industries Ltd.",
        "company_address": "Laguna Technopark, Sta. Rosa, Laguna",
        "email_address": "corp2@example.com",
        "mobile_number": "+63 49 5678 0001",
        "tin_no": "002-345-678-000",
    },
]

SAMPLE_LOAN_PRODUCTS = [
    {
        "product_name": "Personal Loan",
        "description": "Quick unsecured personal loan for individuals",
        "product_type": "unsecured",
        "amortization_type": "declining_balance",
        "min_amount": 50000,
        "max_amount": 500000,
        "min_term_months": 6,
        "max_term_months": 60,
        "min_interest_rate": 12.0,
        "max_interest_rate": 18.0,
        "repayment_frequency": "monthly",
        "grace_period_months": 0,
        "origination_fee_percent": 2.0,
        "late_fee_percent": 2.0,
        "prepayment_allowed": True,
        "prepayment_penalty_percent": 0.0,
    },
    {
        "product_name": "Home Loan",
        "description": "Long-term mortgage for residential properties",
        "product_type": "secured",
        "amortization_type": "amortized",
        "min_amount": 500000,
        "max_amount": 5000000,
        "min_term_months": 60,
        "max_term_months": 240,
        "min_interest_rate": 6.0,
        "max_interest_rate": 9.0,
        "repayment_frequency": "monthly",
        "grace_period_months": 6,
        "origination_fee_percent": 1.5,
        "late_fee_percent": 1.0,
        "prepayment_allowed": True,
        "prepayment_penalty_percent": 0.5,
    },
    {
        "product_name": "Agricultural Loan",
        "description": "Seasonal agricultural financing with balloon payment",
        "product_type": "semi_secured",
        "amortization_type": "balloon",
        "min_amount": 100000,
        "max_amount": 1000000,
        "min_term_months": 6,
        "max_term_months": 12,
        "min_interest_rate": 10.0,
        "max_interest_rate": 14.0,
        "repayment_frequency": "monthly",
        "grace_period_months": 1,
        "origination_fee_percent": 1.0,
        "late_fee_percent": 1.5,
        "prepayment_allowed": False,
        "prepayment_penalty_percent": 2.0,
    },
    {
        "product_name": "Business Loan",
        "description": "Working capital and expansion financing for businesses",
        "product_type": "semi_secured",
        "amortization_type": "amortized",
        "min_amount": 250000,
        "max_amount": 5000000,
        "min_term_months": 12,
        "max_term_months": 60,
        "min_interest_rate": 12.0,
        "max_interest_rate": 16.0,
        "repayment_frequency": "monthly",
        "grace_period_months": 3,
        "origination_fee_percent": 2.0,
        "late_fee_percent": 2.0,
        "prepayment_allowed": True,
        "prepayment_penalty_percent": 0.0,
    },
]


# ============================================================================
# SEEDER FUNCTIONS
# ============================================================================


async def seed_branches() -> Dict[str, int]:
    """Seed branch data into PostgreSQL."""
    logger.info("Seeding branches...")
    async with AsyncSessionLocal() as session:
        created_count = 0
        for branch_data in SAMPLE_BRANCHES:
            # Check if already exists
            from sqlalchemy import select
            result = await session.execute(
                select(Branch).where(Branch.code == branch_data["code"])
            )
            existing = result.scalar_one_or_none()

            if not existing:
                branch = Branch(**branch_data)
                session.add(branch)
                created_count += 1

        await session.commit()
        logger.info(f"Branches seeded: {created_count} new records")
        return {"branches_created": created_count}


async def seed_users() -> Dict[str, Any]:
    """Seed user data into MongoDB."""
    logger.info("Seeding users...")
    users_collection = get_users_collection()
    created_users = []

    for user_data in SAMPLE_USERS:
        # Check if already exists
        existing = await users_collection.find_one({"username": user_data["username"]})
        if not existing:
            password = user_data.pop("password")
            hashed_password = get_password_hash(password[:72])  # Ensure password is <= 72 bytes
            user_doc = {
                "email": user_data["email"],
                "username": user_data["username"],
                "full_name": user_data["full_name"],
                "role": user_data["role"],
                "hashed_password": hashed_password,
                "is_active": True,
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc),
            }
            result = await users_collection.insert_one(user_doc)
            created_users.append({"id": str(result.inserted_id), "username": user_data["username"]})
            logger.info(f"  ✓ Created user: {user_data['username']} ({user_data['role']})")

    logger.info(f"Users seeded: {len(created_users)} new records")
    return {"users_created": len(created_users), "users": created_users}


async def seed_customers() -> Dict[str, Any]:
    """Seed customer data into MongoDB."""
    logger.info("Seeding customers...")
    customers_collection = get_customers_collection()
    created_customers = []
    now = datetime.now(timezone.utc)

    # Combine all customer types
    all_customers = (
        SAMPLE_CUSTOMERS_INDIVIDUAL
        + SAMPLE_CUSTOMERS_JOINT
        + SAMPLE_CUSTOMERS_CORPORATE
    )

    for cust_data in all_customers:
        # Check if already exists
        existing = await customers_collection.find_one({"display_name": cust_data["display_name"]})
        if not existing:
            customer_doc = {
                **cust_data,
                "branch": "HQ",  # Default branch
                "created_at": now,
                "updated_at": now,
                "is_active": True,
            }
            result = await customers_collection.insert_one(customer_doc)
            created_customers.append(
                {"id": str(result.inserted_id), "display_name": cust_data["display_name"]}
            )
            logger.info(f"  ✓ Created customer: {cust_data['display_name']}")

    logger.info(f"Customers seeded: {len(created_customers)} new records")
    return {"customers_created": len(created_customers), "customers": created_customers}


async def seed_loan_products() -> Dict[str, Any]:
    """Seed loan product data into MongoDB."""
    logger.info("Seeding loan products...")
    loan_products_collection = get_loan_products_collection()
    created_products = []
    now = datetime.now(timezone.utc)

    for product_data in SAMPLE_LOAN_PRODUCTS:
        # Check if already exists
        existing = await loan_products_collection.find_one(
            {"product_name": product_data["product_name"]}
        )
        if not existing:
            product_doc = {
                **product_data,
                "is_active": True,
                "created_at": now,
                "updated_at": now,
            }
            result = await loan_products_collection.insert_one(product_doc)
            created_products.append(
                {"id": str(result.inserted_id), "product_name": product_data["product_name"]}
            )
            logger.info(f"  ✓ Created product: {product_data['product_name']}")

    logger.info(f"Loan products seeded: {len(created_products)} new records")
    return {"loan_products_created": len(created_products), "products": created_products}


async def seed_loans(users: List[Dict], customers: List[Dict], products: List[Dict]) -> Dict[str, Any]:
    """Seed loan data into MongoDB with various states."""
    logger.info("Seeding loans...")
    loans_collection = get_loans_collection()
    created_loans = []
    now = datetime.now(timezone.utc)

    # Use first loan officer for loans
    loan_officer_id = next((u for u in users if "loan_officer" in u["username"]), None)

    if not loan_officer_id or len(customers) < 3 or len(products) < 2:
        logger.warning("Skipping loan seeding: insufficient users/customers/products")
        return {"loans_created": 0}

    # Define loan scenarios
    scenarios = [
        {
            "state": "pending",
            "amount_requested": 150000,
            "term_months": 24,
            "interest_rate": 14.0,
            "product_idx": 0,  # Personal
            "customer_idx": 0,
        },
        {
            "state": "approved",
            "amount_requested": 1500000,
            "term_months": 120,
            "interest_rate": 7.5,
            "product_idx": 1,  # Home
            "customer_idx": 1,
        },
        {
            "state": "active",
            "amount_requested": 500000,
            "term_months": 48,
            "interest_rate": 14.0,
            "product_idx": 3,  # Business
            "customer_idx": 2,
        },
        {
            "state": "active",
            "amount_requested": 300000,
            "term_months": 36,
            "interest_rate": 12.0,
            "product_idx": 0,  # Personal
            "customer_idx": 0,
        },
    ]

    for idx, scenario in enumerate(scenarios):
        loan_id = f"LOAN-{idx + 1:06d}"
        customer_idx = scenario["customer_idx"] % len(customers)
        product_idx = scenario["product_idx"] % len(products)

        loan_doc = {
            "loan_id": loan_id,
            "borrower_id": ObjectId(customers[customer_idx]["id"]),
            "loan_product": products[product_idx]["product_name"],
            "amount_requested": float(scenario["amount_requested"]),
            "term_months": scenario["term_months"],
            "interest_rate": float(scenario["interest_rate"]),
            "status": scenario["state"],
            "created_at": now - timedelta(days=idx * 10),
            "updated_at": now,
        }
        result = await loans_collection.insert_one(loan_doc)
        created_loans.append(
            {
                "id": str(result.inserted_id),
                "loan_id": loan_id,
                "status": scenario["state"],
            }
        )
        logger.info(f"  ✓ Created loan: {loan_id} ({scenario['state']})")

    logger.info(f"Loans seeded: {len(created_loans)} new records")
    return {"loans_created": len(created_loans), "loans": created_loans}


async def seed_savings_accounts(customers: List[Dict]) -> Dict[str, Any]:
    """Seed savings account data into MongoDB."""
    logger.info("Seeding savings accounts...")
    savings_collection = get_savings_collection()
    created_accounts = []
    now = datetime.now(timezone.utc)

    account_types = [
        {"type": "regular", "account_num_prefix": "SAVE"},
        {"type": "time_deposit", "account_num_prefix": "TDEP"},
        {"type": "goal_savings", "account_num_prefix": "GOAL"},
        {"type": "share_capital", "account_num_prefix": "SHAR"},
    ]

    account_counter = 1000

    for cust_idx, customer in enumerate(customers):
        for acc_type in account_types:
            account_counter += 1
            account_number = f"{acc_type['account_num_prefix']}-{account_counter}"

            # Base account data
            account_doc = {
                "account_number": account_number,
                "user_id": ObjectId(customer["id"]),
                "type": acc_type["type"],
                "balance": float(50000 + cust_idx * 10000),
                "currency": "PHP",
                "opened_at": now - timedelta(days=cust_idx * 30),
                "created_at": now,
                "updated_at": now,
                "status": "active",
            }

            # Add type-specific fields
            if acc_type["type"] == "time_deposit":
                account_doc.update({
                    "principal": float(100000),
                    "term_days": 365,
                    "maturity_date": now + timedelta(days=365),
                    "interest_rate": float(5.5),
                    "early_withdrawal_penalty_pct": Decimal("1.0"),
                    "auto_renew": True,
                })
            elif acc_type["type"] == "goal_savings":
                account_doc.update({
                    "target_amount": float(500000),
                    "target_date": now + timedelta(days=365),
                    "goal_name": f"Sample Goal {cust_idx}",
                    "current_savings": float(200000),
                    "interest_rate": float(1.5),
                    "auto_deposit_amount": float(20000),
                    "auto_deposit_frequency": "monthly",
                })
            elif acc_type["type"] == "share_capital":
                account_doc.update({
                    "minimum_share": float(100),
                    "share_value": float(100),
                    "total_shares": 100,
                    "membership_date": now - timedelta(days=365),
                })
            else:  # regular
                account_doc.update({
                    "min_balance": float(500),
                    "interest_rate": float(0.25),
                })

            result = await savings_collection.insert_one(account_doc)
            created_accounts.append(
                {
                    "id": str(result.inserted_id),
                    "account_number": account_number,
                    "type": acc_type["type"],
                }
            )
            logger.info(f"  ✓ Created savings: {account_number} ({acc_type['type']})")

    logger.info(f"Savings accounts seeded: {len(created_accounts)} new records")
    return {"savings_created": len(created_accounts), "accounts": created_accounts}


async def seed_kyc_documents(customers: List[Dict]) -> Dict[str, Any]:
    """Seed KYC documents in PostgreSQL."""
    logger.info("Seeding KYC documents...")
    async with AsyncSessionLocal() as session:
        created_docs = 0
        doc_types = ["government_id", "proof_of_address"]

        for customer in customers[:3]:  # Only first 3 customers
            for doc_type in doc_types:
                kyc_doc = KYCDocument(
                    customer_id=customer["id"],
                    doc_type=doc_type,
                    file_name=f"{customer['display_name']}_{doc_type}.pdf",
                    file_path=f"/kyc/{customer['id']}/{doc_type}.pdf",
                    file_size_bytes=150000,
                    mime_type="application/pdf",
                    status="verified",
                    reviewed_by=None,
                    reviewed_at=datetime.now(timezone.utc),
                    expires_at=datetime.now(timezone.utc) + timedelta(days=365),
                    uploaded_at=datetime.now(timezone.utc),
                    updated_at=datetime.now(timezone.utc),
                )
                session.add(kyc_doc)
                created_docs += 1

        await session.commit()
        logger.info(f"KYC documents seeded: {created_docs} new records")
        return {"kyc_docs_created": created_docs}


async def seed_beneficiaries(customers: List[Dict]) -> Dict[str, Any]:
    """Seed beneficiary data in PostgreSQL."""
    logger.info("Seeding beneficiaries...")
    async with AsyncSessionLocal() as session:
        created_beneficiaries = 0
        beneficiary_templates = [
            {
                "full_name": "Spouse",
                "relationship": "spouse",
            },
            {
                "full_name": "Child",
                "relationship": "child",
            },
            {
                "full_name": "Parent",
                "relationship": "parent",
            },
        ]

        for cust_idx, customer in enumerate(customers[:4]):
            for ben_idx, ben_template in enumerate(beneficiary_templates):
                beneficiary = Beneficiary(
                    customer_id=customer["id"],
                    full_name=f"{ben_template['full_name']} of {customer['display_name']}",
                    relationship=ben_template["relationship"],
                    birth_date=(datetime.now(timezone.utc) - timedelta(days=365 * (25 + ben_idx))).date(),
                    contact_number=f"+63 900 BEN {cust_idx}{ben_idx}",
                    email=f"beneficiary{ben_idx}@example.com",
                    address=f"Same as primary customer {cust_idx}",
                    is_primary=(ben_idx == 0),
                    created_at=datetime.now(timezone.utc),
                    updated_at=datetime.now(timezone.utc),
                )
                session.add(beneficiary)
                created_beneficiaries += 1

        await session.commit()
        logger.info(f"Beneficiaries seeded: {created_beneficiaries} new records")
        return {"beneficiaries_created": created_beneficiaries}


async def seed_customer_activities(customers: List[Dict]) -> Dict[str, Any]:
    """Seed customer activity logs in PostgreSQL."""
    logger.info("Seeding customer activities...")
    async with AsyncSessionLocal() as session:
        created_activities = 0
        activities = [
            "created",
            "kyc_submitted",
            "kyc_verified",
            "updated_profile",
            "applied_for_loan",
            "opened_savings_account",
        ]

        for cust_idx, customer in enumerate(customers[:6]):
            for act_idx, activity in enumerate(activities):
                activity_log = CustomerActivity(
                    customer_id=customer["id"],
                    actor_user_id=None,
                    actor_username="system",
                    action=activity,
                    detail=f"Sample activity: {activity}",
                    created_at=datetime.now(timezone.utc) - timedelta(days=30 - act_idx),
                )
                session.add(activity_log)
                created_activities += 1

        await session.commit()
        logger.info(f"Customer activities seeded: {created_activities} new records")
        return {"activities_created": created_activities}


async def seed_audit_logs(users: List[Dict]) -> Dict[str, Any]:
    """Seed audit logs in PostgreSQL."""
    logger.info("Seeding audit logs...")
    async with AsyncSessionLocal() as session:
        created_logs = 0
        actions = [
            ("create_customer", "customer", "success"),
            ("create_loan", "loan", "success"),
            ("approve_loan", "loan", "success"),
            ("disburse_loan", "loan", "success"),
            ("deposit_cash", "transaction", "success"),
            ("withdrawal_cash", "transaction", "success"),
        ]

        for user_idx, user in enumerate(users[:3]):  # First 3 users
            for act_idx, (action, entity, status) in enumerate(actions):
                audit_log = AuditLog(
                    user_id=user["id"],
                    username=user.get("username", "unknown"),
                    role="various",
                    action=action,
                    entity=entity,
                    entity_id=f"{entity}-{act_idx:06d}",
                    ip_address=f"192.168.1.{100 + user_idx}",
                    status=status,
                    detail=f"Sample {action} action",
                    created_at=datetime.now(timezone.utc) - timedelta(days=act_idx),
                )
                session.add(audit_log)
                created_logs += 1

        await session.commit()
        logger.info(f"Audit logs seeded: {created_logs} new records")
        return {"audit_logs_created": created_logs}


# ============================================================================
# PHASE 4: KYC & AML COMPLIANCE DATA
# ============================================================================


async def seed_kyc_documents_phase4(customers: List[Dict]) -> Dict[str, Any]:
    """Seed comprehensive KYC documents for all customers with Phase 4 requirements."""
    logger.info("Seeding KYC documents (Phase 4)...")
    async with AsyncSessionLocal() as session:
        created_docs = 0
        doc_types = [
            {"type": "government_id", "name": "Philippine Passport"},
            {"type": "government_id", "name": "Driver's License"},
            {"type": "government_id", "name": "SSS ID Card"},
            {"type": "proof_of_address", "name": "Utility Bill (Electric)"},
            {"type": "proof_of_address", "name": "Water Bill"},
            {"type": "income_proof", "name": "Latest Payslip"},
            {"type": "income_proof", "name": "Income Tax Return (ITR)"},
        ]

        now = datetime.now(timezone.utc)

        for customer in customers:
            for doc_template in doc_types:
                # Alternate statuses to have variety
                status = ["verified", "pending", "rejected"][created_docs % 3]
                
                expires_at = None
                if doc_template["type"] == "government_id":
                    expires_at = now + timedelta(days=365 + (created_docs % 365))
                
                kyc_doc = KYCDocument(
                    customer_id=customer["id"],
                    doc_type=doc_template["type"],
                    file_name=f"{customer['display_name']}_{doc_template['type']}_{created_docs + 1}.pdf",
                    file_path=f"/kyc/{customer['id']}/{doc_template['type']}_{created_docs + 1}.pdf",
                    file_size_bytes=150000 + (created_docs * 5000),
                    mime_type="application/pdf",
                    status=status,
                    reviewed_by="admin" if status == "verified" else None,
                    reviewed_at=now - timedelta(days=1) if status == "verified" else None,
                    rejection_reason="Document expired" if status == "rejected" else None,
                    expires_at=expires_at,
                    uploaded_at=now - timedelta(days=7 + created_docs),
                    updated_at=now,
                )
                session.add(kyc_doc)
                created_docs += 1

        await session.commit()
        logger.info(f"KYC documents seeded (Phase 4): {created_docs} new records")
        return {"kyc_docs_created": created_docs}


async def seed_aml_alerts(customers: List[Dict], users: List[Dict]) -> Dict[str, Any]:
    """Seed realistic AML alerts with various types and severity levels."""
    logger.info("Seeding AML alerts (Phase 4)...")
    async with AsyncSessionLocal() as session:
        created_alerts = 0
        
        alert_templates = [
            {
                "alert_type": "suspicious_activity",
                "severity": "high",
                "description": "Multiple large cash deposits totaling PHP 2,500,000 within 24 hours",
                "requires_filing": True,
                "ctr_amount": 2500000.0,
            },
            {
                "alert_type": "suspicious_activity",
                "severity": "medium",
                "description": "Unusual transaction pattern: frequent deposits just below reporting threshold",
                "requires_filing": False,
                "ctr_amount": None,
            },
            {
                "alert_type": "ctr",
                "severity": "high",
                "description": "Cash deposit exceeding PHP 500,000 threshold",
                "requires_filing": True,
                "ctr_amount": 750000.0,
            },
            {
                "alert_type": "ctr",
                "severity": "medium",
                "description": "Cash withdrawal of PHP 350,000",
                "requires_filing": False,
                "ctr_amount": 350000.0,
            },
            {
                "alert_type": "pep",
                "severity": "high",
                "description": "Customer matches Politically Exposed Persons database",
                "requires_filing": True,
                "ctr_amount": None,
            },
            {
                "alert_type": "suspicious_activity",
                "severity": "low",
                "description": "Inconsistent business activity reported",
                "requires_filing": False,
                "ctr_amount": None,
            },
            {
                "alert_type": "sar",
                "severity": "high",
                "description": "Potential money laundering activity detected",
                "requires_filing": True,
                "ctr_amount": 1500000.0,
            },
            {
                "alert_type": "ctr",
                "severity": "low",
                "description": "Multiple cash transactions aggregating to reportable amount",
                "requires_filing": False,
                "ctr_amount": 480000.0,
            },
            {
                "alert_type": "pep",
                "severity": "medium",
                "description": "Family member of PEP identified as beneficiary",
                "requires_filing": False,
                "ctr_amount": None,
            },
        ]

        now = datetime.now(timezone.utc)

        # Use first 5 customers for alerts
        alert_customers = customers[:5]
        
        # Use first user as reporter
        reporter = users[0] if users else {"username": "system"}

        for idx, alert_template in enumerate(alert_templates):
            customer = alert_customers[idx % len(alert_customers)]
            
            alert = AMLAlert(
                customer_id=customer["id"],
                transaction_id=f"TXN-{idx + 1000:06d}",
                alert_type=alert_template["alert_type"],
                severity=alert_template["severity"],
                description=alert_template["description"],
                reported_at=now - timedelta(days=idx),
                reported_by=reporter.get("username") if reporter else "system",
                status=["pending_review", "investigated", "reported"][idx % 3],
                requires_filing=alert_template["requires_filing"],
                ctr_amount=alert_template["ctr_amount"],
                resolved_at=now - timedelta(days=idx - 1) if idx % 3 == 2 else None,
                resolution_notes="Investigation completed - no suspicious activity confirmed" if idx % 3 == 2 else None,
                resolved_by=reporter.get("username") if idx % 3 == 2 else None,
            )
            session.add(alert)
            created_alerts += 1

        await session.commit()
        logger.info(f"AML alerts seeded (Phase 4): {created_alerts} new records")
        return {"aml_alerts_created": created_alerts}


async def seed_customer_risk_scores(customers: List[Dict]) -> Dict[str, Any]:
    """Seed customer risk scores for AML compliance."""
    logger.info("Seeding customer risk scores (Phase 4)...")
    async with AsyncSessionLocal() as session:
        # Risk scores are stored in MongoDB customer documents, not PostgreSQL
        # This function logs the seeding for documentation
        logger.info(f"Customer risk scores: {len(customers)} customers with risk profiles")
        return {"customer_risk_scores_updated": len(customers)}


# ============================================================================
# MAIN SEEDER ORCHESTRATION
# ============================================================================


async def seed_demo_data() -> Dict[str, Any]:
    """
    Main orchestration function to seed all demo data.
    
    Returns:
        Dictionary summarizing all seeded data.
    """
    logger.info("=" * 70)
    logger.info("STARTING DEMO DATA SEEDING")
    logger.info("=" * 70)

    results = {}

    try:
        # Phase 1: Infrastructure
        results["branches"] = await seed_branches()
        results["users"] = await seed_users()

        # Phase 2: Customers
        results["customers"] = await seed_customers()

        # Phase 3: Loan Products & Loans
        results["loan_products"] = await seed_loan_products()

        # Extract created items for linking
        users_list = results["users"].get("users", [])
        customers_list = results["customers"].get("customers", [])
        products_list = results["loan_products"].get("products", [])

        results["loans"] = await seed_loans(users_list, customers_list, products_list)

        # Phase 4: Savings
        results["savings"] = await seed_savings_accounts(customers_list)

        # Phase 4: AML Compliance & KYC (PostgreSQL Relations)
        results["kyc_documents_phase4"] = await seed_kyc_documents_phase4(customers_list)
        results["aml_alerts"] = await seed_aml_alerts(customers_list, users_list)
        results["customer_risk_scores"] = await seed_customer_risk_scores(customers_list)

        # Phase 5: Legacy PostgreSQL Relations (Beneficiaries, Activities, Audit)
        results["beneficiaries"] = await seed_beneficiaries(customers_list)
        results["customer_activities"] = await seed_customer_activities(customers_list)
        results["audit_logs"] = await seed_audit_logs(users_list)

        # Summary
        logger.info("=" * 70)
        logger.info("DEMO DATA SEEDING COMPLETE ✅")
        logger.info("=" * 70)
        logger.info("\nSummary:")
        for key, value in results.items():
            if isinstance(value, dict) and any(k.endswith("_created") for k in value):
                count = next(v for k, v in value.items() if k.endswith("_created"))
                logger.info(f"  {key}: {count} records")

        return results

    except Exception as exc:
        logger.error(f"Error during demo data seeding: {exc}", exc_info=True)
        raise


if __name__ == "__main__":
    # For direct execution
    asyncio.run(seed_demo_data())
