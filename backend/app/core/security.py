from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.core.config import settings
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import warnings
import os

# Suppress bcrypt version warnings
warnings.filterwarnings("ignore", category=UserWarning, module="passlib")
os.environ['PASSLIB_SUPPRESS_BCRYPT_VERSION_WARNING'] = '1'

# Monkey patch to fix bcrypt version detection
try:
    import bcrypt
    if not hasattr(bcrypt, '__about__'):
        class MockAbout:
            __version__ = bcrypt.__version__ if hasattr(bcrypt, '__version__') else "4.3.0"
        bcrypt.__about__ = MockAbout()
except ImportError:
    pass

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=12,
    bcrypt__ident="2b"
)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode["exp"] = expire
    to_encode["type"] = "access"
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt

def create_refresh_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode["exp"] = expire
    to_encode["type"] = "refresh"
    encoded_jwt = jwt.encode(to_encode, settings.JWT_REFRESH_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt

def verify_token(token: str, secret_key: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, secret_key, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except JWTError:
        return None

def create_verification_token(email: str) -> str:
    data = {"email": email, "type": "verification"}
    expire = datetime.utcnow() + timedelta(hours=24)
    data["exp"] = expire
    return jwt.encode(data, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

def create_reset_token(email: str) -> str:
    data = {"email": email, "type": "reset"}
    expire = datetime.utcnow() + timedelta(hours=1)
    data["exp"] = expire
    return jwt.encode(data, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

async def send_email(to_email: str, subject: str, body: str) -> bool:
    if not all([settings.EMAIL_HOST, settings.EMAIL_USER, settings.EMAIL_PASSWORD]):
        print(f"Email would be sent to {to_email}: {subject}")
        return True

    try:
        msg = MIMEMultipart()
        msg['From'] = settings.EMAIL_USER or ""
        msg['To'] = to_email
        msg['Subject'] = subject

        msg.attach(MIMEText(body, 'html'))

        server = smtplib.SMTP_SSL(settings.EMAIL_HOST or "", settings.EMAIL_PORT)
        # server.starttls()
        server.login(settings.EMAIL_USER or "", settings.EMAIL_PASSWORD or "")
        text = msg.as_string()
        server.sendmail(settings.EMAIL_USER or "", to_email, text)
        server.quit()
        return True
    except Exception as e:
        print(f"Email sending failed: {e}")
        return False

def get_device_info(user_agent: str) -> dict:
    """Extract device information from user agent string"""
    # This is a simplified version - in production you might want to use a proper user agent parser
    device_info = {
        "user_agent": user_agent,
        "browser": "Unknown",
        "os": "Unknown",
        "device": "Unknown"
    }

    user_agent_lower = user_agent.lower()

    # Detect browser
    if "chrome" in user_agent_lower:
        device_info["browser"] = "Chrome"
    elif "firefox" in user_agent_lower:
        device_info["browser"] = "Firefox"
    elif "safari" in user_agent_lower:
        device_info["browser"] = "Safari"
    elif "edge" in user_agent_lower:
        device_info["browser"] = "Edge"

    # Detect OS
    if "windows" in user_agent_lower:
        device_info["os"] = "Windows"
    elif "mac" in user_agent_lower:
        device_info["os"] = "macOS"
    elif "linux" in user_agent_lower:
        device_info["os"] = "Linux"
    elif "android" in user_agent_lower:
        device_info["os"] = "Android"
    elif "ios" in user_agent_lower:
        device_info["os"] = "iOS"

    # Detect device type
    if "mobile" in user_agent_lower or "android" in user_agent_lower or "iphone" in user_agent_lower:
        device_info["device"] = "Mobile"
    elif "tablet" in user_agent_lower or "ipad" in user_agent_lower:
        device_info["device"] = "Tablet"
    else:
        device_info["device"] = "Desktop"

    return device_info
