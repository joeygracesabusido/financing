import strawberry
from typing import List, Optional
from strawberry.types import Info
from fastapi import HTTPException, status
from datetime import datetime

# Import models and schemas
from .models import CustomerInDB, CustomerCreate, CustomerUpdate, PyObjectId
from .schema import CustomerType, CustomerCreateInput, CustomerUpdateInput, CustomerResponse, CustomersResponse
from .database import get_customers_collection
from .database.customer_crud import CustomerCRUD

def convert_customer_db_to_customer_type(customer_db: CustomerInDB) -> CustomerType:
    """Convert CustomerInDB to CustomerType schema"""
    return CustomerType(
        id=str(customer_db.id),
        last_name=customer_db.last_name,
        first_name=customer_db.first_name,
        middle_name=customer_db.middle_name,
        tin_no=customer_db.tin_no,
        sss_no=customer_db.sss_no,
        permanent_address=customer_db.permanent_address,
        birth_date=customer_db.birth_date,
        birth_place=customer_db.birth_place,
        mobile_number=customer_db.mobile_number,
        email_address=customer_db.email_address,
        employer_name_address=customer_db.employer_name_address,
        job_title=customer_db.job_title,
        salary_range=customer_db.salary_range,
        created_at=customer_db.created_at,
        updated_at=customer_db.updated_at
    )

@strawberry.type
class Query:
    @strawberry.field
    async def customers(self, info: Info, skip: int = 0, limit: int = 100) -> CustomersResponse:
        """Get all customers"""
        # Authorization can be added here, e.g., check if current_user is admin
        try:
            customers_collection = get_customers_collection()
            customer_crud = CustomerCRUD(customers_collection)
            
            customers_db = await customer_crud.get_customers(skip=skip, limit=limit)
            
            customers = [convert_customer_db_to_customer_type(customer_db) for customer_db in customers_db]
            
            # Note: CustomerCRUD currently doesn't have a count_customers method
            # For simplicity, returning len(customers) as total for now.
            total = len(customers) 

            return CustomersResponse(
                success=True,
                message="Customers retrieved successfully",
                customers=customers,
                total=total
            )
        except Exception as e:
            return CustomersResponse(
                success=False,
                message=f"Error retrieving customers: {str(e)}",
                customers=[],
                total=0
            )

    @strawberry.field
    async def customer(self, info: Info, customer_id: str) -> CustomerResponse:
        """Get customer by ID"""
        try:
            customers_collection = get_customers_collection()
            customer_crud = CustomerCRUD(customers_collection)
            
            customer_db = await customer_crud.get_customer_by_id(customer_id)
            if not customer_db:
                return CustomerResponse(
                    success=False,
                    message="Customer not found"
                )
            
            customer = convert_customer_db_to_customer_type(customer_db)
            return CustomerResponse(
                success=True,
                message="Customer retrieved successfully",
                customer=customer
            )
        except Exception as e:
            return CustomerResponse(
                success=False,
                message=f"Error retrieving customer: {str(e)}"
            )

@strawberry.type
class Mutation:
    @strawberry.field
    async def create_customer(self, info: Info, input: CustomerCreateInput) -> CustomerResponse:
        """Create a new customer"""
        try:
            customers_collection = get_customers_collection()
            customer_crud = CustomerCRUD(customers_collection)

            existing_customer = await customer_crud.get_customer_by_email(input.email_address)
            if existing_customer:
                return CustomerResponse(
                    success=False,
                    message="Customer with this email already exists"
                )

            customer_create = CustomerCreate(
                **input.model_dump()
            )

            customer_db = await customer_crud.create_customer(customer_create)
            customer = convert_customer_db_to_customer_type(customer_db)

            return CustomerResponse(
                success=True,
                message="Customer created successfully",
                customer=customer
            )
        except Exception as e:
            return CustomerResponse(
                success=False,
                message=f"Error creating customer: {str(e)}"
            )

    @strawberry.field
    async def update_customer(self, info: Info, customer_id: str, input: CustomerUpdateInput) -> CustomerResponse:
        """Update an existing customer"""
        try:
            customers_collection = get_customers_collection()
            customer_crud = CustomerCRUD(customers_collection)

            customer_update_data = input.model_dump(exclude_unset=True)
            customer_update = CustomerUpdate(**customer_update_data)

            customer_db = await customer_crud.update_customer(customer_id, customer_update)
            if not customer_db:
                return CustomerResponse(
                    success=False,
                    message="Customer not found"
                )

            customer = convert_customer_db_to_customer_type(customer_db)
            return CustomerResponse(
                success=True,
                message="Customer updated successfully",
                customer=customer
            )
        except Exception as e:
            return CustomerResponse(
                success=False,
                message=f"Error updating customer: {str(e)}"
            )

    @strawberry.field
    async def delete_customer(self, info: Info, customer_id: str) -> CustomerResponse:
        """Delete a customer"""
        try:
            customers_collection = get_customers_collection()
            customer_crud = CustomerCRUD(customers_collection)

            success = await customer_crud.delete_customer(customer_id)
            if not success:
                return CustomerResponse(
                    success=False,
                    message="Customer not found"
                )

            return CustomerResponse(
                success=True,
                message="Customer deleted successfully"
            )
        except Exception as e:
            return CustomerResponse(
                success=False,
                message=f"Error deleting customer: {str(e)}"
            )