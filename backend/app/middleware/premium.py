from fastapi import HTTPException, status, Depends
from functools import wraps
from app.api.auth import get_current_user
from app.schemas.auth import UserDetailsResponse


class PremiumAccessError(HTTPException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail={
                "message": "Premium access required",
                "action": "upgrade_required",
                "redirect_to": "/payment"
            }
        )


async def require_premium_access(
    current_user: UserDetailsResponse = Depends(get_current_user)
) -> UserDetailsResponse:
    """
    Dependency to ensure user has premium access.
    Raises 402 Payment Required if user is not premium.
    """
    if current_user.role == "admin":
        # Admins always have premium access
        return current_user

    if not getattr(current_user, 'is_premium', False):
        raise PremiumAccessError()

    return current_user


def premium_required(func):
    """
    Decorator for functions that require premium access.
    Can be used on regular functions that take current_user as parameter.
    """
    @wraps(func)
    async def wrapper(*args, **kwargs):
        # Find current_user in kwargs
        current_user = kwargs.get('current_user')
        if not current_user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required"
            )

        # Check premium access
        if current_user.role != "admin" and not getattr(current_user, 'is_premium', False):
            raise PremiumAccessError()

        return await func(*args, **kwargs)
    return wrapper


class PremiumAccessControl:
    """
    Utility class for checking premium access in services
    """

    @staticmethod
    def check_premium_access(user: UserDetailsResponse) -> bool:
        """Check if user has premium access"""
        return user.role == "admin" or getattr(user, 'is_premium', False)

    @staticmethod
    def ensure_premium_access(user: UserDetailsResponse) -> None:
        """Ensure user has premium access, raise exception if not"""
        if not PremiumAccessControl.check_premium_access(user):
            raise PremiumAccessError()

    @staticmethod
    def get_access_info(user: UserDetailsResponse) -> dict:
        """Get user access information"""
        has_premium = PremiumAccessControl.check_premium_access(user)
        return {
            "has_premium_access": has_premium,
            "can_download": has_premium,
            "can_screenshot": has_premium,
            "role": user.role,
            "upgrade_required": not has_premium and user.role != "admin"
        }
