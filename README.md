# Full-Stack Web Application

A comprehensive full-stack web application built with Next.js (frontend) and FastAPI (backend) featuring authentication, role-based access control, and template management.

## 🏗️ Architecture

### Frontend
- **Next.js 14** with App Router and TypeScript
- **Tailwind CSS** for styling
- **Shadcn UI** components
- **React Hook Form + Zod** for form validation
- **TanStack React Query v5** for API state management
- **Feature-centric folder structure** for better organization

### Backend
- **FastAPI** with Pydantic models
- **MongoDB** with Motor (async driver)
- **JWT authentication** with refresh tokens
- **Role-based access control** (admin, user)

## 🚀 Features

### Authentication
- JWT-based authentication with refresh tokens
- Role-based routing (admin/user)
- Session management with device tracking
- Email verification system
- Password reset functionality

### Admin Features
- Template upload (image, title, description)
- Template management (list, delete)
- Role and permission management
- Session monitoring

### User Features
- View admin-uploaded templates
- Screenshot protection with payment redirect
- Session management

### Security Features
- HTTP-only cookies for JWT storage
- Route protection middleware
- Screenshot attempt detection
- Right-click and developer tools blocking

## 📁 Project Structure

```
templater/
├── frontend/                 # Next.js application
│   ├── app/                 # App Router pages
│   ├── features/            # Feature-centric modules
│   │   ├── auth/           # Authentication feature
│   │   ├── admin/          # Admin features
│   │   ├── user/           # User features
│   │   └── shared/         # Shared components/utilities
│   ├── lib/                # Utility libraries
│   └── types/              # Global TypeScript types
├── backend/                 # FastAPI application
│   ├── app/
│   │   ├── api/            # API routes
│   │   ├── core/           # Core configurations
│   │   ├── models/         # Database models
│   │   ├── schemas/        # Pydantic schemas
│   │   └── services/       # Business logic
│   └── requirements.txt    # Python dependencies
└── README.md              # This file
```

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- Python 3.8+
- MongoDB instance
- Git

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set environment variables:**
   Create a `.env` file in the backend directory:
   ```env
   MONGODB_URL=your-mongodb-url
   JWT_SECRET_KEY=your-super-secret-jwt-key
   JWT_REFRESH_SECRET_KEY=your-super-secret-refresh-key
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password
   FRONTEND_URL=http://localhost:3000
   ```

5. **Run the backend:**
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set environment variables:**
   Create a `.env.local` file in the frontend directory:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

4. **Run the frontend:**
   ```bash
   npm run dev
   ```

## 🧪 Testing Screenshot Protection

The screenshot protection feature can be tested in several ways:

1. **Print Screen Key:** Press `PrtScn` or `Fn + PrtScn`
2. **Snipping Tool:** Try to use Windows Snipping Tool or similar
3. **Browser Developer Tools:** Press `F12` or `Ctrl+Shift+I`
4. **Right-click:** Right-click on protected content

When any of these actions are detected, the user will be redirected to the payment page.

## 🔐 Authentication Flow

1. User signs up with email
2. Email verification required
3. User signs in and receives JWT tokens
4. Tokens stored in HTTP-only cookies
5. Refresh token mechanism for seamless experience
6. Session tracking with device information

## 🎯 API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/signin` - User login
- `POST /api/auth/verify-email` - Email verification
- `POST /api/auth/forgot` - Password reset request
- `POST /api/auth/reset-password` - Password reset
- `GET /api/auth/details` - Get user details
- `POST /api/auth/refresh-token` - Refresh JWT token
- `POST /api/auth/logout` - Logout
- `GET /api/auth/sessions` - List user sessions
- `DELETE /api/auth/sessions` - Logout from all devices
- `DELETE /api/auth/sessions/{sessionId}` - Logout specific session
- `GET /api/auth/sessions/stats` - Session statistics

### Templates
- `GET /api/templates` - Get all templates (public)
- `POST /api/templates` - Upload template (admin only)
- `DELETE /api/templates/{id}` - Delete template (admin only)

## 🚀 Deployment

### Backend Deployment
- Deploy to platforms like Railway, Render, or Heroku
- Set environment variables in deployment platform
- Ensure MongoDB connection string is properly configured

### Frontend Deployment
- Deploy to Vercel, Netlify, or similar platforms
- Set environment variables for API URL
- Configure CORS settings in backend for production domain

## 📝 Notes

- The application uses feature-centric architecture for better maintainability
- JWT tokens are stored in HTTP-only cookies for security
- Session management includes device tracking
- Screenshot protection is implemented using multiple detection methods
- Role-based access control is enforced at both frontend and backend levels
- But still we cannot prevent all forms of screen capture or image manipulation.

## 🔧 Development

- Backend runs on `http://localhost:8000`
- Frontend runs on `http://localhost:3000`
- MongoDB should be running locally or use a cloud instance
- API documentation available at `http://localhost:8000/docs` when backend is running