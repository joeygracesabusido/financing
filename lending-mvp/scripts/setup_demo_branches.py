# Branch Setup Script
# =====================
# Creates 3 branches + HQ office with demo users
# Run this script to set up the test environment

import asyncio
from datetime import datetime

async def setup_branches_and_users():
    """Setup database with branches and demo users for security testing."""
    
    print("🔧 Setting up branches and demo users...")
    
    # Branch definitions
    branches = [
        {'code': 'HQ', 'name': 'Headquarters Office', 'address': 'Main Street, City Center'},
        {'code': 'BR-QC', 'name': 'Quebec Branch', 'address': 'Rue Sainte-Catherine, Montreal'},
        {'code': 'BR-CDO', 'name': 'Central Data Office', 'address': 'Business District, Downtown'},
    ]
    
    # User definitions
    users = [
        {
            'username': 'admin',
            'password_hash': 'admin123',  # In production, use proper hashing
            'role': 'admin',
            'branch_code': 'HQ',
            'full_name': 'Admin User'
        },
        {
            'username': 'loan_officer_1',
            'password_hash': 'lo123456',
            'role': 'loan_officer',
            'branch_code': 'HQ',
            'full_name': 'John Doe'
        },
        {
            'username': 'teller_1',
            'password_hash': 'te123456',
            'role': 'teller',
            'branch_code': 'BR-CDO',
            'full_name': 'Jane Smith'
        },
        {
            'username': 'branch_manager_qc',
            'password_hash': 'bm123456',
            'role': 'branch_manager',
            'branch_code': 'BR-QC',
            'full_name': 'Michael Brown'
        },
    ]
    
    print(f"\n📍 Creating {len(branches)} branches:")
    for branch in branches:
        print(f"  - {branch['code']}: {branch['name']} ({branch['address']})")
    
    print(f"\n👤 Creating {len(users)} demo users:")
    for user in users:
        print(f"  - {user['username']}: {user['role']} @ {user['branch_code']}")
    
    # In production, you would execute these SQL commands
    print("\n💾 Would execute SQL to create branches and users...")
    print("\nExample SQL:")
    for branch in branches:
        print(f"INSERT INTO branch (code, name, address) VALUES ('{branch['code']}', '{branch['name']}', '{branch['address']}');")
    
    for user in users:
        print(f"INSERT INTO user (username, password_hash, role, branch_code) VALUES ('{user['username']}', '{user['password_hash']}', '{user['role']}', '{user['branch_code']}');")

if __name__ == '__main__':
    asyncio.run(setup_branches_and_users())
