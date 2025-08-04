# Templater Backend - FastAPI Authentication System

A robust FastAPI backend with MongoDB integration, JWT authentication, and template management.

## 🚀 Quick Start

### Prerequisites

- Python 3.8+
- MongoDB (local or Atlas)
- pip or conda

### Installation

1. **Clone and navigate to backend**:
   ```bash
   cd templater/backend
   ```

2. **Create virtual environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your actual values
   ```

5. **Start the application**:
   ```bash
   uvicorn app.main:app --reload
   ```

### Environment Configuration

Your `.env` file should contain:

```env
# Database
MONGODB_URL=mongodb://localhost:27017/templater

# JWT Keys (generate secure random strings)
JWT_SECRET_KEY=your_super_secret_jwt_key_here
JWT_REFRESH_SECRET_KEY=your_super_secret_refresh_key_here

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Email (optional for verification)
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
```

## 🔐 Authentication System

### Features

- **JWT Token Authentication** with access and refresh tokens
- **Role-based Access Control** (admin/user)
- **Email Verification** with token-based confirmation
- **Password Reset** functionality
- **Session Management** with device tracking
- **HTTP-only Cookies** for enhanced security

### API Endpoints

#### Authentication Routes (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/signup` | Create new user account | No |
| POST | `/signin` | User login | No |
| POST | `/verify-email` | Verify email with token | No |
| POST | `/forgot` | Request password reset | No |
| POST | `/reset-password` | Reset password with token | No |
| POST | `/refresh-token` | Refresh access token | No |
| GET | `/details` | Get current user details | Yes |
| POST | `/logout` | Logout current session | Yes |
| GET | `/sessions` | Get user sessions | Yes |
| DELETE | `/sessions` | Logout all devices | Yes |
| DELETE | `/sessions/{id}` | Logout specific device | Yes |

#### Template Routes (`/api/templates`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Get all templates | No |
| GET | `/{id}` | Get specific template | No |
| POST | `/` | Create template | Admin |
| PUT | `/{id}` | Update template | Admin/Owner |
| DELETE | `/{id}` | Delete template | Admin/Owner |
| GET | `/my/templates` | Get user's templates | Yes |

## 🧪 Testing

### Run Authentication Tests

```bash
python test_auth.py
```

This comprehensive test suite verifies:
- Password hashing and verification
- User creation and authentication
- Session and token management
- JWT token verification
- Database operations

### Manual API Testing

1. **Start the server**:
   ```bash
   uvicorn app.main:app --reload
   ```

2. **Open API documentation**:
   - Swagger UI: http://localhost:8000/docs
   - ReDoc: http://localhost:8000/redoc

3. **Test endpoints**:
   - Health check: http://localhost:8000/health
   - Root: http://localhost:8000/

## 📁 Project Structure

```
backend/
├── app/
│   ├── api/              # API route handlers
│   │   ├── auth.py       # Authentication endpoints
│   │   └── templates.py  # Template management endpoints
│   ├── core/             # Core functionality
│   │   ├── config.py     # Configuration management
│   │   ├── database.py   # Database connection
│   │   └── security.py   # Security utilities
│   ├── models/           # Pydantic models
│   │   ├── user.py       # User data models
│   │   ├── session.py    # Session data models
│   │   └── template.py   # Template data models
│   ├── schemas/          # API request/response schemas
│   │   ├── auth.py       # Authentication schemas
│   │   └── template.py   # Template schemas
│   ├── services/         # Business logic
│   │   ├── auth_service.py     # Authentication service
│   │   └── template_service.py # Template service
│   └── main.py           # FastAPI application
├── uploads/              # File upload directory
├── venv/                 # Virtual environment
├── .env.example          # Environment template
├── requirements.txt      # Python dependencies
├── test_auth.py         # Authentication test suite
└── README.md            # This file
```

## 🔒 Security Features

### JWT Implementation
- **Access tokens**: Short-lived (30 minutes)
- **Refresh tokens**: Long-lived (7 days)
- **HTTP-only cookies**: Enhanced security
- **Role-based claims**: User role in token payload

### Password Security
- **bcrypt hashing**: Industry-standard password hashing
- **Salt rounds**: Automatic salt generation
- **Password validation**: Minimum 8 characters

### Session Management
- **Device tracking**: Browser and OS detection
- **IP address logging**: Request origin tracking
- **Multi-device support**: Multiple concurrent sessions
- **Session invalidation**: Logout from specific devices

## 🚨 Common Issues & Solutions

### 1. Import Errors
```bash
ModuleNotFoundError: No module named 'fastapi'
```
**Solution**: Activate virtual environment
```bash
source venv/bin/activate
```

### 2. Database Connection
```bash
ServerSelectionTimeoutError: Failed to connect to MongoDB
```
**Solution**: Check MongoDB is running and MONGODB_URL is correct

### 3. JWT Errors
```bash
Invalid token
```
**Solution**: Ensure JWT_SECRET_KEY and JWT_REFRESH_SECRET_KEY are set

### 4. Email Issues
```bash
Email sending failed
```
**Solution**: Configure email settings or disable email verification for development

## 🛠 Development

### Adding New Authentication Features

1. **New endpoint**: Add to `app/api/auth.py`
2. **New schema**: Add to `app/schemas/auth.py`
3. **Business logic**: Add to `app/services/auth_service.py`
4. **Database model**: Add to `app/models/user.py`

### Database Collections

- **users**: User accounts and authentication data
- **user_sessions**: Active user sessions with device info
- **auth_tokens**: JWT tokens and expiration tracking
- **templates**: Template metadata and file references

## 🚀 Deployment

### Production Checklist

- [ ] Set secure JWT secrets (32+ random characters)
- [ ] Configure production MongoDB (Atlas recommended)
- [ ] Set up email service (SendGrid, SES, etc.)
- [ ] Enable HTTPS and secure cookies
- [ ] Set CORS origins to production domains
- [ ] Configure reverse proxy (nginx)
- [ ] Set up monitoring and logging
- [ ] Implement rate limiting
- [ ] Enable database backups

### Docker Deployment

```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY app/ ./app/
EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## 📚 API Documentation

Once the server is running, comprehensive API documentation is available at:
- **Interactive docs**: http://localhost:8000/docs
- **Alternative docs**: http://localhost:8000/redoc

These provide:
- Complete endpoint documentation
- Request/response schemas
- Authentication examples
- Try-it-now functionality

## 🤝 Contributing

1. Follow existing code patterns
2. Add tests for new features
3. Update documentation
4. Ensure type hints are present
5. Run authentication tests before submitting

## 📄 License

This project is part of the Templater application suite.