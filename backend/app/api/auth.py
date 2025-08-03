from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from fastapi.security import HTTPBearer
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from datetime import timedelta
from typing import List

from app.core.database import get_database
from app.core.security import verify_token
from app.core.config import settings
from app.services.auth_service import AuthService
from app.schemas.auth import (
    SignUpRequest, SignInRequest, VerifyEmailRequest, ForgotPasswordRequest,
    ResetPasswordRequest, RefreshTokenRequest, UserDetailsResponse, AuthResponse,
    SessionResponse, SessionStatsResponse, MessageResponse
)

auth_router = APIRouter()
security = HTTPBearer()

async def get_current_user(
    request: Request,
    db: AsyncIOMotorClient = Depends(get_database)
) -> UserDetailsResponse:
    # Get token from cookies first, then from Authorization header
    access_token = request.cookies.get("access_token")
    if not access_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            access_token = auth_header.split(" ")[1]
    
    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )

    payload = verify_token(access_token, settings.JWT_SECRET_KEY)
    if not payload or payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid access token"
        )

    user_id = payload.get("user_id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )

    auth_service = AuthService(db)
    user = await auth_service.get_user_by_id(user_id)
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )

    return UserDetailsResponse(
        id=str(user.id),
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        role=user.role,
        is_active=user.is_active,
        is_verified=user.is_verified,
        created_at=user.created_at,
        updated_at=user.updated_at
    )

async def get_current_admin(
    current_user: UserDetailsResponse = Depends(get_current_user)
) -> UserDetailsResponse:
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user

@auth_router.post("/signup", response_model=MessageResponse)
async def signup(
    user_data: SignUpRequest,
    db: AsyncIOMotorClient = Depends(get_database)
):
    auth_service = AuthService(db)
    await auth_service.create_user(user_data)
    return MessageResponse(message="User created successfully. Please check your email for verification.")

@auth_router.post("/signin", response_model=AuthResponse)
async def signin(
    user_data: SignInRequest,
    request: Request,
    response: Response,
    db: AsyncIOMotorClient = Depends(get_database)
):
    auth_service = AuthService(db)
    
    # Authenticate user
    user = await auth_service.authenticate_user(user_data.email, user_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account is deactivated"
        )

    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email not verified. Please check your email for verification link."
        )

    # Create session and tokens
    user_agent = request.headers.get("User-Agent", "")
    client_ip = request.client.host if request.client else None
    
    session, auth_token = await auth_service.create_session(
        user.id, user_agent, client_ip
    )

    # Set cookies
    response.set_cookie(
        key="access_token",
        value=auth_token.access_token,
        httponly=True,
        secure=False,  # Set to True in production with HTTPS
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )
    
    response.set_cookie(
        key="refresh_token",
        value=auth_token.refresh_token,
        httponly=True,
        secure=False,  # Set to True in production with HTTPS
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
    )

    return AuthResponse(
        access_token=auth_token.access_token,
        refresh_token=auth_token.refresh_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserDetailsResponse(
            id=str(user.id),
            email=user.email,
            first_name=user.first_name,
            last_name=user.last_name,
            role=user.role,
            is_active=user.is_active,
            is_verified=user.is_verified,
            created_at=user.created_at,
            updated_at=user.updated_at
        )
    )

@auth_router.post("/verify-email", response_model=MessageResponse)
async def verify_email(
    verify_data: VerifyEmailRequest,
    db: AsyncIOMotorClient = Depends(get_database)
):
    auth_service = AuthService(db)
    await auth_service.verify_email(verify_data.token)
    return MessageResponse(message="Email verified successfully")

@auth_router.post("/forgot", response_model=MessageResponse)
async def forgot_password(
    forgot_data: ForgotPasswordRequest,
    db: AsyncIOMotorClient = Depends(get_database)
):
    auth_service = AuthService(db)
    await auth_service.forgot_password(forgot_data.email)
    return MessageResponse(message="If the email exists, a password reset link has been sent")

@auth_router.post("/reset-password", response_model=MessageResponse)
async def reset_password(
    reset_data: ResetPasswordRequest,
    db: AsyncIOMotorClient = Depends(get_database)
):
    auth_service = AuthService(db)
    await auth_service.reset_password(reset_data.token, reset_data.new_password)
    return MessageResponse(message="Password reset successfully")

@auth_router.post("/refresh-token", response_model=AuthResponse)
async def refresh_token(
    refresh_data: RefreshTokenRequest,
    response: Response,
    db: AsyncIOMotorClient = Depends(get_database)
):
    payload = verify_token(refresh_data.refresh_token, settings.JWT_REFRESH_SECRET_KEY)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )

    user_id = payload.get("user_id")
    auth_service = AuthService(db)
    user = await auth_service.get_user_by_id(user_id)
    
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )

    # Create new tokens
    token_data = {"user_id": str(user.id), "role": user.role}
    new_access_token = auth_service.create_access_token(token_data)
    new_refresh_token = auth_service.create_refresh_token(token_data)

    # Set new cookies
    response.set_cookie(
        key="access_token",
        value=new_access_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )
    
    response.set_cookie(
        key="refresh_token",
        value=new_refresh_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
    )

    return AuthResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserDetailsResponse(
            id=str(user.id),
            email=user.email,
            first_name=user.first_name,
            last_name=user.last_name,
            role=user.role,
            is_active=user.is_active,
            is_verified=user.is_verified,
            created_at=user.created_at,
            updated_at=user.updated_at
        )
    )

@auth_router.get("/details", response_model=UserDetailsResponse)
async def get_user_details(
    current_user: UserDetailsResponse = Depends(get_current_user)
):
    return current_user

@auth_router.post("/logout", response_model=MessageResponse)
async def logout(
    response: Response,
    current_user: UserDetailsResponse = Depends(get_current_user),
    db: AsyncIOMotorClient = Depends(get_database)
):
    auth_service = AuthService(db)
    await auth_service.deactivate_all_sessions(str(current_user.id))
    
    # Clear cookies
    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token")
    
    return MessageResponse(message="Logged out successfully")

@auth_router.get("/sessions", response_model=List[SessionResponse])
async def get_user_sessions(
    current_user: UserDetailsResponse = Depends(get_current_user),
    db: AsyncIOMotorClient = Depends(get_database)
):
    auth_service = AuthService(db)
    sessions = await auth_service.get_user_sessions(str(current_user.id))
    return sessions

@auth_router.delete("/sessions", response_model=MessageResponse)
async def logout_all_devices(
    current_user: UserDetailsResponse = Depends(get_current_user),
    db: AsyncIOMotorClient = Depends(get_database)
):
    auth_service = AuthService(db)
    await auth_service.deactivate_all_sessions(str(current_user.id))
    return MessageResponse(message="Logged out from all devices")

@auth_router.delete("/sessions/{session_id}", response_model=MessageResponse)
async def logout_device(
    session_id: str,
    current_user: UserDetailsResponse = Depends(get_current_user),
    db: AsyncIOMotorClient = Depends(get_database)
):
    auth_service = AuthService(db)
    success = await auth_service.deactivate_session(session_id, str(current_user.id))
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    return MessageResponse(message="Device logged out successfully")

@auth_router.get("/sessions/stats", response_model=SessionStatsResponse)
async def get_session_stats(
    current_user: UserDetailsResponse = Depends(get_current_user),
    db: AsyncIOMotorClient = Depends(get_database)
):
    auth_service = AuthService(db)
    stats = await auth_service.get_session_stats(str(current_user.id))
    return stats

@auth_router.post("/resend-verification", response_model=MessageResponse)
async def resend_verification(
    email: str,
    db: AsyncIOMotorClient = Depends(get_database)
):
    auth_service = AuthService(db)
    await auth_service.resend_verification(email)
    return MessageResponse(message="Verification email sent successfully") 