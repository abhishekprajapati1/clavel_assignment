from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from typing import Optional

from app.core.database import get_database
from app.api.auth import get_current_user, get_current_admin
from app.schemas.auth import UserDetailsResponse
from app.schemas.template import (
    TemplateCreateRequest, TemplateUpdateRequest, TemplateResponse, 
    TemplateListResponse, MessageResponse
)
from app.services.template_service import TemplateService
from app.models.template import TemplateCreate

templates_router = APIRouter()

@templates_router.get("/", response_model=TemplateListResponse)
async def get_templates(
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(10, ge=1, le=100, description="Items per page"),
    db: AsyncIOMotorClient = Depends(get_database)
):
    """Get all templates (public endpoint)"""
    skip = (page - 1) * per_page
    template_service = TemplateService(db)
    return await template_service.get_templates(skip=skip, limit=per_page)

@templates_router.get("/{template_id}", response_model=TemplateResponse)
async def get_template(
    template_id: str,
    db: AsyncIOMotorClient = Depends(get_database)
):
    """Get a specific template by ID (public endpoint)"""
    template_service = TemplateService(db)
    template = await template_service.get_template_by_id(template_id)
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )
    return template

@templates_router.post("/", response_model=TemplateResponse)
async def create_template(
    title: str = Form(..., description="Template title"),
    description: Optional[str] = Form(None, description="Template description"),
    image: UploadFile = File(..., description="Template image"),
    current_user: UserDetailsResponse = Depends(get_current_admin),
    db: AsyncIOMotorClient = Depends(get_database)
):
    """Create a new template (admin only)"""
    template_service = TemplateService(db)
    
    # Upload image
    image_url = await template_service.upload_image(image)
    
    # Create template
    template_data = TemplateCreate(
        title=title,
        description=description,
        image_url=image_url,
        uploaded_by=ObjectId(current_user.id)
    )
    
    template = await template_service.create_template(template_data, ObjectId(current_user.id))
    
    return TemplateResponse(
        id=str(template.id),
        title=template.title,
        description=template.description,
        image_url=template.image_url,
        uploaded_by=current_user.first_name + " " + current_user.last_name,
        created_at=template.created_at,
        updated_at=template.updated_at
    )

@templates_router.put("/{template_id}", response_model=TemplateResponse)
async def update_template(
    template_id: str,
    template_data: TemplateUpdateRequest,
    current_user: UserDetailsResponse = Depends(get_current_user),
    db: AsyncIOMotorClient = Depends(get_database)
):
    """Update a template (admin or template owner only)"""
    template_service = TemplateService(db)
    
    updated_template = await template_service.update_template(
        template_id, template_data, ObjectId(current_user.id)
    )
    
    if not updated_template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )
    
    return TemplateResponse(
        id=str(updated_template.id),
        title=updated_template.title,
        description=updated_template.description,
        image_url=updated_template.image_url,
        uploaded_by="You",  # Will be updated with actual name
        created_at=updated_template.created_at,
        updated_at=updated_template.updated_at
    )

@templates_router.delete("/{template_id}", response_model=MessageResponse)
async def delete_template(
    template_id: str,
    current_user: UserDetailsResponse = Depends(get_current_user),
    db: AsyncIOMotorClient = Depends(get_database)
):
    """Delete a template (admin or template owner only)"""
    template_service = TemplateService(db)
    
    success = await template_service.delete_template(template_id, ObjectId(current_user.id))
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )
    
    return MessageResponse(message="Template deleted successfully")

@templates_router.get("/my/templates", response_model=TemplateListResponse)
async def get_my_templates(
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(10, ge=1, le=100, description="Items per page"),
    current_user: UserDetailsResponse = Depends(get_current_user),
    db: AsyncIOMotorClient = Depends(get_database)
):
    """Get current user's templates"""
    skip = (page - 1) * per_page
    template_service = TemplateService(db)
    return await template_service.get_templates_by_user(
        ObjectId(current_user.id), skip=skip, limit=per_page
    ) 