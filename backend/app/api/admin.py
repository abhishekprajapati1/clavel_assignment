from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from datetime import datetime, timedelta
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient
import calendar
import logging

from app.core.database import get_database
from app.api.auth import get_current_user
from app.models.user import UserInDB, UserResponse
from app.models.template import TemplateInDB
from app.services.analytics_service import AnalyticsService
from app.schemas.admin import (
    DashboardStats,
    UserStats,
    TemplateStats,
    MonthlyAnalytics,
    UserListResponse,
    AdminUserUpdate
)

logger = logging.getLogger(__name__)

admin_router = APIRouter()

async def get_current_admin_user(
    current_user: UserInDB = Depends(get_current_user)
) -> UserInDB:
    """Dependency to ensure current user is an admin"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user

@admin_router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    db: AsyncIOMotorClient = Depends(get_database),
    current_admin: UserInDB = Depends(get_current_admin_user)
):
    """Get dashboard statistics for admin overview"""

    # Get current date for month calculations
    now = datetime.utcnow()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    # Aggregate all stats in parallel
    try:
        logger.info("Starting dashboard stats collection")

        # Initialize analytics service
        logger.debug("Initializing analytics service")
        analytics_service = AnalyticsService(db.templater)

        # Total counts
        logger.debug("Getting total counts")
        total_templates = await db.templater.templates.count_documents({})
        logger.debug(f"Total templates: {total_templates}")

        total_users = await db.templater.users.count_documents({})
        logger.debug(f"Total users: {total_users}")

        premium_users = await db.templater.users.count_documents({"is_premium": True})
        logger.debug(f"Premium users: {premium_users}")

        verified_users = await db.templater.users.count_documents({"is_verified": True})
        logger.debug(f"Verified users: {verified_users}")

        # This month counts
        logger.debug("Getting this month counts")
        templates_this_month = await db.templater.templates.count_documents({
            "created_at": {"$gte": month_start}
        })
        logger.debug(f"Templates this month: {templates_this_month}")

        users_this_month = await db.templater.users.count_documents({
            "created_at": {"$gte": month_start}
        })
        logger.debug(f"Users this month: {users_this_month}")

        # Get download analytics
        logger.debug("Getting download analytics")
        total_downloads = await analytics_service.get_total_downloads()
        logger.debug(f"Total downloads: {total_downloads}")

        downloads_this_month = await analytics_service.get_downloads_this_month()
        logger.debug(f"Downloads this month: {downloads_this_month}")

        logger.info("Dashboard stats collection completed successfully")
        return DashboardStats(
            total_templates=total_templates,
            total_downloads=total_downloads,
            total_users=total_users,
            premium_users=premium_users,
            verified_users=verified_users,
            templates_this_month=templates_this_month,
            downloads_this_month=downloads_this_month,
            users_this_month=users_this_month
        )
    except Exception as e:
        logger.error(f"Error in get_dashboard_stats: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch dashboard stats: {str(e)}"
        )

@admin_router.get("/dashboard/monthly-analytics", response_model=List[MonthlyAnalytics])
async def get_monthly_analytics(
    db: AsyncIOMotorClient = Depends(get_database),
    current_admin: UserInDB = Depends(get_current_admin_user),
    months: int = Query(default=6, ge=1, le=12)
):
    """Get monthly analytics data for charts"""

    try:
        logger.info(f"Starting monthly analytics collection for {months} months")

        # Initialize analytics service
        logger.debug("Initializing analytics service for monthly analytics")
        analytics_service = AnalyticsService(db.templater)

        analytics_data = []
        now = datetime.utcnow()
        logger.debug(f"Current date: {now}")

        for i in range(months):
            logger.debug(f"Processing month {i}")

            # Calculate the start and end of each month going backwards
            if i == 0:
                month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
                month_end = now
            else:
                # Go back i months
                year = now.year
                month = now.month - i
                if month <= 0:
                    month += 12
                    year -= 1

                month_start = datetime(year, month, 1)
                # Get last day of month
                last_day = calendar.monthrange(year, month)[1]
                month_end = datetime(year, month, last_day, 23, 59, 59)

            logger.debug(f"Month {i}: {month_start} to {month_end}")

            # Count documents for this month
            logger.debug(f"Counting templates for month {i}")
            templates_count = await db.templater.templates.count_documents({
                "created_at": {"$gte": month_start, "$lte": month_end}
            })
            logger.debug(f"Templates count for month {i}: {templates_count}")

            logger.debug(f"Counting users for month {i}")
            users_count = await db.templater.users.count_documents({
                "created_at": {"$gte": month_start, "$lte": month_end}
            })
            logger.debug(f"Users count for month {i}: {users_count}")

            # Get downloads for this month
            logger.debug(f"Getting downloads for month {i}")
            downloads_count = await analytics_service.get_downloads_for_period(month_start, month_end)
            logger.debug(f"Downloads count for month {i}: {downloads_count}")

            analytics_data.append(MonthlyAnalytics(
                month=month_start.strftime("%b %Y"),
                templates=templates_count,
                downloads=downloads_count,
                users=users_count
            ))

        # Reverse to show oldest to newest
        logger.info("Monthly analytics collection completed successfully")
        return list(reversed(analytics_data))

    except Exception as e:
        logger.error(f"Error in get_monthly_analytics: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch monthly analytics: {str(e)}"
        )

@admin_router.get("/dashboard/top-templates", response_model=List[TemplateStats])
async def get_top_templates(
    db: AsyncIOMotorClient = Depends(get_database),
    current_admin: UserInDB = Depends(get_current_admin_user),
    limit: int = Query(default=10, ge=1, le=50)
):
    """Get top performing templates by downloads and views"""

    try:
        logger.info(f"Starting top templates collection with limit {limit}")

        # Initialize analytics service
        logger.debug("Initializing analytics service for top templates")
        analytics_service = AnalyticsService(db.templater)

        # Get templates with their stats
        logger.debug("Fetching templates from database")
        templates = await db.templater.templates.find({}).sort("created_at", -1).limit(limit).to_list(length=limit)
        logger.debug(f"Found {len(templates)} templates")

        template_stats = []
        for idx, template in enumerate(templates):
            logger.debug(f"Processing template {idx + 1}/{len(templates)}: {template.get('title', 'Unknown')}")

            # Get uploader information
            logger.debug(f"Getting uploader info for template {template['_id']}")
            uploader = await db.templater.users.find_one({"_id": template["uploaded_by"]})
            uploader_name = f"{uploader['first_name']} {uploader['last_name']}" if uploader else "Unknown"
            logger.debug(f"Uploader: {uploader_name}")

            # Get actual download and view counts
            logger.debug(f"Getting download count for template {template['_id']}")
            download_count = await analytics_service.get_template_download_count(str(template["_id"]))
            logger.debug(f"Download count: {download_count}")

            logger.debug(f"Getting view count for template {template['_id']}")
            view_count = await analytics_service.get_template_view_count(str(template["_id"]))
            logger.debug(f"View count: {view_count}")

            template_stats.append(TemplateStats(
                template_id=str(template["_id"]),
                template_title=template["title"],
                download_count=download_count,
                view_count=view_count,
                uploaded_by=uploader_name,
                created_at=template["created_at"]
            ))

        # Sort by download count
        logger.debug("Sorting templates by download count")
        template_stats.sort(key=lambda x: x.download_count, reverse=True)
        logger.info("Top templates collection completed successfully")
        return template_stats

    except Exception as e:
        logger.error(f"Error in get_top_templates: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch top templates: {str(e)}"
        )

@admin_router.get("/users", response_model=List[UserListResponse])
async def get_all_users(
    db: AsyncIOMotorClient = Depends(get_database),
    current_admin: UserInDB = Depends(get_current_admin_user),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=1000)
):
    """Get all users for admin management"""

    try:
        users = await db.templater.users.find({}).skip(skip).limit(limit).to_list(length=limit)

        user_responses = []
        for user in users:
            user_responses.append(UserListResponse(
                id=str(user["_id"]),
                email=user["email"],
                first_name=user["first_name"],
                last_name=user["last_name"],
                role=user.get("role", "user"),
                is_active=user.get("is_active", True),
                is_verified=user.get("is_verified", False),
                is_premium=user.get("is_premium", False),
                created_at=user["created_at"],
                updated_at=user["updated_at"],
                last_login=user.get("last_login")
            ))

        return user_responses

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch users: {str(e)}"
        )

@admin_router.get("/users/stats", response_model=UserStats)
async def get_user_stats(
    db: AsyncIOMotorClient = Depends(get_database),
    current_admin: UserInDB = Depends(get_current_admin_user)
):
    """Get user statistics for admin dashboard"""

    try:
        total_users = await db.templater.users.count_documents({})
        verified_users = await db.templater.users.count_documents({"is_verified": True})
        premium_users = await db.templater.users.count_documents({"is_premium": True})
        active_users = await db.templater.users.count_documents({"is_active": True})
        admin_users = await db.templater.users.count_documents({"role": "admin"})

        return UserStats(
            total_users=total_users,
            verified_users=verified_users,
            premium_users=premium_users,
            active_users=active_users,
            admin_users=admin_users
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch user stats: {str(e)}"
        )

@admin_router.post("/users/{user_id}/toggle-status")
async def toggle_user_status(
    user_id: str,
    db: AsyncIOMotorClient = Depends(get_database),
    current_admin: UserInDB = Depends(get_current_admin_user)
):
    """Toggle user active status"""

    if not ObjectId.is_valid(user_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID"
        )

    try:
        user = await db.templater.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        # Don't allow deactivating other admins
        if user["role"] == "admin" and user["_id"] != current_admin.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot modify other admin users"
            )

        new_status = not user["is_active"]
        await db.templater.users.update_one(
            {"_id": ObjectId(user_id)},
            {
                "$set": {
                    "is_active": new_status,
                    "updated_at": datetime.utcnow()
                }
            }
        )

        return {"message": f"User {'activated' if new_status else 'deactivated'} successfully"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to toggle user status: {str(e)}"
        )

@admin_router.post("/users/{user_id}/resend-verification")
async def resend_verification_email(
    user_id: str,
    db: AsyncIOMotorClient = Depends(get_database),
    current_admin: UserInDB = Depends(get_current_admin_user)
):
    """Resend verification email to user"""

    if not ObjectId.is_valid(user_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID"
        )

    try:
        user = await db.templater.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        if user["is_verified"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User is already verified"
            )

        # Here you would implement the email sending logic
        # For now, we'll just return a success message
        # TODO: Implement actual email sending

        return {"message": "Verification email sent successfully"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to resend verification email: {str(e)}"
        )

# Analytics helper endpoints for additional functionality

@admin_router.get("/analytics/template/{template_id}")
async def get_template_analytics(
    template_id: str,
    db: AsyncIOMotorClient = Depends(get_database),
    current_admin: UserInDB = Depends(get_current_admin_user)
):
    """Get detailed analytics for a specific template"""

    if not ObjectId.is_valid(template_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid template ID"
        )

    try:
        analytics_service = AnalyticsService(db.templater)
        analytics = await analytics_service.get_template_analytics(template_id)

        if not analytics:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Template not found or no analytics data available"
            )

        return analytics

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch template analytics: {str(e)}"
        )

@admin_router.get("/analytics/daily")
async def get_daily_analytics(
    days: int = Query(default=30, ge=1, le=365),
    db: AsyncIOMotorClient = Depends(get_database),
    current_admin: UserInDB = Depends(get_current_admin_user)
):
    """Get daily analytics for the specified number of days"""

    try:
        analytics_service = AnalyticsService(db.templater)
        daily_data = await analytics_service.get_daily_analytics(days)
        return daily_data

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch daily analytics: {str(e)}"
        )
