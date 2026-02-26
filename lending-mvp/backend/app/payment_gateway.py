from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional, List, Literal
from datetime import datetime, date
from decimal import Decimal
from bson import ObjectId

from app.models import PyObjectId
from app.schemas import (
    PaymentGatewayRequest, PaymentGatewayResponse, PaymentStatus, 
    PaymentMethod, TransactionResponse
)
from app.main import db
from app.audit_middleware import audit_log
from app.worker import send_notification

router = APIRouter(prefix="/api/v1/payment-gateway", tags=["Payment Gateway"])

# ============================================================================
# PAYMENT GATEWAY INTEGRATION MODELS
# ============================================================================

class GCashPaymentRequest(BaseModel):
    amount: Decimal
    mobile_number: str
    reference_id: str
    payment_type: Literal["loan_repayment", "savings_deposit", "transfer"]
    customer_id: Optional[PyObjectId] = None
    notes: Optional[str] = None

class MayaPaymentRequest(BaseModel):
    amount: Decimal
    email: str
    reference_id: str
    payment_type: Literal["loan_repayment", "savings_deposit", "transfer"]
    customer_id: Optional[PyObjectId] = None
    notes: Optional[str] = None

class InstaPayRequest(BaseModel):
    amount: Decimal
    source_account: str
    destination_account: str
    destination_bank_code: str
    reference_id: str
    payment_type: Literal["loan_repayment", "savings_deposit", "transfer"]
    notes: Optional[str] = None

class PESONetRequest(BaseModel):
    amount: Decimal
    source_account: str
    destination_account: str
    destination_bank_code: str
    reference_id: str
    payment_type: Literal["batch", "single"]
    batch_id: Optional[str] = None
    notes: Optional[str] = None

# ============================================================================
# GATEWAY-SPECIFIC INTEGRATION LOGIC
# ============================================================================

class PaymentGatewayIntegrations:
    """Payment Gateway Integration Layer"""
    
    @staticmethod
    async def process_gcash_payment(request: GCashPaymentRequest) -> PaymentGatewayResponse:
        """Process GCash payment"""
        try:
            # Validate mobile number format (Philippines format: 09XX-XXX-XXXX)
            if not request.mobile_number.startswith('09') or len(request.mobile_number) != 11:
                raise HTTPException(status_code=400, detail="Invalid Philippine mobile number format")
            
            # Simulate GCash API call (in production, this would be actual API integration)
            payment_id = f"GC-{datetime.now().strftime('%Y%m%d')}-{ObjectId()}"
            
            return PaymentGatewayResponse(
                payment_id=payment_id,
                gateway="GCash",
                amount=request.amount,
                status=PaymentStatus.SUCCESS,
                reference_id=request.reference_id,
                timestamp=datetime.utcnow(),
                mobile_number=request.mobile_number,
                payment_type=request.payment_type
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"GCash payment failed: {str(e)}")
    
    @staticmethod
    async def process_maya_payment(request: MayaPaymentRequest) -> PaymentGatewayResponse:
        """Process Maya payment"""
        try:
            # Validate email format
            if '@' not in request.email:
                raise HTTPException(status_code=400, detail="Invalid email format")
            
            payment_id = f"MY-{datetime.now().strftime('%Y%m%d')}-{ObjectId()}"
            
            return PaymentGatewayResponse(
                payment_id=payment_id,
                gateway="Maya",
                amount=request.amount,
                status=PaymentStatus.SUCCESS,
                reference_id=request.reference_id,
                timestamp=datetime.utcnow(),
                email=request.email,
                payment_type=request.payment_type
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Maya payment failed: {str(e)}")
    
    @staticmethod
    async def process_insta_pay(request: InstaPayRequest) -> PaymentGatewayResponse:
        """Process InstaPay real-time transfer"""
        try:
            # Validate account number format (11 digits for Philippine banks)
            if not request.destination_account.isdigit() or len(request.destination_account) != 11:
                raise HTTPException(status_code=400, detail="Invalid account number format")
            
            payment_id = f"IP-{datetime.now().strftime('%Y%m%d')}-{ObjectId()}"
            
            return PaymentGatewayResponse(
                payment_id=payment_id,
                gateway="InstaPay",
                amount=request.amount,
                status=PaymentStatus.SUCCESS,
                reference_id=request.reference_id,
                timestamp=datetime.utcnow(),
                source_account=request.source_account,
                destination_account=request.destination_account,
                destination_bank_code=request.destination_bank_code,
                payment_type=request.payment_type
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"InstaPay transfer failed: {str(e)}")
    
    @staticmethod
    async def process_pesonet(request: PESONetRequest) -> PaymentGatewayResponse:
        """Process PESONet batch or single payment"""
        try:
            payment_id = f"PN-{datetime.now().strftime('%Y%m%d')}-{ObjectId()}"
            
            response = PaymentGatewayResponse(
                payment_id=payment_id,
                gateway="PESONet",
                amount=request.amount,
                status=PaymentStatus.SUCCESS,
                reference_id=request.reference_id,
                timestamp=datetime.utcnow(),
                source_account=request.source_account,
                destination_account=request.destination_account,
                payment_type=request.payment_type
            )
            
            if request.payment_type == "batch" and request.batch_id:
                response.batch_id = request.batch_id
            
            return response
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"PESONet payment failed: {str(e)}")

# ============================================================================
# API ENDPOINTS
# ============================================================================

@router.post("/gcash", response_model=PaymentGatewayResponse)
async def process_gcash_payment(request: GCashPaymentRequest, current_user: dict = Depends(...)):
    """
    Process payment through GCash e-wallet
    - Requires mobile number in Philippine format (09XX-XXX-XXXX)
    - Supports loan repayment, savings deposit, and transfers
    """
    result = await PaymentGatewayIntegrations.process_gcash_payment(request)
    
    # Log audit trail
    await audit_log(
        user_id=str(current_user["id"]),
        action="GCASH_PAYMENT_PROCESSED",
        details=f"Payment of {request.amount} via GCash for {request.payment_type}",
        metadata={"payment_id": result.payment_id}
    )
    
    # Send notification
    await send_notification(
        user_id=str(current_user["id"]),
        title="Payment Successful",
        message=f"Your payment of {request.amount} via GCash was successful",
        type="payment"
    )
    
    return result

@router.post("/maya", response_model=PaymentGatewayResponse)
async def process_maya_payment(request: MayaPaymentRequest, current_user: dict = Depends(...)):
    """
    Process payment through Maya e-wallet
    - Supports loan repayment, savings deposit, and transfers
    """
    result = await PaymentGatewayIntegrations.process_maya_payment(request)
    
    await audit_log(
        user_id=str(current_user["id"]),
        action="MAYA_PAYMENT_PROCESSED",
        details=f"Payment of {request.amount} via Maya for {request.payment_type}",
        metadata={"payment_id": result.payment_id}
    )
    
    await send_notification(
        user_id=str(current_user["id"]),
        title="Payment Successful",
        message=f"Your payment of {request.amount} via Maya was successful",
        type="payment"
    )
    
    return result

@router.post("/instapay", response_model=PaymentGatewayResponse)
async def process_insta_pay(request: InstaPayRequest, current_user: dict = Depends(...)):
    """
    Process real-time fund transfer via InstaPay
    - BSP-regulated real-time payment rail
    - Instant settlement between banks
    """
    result = await PaymentGatewayIntegrations.process_insta_pay(request)
    
    await audit_log(
        user_id=str(current_user["id"]),
        action="INSTAPAY_TRANSFER_PROCESSED",
        details=f"InstaPay transfer of {request.amount} to {request.destination_account}",
        metadata={"payment_id": result.payment_id, "bank_code": request.destination_bank_code}
    )
    
    await send_notification(
        user_id=str(current_user["id"]),
        title="Fund Transfer Initiated",
        message=f"Your InstaPay transfer of {request.amount} has been initiated",
        type="transfer"
    )
    
    return result

@router.post("/pesonet", response_model=PaymentGatewayResponse)
async def process_pesonet(request: PESONetRequest, current_user: dict = Depends(...)):
    """
    Process fund transfer via PESONet
    - Supports both single and batch payments
    - Same-day settlement capability
    """
    result = await PaymentGatewayIntegrations.process_pesonet(request)
    
    await audit_log(
        user_id=str(current_user["id"]),
        action="PESONET_PAYMENT_PROCESSED",
        details=f"PESONet {request.payment_type} payment of {request.amount}",
        metadata={"payment_id": result.payment_id, "batch_id": request.batch_id}
    )
    
    await send_notification(
        user_id=str(current_user["id"]),
        title="Payment Processed",
        message=f"Your PESONet payment of {request.amount} has been processed",
        type="payment"
    )
    
    return result

@router.post("/verify", response_model=dict)
async def verify_payment(
    payment_id: str,
    current_user: dict = Depends(...)
):
    """Verify payment status"""
    payment_record = await db.payments.find_one({"_id": payment_id})
    
    if not payment_record:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    return {
        "payment_id": payment_record["_id"],
        "status": payment_record["status"],
        "amount": float(payment_record["amount"]),
        "gateway": payment_record["gateway"],
        "timestamp": payment_record["timestamp"]
    }

@router.get("/methods", response_model=List[dict])
async def get_payment_methods(current_user: dict = Depends(...)):
    """Get available payment methods"""
    return [
        {
            "id": "gcash",
            "name": "GCash",
            "type": "ewallet",
            "supported_operations": ["loan_repayment", "savings_deposit", "transfer"]
        },
        {
            "id": "maya",
            "name": "Maya",
            "type": "ewallet",
            "supported_operations": ["loan_repayment", "savings_deposit", "transfer"]
        },
        {
            "id": "instapay",
            "name": "InstaPay",
            "type": "bank_transfer",
            "supported_operations": ["loan_repayment", "savings_deposit", "transfer"],
            "features": ["real_time", "bsp_regulated"]
        },
        {
            "id": "pesonet",
            "name": "PESONet",
            "type": "bank_transfer",
            "supported_operations": ["loan_repayment", "savings_deposit", "transfer", "batch"],
            "features": ["batch_processing", "same_day_settlement"]
        }
    ]