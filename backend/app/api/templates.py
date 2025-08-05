from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query, Request
from fastapi.responses import FileResponse, Response
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from typing import Optional
import os
import logging

from app.core.database import get_database
from app.api.auth import get_current_user, get_current_admin, get_current_user_optional
from app.schemas.auth import UserDetailsResponse
from app.schemas.template import (
    TemplateCreateRequest, TemplateUpdateRequest, TemplateResponse,
    TemplateListResponse, MessageResponse
)
from app.services.template_service import TemplateService
from app.services.analytics_service import AnalyticsService
from app.models.template import TemplateCreate
from app.middleware.premium import require_premium_access, PremiumAccessControl, PremiumAccessError

logger = logging.getLogger(__name__)

templates_router = APIRouter()

@templates_router.get("/uploads/{filename}")
async def serve_protected_file(
    filename: str,
    current_user: UserDetailsResponse = Depends(get_current_user),
    db: AsyncIOMotorClient = Depends(get_database)
):
    """Serve uploaded files with quality based on user's premium status"""
    import mimetypes
    import tempfile
    from PIL import Image, ImageFilter
    import io

    # Prevent directory traversal attacks
    if ".." in filename or "/" in filename or "\\" in filename or filename.startswith("."):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )

    # Validate filename format (only allow alphanumeric, dash, underscore, and dot)
    import re
    if not re.match(r'^[a-zA-Z0-9._-]+$', filename):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )

    # Check if this file belongs to a template (security layer)
    template_service = TemplateService(db)
    template_exists = await template_service.check_template_file_exists(filename)

    if not template_exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )

    # Construct file path
    file_path = os.path.join("uploads", filename)

    # Check if file exists
    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )

    # Check user's premium status
    user_collection = db.templater.users
    user_doc = await user_collection.find_one({"_id": ObjectId(current_user.id)})

    is_premium = user_doc and user_doc.get("is_premium", False)

    # Determine media type
    media_type, _ = mimetypes.guess_type(filename)
    if not media_type:
        # Default to image types for unknown extensions
        if filename.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.webp')):
            media_type = f"image/{filename.split('.')[-1].lower()}"
            if media_type == "image/jpg":
                media_type = "image/jpeg"
        else:
            media_type = "application/octet-stream"

    # For premium users, serve original file
    if is_premium:
        return FileResponse(
            path=file_path,
            filename=filename,
            media_type=media_type,
            headers={
                "Cache-Control": "private, max-age=3600",
                "X-Content-Type-Options": "nosniff",
                "X-Frame-Options": "DENY",
                "X-Premium-Quality": "true"
            }
        )

    # For free users, serve degraded quality image
    try:
        # Check if it's an image file
        if not filename.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.webp')):
            # For non-image files, just serve normally (shouldn't happen in template context)
            return FileResponse(
                path=file_path,
                filename=filename,
                media_type=media_type,
                headers={
                    "Cache-Control": "private, max-age=1800",
                    "X-Content-Type-Options": "nosniff",
                    "X-Frame-Options": "DENY",
                    "X-Premium-Quality": "false"
                }
            )

        # Open and process the image
        with Image.open(file_path) as img:
            # Convert to RGB if necessary
            if img.mode != 'RGB':
                img = img.convert('RGB')

            # Create degraded version for free users
            # 1. Reduce quality significantly
            # 2. Add blur effect
            # 3. Reduce resolution

            # Resize to 70% of original size
            original_size = img.size
            new_size = (int(original_size[0] * 0.7), int(original_size[1] * 0.7))
            img_degraded = img.resize(new_size, Image.Resampling.LANCZOS)

            # Apply blur effect
            img_degraded = img_degraded.filter(ImageFilter.GaussianBlur(radius=1.5))

            # Save to bytes with reduced quality
            img_bytes = io.BytesIO()

            # Determine format for saving
            if filename.lower().endswith('.png'):
                # For PNG, we'll convert to JPEG with low quality to reduce file size
                img_degraded.save(img_bytes, format='JPEG', quality=60, optimize=True)
                media_type = "image/jpeg"
            else:
                # For JPEG and other formats
                img_degraded.save(img_bytes, format='JPEG', quality=60, optimize=True)
                media_type = "image/jpeg"

            img_bytes.seek(0)

            # Return degraded image
            return Response(
                content=img_bytes.getvalue(),
                media_type=media_type,
                headers={
                    "Cache-Control": "private, max-age=1800",  # Shorter cache for free users
                    "X-Content-Type-Options": "nosniff",
                    "X-Frame-Options": "DENY",
                    "X-Premium-Quality": "false",
                    "Content-Disposition": f"inline; filename={filename}"
                }
            )

    except Exception as e:
        logger.error(f"Error processing image {filename}: {str(e)}")
        # If image processing fails, return original file
        return FileResponse(
            path=file_path,
            filename=filename,
            media_type=media_type,
            headers={
                "Cache-Control": "private, max-age=1800",
                "X-Content-Type-Options": "nosniff",
                "X-Frame-Options": "DENY",
                "X-Premium-Quality": "false"
            }
        )

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
    request: Request,
    db: AsyncIOMotorClient = Depends(get_database),
    current_user: Optional[UserDetailsResponse] = Depends(get_current_user_optional)
):
    """Get a specific template by ID (public endpoint)"""
    template_service = TemplateService(db)
    template = await template_service.get_template_by_id(template_id)
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )

    # Log template view
    try:
        analytics_service = AnalyticsService(db)
        await analytics_service.log_view(
            template_id=template_id,
            user_id=current_user.id if current_user else None,
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent")
        )
    except Exception:
        # Don't fail if analytics logging fails
        pass

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
    request: Request,
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

    # Log template download
    try:
        analytics_service = AnalyticsService(db)
        await analytics_service.log_download(
            template_id=template_id,
            user_id=current_user.id,
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent")
        )
    except Exception:
        # Don't fail if analytics logging fails
        pass

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
