#!/usr/bin/env python3
"""
Admin User Creation Script
Automatically creates an admin user if one doesn't exist in the database.
This script is designed to run on application startup.
"""

import asyncio
import sys
import os
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient

# Add the backend directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app.core.config import settings
from app.core.security import get_password_hash
from app.models.user import UserInDB
from bson import ObjectId

# Admin user credentials
ADMIN_EMAIL = "admin@templater.com"
ADMIN_PASSWORD = "Admin@123"
ADMIN_FIRST_NAME = "Admin"
ADMIN_LAST_NAME = "User"

async def create_admin_user():
    """
    Create admin user if it doesn't exist
    Returns True if admin was created or already exists, False on error
    """
    try:
        # Connect to database
        client = AsyncIOMotorClient(settings.MONGODB_URL)
        db = client
        users_collection = db.templater.users

        print("🔧 Checking for admin user...")

        # Check if any admin user exists
        existing_admin = await users_collection.find_one({"role": "admin"})

        if existing_admin:
            print(f"✅ Admin user already exists: {existing_admin['email']}")
            print(f"   Name: {existing_admin['first_name']} {existing_admin['last_name']}")
            print(f"   Verified: {existing_admin.get('is_verified', False)}")
            print(f"   Active: {existing_admin.get('is_active', True)}")
            client.close()
            return True

        # Check if the specific admin email exists with different role
        existing_user = await users_collection.find_one({"email": ADMIN_EMAIL})

        if existing_user:
            if existing_user['role'] != 'admin':
                print(f"📝 User {ADMIN_EMAIL} exists but is not admin. Updating role...")

                # Update existing user to admin
                await users_collection.update_one(
                    {"email": ADMIN_EMAIL},
                    {
                        "$set": {
                            "role": "admin",
                            "is_verified": True,
                            "is_active": True,
                            "updated_at": datetime.utcnow()
                        }
                    }
                )
                print(f"✅ User {ADMIN_EMAIL} updated to admin role")
            else:
                print(f"✅ Admin user {ADMIN_EMAIL} already exists")

            client.close()
            return True

        # Create new admin user
        print(f"🚀 Creating admin user: {ADMIN_EMAIL}")

        # Hash password
        hashed_password = get_password_hash(ADMIN_PASSWORD)

        # Create admin user document
        admin_user = UserInDB(
            email=ADMIN_EMAIL,
            first_name=ADMIN_FIRST_NAME,
            last_name=ADMIN_LAST_NAME,
            role="admin",
            hashed_password=hashed_password,
            is_active=True,
            is_verified=True,  # Admin is automatically verified
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )

        # Insert admin user
        result = await users_collection.insert_one(admin_user.model_dump(by_alias=True))

        if result.inserted_id:
            print(f"✅ Admin user created successfully!")
            print(f"   Email: {ADMIN_EMAIL}")
            print(f"   Password: {ADMIN_PASSWORD}")
            print(f"   Name: {ADMIN_FIRST_NAME} {ADMIN_LAST_NAME}")
            print(f"   ID: {result.inserted_id}")
            print(f"   ⚠️  Please change the default password after first login!")
        else:
            print("❌ Failed to create admin user")
            client.close()
            return False

        client.close()
        return True

    except Exception as e:
        print(f"❌ Error creating admin user: {e}")
        import traceback
        traceback.print_exc()
        return False

async def ensure_admin_exists():
    """
    Main function to ensure admin user exists
    This is the function called from the main application
    """
    print("🔐 Starting admin user check...")

    try:
        success = await create_admin_user()
        if success:
            print("✅ Admin user verification completed")
        else:
            print("❌ Admin user verification failed")
        return success
    except Exception as e:
        print(f"💥 Admin user check failed: {e}")
        return False

if __name__ == "__main__":
    """
    Standalone execution for testing
    """
    print("🚀 Admin User Creation Script")
    print("=" * 50)

    # Check if required environment variables are set
    required_vars = ['MONGODB_URL', 'JWT_SECRET_KEY']
    missing_vars = [var for var in required_vars if not getattr(settings, var, None)]

    if missing_vars:
        print("❌ Missing required environment variables:")
        for var in missing_vars:
            print(f"   - {var}")
        print("\nPlease set these in your .env file and try again.")
        sys.exit(1)

    # Run the admin creation
    success = asyncio.run(ensure_admin_exists())

    if success:
        print("\n🎉 Admin user setup completed successfully!")
        print(f"   You can now login with:")
        print(f"   Email: {ADMIN_EMAIL}")
        print(f"   Password: {ADMIN_PASSWORD}")
    else:
        print("\n💥 Admin user setup failed!")
        sys.exit(1)
