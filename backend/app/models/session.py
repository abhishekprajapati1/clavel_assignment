from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field
from bson import ObjectId
from .user import PyObjectId

class UserSessionBase(BaseModel):
    user_id: PyObjectId
    device_info: Dict[str, Any]
    ip_address: Optional[str] = None
    is_active: bool = Field(default=True)
    last_activity: datetime = Field(default_factory=datetime.utcnow)

class UserSessionCreate(UserSessionBase):
    pass

class UserSessionUpdate(BaseModel):
    is_active: Optional[bool] = None
    last_activity: Optional[datetime] = None

class UserSessionInDB(UserSessionBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str}
    }

class UserSessionResponse(UserSessionBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = {
        "json_encoders": {ObjectId: str}
    }

class AuthTokenBase(BaseModel):
    session_id: PyObjectId
    access_token: str
    refresh_token: str
    expires_at: datetime
    is_active: bool = Field(default=True)

class AuthTokenCreate(AuthTokenBase):
    pass

class AuthTokenUpdate(BaseModel):
    is_active: Optional[bool] = None
    expires_at: Optional[datetime] = None

class AuthTokenInDB(AuthTokenBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str}
    }

class AuthTokenResponse(AuthTokenBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = {
        "json_encoders": {ObjectId: str}
    }
