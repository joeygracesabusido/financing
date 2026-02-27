import strawberry
from typing import List, Optional
from decimal import Decimal
from datetime import datetime, date
from strawberry.types import Info
from fastapi import HTTPException

#from .database import get_db
# from .database.customer_crud import CustomerCRUD
# from .customer import CustomerType, convert_customer_db_to_customer_type
from .models import CustomerInDB # Needed for convert_customer_db_to_customer_type, if it's moved here or passed around

from .services import accounting_service, loan_service
from .models import Customer, CustomerCreate, CustomerUpdate


# --- Strawberry Types (mirroring Pydantic models) ---

# User Types
@strawberry.type
class UserType:
    id: strawberry.ID
    email: str
    username: str
    full_name: str = strawberry.field(name="fullName")
    is_active: bool = strawberry.field(name="isActive")
    role: str
    created_at: datetime = strawberry.field(name="createdAt")
    updated_at: datetime = strawberry.field(name="updatedAt")

@strawberry.input
class UserCreateInput:
    email: str
    username: str
    full_name: str
    password: str
    role: Optional[str] = "customer"

@strawberry.input
class UserUpdateInput:
    email: Optional[str] = None
    username: Optional[str] = None
    full_name: Optional[str] = None
    is_active: Optional[bool] = None
    role: Optional[str] = None
    password: Optional[str] = None

@strawberry.input
class LoginInput:
    username: str  # Can be email or username
    password: str
    totp_code: Optional[str] = None  # Optional 2FA TOTP code

@strawberry.type
class LoginResponse:
    access_token: str
    token_type: str
    user: Optional[UserType] = None
    refresh_token: Optional[str] = strawberry.field(name="refreshToken", default=None)

@strawberry.type
class UserResponse:
    success: bool
    message: str
    user: Optional[UserType] = None

@strawberry.type
class UsersResponse:
    success: bool
    message: str
    users: List[UserType]
    total: int

# # Savings Types
# @strawberry.type
# class SavingsAccountType:
#     id: strawberry.ID
#     account_number: str
#     user_id: strawberry.ID
#     type: str
#     balance: float
#     currency: str
#     opened_at: datetime
#     created_at: datetime
#     updated_at: datetime
#     status: str
#     customer: Optional["CustomerType"] = None

#     @strawberry.field
#     async def customer(self, info: Info) -> Optional[CustomerType]:
#         db = get_db()
#         customer_crud = CustomerCRUD(db.customers)
        
#         customer_data = await customer_crud.get_customer_by_id(str(self.user_id))
        
#         if customer_data:
#             return convert_customer_db_to_customer_type(customer_data)
#         return None

 

# @strawberry.input
# class SavingsAccountCreateInput:
#     customer_id: strawberry.ID # Customer ID to link the account
#     account_number: str
#     type: str # e.g., "basic", "interest-bearing", "fixed-deposit"
#     balance: float = 0.00 # Initial deposit
#     currency: str = "PHP"
#     status: str = "active"
#     opened_at: datetime # Date the account was opened
#     interest_rate: Optional[float] = None # For HighYieldSavings and TimeDeposit
#     interest_paid_frequency: Optional[str] = None # For HighYieldSavings
#     principal: Optional[float] = None # For TimeDeposit
#     term_days: Optional[int] = None # For TimeDeposit

# @strawberry.type
# class SavingsAccountResponse:
#     success: bool
#     message: str
#     account: Optional[SavingsAccountType] = None

# @strawberry.type
# class SavingsAccountsResponse:
#     success: bool
#     message: str
#     accounts: List[SavingsAccountType]
#     total: int

# # Transaction Types
# @strawberry.type
# class TransactionType:
#     id: strawberry.ID
#     account_id: strawberry.ID
#     transaction_type: str # e.g., "deposit", "withdrawal"
#     amount: float
#     timestamp: datetime
#     notes: Optional[str] = None

# @strawberry.input
# class TransactionCreateInput:
#     account_id: strawberry.ID
#     amount: float
#     notes: Optional[str] = None

# @strawberry.type
# class TransactionResponse:
#     success: bool
#     message: str
#     transaction: Optional[TransactionType] = None

# @strawberry.type
# class TransactionsResponse:
#     success: bool
#     message: str
#     transactions: List[TransactionType]
#     total: int

# Loan Types
@strawberry.type
class GeneralLoanType:
    borrower_id: str
    amount_requested: Decimal
    status: str

# Ledger Entry Types
@strawberry.type
class LedgerEntryType:
    transaction_id: str
    account: str
    amount: float
    entry_type: str
    timestamp: str

# --- GraphQL Queries ---

@strawberry.type
class Query:
    @strawberry.field
    async def get_loan_by_id(self, loan_id: str) -> Optional[GeneralLoanType]:
        # Placeholder for fetching loan
        # In a real app, you'd call a service function
        return GeneralLoanType(borrower_id="some_user", amount_requested=Decimal("1000"), status="pending")

    @strawberry.field
    async def get_borrower_ledger(self, borrower_id: str) -> List[LedgerEntryType]:
        # This is where GraphQL shines: complex, nested queries
        entries = await accounting_service.get_ledger_for_borrower(borrower_id)
        return [
            LedgerEntryType(
                transaction_id=e["transaction_id"],
                account=e["account"],
                amount=e["amount"],
                entry_type=e["entry_type"],
                timestamp=str(e["timestamp"])
            ) for e in entries
        ]

    # These fields are typically defined in their respective modules and then composed in main.py
    # @strawberry.field
    # async def savingsAccount(self, info: Info, account_id: strawberry.ID) -> SavingsAccountResponse:
    #     from .savings import SavingsQuery
    #     return await SavingsQuery().savingsAccount(info, account_id)

    # @strawberry.field
    # async def savingsAccounts(self, info: Info) -> SavingsAccountsResponse:
    #     from .savings import SavingsQuery
    #     return await SavingsQuery().savingsAccounts(info)

# QR Code Payment Types
@strawberry.type
class QRCodeResponse:
    qr_code: str = strawberry.field(name="qrCode")
    payment_url: str = strawberry.field(name="paymentUrl")
    account_number: str = strawberry.field(name="accountNumber")
    amount: float
    reference: Optional[str] = None
    bank_code: Optional[str] = strawberry.field(name="bankCode", default=None)

# Notification Preference Types
@strawberry.type
class NotificationPreferencesType:
    email_enabled: bool = strawberry.field(name="emailEnabled")
    sms_enabled: bool = strawberry.field(name="smsEnabled")
    push_enabled: bool = strawberry.field(name="pushEnabled")
    email_notifications: List[str] = strawberry.field(name="emailNotifications", default_factory=list)
    sms_notifications: List[str] = strawberry.field(name="smsNotifications", default_factory=list)
    push_notifications: List[str] = strawberry.field(name="pushNotifications", default_factory=list)

@strawberry.input
class NotificationPreferencesInput:
    email_enabled: Optional[bool] = None
    sms_enabled: Optional[bool] = None
    push_enabled: Optional[bool] = None
    email_notifications: Optional[List[str]] = None
    sms_notifications: Optional[List[str]] = None
    push_notifications: Optional[List[str]] = None

@strawberry.type
class NotificationHistoryType:
    id: strawberry.ID
    channel: str
    message: str
    status: str
    sent_at: datetime = strawberry.field(name="sentAt")

@strawberry.type
class NotificationHistoryResponse:
    success: bool
    notifications: List[NotificationHistoryType]
    total: int


# --- Teller & Payment Gateway Types ---

# Transaction Limit Types
@strawberry.type
class TransactionLimitConfig:
    id: strawberry.ID
    role: str
    daily_limit: float = strawberry.field(name="dailyLimit")
    weekly_limit: float = strawberry.field(name="weeklyLimit")
    monthly_limit: float = strawberry.field(name="monthlyLimit")
    single_transaction_limit: float = strawberry.field(name="singleTransactionLimit")
    branch_id: Optional[str] = strawberry.field(name="branchId", default=None)
    active: bool


@strawberry.input
class TransactionLimitCreateInput:
    role: str
    daily_limit: float = strawberry.field(name="dailyLimit")
    weekly_limit: float = strawberry.field(name="weeklyLimit")
    monthly_limit: float = strawberry.field(name="monthlyLimit")
    single_transaction_limit: float = strawberry.field(name="singleTransactionLimit")
    branch_id: Optional[str] = strawberry.field(name="branchId", default=None)
    active: Optional[bool] = True


@strawberry.input
class TransactionLimitUpdateInput:
    daily_limit: Optional[float] = None
    weekly_limit: Optional[float] = None
    monthly_limit: Optional[float] = None
    single_transaction_limit: Optional[float] = None
    active: Optional[bool] = None


# Payment Gateway Types
@strawberry.type
class PaymentGatewayResponse:
    payment_id: str = strawberry.field(name="paymentId")
    gateway: str
    amount: float
    status: str
    reference_id: str = strawberry.field(name="referenceId")
    timestamp: datetime
    mobile_number: Optional[str] = None
    email: Optional[str] = None
    destination_account: Optional[str] = strawberry.field(name="destinationAccount", default=None)
    destination_bank_code: Optional[str] = strawberry.field(name="destinationBankCode", default=None)
    batch_id: Optional[str] = strawberry.field(name="batchId", default=None)


@strawberry.input
class GCashPaymentInput:
    amount: float
    mobile_number: str
    reference_id: str = strawberry.field(name="referenceId")
    payment_type: str = strawberry.field(name="paymentType", default="loan_repayment")
    customer_id: Optional[str] = strawberry.field(name="customerId", default=None)
    notes: Optional[str] = None


@strawberry.input
class MayaPaymentInput:
    amount: float
    email: str
    reference_id: str = strawberry.field(name="referenceId")
    payment_type: str = strawberry.field(name="paymentType", default="loan_repayment")
    customer_id: Optional[str] = strawberry.field(name="customerId", default=None)
    notes: Optional[str] = None


@strawberry.input
class InstaPayInput:
    amount: float
    source_account: str = strawberry.field(name="sourceAccount")
    destination_account: str = strawberry.field(name="destinationAccount")
    destination_bank_code: str = strawberry.field(name="destinationBankCode")
    reference_id: str = strawberry.field(name="referenceId")
    payment_type: str = strawberry.field(name="paymentType", default="transfer")
    notes: Optional[str] = None


@strawberry.input
class PESONetInput:
    amount: float
    source_account: str = strawberry.field(name="sourceAccount")
    destination_account: str = strawberry.field(name="destinationAccount")
    destination_bank_code: str = strawberry.field(name="destinationBankCode")
    reference_id: str = strawberry.field(name="referenceId")
    payment_type: str = strawberry.field(name="paymentType", default="single")
    batch_id: Optional[str] = strawberry.field(name="batchId", default=None)
    notes: Optional[str] = None


@strawberry.type
class PaymentMethod:
    id: str
    name: str
    type: str
    supported_operations: List[str] = strawberry.field(name="supportedOperations")
    features: Optional[List[str]] = None


# Cash Drawer Session Types
@strawberry.type
class CashDrawerSession:
    session_id: strawberry.ID = strawberry.field(name="sessionId")
    teller_id: str = strawberry.field(name="tellerId")
    branch_id: str = strawberry.field(name="branchId")
    opening_time: datetime = strawberry.field(name="openingTime")
    initial_amount: float = strawberry.field(name="initialAmount")
    current_amount: float = strawberry.field(name="currentAmount")
    status: str
    closing_time: Optional[datetime] = strawberry.field(name="closingTime", default=None)
    expected_amount: Optional[float] = strawberry.field(name="expectedAmount", default=None)
    actual_amount: Optional[float] = strawberry.field(name="actualAmount", default=None)
    variance: Optional[float] = None
    variance_reason: Optional[str] = strawberry.field(name="varianceReason", default=None)
    notes: Optional[str] = None


@strawberry.input
class CashDrawerOpeningInput:
    teller_id: str = strawberry.field(name="tellerId")
    branch_id: str = strawberry.field(name="branchId")
    initial_amount: float = strawberry.field(name="initialAmount")
    notes: Optional[str] = None


@strawberry.input
class CashDrawerClosingInput:
    session_id: strawberry.ID = strawberry.field(name="sessionId")
    expected_amount: float = strawberry.field(name="expectedAmount")
    actual_amount: float = strawberry.field(name="actualAmount")
    variance_reason: Optional[str] = strawberry.field(name="varianceReason", default=None)
    notes: Optional[str] = None


@strawberry.type
class TellerSessionResponse:
    success: bool
    session: Optional[CashDrawerSession] = None
    message: str

# Payment Details for QR Scan
@strawberry.type
class PaymentDetailsType:
    account_number: str = strawberry.field(name="accountNumber")
    amount: float
    reference: Optional[str] = None
    bank_code: Optional[str] = strawberry.field(name="bankCode", default=None)

# Fund Transfer Types
@strawberry.input
class GeneralFundTransferInput:
    from_account: str = strawberry.field(name="fromAccount")
    to_account: str = strawberry.field(name="toAccount")
    amount: float
    reference: Optional[str] = None
    transfer_type: Optional[str] = None

@strawberry.type
class GeneralFundTransferResponse:
    success: bool
    message: str
    transfer: Optional["FundTransferType"] = None

@strawberry.type
class FundTransferType:
    id: strawberry.ID
    from_account: str = strawberry.field(name="fromAccount")
    to_account: str = strawberry.field(name="toAccount")
    amount: float
    status: str
    created_at: datetime = strawberry.field(name="createdAt")

# --- GraphQL Queries ---

@strawberry.type
class Query:
    # ... existing queries ...

    @strawberry.field
    async def generate_qr_code(
        self,
        account_number: str,
        amount: float,
        reference: Optional[str] = None,
        bank_code: Optional[str] = None
    ) -> QRCodeResponse:
        """Generate a QR code for payment collection."""
        from ..utils.qr_payment import generate_payment_qr_code
        
        qr_code_data = await generate_payment_qr_code({
            "account_number": account_number,
            "amount": amount,
            "reference": reference,
            "bank_code": bank_code
        })
        
        payment_url = f"{bank_code or 'PH'}|{account_number}|{amount:.2f}|{reference or ''}"
        
        return QRCodeResponse(
            qr_code=qr_code_data,
            payment_url=payment_url,
            account_number=account_number,
            amount=amount,
            reference=reference,
            bank_code=bank_code
        )
    
    @strawberry.field
    async def notification_preferences(self, info: Info) -> NotificationPreferencesType:
        """Get notification preferences for the current user."""
        current_user = info.context.get("current_user")
        if not current_user:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        return NotificationPreferencesType(
            email_enabled=True,
            sms_enabled=False,
            push_enabled=True,
            email_notifications=["payment_reminder", "loan_due", "transfer_confirmation"],
            sms_notifications=["payment_reminder", "loan_due"],
            push_notifications=["payment_reminder", "loan_due", "transfer_confirmation", "system_update"]
        )
    
    @strawberry.field
    async def notification_history(
        self,
        info: Info,
        skip: int = 0,
        limit: int = 20
    ) -> NotificationHistoryResponse:
        """Get notification history for the current user."""
        current_user = info.context.get("current_user")
        if not current_user:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        # In a real app, this would fetch from a notifications database
        notifications = [
            NotificationHistoryType(
                id=strawberry.ID("1"),
                channel="email",
                message="Loan payment received",
                status="delivered",
                sent_at=datetime.utcnow()
            ),
            NotificationHistoryType(
                id=strawberry.ID("2"),
                channel="push",
                message="New loan statement available",
                status="delivered",
                sent_at=datetime.utcnow()
            )
        ]
        
        return NotificationHistoryResponse(
            success=True,
            notifications=notifications,
            total=len(notifications)
        )

# --- GraphQL Mutations ---

@strawberry.type
class ScanQRCodeResponse:
    success: bool
    message: str
    payment_details: Optional[PaymentDetailsType] = strawberry.field(name="paymentDetails", default=None)

@strawberry.type
class Mutation:
    @strawberry.mutation
    async def scan_qr_code(self, qr_data: str) -> ScanQRCodeResponse:
        """Scan and process a QR code."""
        # In a real app, this would parse the QR data and validate
        if not qr_data.startswith("PH") and not qr_data.startswith("GCASH"):
            return ScanQRCodeResponse(success=False, message="Invalid QR code format")
        
        # Parse QR data
        parts = qr_data.split("|")
        if len(parts) < 3:
            return ScanQRCodeResponse(success=False, message="Invalid QR code data")
        
        details = PaymentDetailsType(
            account_number=parts[1],
            amount=float(parts[2]) if len(parts) > 2 else 0,
            reference=parts[3] if len(parts) > 3 else None,
            bank_code=parts[0]
        )
        
        return ScanQRCodeResponse(
            success=True,
            message="QR code scanned successfully",
            payment_details=details
        )
    
    @strawberry.mutation
    async def update_notification_preferences(
        self,
        info: Info,
        input: NotificationPreferencesInput
    ) -> NotificationPreferencesType:
        """Update notification preferences for the current user."""
        current_user = info.context.get("current_user")
        if not current_user:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        # In a real app, this would update the user's preferences in the database
        return NotificationPreferencesType(
            email_enabled=input.email_enabled or True,
            sms_enabled=input.sms_enabled or False,
            push_enabled=input.push_enabled or True,
            email_notifications=input.email_notifications or ["payment_reminder", "loan_due", "transfer_confirmation"],
            sms_notifications=input.sms_notifications or ["payment_reminder", "loan_due"],
            push_notifications=input.push_notifications or ["payment_reminder", "loan_due", "transfer_confirmation", "system_update"]
        )
    
    @strawberry.mutation
    async def create_fund_transfer(
        self,
        info: Info,
        input: GeneralFundTransferInput
    ) -> GeneralFundTransferResponse:
        """Create a fund transfer request."""
        current_user = info.context.get("current_user")
        if not current_user:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        # In a real app, this would process the transfer through the transaction service
        from datetime import datetime
        
        return GeneralFundTransferResponse(
            success=True,
            message="Fund transfer request created successfully",
            transfer=FundTransferType(
                id=strawberry.ID("transfer-123"),
                from_account=input.from_account,
                to_account=input.to_account,
                amount=input.amount,
                status="pending",
                created_at=datetime.utcnow()
            )
        )
    
    # ... existing mutations ...