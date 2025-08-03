from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from dotenv import load_dotenv

from app.core.config import settings
from app.api.auth import auth_router
from app.api.templates import templates_router

# Load environment variables
load_dotenv()

app = FastAPI(
    title="Clavel Assignment API",
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

@app.get("/")
async def root():
    return {"message": "Clavel Assignment API is running!"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"} 