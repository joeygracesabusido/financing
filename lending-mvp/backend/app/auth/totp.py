"""
TOTP (Time-based One-Time Password) utilities for 2FA.
Uses pyotp + qrcode libraries.
"""
import base64
import io

import pyotp
import qrcode
from qrcode.image.pure import PyPNGImage


# Issuer name shown in Authenticator apps
ISSUER_NAME = "LendingMVP"


def generate_totp_secret() -> str:
    """Generate a new random Base32 TOTP secret."""
    return pyotp.random_base32()


def get_totp_uri(secret: str, username: str) -> str:
    """Build the otpauth:// URI for QR enrollment."""
    totp = pyotp.TOTP(secret)
    return totp.provisioning_uri(name=username, issuer_name=ISSUER_NAME)


def generate_qr_base64(uri: str) -> str:
    """
    Generate a QR code PNG from a URI and return it as a base64 string.
    The frontend can display it as: <img src="data:image/png;base64,{result}" />
    """
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=6,
        border=4,
    )
    qr.add_data(uri)
    qr.make(fit=True)
    img = qr.make_image(image_factory=PyPNGImage)
    buf = io.BytesIO()
    img.save(buf)
    buf.seek(0)
    return base64.b64encode(buf.read()).decode("utf-8")


def verify_totp(secret: str, otp_code: str, valid_window: int = 1) -> bool:
    """
    Verify a 6-digit OTP against a TOTP secret.
    valid_window=1 allows ±30 seconds clock drift.
    """
    totp = pyotp.TOTP(secret)
    return totp.verify(otp_code, valid_window=valid_window)
