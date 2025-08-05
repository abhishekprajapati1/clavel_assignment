from pydantic_settings import BaseSettings
from typing import Optional
from pydantic import Field
from pydantic_core import ValidationError
import sys

class Settings(BaseSettings):
    DEBUG: bool = True

    # Database
    MONGODB_URL: str = Field(default=..., description="Please set MONGODB_URL in your .env file.")

    # JWT
    JWT_SECRET_KEY: str
    JWT_REFRESH_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Email
    EMAIL_HOST: Optional[str] = None
    EMAIL_PORT: int = 587
    EMAIL_USER: Optional[str] = None
    EMAIL_PASSWORD: Optional[str] = None
    EMAIL_USE_TLS: bool = True

    # Frontend
    FRONTEND_URL: str = "http://localhost:3000"

    # File upload
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_IMAGE_TYPES: list = ["image/jpeg", "image/png", "image/gif", "image/webp"]

    # STRIPE
    STRIPE_PUBLIC_KEY: str
    STRIPE_SECRET_KEY: str
    STRIPE_WEBHOOK_SECRET: Optional[str] = None

    # Environment and Security
    ENVIRONMENT: str = "development"  # development, staging, production
    COOKIE_SECURE: Optional[bool] = None  # Auto-detect based on environment if None
    COOKIE_SAMESITE: str = "lax"  # lax, strict, none
    COOKIE_DOMAIN: Optional[str] = None  # Auto-detect if None

    @property
    def is_production(self) -> bool:
        """Check if running in production environment"""
        return self.ENVIRONMENT.lower() in ("production", "prod")

    @property
    def is_development(self) -> bool:
        """Check if running in development environment"""
        return self.ENVIRONMENT.lower() in ("development", "dev", "local")

    @property
    def should_use_secure_cookies(self) -> bool:
        """Determine if cookies should be secure based on environment"""
        if self.COOKIE_SECURE is not None:
            return self.COOKIE_SECURE

        # Auto-detect: use secure cookies in production or when using HTTPS
        if self.is_production:
            return True

        # Check if frontend URL uses HTTPS
        return self.FRONTEND_URL.startswith("https://")

    @property
    def cookie_domain_setting(self) -> Optional[str]:
        """Get the appropriate cookie domain setting"""
        if self.COOKIE_DOMAIN:
            return self.COOKIE_DOMAIN

        # In production, you might want to set a specific domain
        # For now, let browser handle it automatically
        return None

    class Config:
        env_file = ".env"

try:
    settings = Settings()
except ValidationError as e:
    missing_fields = [err['loc'][0] for err in e.errors()]
    print("\n❌ Environment configuration error:")
    for field in missing_fields:
        print(f"  ➤ Please set the environment variable: {field}")
    sys.exit(1)
