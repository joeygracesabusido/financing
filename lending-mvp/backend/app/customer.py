import strawberry
from typing import List, Optional
from strawberry.types import Info
from fastapi import HTTPException, status
from datetime import datetime, date

from starlette.requests import Request

# Import models and schemas
from .models import CustomerInDB, CustomerCreate, CustomerUpdate, PyObjectId,UserInDB
#from .schema import CustomerType, CustomerCreateInput, CustomerUpdateInput, CustomerResponse, CustomersResponse
from .database import get_customers_collection, get_db
from .database.customer_crud import CustomerCRUD


# Customer Types
@strawberry.type
class CustomerType:
    id: strawberry.ID
    customer_type: str = strawberry.field(name="customerType")  # Added customer_type
    last_name: Optional[str] = strawberry.field(name="lastName", default=None)  # Made optional
    first_name: Optional[str] = strawberry.field(name="firstName", default=None)  # Made optional
    display_name: str = strawberry.field(name="displayName")
    middle_name: Optional[str] = strawberry.field(name="middleName", default=None)
    tin_no: Optional[str] = strawberry.field(name="tinNo", default=None)
    sss_no: Optional[str] = strawberry.field(name="sssNo", default=None)
    permanent_address: Optional[str] = strawberry.field(name="permanentAddress", default=None)
    birth_date: Optional[date] = strawberry.field(name="birthDate", default=None)
    birth_place: Optional[str] = strawberry.field(name="birthPlace", default=None)
    mobile_number: Optional[str] = strawberry.field(name="mobileNumber", default=None)
    email_address: str = strawberry.field(name="emailAddress")
    employer_name_address: Optional[str] = strawberry.field(name="employerNameAddress", default=None)
    job_title: Optional[str] = strawberry.field(name="jobTitle", default=None)
    salary_range: Optional[str] = strawberry.field(name="salaryRange", default=None)
    created_at: datetime = strawberry.field(name="createdAt")
    updated_at: datetime = strawberry.field(name="updatedAt")
    company_name: Optional[str] = strawberry.field(name="companyName", default=None)
    company_address: Optional[str] = strawberry.field(name="companyAddress", default=None)
    branch: str

@strawberry.input
class CustomerCreateInput:
    customer_type: str # Added customer_type
    last_name: Optional[str] = None # Made optional
    first_name: Optional[str] = None # Made optional
    middle_name: Optional[str] = None
    display_name: str
    tin_no: Optional[str] = None
    sss_no: Optional[str] = None
    permanent_address: Optional[str] = None
    birth_date: Optional[datetime] = None
    birth_place: Optional[str] = None
    mobile_number: Optional[str] = None
    email_address: str
    employer_name_address: Optional[str] = None
    job_title: Optional[str] = None
    salary_range: Optional[str] = None
    company_name: Optional[str] = None
    company_address: Optional[str] = None
    branch: str

@strawberry.input
class CustomerUpdateInput:
    customer_type: str # Added customer_type
    last_name: Optional[str] = None
    first_name: Optional[str] = None
    middle_name: Optional[str] = None
    tin_no: Optional[str] = None
    sss_no: Optional[str] = None
    permanent_address: Optional[str] = None
    birth_date: Optional[datetime] = None
    birth_place: Optional[str] = None
    mobile_number: Optional[str] = None
    email_address: Optional[str] = None
    employer_name_address: Optional[str] = None
    job_title: Optional[str] = None
    salary_range: Optional[str] = None
    company_name: Optional[str] = None
    company_address: Optional[str] = None
    branch: str
    display_name: str

@strawberry.type
class CustomerResponse:
    success: bool
    message: str
    customer: Optional[CustomerType] = None

@strawberry.type
class CustomersResponse:
    success: bool
    message: str
    customers: List[CustomerType]
    total: int

@strawberry.field
async def customer(self, info: Info) -> Optional["CustomerType"]:
    db = get_db()
    customer_crud = CustomerCRUD(db.customers)
        
    customer_data = await customer_crud.get_customer_by_id(str(self.user_id))
        
    if customer_data:
        return convert_customer_db_to_customer_type(customer_data)
    return None





def convert_customer_db_to_customer_type(customer_db: CustomerInDB) -> "CustomerType":
    """Convert CustomerInDB to CustomerType schema"""
    return CustomerType(
        id=strawberry.ID(str(customer_db.id)),
        last_name=customer_db.last_name,
        first_name=customer_db.first_name,
        display_name=customer_db.display_name,
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
        updated_at=customer_db.updated_at,
        company_name=customer_db.company_name,
        company_address=customer_db.company_address,
        customer_type=customer_db.customer_type,
        branch=customer_db.branch
    )

@strawberry.type
class Query:
    @strawberry.field
    async def customers(self, info: Info, skip: int = 0, limit: int = 100, search_term: Optional[str] = None) -> CustomersResponse:
        """Get all customers with optional search"""
        current_user: UserInDB = info.context.get("current_user")
        print(current_user.role)
        if not current_user or current_user.role != "admin":
            raise Exception("Not authorized")

        try:
            customers_collection = get_customers_collection()
            customer_crud = CustomerCRUD(customers_collection)
            
            customers_db = await customer_crud.get_customers(skip=skip, limit=limit, search_term=search_term)
            total = await customer_crud.count_customers(search_term=search_term)
            
            customers = [convert_customer_db_to_customer_type(customer_db) for customer_db in customers_db]
            
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
    async def customer(self, info: Info, customer_id: strawberry.ID) -> CustomerResponse:
        """Get customer by ID"""
        current_user: UserInDB = info.context.get("current_user")
        if not current_user or current_user.role != "admin":
            raise Exception("Not authorized")
        try:
            customers_collection = get_customers_collection()
            customer_crud = CustomerCRUD(customers_collection)
            
            customer_db = await customer_crud.get_customer_by_id(str(customer_id))
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
        # current_user: UserInDB = info.context.get("current_user")
        # print(current_user.role)
        # if not current_user or current_user.role != "admin":
        #     raise Exception("Not authorized")

        current_user = info.context.get("current_user")
    
        if current_user is None:
            raise Exception("Not authenticated – please login")
        
        if current_user.role != "admin":
            raise Exception("Not authorized – admin role required")
        
        try:
            customers_collection = get_customers_collection()
            customer_crud = CustomerCRUD(customers_collection)

            if await customer_crud.get_customer_by_email(input.email_address):
                return CustomerResponse(
                    success=False,
                    message="Customer with this email already exists"
                )

            # Convert and create
            customer_create = CustomerCreate(**strawberry.asdict(input))

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
    async def update_customer(self, info: Info, customer_id: strawberry.ID, input: CustomerUpdateInput) -> CustomerResponse:
        """Update an existing customer"""
        current_user: UserInDB = info.context.get("current_user")
        if not current_user or current_user.role != "admin":
            raise Exception("Not authorized")
        try:
            customers_collection = get_customers_collection()
            customer_crud = CustomerCRUD(customers_collection)

            customer_update_data = strawberry.asdict(input)
            customer_update = CustomerUpdate(**customer_update_data)

            customer_db = await customer_crud.update_customer(str(customer_id), customer_update)
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
    async def delete_customer(self, info: Info, customer_id: strawberry.ID) -> CustomerResponse:
        """Delete a customer"""
        current_user: UserInDB = info.context.get("current_user")
        if not current_user or current_user.role != "admin":
            raise Exception("Not authorized")
        try:
            customers_collection = get_customers_collection()
            customer_crud = CustomerCRUD(customers_collection)

            success = await customer_crud.delete_customer(str(customer_id))
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