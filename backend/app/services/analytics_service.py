from datetime import datetime, timedelta
from typing import Optional, Dict, List, Any
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
import logging

logger = logging.getLogger(__name__)

class AnalyticsService:
    """Service for tracking and analyzing template downloads and views"""

    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.download_logs = db.download_logs
        self.view_logs = db.view_logs

    async def _ensure_collections_exist(self):
        """Ensure analytics collections exist"""
        try:
            collections = await self.db.list_collection_names()

            if "download_logs" not in collections:
                await self.db.create_collection("download_logs")
                logger.info("Created download_logs collection")

            if "view_logs" not in collections:
                await self.db.create_collection("view_logs")
                logger.info("Created view_logs collection")

        except Exception as e:
            logger.warning(f"Could not ensure collections exist: {str(e)}")

    async def log_download(
        self,
        template_id: str,
        user_id: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> bool:
        """Log a template download"""
        try:
            await self._ensure_collections_exist()

            download_log = {
                "template_id": ObjectId(template_id),
                "user_id": ObjectId(user_id),
                "downloaded_at": datetime.utcnow(),
                "ip_address": ip_address,
                "user_agent": user_agent
            }

            await self.download_logs.insert_one(download_log)
            logger.info(f"Download logged: template {template_id} by user {user_id}")
            return True

        except Exception as e:
            logger.error(f"Failed to log download: {str(e)}")
            return False

    async def log_view(
        self,
        template_id: str,
        user_id: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> bool:
        """Log a template view"""
        try:
            await self._ensure_collections_exist()

            view_log = {
                "template_id": ObjectId(template_id),
                "user_id": ObjectId(user_id) if user_id else None,
                "viewed_at": datetime.utcnow(),
                "ip_address": ip_address,
                "user_agent": user_agent
            }

            await self.view_logs.insert_one(view_log)
            logger.debug(f"View logged: template {template_id}")
            return True

        except Exception as e:
            logger.error(f"Failed to log view: {str(e)}")
            return False

    async def get_total_downloads(self) -> int:
        """Get total number of downloads across all templates"""
        try:
            await self._ensure_collections_exist()
            count = await self.download_logs.count_documents({})
            logger.debug(f"Total downloads count: {count}")
            return count
        except Exception as e:
            logger.error(f"Failed to get total downloads: {str(e)}")
            return 0

    async def get_total_views(self) -> int:
        """Get total number of views across all templates"""
        try:
            await self._ensure_collections_exist()
            count = await self.view_logs.count_documents({})
            logger.debug(f"Total views count: {count}")
            return count
        except Exception as e:
            logger.error(f"Failed to get total views: {str(e)}")
            return 0

    async def get_downloads_this_month(self) -> int:
        """Get downloads count for current month"""
        try:
            await self._ensure_collections_exist()
            now = datetime.utcnow()
            month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

            count = await self.download_logs.count_documents({
                "downloaded_at": {"$gte": month_start}
            })
            logger.debug(f"Downloads this month: {count}")
            return count
        except Exception as e:
            logger.error(f"Failed to get downloads this month: {str(e)}")
            return 0

    async def get_downloads_for_period(self, start_date: datetime, end_date: datetime) -> int:
        """Get downloads count for a specific period"""
        try:
            await self._ensure_collections_exist()
            count = await self.download_logs.count_documents({
                "downloaded_at": {"$gte": start_date, "$lte": end_date}
            })
            logger.debug(f"Downloads for period {start_date} to {end_date}: {count}")
            return count
        except Exception as e:
            logger.error(f"Failed to get downloads for period: {str(e)}")
            return 0

    async def get_template_download_count(self, template_id: str) -> int:
        """Get download count for a specific template"""
        try:
            await self._ensure_collections_exist()
            if not ObjectId.is_valid(template_id):
                logger.warning(f"Invalid template_id: {template_id}")
                return 0

            count = await self.download_logs.count_documents({
                "template_id": ObjectId(template_id)
            })
            logger.debug(f"Download count for template {template_id}: {count}")
            return count
        except Exception as e:
            logger.error(f"Failed to get template download count: {str(e)}")
            return 0

    async def get_template_view_count(self, template_id: str) -> int:
        """Get view count for a specific template"""
        try:
            await self._ensure_collections_exist()
            if not ObjectId.is_valid(template_id):
                logger.warning(f"Invalid template_id: {template_id}")
                return 0

            count = await self.view_logs.count_documents({
                "template_id": ObjectId(template_id)
            })
            logger.debug(f"View count for template {template_id}: {count}")
            return count
        except Exception as e:
            logger.error(f"Failed to get template view count: {str(e)}")
            return 0

    async def get_top_templates_by_downloads(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get top templates by download count"""
        try:
            pipeline = [
                {
                    "$group": {
                        "_id": "$template_id",
                        "download_count": {"$sum": 1},
                        "last_download": {"$max": "$downloaded_at"}
                    }
                },
                {"$sort": {"download_count": -1}},
                {"$limit": limit},
                {
                    "$lookup": {
                        "from": "templates",
                        "localField": "_id",
                        "foreignField": "_id",
                        "as": "template"
                    }
                },
                {"$unwind": "$template"}
            ]

            results = await self.download_logs.aggregate(pipeline).to_list(length=limit)
            return results

        except Exception as e:
            logger.error(f"Failed to get top templates by downloads: {str(e)}")
            return []

    async def get_top_templates_by_views(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get top templates by view count"""
        try:
            pipeline = [
                {
                    "$group": {
                        "_id": "$template_id",
                        "view_count": {"$sum": 1},
                        "last_view": {"$max": "$viewed_at"}
                    }
                },
                {"$sort": {"view_count": -1}},
                {"$limit": limit},
                {
                    "$lookup": {
                        "from": "templates",
                        "localField": "_id",
                        "foreignField": "_id",
                        "as": "template"
                    }
                },
                {"$unwind": "$template"}
            ]

            results = await self.view_logs.aggregate(pipeline).to_list(length=limit)
            return results

        except Exception as e:
            logger.error(f"Failed to get top templates by views: {str(e)}")
            return []

    async def get_user_download_history(self, user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Get download history for a specific user"""
        try:
            pipeline = [
                {"$match": {"user_id": ObjectId(user_id)}},
                {"$sort": {"downloaded_at": -1}},
                {"$limit": limit},
                {
                    "$lookup": {
                        "from": "templates",
                        "localField": "template_id",
                        "foreignField": "_id",
                        "as": "template"
                    }
                },
                {"$unwind": "$template"}
            ]

            results = await self.download_logs.aggregate(pipeline).to_list(length=limit)
            return results

        except Exception as e:
            logger.error(f"Failed to get user download history: {str(e)}")
            return []

    async def get_daily_analytics(self, days: int = 30) -> List[Dict[str, Any]]:
        """Get daily analytics for the last N days"""
        try:
            end_date = datetime.utcnow().replace(hour=23, minute=59, second=59, microsecond=999999)
            start_date = end_date - timedelta(days=days)

            # Pipeline for downloads
            download_pipeline = [
                {
                    "$match": {
                        "downloaded_at": {"$gte": start_date, "$lte": end_date}
                    }
                },
                {
                    "$group": {
                        "_id": {
                            "$dateToString": {
                                "format": "%Y-%m-%d",
                                "date": "$downloaded_at"
                            }
                        },
                        "downloads": {"$sum": 1}
                    }
                },
                {"$sort": {"_id": 1}}
            ]

            # Pipeline for views
            view_pipeline = [
                {
                    "$match": {
                        "viewed_at": {"$gte": start_date, "$lte": end_date}
                    }
                },
                {
                    "$group": {
                        "_id": {
                            "$dateToString": {
                                "format": "%Y-%m-%d",
                                "date": "$viewed_at"
                            }
                        },
                        "views": {"$sum": 1}
                    }
                },
                {"$sort": {"_id": 1}}
            ]

            downloads_data = await self.download_logs.aggregate(download_pipeline).to_list(length=days)
            views_data = await self.view_logs.aggregate(view_pipeline).to_list(length=days)

            # Combine data
            analytics = {}
            for item in downloads_data:
                date = item["_id"]
                analytics[date] = {"date": date, "downloads": item["downloads"], "views": 0}

            for item in views_data:
                date = item["_id"]
                if date in analytics:
                    analytics[date]["views"] = item["views"]
                else:
                    analytics[date] = {"date": date, "downloads": 0, "views": item["views"]}

            return list(analytics.values())

        except Exception as e:
            logger.error(f"Failed to get daily analytics: {str(e)}")
            return []

    async def get_monthly_analytics(self, months: int = 6) -> List[Dict[str, Any]]:
        """Get monthly analytics for the last N months"""
        try:
            analytics_data = []
            now = datetime.utcnow()

            for i in range(months):
                # Calculate month boundaries
                if i == 0:
                    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
                    month_end = now
                else:
                    year = now.year
                    month = now.month - i
                    if month <= 0:
                        month += 12
                        year -= 1

                    month_start = datetime(year, month, 1)
                    # Get last day of month
                    import calendar
                    last_day = calendar.monthrange(year, month)[1]
                    month_end = datetime(year, month, last_day, 23, 59, 59)

                # Get counts for this month
                downloads = await self.download_logs.count_documents({
                    "downloaded_at": {"$gte": month_start, "$lte": month_end}
                })

                views = await self.view_logs.count_documents({
                    "viewed_at": {"$gte": month_start, "$lte": month_end}
                })

                analytics_data.append({
                    "month": month_start.strftime("%b %Y"),
                    "downloads": downloads,
                    "views": views,
                    "start_date": month_start,
                    "end_date": month_end
                })

            # Reverse to show oldest to newest
            return list(reversed(analytics_data))

        except Exception as e:
            logger.error(f"Failed to get monthly analytics: {str(e)}")
            return []

    async def get_template_analytics(self, template_id: str) -> Dict[str, Any]:
        """Get comprehensive analytics for a specific template"""
        try:
            template_oid = ObjectId(template_id)

            # Get basic counts
            total_downloads = await self.download_logs.count_documents({"template_id": template_oid})
            total_views = await self.download_logs.count_documents({"template_id": template_oid})

            # Get unique downloaders
            unique_downloaders = len(await self.download_logs.distinct("user_id", {"template_id": template_oid}))

            # Get recent activity (last 30 days)
            thirty_days_ago = datetime.utcnow() - timedelta(days=30)
            recent_downloads = await self.download_logs.count_documents({
                "template_id": template_oid,
                "downloaded_at": {"$gte": thirty_days_ago}
            })
            recent_views = await self.view_logs.count_documents({
                "template_id": template_oid,
                "viewed_at": {"$gte": thirty_days_ago}
            })

            # Get first and last activity
            first_download = await self.download_logs.find_one(
                {"template_id": template_oid},
                sort=[("downloaded_at", 1)]
            )
            last_download = await self.download_logs.find_one(
                {"template_id": template_oid},
                sort=[("downloaded_at", -1)]
            )

            return {
                "template_id": template_id,
                "total_downloads": total_downloads,
                "total_views": total_views,
                "unique_downloaders": unique_downloaders,
                "recent_downloads": recent_downloads,
                "recent_views": recent_views,
                "first_download": first_download.get("downloaded_at") if first_download else None,
                "last_download": last_download.get("downloaded_at") if last_download else None,
                "conversion_rate": (total_downloads / total_views * 100) if total_views > 0 else 0
            }

        except Exception as e:
            logger.error(f"Failed to get template analytics: {str(e)}")
            return {}

    async def cleanup_old_logs(self, days_to_keep: int = 365) -> int:
        """Clean up old analytics logs to manage database size"""
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=days_to_keep)

            # Delete old download logs
            download_result = await self.download_logs.delete_many({
                "downloaded_at": {"$lt": cutoff_date}
            })

            # Delete old view logs
            view_result = await self.view_logs.delete_many({
                "viewed_at": {"$lt": cutoff_date}
            })

            total_deleted = download_result.deleted_count + view_result.deleted_count
            logger.info(f"Cleaned up {total_deleted} old analytics logs")

            return total_deleted

        except Exception as e:
            logger.error(f"Failed to cleanup old logs: {str(e)}")
            return 0
