# Admin User Setup

This document explains the automatic admin user creation system in the Templater backend application.

## Overview

The application automatically creates an admin user on startup if one doesn't exist. This ensures that there's always an admin account available for managing the system.

## Admin Credentials

**Default Admin User:**
- **Email:** `admin@templater.com`
- **Password:** `Admin@123`
- **Role:** `admin`
- **Status:** Active and verified

⚠️ **Security Notice:** Please change the default password after your first login!

## How It Works

### Automatic Creation
The admin creation system runs automatically when the FastAPI application starts up. The process:

1. **On Application Startup** - The `create_admin.py` script is executed
2. **Database Check** - Searches for existing admin users
3. **Admin Creation** - Creates admin user if none exists
4. **Role Upgrade** - Updates existing user to admin if email matches

### Script Location
- **Script:** `backend/create_admin.py`
- **Integration:** `backend/app/main.py` (startup event)

## Startup Behavior

### Case 1: No Admin Exists
```
🔧 Checking for admin user...
🚀 Creating admin user: admin@templater.com
✅ Admin user created successfully!
   Email: admin@templater.com
   Password: Admin@123
   Name: Admin User
   ⚠️  Please change the default password after first login!
```

### Case 2: Admin Already Exists
```
🔧 Checking for admin user...
✅ Admin user already exists: admin@templater.com
   Name: Admin User
   Verified: True
   Active: True
```

### Case 3: User Exists But Not Admin
```
🔧 Checking for admin user...
📝 User admin@templater.com exists but is not admin. Updating role...
✅ User admin@templater.com updated to admin role
```

## Manual Execution

You can also run the admin creation script manually:

```bash
cd backend
source venv/bin/activate
python create_admin.py
```

This is useful for:
- Testing the admin creation process
- Creating admin user before application startup
- Debugging admin-related issues

## Admin User Properties

The created admin user has the following properties:

```json
{
  "email": "admin@templater.com",
  "first_name": "Admin",
  "last_name": "User",
  "role": "admin",
  "is_active": true,
  "is_verified": true,
  "hashed_password": "[bcrypt_hash]",
  "created_at": "[timestamp]",
  "updated_at": "[timestamp]"
}
```

## JWT Token Claims

When the admin logs in, their JWT token includes:

```json
{
  "user_id": "[user_id]",
  "role": "admin",
  "exp": "[expiration]",
  "type": "access"
}
```

This allows the frontend to identify admin users and show appropriate UI/functionality.

## Login Testing

Test admin login with cURL:

```bash
curl -X POST "http://localhost:8000/api/auth/signin" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@templater.com",
    "password": "Admin@123"
  }'
```

Expected response:
- Access token with `"role": "admin"`
- User object with admin properties
- HTTP 200 status

## Security Considerations

### Password Security
- Default password should be changed immediately
- Use strong passwords in production
- Consider implementing password complexity requirements

### Environment Variables
The script requires these environment variables:
- `MONGODB_URL` - Database connection string
- `JWT_SECRET_KEY` - JWT signing key

### Production Deployment
For production environments:

1. **Change Default Password** - Update `ADMIN_PASSWORD` in script
2. **Secure Credentials** - Store credentials securely
3. **Environment Variables** - Use production-grade secrets
4. **Monitor Access** - Log admin login attempts

## Troubleshooting

### Common Issues

**Database Connection Failed**
```
❌ Database connection failed: [error]
```
- Check `MONGODB_URL` environment variable
- Ensure MongoDB is running and accessible

**Admin Creation Failed**
```
❌ Error creating admin user: [error]
```
- Check database permissions
- Verify user schema compatibility
- Check for duplicate key errors

**Environment Variables Missing**
```
❌ Missing required environment variables:
   - MONGODB_URL
   - JWT_SECRET_KEY
```
- Ensure `.env` file is properly configured
- Verify environment variable names

### Debug Mode

Enable debug logging by setting:
```bash
export DEBUG=true
```

### Manual Admin Creation

If automatic creation fails, create admin manually:

```python
from app.core.security import get_password_hash
from app.models.user import UserInDB
from motor.motor_asyncio import AsyncIOMotorClient

# Create admin user document
admin_user = UserInDB(
    email="admin@templater.com",
    first_name="Admin",
    last_name="User",
    role="admin",
    hashed_password=get_password_hash("Admin@123"),
    is_active=True,
    is_verified=True
)

# Insert into database
# (Connect to database and insert admin_user)
```

## Configuration

### Customizing Admin Credentials

To customize the default admin credentials, edit `create_admin.py`:

```python
# Admin user credentials
ADMIN_EMAIL = "your-admin@company.com"
ADMIN_PASSWORD = "YourSecurePassword123!"
ADMIN_FIRST_NAME = "Your Name"
ADMIN_LAST_NAME = "Admin"
```

### Disabling Auto-Creation

To disable automatic admin creation, comment out the line in `app/main.py`:

```python
@app.on_event("startup")
async def startup_event():
    await connect_to_mongo()
    # await ensure_admin_exists()  # Commented out
```

## Integration with Frontend

The frontend can detect admin users by checking the JWT token role:

```typescript
const isAdmin = user?.role === 'admin';

// Show admin-only features
if (isAdmin) {
  // Display admin dashboard, user management, etc.
}
```

This enables role-based access control throughout the application.