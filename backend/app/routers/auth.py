"""Router for account authentication via OTP."""

import os
import random
import secrets
import smtplib
from datetime import datetime, timedelta
from email.mime.text import MIMEText
from fastapi import APIRouter, HTTPException, Header, Depends, status
import structlog
from app.db.connection import get_db
from app.models.schemas import OTPSendRequest, OTPVerifyRequest, AuthResponse, AccountInfo

logger = structlog.get_logger()
router = APIRouter(prefix="/api/auth", tags=["auth"])

SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
SMTP_FROM_EMAIL = os.getenv("SMTP_FROM_EMAIL")


def send_otp_email(to_email: str, code: str):
    """Attempt to send OTP code via SMTP. Logs to console if SMTP is not configured."""
    if not all([SMTP_HOST, SMTP_USERNAME, SMTP_PASSWORD, SMTP_FROM_EMAIL]):
        logger.info("[DEV MODE] OTP Generated", email=to_email, code=code)
        return True

    try:
        msg = MIMEText(f"Your DeskPad verification code is: {code}\nThis code will expire in 5 minutes.")
        msg["Subject"] = "DeskPad Verification Code"
        msg["From"] = SMTP_FROM_EMAIL
        msg["To"] = to_email

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.sendmail(SMTP_FROM_EMAIL, [to_email], msg.as_string())
        
        logger.info("OTP email sent successfully", email=to_email)
        return True
    except Exception as e:
        logger.error("Failed to send OTP email via SMTP", error=str(e), email=to_email)
        # Fallback to dev mode print so the user is never locked out
        logger.info("[DEV FALLBACK] OTP Generated due to SMTP failure", email=to_email, code=code)
        return False


@router.post("/otp/send")
async def send_otp(req: OTPSendRequest):
    """Generate and send a 6-digit OTP code to the requested email."""
    email = req.email.strip().lower()
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email address is required"
        )

    code = f"{random.randint(100000, 999999):06d}"
    expires_at = datetime.utcnow() + timedelta(minutes=5)

    db = await get_db()
    await db.execute(
        "INSERT OR REPLACE INTO otp_codes (email, code, expires_at) VALUES (?, ?, ?)",
        (email, code, expires_at.isoformat())
    )
    await db.commit()

    send_otp_email(email, code)
    
    # In development mode or if SMTP is unconfigured, return code in response to facilitate browser testing
    res = {"success": True}
    if not all([SMTP_HOST, SMTP_USERNAME, SMTP_PASSWORD, SMTP_FROM_EMAIL]):
        res["code"] = code  # Only expose in response when SMTP is not configured
    return res


@router.post("/otp/verify", response_model=AuthResponse)
async def verify_otp(req: OTPVerifyRequest):
    """Verify OTP, login, and create account if necessary."""
    email = req.email.strip().lower()
    code = req.code.strip()

    db = await get_db()
    cursor = await db.execute(
        "SELECT code, expires_at FROM otp_codes WHERE email = ?",
        (email,)
    )
    row = await cursor.fetchone()

    if not row:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No verification code was sent to this email address"
        )

    saved_code, expires_at_str = row
    expires_at = datetime.fromisoformat(expires_at_str)

    if saved_code != code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code"
        )

    if datetime.utcnow() > expires_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification code has expired"
        )

    # Clean up OTP
    await db.execute("DELETE FROM otp_codes WHERE email = ?", (email,))

    # Create account if it doesn't exist
    cursor = await db.execute("SELECT id FROM accounts WHERE email = ?", (email,))
    account_row = await cursor.fetchone()

    if not account_row:
        # Create account
        cursor = await db.execute("INSERT INTO accounts (email) VALUES (?)", (email,))
        account_id = cursor.lastrowid
        
        # Automatically create initial Profile for new account
        profile_cursor = await db.execute(
            "INSERT INTO users (name, avatar_color, account_id) VALUES (?, ?, ?)",
            ("Default Profile", "#4f46e5", account_id)
        )
        profile_id = profile_cursor.lastrowid
        
        # Seed settings for the new default profile
        DEFAULT_USER_SETTINGS = {
            "clock_mode": "analog",
            "time_format": "24h",
            "week_starts_on": "1",
            "show_week_numbers": "false",
        }
        for key, value in DEFAULT_USER_SETTINGS.items():
            await db.execute(
                "INSERT INTO user_settings (user_id, key, value) VALUES (?, ?, ?)",
                (profile_id, key, value)
            )
    else:
        account_id = account_row[0]

    # Create session
    token = secrets.token_hex(32)
    session_expiry = datetime.utcnow() + timedelta(days=30)
    await db.execute(
        "INSERT INTO sessions (token, account_id, expires_at) VALUES (?, ?, ?)",
        (token, account_id, session_expiry.isoformat())
    )
    await db.commit()

    return AuthResponse(
        token=token,
        account=AccountInfo(id=account_id, email=email)
    )


@router.post("/logout")
async def logout(authorization: str = Header(None)):
    """Revoke session token."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization token required"
        )

    token = authorization.split(" ")[1]
    db = await get_db()
    await db.execute("DELETE FROM sessions WHERE token = ?", (token,))
    await db.commit()
    return {"success": True}


async def get_current_account(authorization: str = Header(None)) -> AccountInfo:
    """Dependency to retrieve active account from Authorization header."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization token required"
        )

    token = authorization.split(" ")[1]
    db = await get_db()
    cursor = await db.execute(
        "SELECT s.account_id, a.email, s.expires_at FROM sessions s JOIN accounts a ON s.account_id = a.id WHERE s.token = ?",
        (token,)
    )
    row = await cursor.fetchone()

    if not row:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session token"
        )

    account_id, email, expires_at_str = row
    expires_at = datetime.fromisoformat(expires_at_str)

    if datetime.utcnow() > expires_at:
        await db.execute("DELETE FROM sessions WHERE token = ?", (token,))
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session has expired"
        )

    return AccountInfo(id=account_id, email=email)


@router.get("/session")
async def get_session(current_account: AccountInfo = Depends(get_current_account)):
    """Retrieve active session details, account info, and associated profiles."""
    db = await get_db()
    cursor = await db.execute(
        "SELECT id, name, avatar_color FROM users WHERE account_id = ? ORDER BY id ASC",
        (current_account.id,)
    )
    profiles_rows = await cursor.fetchall()
    
    profiles = [
        {"id": row[0], "name": row[1], "avatar_color": row[2]}
        for row in profiles_rows
    ]
    
    return {
        "account": current_account,
        "profiles": profiles
    }


async def verify_profile_owner(db, user_id: int, account_id: int):
    """Verify that a given profile user_id belongs to the active account_id."""
    cursor = await db.execute("SELECT account_id FROM users WHERE id = ?", (user_id,))
    row = await cursor.fetchone()
    if not row or row[0] != account_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: you do not own this profile"
        )
