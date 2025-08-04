from datetime import datetime, timedelta
from typing import Optional, List
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from fastapi import HTTPException, status
from app.core.security import (
    get_password_hash, verify_password, create_access_token,
    create_refresh_token, verify_token, create_verification_token,
    create_reset_token, send_email, get_device_info
)
from app.core.config import settings
from app.models.user import UserInDB, UserCreate
from app.models.session import UserSessionInDB, AuthTokenInDB
from app.schemas.auth import SignUpRequest, SessionResponse, SessionStatsResponse

class AuthService:
    def __init__(self, db: AsyncIOMotorClient):
        self.db = db
        self.users_collection = db.templater.users
        self.sessions_collection = db.templater.user_sessions
        self.tokens_collection = db.templater.auth_tokens

    async def create_user(self, user_data: SignUpRequest) -> UserInDB:
        # Check if user already exists
        existing_user = await self.users_collection.find_one({"email": user_data.email})
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )

        # Create verification token
        verification_token = create_verification_token(user_data.email)
        verification_expires = datetime.utcnow() + timedelta(hours=24)

        # Create user document
        user_dict = user_data.model_dump()
        user_dict["hashed_password"] = get_password_hash(user_data.password)
        user_dict["verification_token"] = verification_token
        user_dict["verification_token_expires"] = verification_expires
        user_dict.pop("password", None)

        user = UserInDB(**user_dict)
        result = await self.users_collection.insert_one(user.model_dump(by_alias=True))
        user.id = result.inserted_id

        # Send verification email
        verification_url = f"{settings.FRONTEND_URL}/verify-email?token={verification_token}"
        email_body = f"""
        <h2>Welcome to Templater!</h2>
        <p>Please verify your email by clicking the link below:</p>
        <a href="{verification_url}">Verify Email</a>
        <p>This link will expire in 24 hours.</p>
        """
        await send_email(user_data.email, "Verify Your Email", email_body)

        return user

    async def verify_email(self, token: str) -> bool:
        payload = verify_token(token, settings.JWT_SECRET_KEY)
        if not payload or payload.get("type") != "verification":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid verification token"
            )

        email = payload.get("email")
        user = await self.users_collection.find_one({"email": email})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        if user.get("is_verified"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already verified"
            )

        # Update user verification status
        await self.users_collection.update_one(
            {"email": email},
            {
                "$set": {
                    "is_verified": True,
                    "verification_token": None,
                    "verification_token_expires": None,
                    "updated_at": datetime.utcnow()
                }
            }
        )

        return True

    async def authenticate_user(self, email: str, password: str) -> Optional[UserInDB]:
        user = await self.users_collection.find_one({"email": email})
        if not user:
            return None

        if not verify_password(password, user["hashed_password"]):
            return None

        return UserInDB(**user)

    async def create_session(self, user_id: ObjectId, user_agent: str, ip_address: Optional[str] = None) -> tuple[UserSessionInDB, AuthTokenInDB]:
        # Get user data to include correct role in token
        user = await self.users_collection.find_one({"_id": user_id})
        user_role = user.get("role", "user") if user else "user"

        # Create session
        device_info = get_device_info(user_agent)
        session_data = {
            "user_id": user_id,
            "device_info": device_info,
            "ip_address": ip_address,
            "is_active": True,
            "last_activity": datetime.utcnow()
        }

        session = UserSessionInDB(**session_data)
        session_result = await self.sessions_collection.insert_one(session.model_dump(by_alias=True))
        session.id = session_result.inserted_id

        # Create tokens with correct user role
        token_data = {
            "user_id": str(user_id),
            "role": user_role
        }

        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token(token_data)

        auth_token_data = {
            "session_id": session.id,
            "access_token": access_token,
            "refresh_token": refresh_token,
            "expires_at": datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
            "is_active": True
        }

        auth_token = AuthTokenInDB(**auth_token_data)
        await self.tokens_collection.insert_one(auth_token.model_dump(by_alias=True))

        return session, auth_token

    def create_access_token(self, data: dict) -> str:
        """Create access token using the security module function"""
        return create_access_token(data)

    def create_refresh_token(self, data: dict) -> str:
        """Create refresh token using the security module function"""
        return create_refresh_token(data)

    async def get_user_by_id(self, user_id: str) -> Optional[UserInDB]:
        user = await self.users_collection.find_one({"_id": ObjectId(user_id)})
        if not user:
            return None
        return UserInDB(**user)

    async def get_user_sessions(self, user_id: str) -> List[SessionResponse]:
        sessions = await self.sessions_collection.find({"user_id": ObjectId(user_id)}).to_list(None)
        return [SessionResponse(**session) for session in sessions]

    async def deactivate_session(self, session_id: str, user_id: str) -> bool:
        result = await self.sessions_collection.update_one(
            {"_id": ObjectId(session_id), "user_id": ObjectId(user_id)},
            {"$set": {"is_active": False, "updated_at": datetime.utcnow()}}
        )
        return result.modified_count > 0

    async def deactivate_all_sessions(self, user_id: str) -> bool:
        result = await self.sessions_collection.update_many(
            {"user_id": ObjectId(user_id)},
            {"$set": {"is_active": False, "updated_at": datetime.utcnow()}}
        )
        return result.modified_count > 0

    async def get_session_stats(self, user_id: str) -> SessionStatsResponse:
        pipeline = [
            {"$match": {"user_id": ObjectId(user_id)}},
            {
                "$group": {
                    "_id": None,
                    "total_sessions": {"$sum": 1},
                    "active_sessions": {
                        "$sum": {"$cond": ["$is_active", 1, 0]}
                    },
                    "inactive_sessions": {
                        "$sum": {"$cond": ["$is_active", 0, 1]}
                    }
                }
            }
        ]

        stats_result = await self.sessions_collection.aggregate(pipeline).to_list(None)
        stats = stats_result[0] if stats_result else {
            "total_sessions": 0,
            "active_sessions": 0,
            "inactive_sessions": 0
        }

        # Get sessions by device
        device_pipeline = [
            {"$match": {"user_id": ObjectId(user_id)}},
            {"$group": {"_id": "$device_info.device", "count": {"$sum": 1}}}
        ]
        device_stats = await self.sessions_collection.aggregate(device_pipeline).to_list(None)
        sessions_by_device = {item["_id"]: item["count"] for item in device_stats}

        # Get sessions by browser
        browser_pipeline = [
            {"$match": {"user_id": ObjectId(user_id)}},
            {"$group": {"_id": "$device_info.browser", "count": {"$sum": 1}}}
        ]
        browser_stats = await self.sessions_collection.aggregate(browser_pipeline).to_list(None)
        sessions_by_browser = {item["_id"]: item["count"] for item in browser_stats}

        return SessionStatsResponse(
            total_sessions=stats["total_sessions"],
            active_sessions=stats["active_sessions"],
            inactive_sessions=stats["inactive_sessions"],
            sessions_by_device=sessions_by_device,
            sessions_by_browser=sessions_by_browser
        )

    async def forgot_password(self, email: str) -> bool:
        user = await self.users_collection.find_one({"email": email})
        if not user:
            # Don't reveal if email exists or not
            return True

        reset_token = create_reset_token(email)
        reset_url = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"

        email_body = f"""
        <h2>Password Reset Request</h2>
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <a href="{reset_url}">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
        """

        await send_email(email, "Password Reset Request", email_body)
        return True

    async def reset_password(self, token: str, new_password: str) -> bool:
        payload = verify_token(token, settings.JWT_SECRET_KEY)
        if not payload or payload.get("type") != "reset":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid reset token"
            )

        email = payload.get("email")
        hashed_password = get_password_hash(new_password)

        result = await self.users_collection.update_one(
            {"email": email},
            {
                "$set": {
                    "hashed_password": hashed_password,
                    "updated_at": datetime.utcnow()
                }
            }
        )

        if result.modified_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        return True

    async def resend_verification(self, email: str) -> bool:
        user = await self.users_collection.find_one({"email": email})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        if user.get("is_verified"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already verified"
            )

        # Create new verification token
        verification_token = create_verification_token(email)
        verification_expires = datetime.utcnow() + timedelta(hours=24)

        # Update user with new token
        await self.users_collection.update_one(
            {"email": email},
            {
                "$set": {
                    "verification_token": verification_token,
                    "verification_token_expires": verification_expires,
                    "updated_at": datetime.utcnow()
                }
            }
        )

        # Send verification email
        verification_url = f"{settings.FRONTEND_URL}/verify-email?token={verification_token}"
        email_body = f"""
        <h2>Email Verification</h2>
        <p>Please verify your email by clicking the link below:</p>
        <a href="{verification_url}">Verify Email</a>
        <p>This link will expire in 24 hours.</p>
        """

        await send_email(email, "Verify Your Email", email_body)
        return True

    async def update_user_profile(self, user_id: str, profile_data: dict) -> UserInDB:
        """Update user profile information"""
        allowed_fields = ["first_name", "last_name", "email"]
        update_data = {k: v for k, v in profile_data.items() if k in allowed_fields}
        update_data["updated_at"] = datetime.utcnow()

        # If email is being changed, check if it's already taken
        if "email" in update_data:
            existing_user = await self.users_collection.find_one({
                "email": update_data["email"],
                "_id": {"$ne": ObjectId(user_id)}
            })
            if existing_user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already in use"
                )

        result = await self.users_collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": update_data}
        )

        if result.modified_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        updated_user = await self.users_collection.find_one({"_id": ObjectId(user_id)})
        return UserInDB(**updated_user)

    async def change_password(self, user_id: str, current_password: str, new_password: str) -> bool:
        """Change user password"""
        user = await self.users_collection.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        # Verify current password
        if not verify_password(current_password, user["hashed_password"]):
            return False

        # Update password
        hashed_password = get_password_hash(new_password)
        result = await self.users_collection.update_one(
            {"_id": ObjectId(user_id)},
            {
                "$set": {
                    "hashed_password": hashed_password,
                    "updated_at": datetime.utcnow()
                }
            }
        )

        return result.modified_count > 0

    async def get_user_settings(self, user_id: str) -> dict:
        """Get user account settings and preferences"""
        user = await self.users_collection.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        # Get session count
        session_count = await self.sessions_collection.count_documents({
            "user_id": ObjectId(user_id),
            "is_active": True
        })

        return {
            "user_info": {
                "id": str(user["_id"]),
                "email": user["email"],
                "first_name": user["first_name"],
                "last_name": user["last_name"],
                "is_verified": user.get("is_verified", False),
                "is_premium": user.get("is_premium", False),
                "role": user.get("role", "user"),
                "created_at": user["created_at"],
                "updated_at": user["updated_at"]
            },
            "security": {
                "active_sessions": session_count,
                "last_password_change": user.get("password_changed_at"),
                "two_factor_enabled": user.get("two_factor_enabled", False)
            },
            "preferences": user.get("preferences", {
                "email_notifications": True,
                "security_alerts": True,
                "marketing_emails": False
            })
        }

    async def update_user_preferences(self, user_id: str, preferences: dict) -> bool:
        """Update user preferences"""
        allowed_preferences = [
            "email_notifications",
            "security_alerts",
            "marketing_emails",
            "theme",
            "language"
        ]

        filtered_preferences = {
            k: v for k, v in preferences.items()
            if k in allowed_preferences
        }

        result = await self.users_collection.update_one(
            {"_id": ObjectId(user_id)},
            {
                "$set": {
                    "preferences": filtered_preferences,
                    "updated_at": datetime.utcnow()
                }
            }
        )

        return result.modified_count > 0

    async def delete_user_account(self, user_id: str) -> bool:
        """Permanently delete user account and all associated data"""
        # Deactivate all sessions first
        await self.deactivate_all_sessions(user_id)

        # Delete auth tokens
        await self.tokens_collection.delete_many({"user_id": ObjectId(user_id)})

        # Delete sessions
        await self.sessions_collection.delete_many({"user_id": ObjectId(user_id)})

        # Delete user record
        result = await self.users_collection.delete_one({"_id": ObjectId(user_id)})

        return result.deleted_count > 0
