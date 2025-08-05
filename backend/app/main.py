from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from dotenv import load_dotenv

from app.core.config import settings
from app.core.database import connect_to_mongo, close_mongo_connection
from app.api.auth import auth_router
from app.api.templates import templates_router
from app.api.stripe import router as stripe_router
from app.api.admin import admin_router
import sys
import os

# Add create_admin script
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from create_admin import ensure_admin_exists
from app.core.init_collections import init_analytics_collections, verify_analytics_setup
from app.core.database import get_database

# Load environment variables
load_dotenv()

app = FastAPI(
    title="Templater API",
    description="Full-stack web application API with authentication and template management",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for uploaded templates
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Include routers
app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
app.include_router(templates_router, prefix="/api/templates", tags=["Templates"])
app.include_router(stripe_router, prefix="/api/payment", tags=["Payment"])
app.include_router(admin_router, prefix="/api/admin", tags=["Admin"])

@app.on_event("startup")
async def startup_event():
    await connect_to_mongo()
    # Create admin user if it doesn't exist
    await ensure_admin_exists()

    # Initialize analytics collections
    db_client = await get_database()
    db = db_client.templater
    await init_analytics_collections(db)
    await verify_analytics_setup(db)

@app.on_event("shutdown")
async def shutdown_event():
    await close_mongo_connection()

@app.get("/")
async def root():
    return {"message": "Templater API is running!"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
