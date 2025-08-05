from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class DashboardStats(BaseModel):
    """Dashboard statistics for admin overview"""
    total_templates: int = Field(..., ge=0)
    total_downloads: int = Field(..., ge=0)
    total_users: int = Field(..., ge=0)
    premium_users: int = Field(..., ge=0)
    verified_users: int = Field(..., ge=0)
    templates_this_month: int = Field(..., ge=0)
    downloads_this_month: int = Field(..., ge=0)
    users_this_month: int = Field(..., ge=0)

class UserStats(BaseModel):
    """User statistics for admin dashboard"""
    total_users: int = Field(..., ge=0)
    verified_users: int = Field(..., ge=0)
    premium_users: int = Field(..., ge=0)
    active_users: int = Field(..., ge=0)
    admin_users: int = Field(..., ge=0)

class TemplateStats(BaseModel):
    """Template statistics with performance metrics"""
    template_id: str
    template_title: str
    download_count: int = Field(..., ge=0)
    view_count: int = Field(..., ge=0)
    uploaded_by: str
    created_at: datetime

class MonthlyAnalytics(BaseModel):
    """Monthly analytics data for charts"""
    month: str  # e.g., "Jan 2024"
    templates: int = Field(..., ge=0)
    downloads: int = Field(..., ge=0)
    users: int = Field(..., ge=0)

class UserListResponse(BaseModel):
    """User information for admin user management"""
    id: str
    email: str
    first_name: str
    last_name: str
    role: str
    is_active: bool
    is_verified: bool
    is_premium: bool
    created_at: datetime
    updated_at: datetime
    last_login: Optional[datetime] = None

    model_config = {
        "json_encoders": {
            datetime: lambda v: v.isoformat()
        }
    }

class AdminUserUpdate(BaseModel):
    """Schema for updating user data by admin"""
    first_name: Optional[str] = Field(None, min_length=1, max_length=50)
    last_name: Optional[str] = Field(None, min_length=1, max_length=50)
    role: Optional[str] = Field(None, pattern="^(admin|user)$")
    is_active: Optional[bool] = None
    is_verified: Optional[bool] = None
    is_premium: Optional[bool] = None

class AdminActionResponse(BaseModel):
    """Generic response for admin actions"""
    message: str
    success: bool = True

class TemplateDownloadLog(BaseModel):
    """Schema for tracking template downloads"""
    template_id: str
    user_id: str
    downloaded_at: datetime
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None

class TemplateViewLog(BaseModel):
    """Schema for tracking template views"""
    template_id: str
    user_id: Optional[str] = None  # Can be None for anonymous views
    viewed_at: datetime
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None

class SystemHealthResponse(BaseModel):
    """System health check response"""
    status: str
    database_connected: bool
    total_users: int
    total_templates: int
    uptime: str
    version: str = "1.0.0"
