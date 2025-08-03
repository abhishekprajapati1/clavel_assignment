from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Database
    MONGODB_URL: str = "mongodb://localhost:27017/clavel_app"
    
    # JWT
    JWT_SECRET_KEY: str = "your-super-secret-jwt-key-change-in-production"
    JWT_REFRESH_SECRET_KEY: str = "your-super-secret-refresh-key-change-in-production"
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

settings = Settings() 