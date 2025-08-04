from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query
from fastapi.responses import FileResponse, Response
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from typing import Optional
import os
import logging

from app.core.database import get_database
from app.api.auth import get_current_user, get_current_admin
from app.schemas.auth import UserDetailsResponse
from app.schemas.template import (
    TemplateCreateRequest, TemplateUpdateRequest, TemplateResponse,
    TemplateListResponse, MessageResponse
)
from app.services.template_service import TemplateService
from app.models.template import TemplateCreate
from app.middleware.premium import require_premium_access, PremiumAccessControl, PremiumAccessError

logger = logging.getLogger(__name__)

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

@templates_router.get("/{template_id}/download")
async def download_template(
    template_id: str,
    current_user: UserDetailsResponse = Depends(require_premium_access),
    db: AsyncIOMotorClient = Depends(get_database)
):
    """Download template image (Premium only)"""
    template_service = TemplateService(db)
    template = await template_service.get_template_by_id(template_id)

    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )

    # Extract filename from image_url
    image_path = template.image_url
    if image_path.startswith('/uploads/'):
        # Remove the leading slash and construct full path
        full_path = os.path.join('uploads', image_path[9:])
    else:
        full_path = image_path

    # Check if file exists
    if not os.path.exists(full_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template file not found"
        )

    # Get original filename for download
    filename = os.path.basename(full_path)
    download_name = f"{template.title}_{filename}"

    return FileResponse(
        path=full_path,
        filename=download_name,
        media_type='application/octet-stream'
    )

@templates_router.get("/access-info")
async def get_template_access_info(
    current_user: UserDetailsResponse = Depends(get_current_user),
    db: AsyncIOMotorClient = Depends(get_database)
):
    """Get user's template access information"""

    # Get user's premium status from database
    user_collection = db.templater.users
    user_doc = await user_collection.find_one({"_id": ObjectId(current_user.id)})

    # Update current_user object with fresh data
    is_premium = user_doc.get("is_premium", False) if user_doc else False

    access_info = PremiumAccessControl.get_access_info(current_user)
    access_info["is_premium"] = is_premium  # Override with fresh data
    access_info["has_premium_access"] = is_premium or current_user.role == "admin"
    access_info["can_download"] = access_info["has_premium_access"]
    access_info["can_screenshot"] = access_info["has_premium_access"]

    return access_info

@templates_router.post("/{template_id}/check-screenshot")
async def check_screenshot_permission(
    template_id: str,
    current_user: UserDetailsResponse = Depends(get_current_user),
    db: AsyncIOMotorClient = Depends(get_database)
):
    """Check if user can take screenshots of this template"""

    # Get fresh user data
    user_collection = db.templater.users
    user_doc = await user_collection.find_one({"_id": ObjectId(current_user.id)})
    is_premium = user_doc.get("is_premium", False) if user_doc else False

    has_access = current_user.role == "admin" or is_premium

    if not has_access:
        raise PremiumAccessError()

    return {
        "can_screenshot": True,
        "template_id": template_id,
        "user_access": "premium" if is_premium else "admin"
    }

@templates_router.get("/premium/available")
async def get_premium_templates(
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(10, ge=1, le=100, description="Items per page"),
    current_user: UserDetailsResponse = Depends(require_premium_access),
    db: AsyncIOMotorClient = Depends(get_database)
):
    """Get all templates with premium access indicators (Premium only)"""
    skip = (page - 1) * per_page
    template_service = TemplateService(db)

    templates_response = await template_service.get_templates(skip=skip, limit=per_page)

    # Add premium access indicators
    for template in templates_response.templates:
        template.can_download = True
        template.can_screenshot = True
        template.access_level = "premium"

    return templates_response
