from pydantic_settings import BaseSettings
from typing import Optional
from pydantic import Field
from pydantic_core import ValidationError
import sys

class Settings(BaseSettings):
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
