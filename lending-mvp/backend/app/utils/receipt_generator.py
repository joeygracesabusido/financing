"""
Official Receipt (OR) PDF Generator
====================================

Generates professional PDF official receipts for loan disbursements, repayments,
and fees with proper banking formatting.
"""

from fpdf import FPDF
from datetime import datetime
from decimal import Decimal
from typing import Optional


class OfficialReceiptPDF(FPDF):
    """Custom PDF class for Official Receipts with proper formatting."""
    
    def __init__(self, receipt_data: dict):
        super().__init__()
        self.receipt_data = receipt_data
        self.set_auto_page_break(auto=True, margin=15)
    
    def header(self):
        """Header with bank logo and receipt title."""
        self.set_font("Helvetica", "B", 16)
        self.set_fill_color(0, 51, 102)  # Navy blue
        self.set_text_color(255, 255, 255)
        self.cell(0, 10, "OFFICIAL RECEIPT", border=0, fill=True, align="C")
        self.ln(10)
        
        # Bank info
        self.set_font("Helvetica", "B", 12)
        self.set_text_color(0, 51, 102)
        self.cell(0, 8, "FINANCING SOLUTIONS INC.", border=0, align="C")
        self.ln(5)
        
        self.set_font("Helvetica", "", 9)
        self.cell(0, 6, "Unit 1200, Atrium Two Building, Bonifacio Global City, Taguig", border=0, align="C")
        self.ln(4)
        self.cell(0, 6, "Telpass: (632) 8888-8888 | Email: info@financing-solutions.ph", border=0, align="C")
        self.ln(10)
    
    def footer(self):
        """Footer with disclaimer and page number."""
        self.set_y(-20)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(128)
        self.cell(0, 5, "This is a computer-generated receipt. Signature not required.", align="C")
        self.ln(3)
        self.set_font("Helvetica", "I", 7)
        self.cell(0, 5, f"Page {self.page_no()}", align="C")
    
    def receipt_header(self):
        """Receipt header with receipt number and date."""
        data = self.receipt_data
        
        self.set_font("Helvetica", "B", 10)
        self.set_text_color(0, 0, 0)
        self.cell(0, 8, f"Receipt No: {data['receipt_number']}", border=0, ln=True)
        
        self.set_font("Helvetica", "", 9)
        self.cell(0, 6, f"Date: {data['date']}", border=0, ln=True)
        
        if data.get('transaction_type'):
            self.cell(0, 6, f"Transaction Type: {data['transaction_type']}", border=0, ln=True)
        
        self.ln(10)
    
    def customer_info(self):
        """Customer information section."""
        data = self.receipt_data
        
        self.set_font("Helvetica", "B", 9)
        self.set_text_color(0, 51, 102)
        self.cell(0, 6, "CUSTOMER INFORMATION", border=0, ln=True)
        self.ln(2)
        
        self.set_font("Helvetica", "", 9)
        self.cell(40, 6, "Customer Name:", border=0)
        self.cell(0, 6, data['customer_name'], border=0, ln=True)
        
        if data.get('customer_id'):
            self.cell(40, 6, "Customer ID:", border=0)
            self.cell(0, 6, data['customer_id'], border=0, ln=True)
        
        if data.get('customer_address'):
            self.cell(40, 6, "Address:", border=0)
            self.cell(0, 6, data['customer_address'], border=0, ln=True)
        
        if data.get('loan_number'):
            self.cell(40, 6, "Loan Number:", border=0)
            self.cell(0, 6, data['loan_number'], border=0, ln=True)
        
        self.ln(5)
    
    def transaction_details(self):
        """Transaction details section."""
        data = self.receipt_data
        
        self.set_font("Helvetica", "B", 9)
        self.set_text_color(0, 51, 102)
        self.cell(0, 6, "TRANSACTION DETAILS", border=0, ln=True)
        self.ln(2)
        
        self.set_font("Helvetica", "", 9)
        
        # Amount details
        self.cell(40, 6, "Amount:", border=0)
        self.cell(0, 6, f"PHP {self.format_currency(data['amount'])}", border=0, ln=True)
        
        if data.get('description'):
            self.cell(40, 6, "Description:", border=0)
            self.cell(0, 6, data['description'], border=0, ln=True)
        
        if data.get('payment_method'):
            self.cell(40, 6, "Payment Method:", border=0)
            self.cell(0, 6, data['payment_method'], border=0, ln=True)
        
        if data.get('receipt_number'):
            self.cell(40, 6, "Receipt Number:", border=0)
            self.cell(0, 6, data['receipt_number'], border=0, ln=True)
        
        self.ln(5)
    
    def breakdown_details(self):
        """Breakdown of principal, interest, penalties."""
        data = self.receipt_data
        
        if not data.get('breakdown'):
            return
        
        self.set_font("Helvetica", "B", 9)
        self.set_text_color(0, 51, 102)
        self.cell(0, 6, "PAYMENT BREAKDOWN", border=0, ln=True)
        self.ln(2)
        
        self.set_font("Helvetica", "", 9)
        
        breakdown = data['breakdown']
        
        if breakdown.get('principal'):
            self.cell(40, 5, "Principal:", border=0)
            self.cell(0, 5, f"PHP {self.format_currency(breakdown['principal'])}", border=0, ln=True)
        
        if breakdown.get('interest'):
            self.cell(40, 5, "Interest:", border=0)
            self.cell(0, 5, f"PHP {self.format_currency(breakdown['interest'])}", border=0, ln=True)
        
        if breakdown.get('penalty'):
            self.cell(40, 5, "Penalty/Late Fee:", border=0)
            self.cell(0, 5, f"PHP {self.format_currency(breakdown['penalty'])}", border=0, ln=True)
        
        if breakdown.get('fees'):
            self.cell(40, 5, "Fees:", border=0)
            self.cell(0, 5, f"PHP {self.format_currency(breakdown['fees'])}", border=0, ln=True)
        
        if breakdown.get('total'):
            self.ln(2)
            self.set_font("Helvetica", "B", 9)
            self.cell(40, 6, "TOTAL:", border=1)
            self.cell(0, 6, f"PHP {self.format_currency(breakdown['total'])}", border=1, ln=True)
        
        self.ln(5)
    
    def accounting_info(self):
        """Accounting journal entry information."""
        data = self.receipt_data
        
        if not data.get('journal_entries'):
            return
        
        self.set_font("Helvetica", "B", 9)
        self.set_text_color(0, 51, 102)
        self.cell(0, 6, "JOURNAL ENTRY", border=0, ln=True)
        self.ln(2)
        
        self.set_font("Helvetica", "", 8)
        
        for entry in data['journal_entries']:
            self.cell(20, 4, entry.get('account_code', ''), border=0)
            self.cell(80, 4, entry.get('account_name', ''), border=0)
            self.cell(30, 4, f"PHP {self.format_currency(entry.get('debit', 0))}", border=0, align="R")
            self.cell(0, 4, f"PHP {self.format_currency(entry.get('credit', 0))}", border=0, align="R", ln=True)
        
        self.ln(5)
    
    def processed_by(self):
        """Processed by information."""
        data = self.receipt_data
        
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(128)
        
        processed_by = data.get('processed_by', 'System')
        processed_date = data.get('processed_date', datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
        
        self.cell(0, 5, f"Processed by: {processed_by} on {processed_date}", align="C")
        self.ln(10)
    
    def format_currency(self, amount) -> str:
        """Format amount as currency with commas."""
        if isinstance(amount, (int, float, Decimal)):
            return f"{amount:,.2f}"
        return str(amount)
    
    def generate(self) -> bytes:
        """Generate the PDF and return as bytes."""
        self.add_page()
        
        self.receipt_header()
        self.customer_info()
        self.transaction_details()
        self.breakdown_details()
        self.accounting_info()
        self.processed_by()
        
        return self.output(dest="S")


def generate_receipt_pdf(receipt_data: dict) -> bytes:
    """
    Generate an Official Receipt PDF.
    
    Args:
        receipt_data: Dictionary containing receipt details:
            - receipt_number: Unique receipt number
            - date: Receipt date
            - customer_name: Customer's full name
            - customer_id: Optional customer ID
            - customer_address: Optional customer address
            - loan_number: Optional loan number
            - amount: Transaction amount
            - description: Transaction description
            - payment_method: Payment method (cash, transfer, etc.)
            - transaction_type: Optional transaction type
            - breakdown: Optional payment breakdown (principal, interest, penalty, fees, total)
            - journal_entries: Optional accounting journal entries
            - processed_by: User who processed the transaction
            - processed_date: Timestamp of processing
    
    Returns:
        PDF as bytes
    """
    pdf = OfficialReceiptPDF(receipt_data)
    return pdf.generate()


# ============================================================================
# EXAMPLE USAGE
# ============================================================================

if __name__ == "__main__":
    # Example 1: Loan Disbursement Receipt
    disbursement_receipt = {
        "receipt_number": "DSB-2026-001",
        "date": datetime.now().strftime("%Y-%m-%d"),
        "customer_name": "Juan dela Cruz",
        "customer_id": "CUST-001",
        "customer_address": "123 Makati Avenue, Makati City",
        "loan_number": "LOAN-001234",
        "amount": Decimal("490000.00"),
        "description": "Net disbursement (Origination fee deducted)",
        "payment_method": "Bank Transfer",
        "transaction_type": "Loan Disbursement",
        "breakdown": {
            "principal": Decimal("490000.00"),
            "total": Decimal("490000.00"),
        },
        "journal_entries": [
            {"account_code": "1300", "account_name": "Loans Receivable", "debit": Decimal("500000.00"), "credit": Decimal("0")},
            {"account_code": "1010", "account_name": "Cash in Bank", "debit": Decimal("0"), "credit": Decimal("490000.00")},
            {"account_code": "4200", "account_name": "Origination Fee Income", "debit": Decimal("0"), "credit": Decimal("10000.00")},
        ],
        "processed_by": "loan_officer_1",
        "processed_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    }
    
    pdf_bytes = generate_receipt_pdf(disbursement_receipt)
    
    with open("/tmp/disbursement_receipt.pdf", "wb") as f:
        f.write(pdf_bytes)
    
    print("Disbursement receipt generated: /tmp/disbursement_receipt.pdf")
    
    # Example 2: Repayment Receipt with breakdown
    repayment_receipt = {
        "receipt_number": "OR-2026-002",
        "date": datetime.now().strftime("%Y-%m-%d"),
        "customer_name": "Maria Cruz Santos",
        "customer_id": "CUST-002",
        "customer_address": "456 Quezon Avenue, Quezon City",
        "loan_number": "LOAN-001235",
        "amount": Decimal("25000.00"),
        "description": "Monthly amortization payment",
        "payment_method": "Cash",
        "transaction_type": "Loan Repayment",
        "breakdown": {
            "principal": Decimal("15000.00"),
            "interest": Decimal("7500.00"),
            "penalty": Decimal("2500.00"),
            "total": Decimal("25000.00"),
        },
        "journal_entries": [
            {"account_code": "1010", "account_name": "Cash in Bank", "debit": Decimal("25000.00"), "credit": Decimal("0")},
            {"account_code": "1300", "account_name": "Loans Receivable", "debit": Decimal("0"), "credit": Decimal("15000.00")},
            {"account_code": "4100", "account_name": "Interest Income", "debit": Decimal("0"), "credit": Decimal("7500.00")},
            {"account_code": "5200", "account_name": "Late Fee Income", "debit": Decimal("0"), "credit": Decimal("2500.00")},
        ],
        "processed_by": "teller_1",
        "processed_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    }
    
    pdf_bytes = generate_receipt_pdf(repayment_receipt)
    
    with open("/tmp/repayment_receipt.pdf", "wb") as f:
        f.write(pdf_bytes)
    
    print("Repayment receipt generated: /tmp/repayment_receipt.pdf")