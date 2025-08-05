"""
Cookie utility functions for handling authentication cookies
with proper security settings for different environments.
"""

from fastapi import Response
from typing import Optional
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

def set_auth_cookies(
    response: Response,
    access_token: str,
    refresh_token: str,
    access_token_expires_in: int = None,
    refresh_token_expires_in: int = None
) -> None:
    """
    Set authentication cookies with proper security settings

    Args:
        response: FastAPI Response object
        access_token: JWT access token
        refresh_token: JWT refresh token
        access_token_expires_in: Access token expiry in seconds
        refresh_token_expires_in: Refresh token expiry in seconds
    """

    # Use default expiry times if not provided
    if access_token_expires_in is None:
        access_token_expires_in = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60

    if refresh_token_expires_in is None:
        refresh_token_expires_in = settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60

    # Determine cookie security settings
    secure_cookies = settings.should_use_secure_cookies
    cookie_domain = settings.cookie_domain_setting
    samesite = settings.COOKIE_SAMESITE

    logger.info(f"Setting auth cookies - Environment: {settings.ENVIRONMENT}, "
                f"Secure: {secure_cookies}, Domain: {cookie_domain}, SameSite: {samesite}")

    # Set access token cookie
    response.set_cookie(
        key="access_token",
        value=access_token,
        max_age=access_token_expires_in,
        expires=access_token_expires_in,
        path="/",
        domain=cookie_domain,
        secure=secure_cookies,
        httponly=True,
        samesite=samesite
    )

    # Set refresh token cookie
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        max_age=refresh_token_expires_in,
        expires=refresh_token_expires_in,
        path="/",
        domain=cookie_domain,
        secure=secure_cookies,
        httponly=True,
        samesite=samesite
    )

    logger.debug("Authentication cookies set successfully")

def clear_auth_cookies(response: Response) -> None:
    """
    Clear authentication cookies (for logout)

    Args:
        response: FastAPI Response object
    """

    cookie_domain = settings.cookie_domain_setting
    secure_cookies = settings.should_use_secure_cookies
    samesite = settings.COOKIE_SAMESITE

    logger.info("Clearing authentication cookies")

    # Clear access token cookie
    response.set_cookie(
        key="access_token",
        value="",
        max_age=0,
        expires=0,
        path="/",
        domain=cookie_domain,
        secure=secure_cookies,
        httponly=True,
        samesite=samesite
    )

    # Clear refresh token cookie
    response.set_cookie(
        key="refresh_token",
        value="",
        max_age=0,
        expires=0,
        path="/",
        domain=cookie_domain,
        secure=secure_cookies,
        httponly=True,
        samesite=samesite
    )

    logger.debug("Authentication cookies cleared successfully")

def set_cookie_with_security(
    response: Response,
    key: str,
    value: str,
    max_age: Optional[int] = None,
    expires: Optional[int] = None,
    path: str = "/",
    httponly: bool = True,
    secure: Optional[bool] = None,
    samesite: Optional[str] = None,
    domain: Optional[str] = None
) -> None:
    """
    Set a cookie with security settings based on environment

    Args:
        response: FastAPI Response object
        key: Cookie name
        value: Cookie value
        max_age: Cookie max age in seconds
        expires: Cookie expiry in seconds
        path: Cookie path
        httponly: Whether cookie should be httponly
        secure: Whether cookie should be secure (auto-detected if None)
        samesite: SameSite policy (auto-detected if None)
        domain: Cookie domain (auto-detected if None)
    """

    # Use environment-appropriate defaults if not specified
    if secure is None:
        secure = settings.should_use_secure_cookies

    if samesite is None:
        samesite = settings.COOKIE_SAMESITE

    if domain is None:
        domain = settings.cookie_domain_setting

    response.set_cookie(
        key=key,
        value=value,
        max_age=max_age,
        expires=expires,
        path=path,
        domain=domain,
        secure=secure,
        httponly=httponly,
        samesite=samesite
    )

    logger.debug(f"Cookie '{key}' set with security settings - "
                f"Secure: {secure}, HttpOnly: {httponly}, SameSite: {samesite}")

def get_cookie_config() -> dict:
    """
    Get current cookie configuration for debugging

    Returns:
        Dict with current cookie configuration
    """
    return {
        "environment": settings.ENVIRONMENT,
        "secure_cookies": settings.should_use_secure_cookies,
        "cookie_domain": settings.cookie_domain_setting,
        "samesite_policy": settings.COOKIE_SAMESITE,
        "frontend_url": settings.FRONTEND_URL,
        "is_production": settings.is_production,
        "is_development": settings.is_development
    }

def log_cookie_config() -> None:
    """
    Log current cookie configuration for debugging
    """
    config = get_cookie_config()
    logger.info("Cookie Configuration:")
    for key, value in config.items():
        logger.info(f"  {key}: {value}")
