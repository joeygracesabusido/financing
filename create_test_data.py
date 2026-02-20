#!/usr/bin/env python3
"""
Test Data Generator for Financing App
Creates sample customers, loans, and transactions for testing
"""

from datetime import datetime, timedelta
from decimal import Decimal
from pymongo import MongoClient
from bson import ObjectId

# Connect to MongoDB
print("🔗 Connecting to MongoDB...")
client = MongoClient('mongodb://localhost:27017/')
db = client['financing_db']

customers_collection = db['customers']
loans_collection = db['loans']
transactions_collection = db['loan_transactions']
    
    # Clear existing data
    print("🧹 Clearing existing test data...")
    customers_collection.delete_many({})
    loans_collection.delete_many({})
    transactions_collection.delete_many({})
    
    # Create sample customers
    print("👥 Creating sample customers...")
    customers_data = [
        {
            "_id": ObjectId(),
            "customer_type": "individual",
            "first_name": "John",
            "middle_name": "Michael",
            "last_name": "Doe",
            "display_name": "John Doe",
            "email_address": "john.doe@example.com",
            "mobile_number": "555-0101",
            "permanent_address": "123 Main St, City, State",
            "branch": "Main Branch",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "_id": ObjectId(),
            "customer_type": "individual",
            "first_name": "Jane",
            "middle_name": "Elizabeth",
            "last_name": "Smith",
            "display_name": "Jane Smith",
            "email_address": "jane.smith@example.com",
            "mobile_number": "555-0102",
            "permanent_address": "456 Oak Ave, City, State",
            "branch": "Main Branch",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "_id": ObjectId(),
            "customer_type": "individual",
            "first_name": "Robert",
            "middle_name": "James",
            "last_name": "Johnson",
            "display_name": "Robert Johnson",
            "email_address": "robert.johnson@example.com",
            "mobile_number": "555-0103",
            "permanent_address": "789 Pine Rd, City, State",
            "branch": "Main Branch",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
    ]
    
    result = customers_collection.insert_many(customers_data)
    print(f"✅ Created {len(result.inserted_ids)} customers")
    customer_ids = result.inserted_ids
    
    # Create sample loans
    print("💰 Creating sample loans...")
    loans_data = [
        {
            "_id": ObjectId(),
            "borrower_id": customer_ids[0],
            "loan_id": "LOAN001",
            "loan_product": "Home Loan",
            "amount_requested": Decimal("100000"),
            "term_months": 36,
            "interest_rate": Decimal("5.5"),
            "status": "active",
            "created_at": datetime.utcnow() - timedelta(days=60),
            "updated_at": datetime.utcnow()
        },
        {
            "_id": ObjectId(),
            "borrower_id": customer_ids[1],
            "loan_id": "LOAN002",
            "loan_product": "Auto Loan",
            "amount_requested": Decimal("35000"),
            "term_months": 60,
            "interest_rate": Decimal("4.2"),
            "status": "pending",
            "created_at": datetime.utcnow() - timedelta(days=10),
            "updated_at": datetime.utcnow()
        },
        {
            "_id": ObjectId(),
            "borrower_id": customer_ids[2],
            "loan_id": "LOAN003",
            "loan_product": "Personal Loan",
            "amount_requested": Decimal("15000"),
            "term_months": 24,
            "interest_rate": Decimal("8.0"),
            "status": "active",
            "created_at": datetime.utcnow() - timedelta(days=30),
            "updated_at": datetime.utcnow()
        }
    ]
    
    result = loans_collection.insert_many(loans_data)
    print(f"✅ Created {len(result.inserted_ids)} loans")
    loan_ids = result.inserted_ids
    
    # Create sample transactions for each loan
    print("📊 Creating sample transactions...")
    all_transactions = []
    
    # Transactions for Loan 1
    all_transactions.extend([
        {
            "_id": ObjectId(),
            "loan_id": loan_ids[0],
            "transaction_type": "disbursement",
            "amount": Decimal("100000"),
            "transaction_date": datetime.utcnow() - timedelta(days=60),
            "notes": "Initial loan disbursement",
            "borrower_name": "John Doe",
            "loan_product": "Home Loan",
            "created_at": datetime.utcnow() - timedelta(days=60),
            "updated_at": datetime.utcnow() - timedelta(days=60)
        },
        {
            "_id": ObjectId(),
            "loan_id": loan_ids[0],
            "transaction_type": "repayment",
            "amount": Decimal("2800"),
            "transaction_date": datetime.utcnow() - timedelta(days=45),
            "notes": "Monthly payment - January",
            "borrower_name": "John Doe",
            "loan_product": "Home Loan",
            "created_at": datetime.utcnow() - timedelta(days=45),
            "updated_at": datetime.utcnow() - timedelta(days=45)
        },
        {
            "_id": ObjectId(),
            "loan_id": loan_ids[0],
            "transaction_type": "repayment",
            "amount": Decimal("2800"),
            "transaction_date": datetime.utcnow() - timedelta(days=30),
            "notes": "Monthly payment - February",
            "borrower_name": "John Doe",
            "loan_product": "Home Loan",
            "created_at": datetime.utcnow() - timedelta(days=30),
            "updated_at": datetime.utcnow() - timedelta(days=30)
        },
        {
            "_id": ObjectId(),
            "loan_id": loan_ids[0],
            "transaction_type": "repayment",
            "amount": Decimal("2800"),
            "transaction_date": datetime.utcnow() - timedelta(days=15),
            "notes": "Monthly payment - March",
            "borrower_name": "John Doe",
            "loan_product": "Home Loan",
            "created_at": datetime.utcnow() - timedelta(days=15),
            "updated_at": datetime.utcnow() - timedelta(days=15)
        }
    ])
    
    # Transactions for Loan 2
    all_transactions.extend([
        {
            "_id": ObjectId(),
            "loan_id": loan_ids[1],
            "transaction_type": "disbursement",
            "amount": Decimal("35000"),
            "transaction_date": datetime.utcnow() - timedelta(days=10),
            "notes": "Vehicle purchase loan disbursement",
            "borrower_name": "Jane Smith",
            "loan_product": "Auto Loan",
            "created_at": datetime.utcnow() - timedelta(days=10),
            "updated_at": datetime.utcnow() - timedelta(days=10)
        }
    ])
    
    # Transactions for Loan 3
    all_transactions.extend([
        {
            "_id": ObjectId(),
            "loan_id": loan_ids[2],
            "transaction_type": "disbursement",
            "amount": Decimal("15000"),
            "transaction_date": datetime.utcnow() - timedelta(days=30),
            "notes": "Personal loan disbursement",
            "borrower_name": "Robert Johnson",
            "loan_product": "Personal Loan",
            "created_at": datetime.utcnow() - timedelta(days=30),
            "updated_at": datetime.utcnow() - timedelta(days=30)
        },
        {
            "_id": ObjectId(),
            "loan_id": loan_ids[2],
            "transaction_type": "repayment",
            "amount": Decimal("625"),
            "transaction_date": datetime.utcnow() - timedelta(days=20),
            "notes": "Monthly payment",
            "borrower_name": "Robert Johnson",
            "loan_product": "Personal Loan",
            "created_at": datetime.utcnow() - timedelta(days=20),
            "updated_at": datetime.utcnow() - timedelta(days=20)
        }
    ])
    
    if all_transactions:
        result = transactions_collection.insert_many(all_transactions)
        print(f"✅ Created {len(result.inserted_ids)} transactions")
    
    # Print summary
    print("\n" + "="*60)
    print("✅ TEST DATA CREATED SUCCESSFULLY")
    print("="*60)
    print(f"\n📊 Summary:")
    print(f"  • Customers: {len(customer_ids)}")
    print(f"  • Loans: {len(loan_ids)}")
    print(f"  • Transactions: {len(all_transactions)}")
    
    print(f"\n🔗 Loan IDs (use these in the URL):")
    for i, loan_id in enumerate(loan_ids):
        loan = loans_collection.find_one({"_id": loan_id})
        print(f"  • {loan['loan_product']}: {str(loan_id)}")
        print(f"    URL: http://localhost:8080/loan_details.html?id={str(loan_id)}")
    
    print(f"\n👥 Customer IDs:")
    for i, customer_id in enumerate(customer_ids):
        customer = customers_collection.find_one({"_id": customer_id})
        print(f"  • {customer['display_name']}: {str(customer_id)}")
    
    print("\n💡 Next Steps:")
    print("  1. Copy one of the Loan IDs from above")
    print("  2. Visit: http://localhost:8080/loan_details.html?id=<LOAN_ID>")
    print("  3. Press F12 to open console")
    print("  4. Verify the loan details and transaction history display")
    print("\n")

if __name__ == "__main__":
    asyncio.run(create_test_data())
