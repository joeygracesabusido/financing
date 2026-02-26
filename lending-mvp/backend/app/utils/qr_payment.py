"""
QR Payment Utility Module
=========================
Generates and validates QR codes for payment collection
Supports GCash, Maya, InstaPay, and PESONet payment methods
"""

import qrcode
import base64
from io import BytesIO
from typing import Optional, Literal
from datetime import datetime
from decimal import Decimal
from bson import ObjectId


class QRPaymentGenerator:
    """Generates QR codes for payment collection"""
    
    @staticmethod
    def generate_payment_qr_code(
        amount: Decimal,
        reference: str,
        payment_method: Literal["gcash", "maya", "instapay", "pesonet"] = "gcash",
        account_number: Optional[str] = None,
        bank_code: Optional[str] = None
    ) -> dict:
        """
        Generate a QR code for payment collection
        
        Args:
            amount: Payment amount
            reference: Transaction reference ID
            payment_method: Payment gateway (gcash, maya, instapay, pesonet)
            account_number: Customer account number (optional)
            bank_code: Bank code for transfers (optional)
        
        Returns:
            Dictionary containing QR code data and metadata
        """
        # Validate amount
        if amount <= 0:
            raise ValueError("Payment amount must be positive")
        
        # Validate reference
        if not reference or len(reference) < 6:
            raise ValueError("Reference ID must be at least 6 characters")
        
        # Generate QR code data based on payment method
        if payment_method in ["gcash", "maya"]:
            qr_data = f"PGW:{payment_method.upper()}:{amount}:{reference}:{datetime.utcnow().isoformat()}"
        elif payment_method in ["instapay", "pesonet"]:
            if not account_number:
                raise ValueError("Account number required for bank transfers")
            
            qr_data = f"BANK:{payment_method.upper()}:{amount}:{reference}:{account_number}:{datetime.utcnow().isoformat()}"
        else:
            raise ValueError(f"Unsupported payment method: {payment_method}")
        
        # Generate QR code image
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(qr_data)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Convert to base64 for web display
        buffered = BytesIO()
        img.save(buffered, format="PNG")
        qr_image_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')
        
        return {
            "qr_code": qr_image_base64,
            "payment_url": f"/payments/{payment_method}/generate?ref={reference}",
            "account_number": account_number,
            "amount": float(amount),
            "reference": reference,
            "payment_method": payment_method,
            "bank_code": bank_code,
            "generated_at": datetime.utcnow().isoformat(),
            "expires_at": (datetime.utcnow().replace(hour=datetime.utcnow().hour+2)).isoformat()
        }
    
    @staticmethod
    def validate_qr_code(qr_data: str) -> dict:
        """
        Validate and parse QR code data
        
        Args:
            qr_data: The QR code data string
        
        Returns:
            Dictionary containing parsed QR code information
        """
        if not qr_data:
            raise ValueError("QR data cannot be empty")
        
        # Parse based on prefix
        if qr_data.startswith("PGW:"):
            return QRPaymentGenerator._parse_payment_qr(qr_data)
        elif qr_data.startswith("BANK:"):
            return QRPaymentGenerator._parse_bank_transfer_qr(qr_data)
        else:
            raise ValueError("Invalid QR code format")
    
    @staticmethod
    def _parse_payment_qr(qr_data: str) -> dict:
        """Parse payment QR code data"""
        parts = qr_data.split(":")
        
        if len(parts) != 6:
            raise ValueError("Invalid QR code format")
        
        return {
            "type": "payment",
            "gateway": parts[1],
            "amount": Decimal(parts[2]),
            "reference": parts[3],
            "timestamp": parts[4],
            "metadata": {
                "generated_at": parts[4],
                "valid_hours": 2
            }
        }
    
    @staticmethod
    def _parse_bank_transfer_qr(qr_data: str) -> dict:
        """Parse bank transfer QR code data"""
        parts = qr_data.split(":")
        
        if len(parts) != 7:
            raise ValueError("Invalid QR code format")
        
        return {
            "type": "bank_transfer",
            "gateway": parts[1],
            "amount": Decimal(parts[2]),
            "reference": parts[3],
            "account_number": parts[4],
            "timestamp": parts[5],
            "metadata": {
                "generated_at": parts[5],
                "valid_hours": 2
            }
        }
    
    @staticmethod
    def generate_teller_qr_payment(
        amount: Decimal,
        reference: str,
        customer_name: Optional[str] = None,
        branch_code: Optional[str] = None
    ) -> dict:
        """
        Generate a teller QR payment code
        
        Args:
            amount: Payment amount
            reference: Transaction reference
            customer_name: Customer name (optional)
            branch_code: Branch code (optional)
        
        Returns:
            Dictionary with QR code and payment details
        """
        if not branch_code:
            branch_code = "BRANCH_DEFAULT"
        
        qr_data = f"TELLER:PAYMENT:{amount}:{reference}:{branch_code}:{datetime.utcnow().isoformat()}"
        
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_M,
            box_size=12,
            border=4,
        )
        qr.add_data(qr_data)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        
        buffered = BytesIO()
        img.save(buffered, format="PNG")
        qr_image_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')
        
        return {
            "qr_code": qr_image_base64,
            "payment_url": f"/teller/qrcode/{reference}",
            "account_number": None,
            "amount": float(amount),
            "reference": reference,
            "payment_method": "teller",
            "customer_name": customer_name,
            "branch_code": branch_code,
            "generated_at": datetime.utcnow().isoformat(),
            "expires_at": (datetime.utcnow().replace(hour=datetime.utcnow().hour+2)).isoformat(),
            "is_teller_payment": True
        }


def create_payment_qr(
    amount: Decimal,
    reference: str,
    payment_method: Literal["gcash", "maya", "instapay", "pesonet"] = "gcash",
    **kwargs
) -> dict:
    """
    Create a payment QR code (convenience function)
    
    Args:
        amount: Payment amount
        reference: Transaction reference
        payment_method: Payment gateway
        **kwargs: Additional parameters (account_number, bank_code, etc.)
    
    Returns:
        Dictionary with QR code data
    """
    generator = QRPaymentGenerator()
    
    if payment_method in ["gcash", "maya"]:
        return generator.generate_payment_qr_code(
            amount=amount,
            reference=reference,
            payment_method=payment_method,
            **kwargs
        )
    elif payment_method in ["instapay", "pesonet"]:
        if "account_number" not in kwargs:
            kwargs["account_number"] = kwargs.get("customer_account")
        return generator.generate_payment_qr_code(
            amount=amount,
            reference=reference,
            payment_method=payment_method,
            **kwargs
        )
    else:
        raise ValueError(f"Unsupported payment method: {payment_method}")


def create_teller_qr_payment(
    amount: Decimal,
    reference: str,
    **kwargs
) -> dict:
    """
    Create a teller QR payment (convenience function)
    
    Args:
        amount: Payment amount
        reference: Transaction reference
        **kwargs: Additional parameters
    
    Returns:
        Dictionary with QR code data
    """
    generator = QRPaymentGenerator()
    return generator.generate_teller_qr_payment(
        amount=amount,
        reference=reference,
        **kwargs
    )


# Example usage
if __name__ == "__main__":
    # Generate GCash QR
    gcash_qr = create_payment_qr(
        amount=Decimal("15000.00"),
        reference="GC-20260226-001",
        payment_method="gcash",
        mobile_number="09171234567"
    )
    print("GCash QR Generated:", gcash_qr)
    
    # Generate Maya QR
    maya_qr = create_payment_qr(
        amount=Decimal("25000.00"),
        reference="MY-20260226-002",
        payment_method="maya",
        email="customer@example.com"
    )
    print("Maya QR Generated:", maya_qr)
    
    # Generate InstaPay QR
    instapay_qr = create_payment_qr(
        amount=Decimal("50000.00"),
        reference="IP-20260226-003",
        payment_method="instapay",
        account_number="0028437123456789",
        bank_code="002"
    )
    print("InstaPay QR Generated:", instapay_qr)
    
    # Generate Teller QR
    teller_qr = create_teller_qr_payment(
        amount=Decimal("10000.00"),
        reference="TL-20260226-001",
        customer_name="Juan dela Cruz",
        branch_code="BR001"
    )
    print("Teller QR Generated:", teller_qr)