#!/usr/bin/env python3
"""
Test script to verify authentication functionality
"""

import asyncio
import sys
import os
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient

# Add the backend directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app.core.config import settings
from app.services.auth_service import AuthService
from app.schemas.auth import SignUpRequest
from app.core.security import verify_password, get_password_hash

async def test_auth_service():
    """Test the authentication service functionality"""
    print("🔧 Testing Authentication Service...")

    # Connect to database
    try:
        client = AsyncIOMotorClient(settings.MONGODB_URL)
        db = client
        print("✅ Database connection successful")
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

    auth_service = AuthService(db)

    # Test 1: Password hashing
    print("\n1️⃣ Testing password hashing...")
    test_password = "testpassword123"
    hashed = get_password_hash(test_password)
    is_valid = verify_password(test_password, hashed)
    print(f"   Password: {test_password}")
    print(f"   Hashed: {hashed[:50]}...")
    print(f"   Verification: {'✅ PASS' if is_valid else '❌ FAIL'}")

    # Test 2: User creation
    print("\n2️⃣ Testing user creation...")
    test_user_data = SignUpRequest(
        email=f"test_{datetime.now().timestamp()}@example.com",
        password="testpassword123",
        first_name="Test",
        last_name="User"
    )

    try:
        user = await auth_service.create_user(test_user_data)
        print(f"   ✅ User created successfully: {user.email}")
        print(f"   User ID: {user.id}")
        print(f"   Verified: {user.is_verified}")
        print(f"   Active: {user.is_active}")
    except Exception as e:
        print(f"   ❌ User creation failed: {e}")
        return False

    # Test 3: User authentication (should fail - not verified)
    print("\n3️⃣ Testing authentication (unverified user)...")
    auth_user = await auth_service.authenticate_user(test_user_data.email, test_user_data.password)
    if auth_user:
        print(f"   ✅ Authentication successful: {auth_user.email}")
    else:
        print("   ❌ Authentication failed (expected for unverified user)")

    # Test 4: Manual verification for testing
    print("\n4️⃣ Manually verifying user for testing...")
    try:
        await auth_service.users_collection.update_one(
            {"email": test_user_data.email},
            {"$set": {"is_verified": True}}
        )
        print("   ✅ User manually verified")
    except Exception as e:
        print(f"   ❌ Manual verification failed: {e}")
        return False

    # Test 5: User authentication (should succeed now)
    print("\n5️⃣ Testing authentication (verified user)...")
    auth_user = await auth_service.authenticate_user(test_user_data.email, test_user_data.password)
    if auth_user:
        print(f"   ✅ Authentication successful: {auth_user.email}")
        print(f"   Role: {auth_user.role}")
    else:
        print("   ❌ Authentication failed")
        return False

    # Test 6: Session creation
    print("\n6️⃣ Testing session creation...")
    try:
        session, auth_token = await auth_service.create_session(
            auth_user.id,
            "Mozilla/5.0 (Test Browser)",
            "127.0.0.1"
        )
        print(f"   ✅ Session created: {session.id}")
        print(f"   Device: {session.device_info.get('device', 'Unknown')}")
        print(f"   Browser: {session.device_info.get('browser', 'Unknown')}")
        print(f"   Access token: {auth_token.access_token[:50]}...")
    except Exception as e:
        print(f"   ❌ Session creation failed: {e}")
        return False

    # Test 7: Token verification
    print("\n7️⃣ Testing token verification...")
    try:
        from app.core.security import verify_token
        payload = verify_token(auth_token.access_token, settings.JWT_SECRET_KEY)
        if payload and payload.get("type") == "access":
            print(f"   ✅ Token verification successful")
            print(f"   User ID: {payload.get('user_id')}")
            print(f"   Role: {payload.get('role')}")
        else:
            print("   ❌ Token verification failed")
            return False
    except Exception as e:
        print(f"   ❌ Token verification error: {e}")
        return False

    # Cleanup: Remove test user
    print("\n🧹 Cleaning up test data...")
    try:
        await auth_service.users_collection.delete_one({"email": test_user_data.email})
        await auth_service.sessions_collection.delete_many({"user_id": auth_user.id})
        await auth_service.tokens_collection.delete_many({"session_id": session.id})
        print("   ✅ Test data cleaned up")
    except Exception as e:
        print(f"   ⚠️ Cleanup warning: {e}")

    # Close database connection
    client.close()

    print("\n🎉 All authentication tests passed!")
    return True

async def test_token_functions():
    """Test token creation and verification functions"""
    print("\n🔐 Testing Token Functions...")

    from app.core.security import create_access_token, create_refresh_token, verify_token

    # Test access token
    test_data = {"user_id": "test123", "role": "user"}
    access_token = create_access_token(test_data)
    access_payload = verify_token(access_token, settings.JWT_SECRET_KEY)

    print(f"   Access Token: {access_token[:50]}...")
    print(f"   Payload: {access_payload}")
    print(f"   Type: {access_payload.get('type') if access_payload else 'None'}")

    # Test refresh token
    refresh_token = create_refresh_token(test_data)
    refresh_payload = verify_token(refresh_token, settings.JWT_REFRESH_SECRET_KEY)

    print(f"   Refresh Token: {refresh_token[:50]}...")
    print(f"   Payload: {refresh_payload}")
    print(f"   Type: {refresh_payload.get('type') if refresh_payload else 'None'}")

    if (access_payload and access_payload.get('type') == 'access' and
        refresh_payload and refresh_payload.get('type') == 'refresh'):
        print("   ✅ Token functions working correctly")
        return True
    else:
        print("   ❌ Token functions failed")
        return False

async def main():
    """Main test function"""
    print("🚀 Starting Authentication Tests...\n")

    try:
        # Test 1: Token functions
        token_test = await test_token_functions()

        # Test 2: Auth service
        if token_test:
            auth_test = await test_auth_service()

            if auth_test:
                print("\n✅ ALL TESTS PASSED! Authentication system is working correctly.")
                return True

        print("\n❌ SOME TESTS FAILED! Please check the errors above.")
        return False

    except Exception as e:
        print(f"\n💥 Test execution failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    # Check if required environment variables are set
    required_vars = ['MONGODB_URL', 'JWT_SECRET_KEY', 'JWT_REFRESH_SECRET_KEY']
    missing_vars = [var for var in required_vars if not getattr(settings, var, None)]

    if missing_vars:
        print("❌ Missing required environment variables:")
        for var in missing_vars:
            print(f"   - {var}")
        print("\nPlease set these in your .env file and try again.")
        sys.exit(1)

    # Run tests
    success = asyncio.run(main())
    sys.exit(0 if success else 1)
