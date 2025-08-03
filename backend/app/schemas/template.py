from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class TemplateCreateRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)

class TemplateUpdateRequest(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)

class TemplateResponse(BaseModel):
    id: str
    title: str
    description: Optional[str]
    image_url: str
    uploaded_by: str
    created_at: datetime
    updated_at: datetime

class TemplateListResponse(BaseModel):
    templates: List[TemplateResponse]
    total: int
    page: int
    per_page: int
    total_pages: int

class MessageResponse(BaseModel):
    message: str 