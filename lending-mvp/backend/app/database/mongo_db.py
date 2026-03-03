"""
MongoDB database connections (for compatibility with existing code).
Currently returns None since the project uses PostgreSQL only.
"""

# Return None for MongoDB collections as project uses PostgreSQL only
get_users_collection = lambda: None
get_customers_collection = lambda: None
get_loans_collection = lambda: None
get_savings_collection = lambda: None
get_transactions_collection = lambda: None
get_loan_products_collection = lambda: None
get_chart_of_accounts_collection = lambda: None
