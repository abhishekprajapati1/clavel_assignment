from datetime import datetime
from typing import List, Optional
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from fastapi import HTTPException, status, UploadFile
import aiofiles
import os
from PIL import Image
import uuid

from app.core.config import settings
from app.models.template import TemplateInDB, TemplateCreate, TemplateUpdate
from app.schemas.template import TemplateResponse, TemplateListResponse

class TemplateService:
    def __init__(self, db: AsyncIOMotorClient):
        self.db = db
        self.templates_collection = db.templater.templates
        self.upload_dir = "uploads"

    async def create_template(self, template_data: TemplateCreate, uploaded_by: ObjectId) -> TemplateInDB:
        template_dict = template_data.model_dump()
        template_dict["uploaded_by"] = uploaded_by

        template = TemplateInDB(**template_dict)
        result = await self.templates_collection.insert_one(template.model_dump(by_alias=True))
        template.id = result.inserted_id

        return template

    async def upload_image(self, file: UploadFile) -> str:
        # Validate file type
        if file.content_type not in settings.ALLOWED_IMAGE_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File type {file.content_type} not allowed. Allowed types: {settings.ALLOWED_IMAGE_TYPES}"
            )

        # Validate file size
        file_size = 0
        content = await file.read()
        file_size = len(content)

        if file_size > settings.MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File size {file_size} bytes exceeds maximum allowed size of {settings.MAX_FILE_SIZE} bytes"
            )

        # Generate unique filename
        file_extension = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
        filename = f"{uuid.uuid4()}.{file_extension}"
        file_path = os.path.join(self.upload_dir, filename)

        # Save file
        async with aiofiles.open(file_path, 'wb') as f:
            await f.write(content)

        # Optimize image if needed
        try:
            with Image.open(file_path) as img:
                # Convert to RGB if necessary
                if img.mode in ('RGBA', 'LA', 'P'):
                    img = img.convert('RGB')

                # Resize if too large (optional)
                max_size = (1920, 1080)
                if img.size[0] > max_size[0] or img.size[1] > max_size[1]:
                    img.thumbnail(max_size, Image.Resampling.LANCZOS)

                img.save(file_path, 'JPEG', quality=85, optimize=True)
        except Exception as e:
            # If image processing fails, continue with original file
            print(f"Image optimization failed: {e}")

        return f"/uploads/{filename}"

    async def get_templates(self, skip: int = 0, limit: int = 10) -> TemplateListResponse:
        # Get total count
        total = await self.templates_collection.count_documents({})

        # Get templates with pagination
        cursor = self.templates_collection.find({}).skip(skip).limit(limit).sort("created_at", -1)
        templates = await cursor.to_list(None)

        # Convert to response format
        template_responses = []
        for template in templates:
            # Get uploader name
            uploader = await self.db.templater.users.find_one({"_id": template["uploaded_by"]})
            uploader_name = f"{uploader.get('first_name', '')} {uploader.get('last_name', '')}".strip() if uploader else "Unknown"

            template_response = TemplateResponse(
                id=str(template["_id"]),
                title=template["title"],
                description=template.get("description"),
                image_url=template["image_url"],
                uploaded_by=uploader_name,
                created_at=template["created_at"],
                updated_at=template["updated_at"]
            )
            template_responses.append(template_response)

        total_pages = (total + limit - 1) // limit
        page = (skip // limit) + 1

        return TemplateListResponse(
            templates=template_responses,
            total=total,
            page=page,
            per_page=limit,
            total_pages=total_pages
        )

    async def get_template_by_id(self, template_id: str) -> Optional[TemplateResponse]:
        template = await self.templates_collection.find_one({"_id": ObjectId(template_id)})
        if not template:
            return None

        # Get uploader name
        uploader = await self.db.templater.users.find_one({"_id": template["uploaded_by"]})
        uploader_name = f"{uploader.get('first_name', '')} {uploader.get('last_name', '')}".strip() if uploader else "Unknown"

        return TemplateResponse(
            id=str(template["_id"]),
            title=template["title"],
            description=template.get("description"),
            image_url=template["image_url"],
            uploaded_by=uploader_name,
            created_at=template["created_at"],
            updated_at=template["updated_at"]
        )

    async def update_template(self, template_id: str, template_data: TemplateUpdate, user_id: ObjectId) -> Optional[TemplateInDB]:
        # Check if template exists and user has permission
        template = await self.templates_collection.find_one({"_id": ObjectId(template_id)})
        if not template:
            return None

        # Only allow admin or the uploader to update
        if template["uploaded_by"] != user_id:
            # Check if user is admin
            user = await self.db.templater.users.find_one({"_id": user_id})
            if not user or user.get("role") != "admin":
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not authorized to update this template"
                )

        # Update template
        update_data = template_data.model_dump(exclude_unset=True)
        update_data["updated_at"] = datetime.utcnow()

        result = await self.templates_collection.update_one(
            {"_id": ObjectId(template_id)},
            {"$set": update_data}
        )

        if result.modified_count == 0:
            return None

        # Return updated template
        updated_template = await self.templates_collection.find_one({"_id": ObjectId(template_id)})
        return TemplateInDB(**updated_template)

    async def delete_template(self, template_id: str, user_id: ObjectId) -> bool:
        # Check if template exists and user has permission
        template = await self.templates_collection.find_one({"_id": ObjectId(template_id)})
        if not template:
            return False

        # Only allow admin or the uploader to delete
        if template["uploaded_by"] != user_id:
            # Check if user is admin
            user = await self.db.templater.users.find_one({"_id": user_id})
            if not user or user.get("role") != "admin":
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not authorized to delete this template"
                )

        # Delete the image file
        try:
            image_path = template["image_url"].replace("/uploads/", "")
            full_path = os.path.join(self.upload_dir, image_path)
            if os.path.exists(full_path):
                os.remove(full_path)
        except Exception as e:
            print(f"Failed to delete image file: {e}")

        # Delete from database
        result = await self.templates_collection.delete_one({"_id": ObjectId(template_id)})
        return result.deleted_count > 0

    async def get_templates_by_user(self, user_id: ObjectId, skip: int = 0, limit: int = 10) -> TemplateListResponse:
        # Get total count
        total = await self.templates_collection.count_documents({"uploaded_by": user_id})

        # Get templates with pagination
        cursor = self.templates_collection.find({"uploaded_by": user_id}).skip(skip).limit(limit).sort("created_at", -1)
        templates = await cursor.to_list(None)

        # Convert to response format
        template_responses = []
        for template in templates:
            template_response = TemplateResponse(
                id=str(template["_id"]),
                title=template["title"],
                description=template.get("description"),
                image_url=template["image_url"],
                uploaded_by="You",  # Since it's the user's own templates
                created_at=template["created_at"],
                updated_at=template["updated_at"]
            )
            template_responses.append(template_response)

        total_pages = (total + limit - 1) // limit
        page = (skip // limit) + 1

        return TemplateListResponse(
            templates=template_responses,
            total=total,
            page=page,
            per_page=limit,
            total_pages=total_pages
        )
