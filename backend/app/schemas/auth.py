from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class SignUpRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    first_name: str = Field(..., min_length=1, max_length=50)
    last_name: str = Field(..., min_length=1, max_length=50)

class SignInRequest(BaseModel):
    email: EmailStr
    password: str

class VerifyEmailRequest(BaseModel):
    token: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8)

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class UserDetailsResponse(BaseModel):
    id: str
    email: str
    first_name: str
    last_name: str
    role: str
    is_active: bool
    is_verified: bool
    is_premium: bool = False
    created_at: datetime
    updated_at: datetime

class AuthResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserDetailsResponse

class SessionResponse(BaseModel):
    id: str
    device_info: dict
    ip_address: Optional[str]
    is_active: bool
    last_activity: datetime
    created_at: datetime

class SessionStatsResponse(BaseModel):
    total_sessions: int
    active_sessions: int
    inactive_sessions: int
    sessions_by_device: dict
    sessions_by_browser: dict

class MessageResponse(BaseModel):
    message: str
