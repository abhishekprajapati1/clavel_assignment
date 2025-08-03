# Quick Start Guide

## Prerequisites

- Python 3.8+
- Node.js 18+
- MongoDB (local or cloud instance)
- Git

## Quick Setup

1. **Clone and setup the project:**
   ```bash
   git clone <your-repo-url>
   cd templater
   ```

   **Backend Setup**
   ```bash
   cd backend
   cp .env.example .env # copy .env.example to .env and update your environment variables
   python -m venv venv # create virtual environment
   source venv/bin/activate
   pip install --upgrade pip # upgrade pip
   pip install -r requirements.txt # install dependencies
   uvicorn app.main:app --reload # starts the backend server at port 8000
   ```
   **Frontend Setup**
   ```bash
   cd frontend
   npm install # install dependencies
   npm run dev # starts the frontend server in development mode at port 3000
   # to start in production first stop development server then run
   npm run build # build production assets
   npm run start # start production server
   ```

2. **Access the Application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

## First Steps

1. **Create an Admin Account:**
   - Go to http://localhost:3000/auth/signup
   - Create an account with any email
   - Check the console for verification email (in development mode)

2. **Verify Email:**
   - The verification link will be printed in the backend console
   - Copy and paste it in your browser

3. **Sign In:**
   - Go to http://localhost:3000/auth/signin
   - Sign in with your credentials

4. **Access Admin Panel:**
   - You'll be redirected to the admin dashboard
   - Upload some templates

5. **Test User Experience:**
   - Create a regular user account
   - Sign in and view templates
   - Test screenshot protection (try right-click, F12, etc.)

## Testing Screenshot Protection

The screenshot protection can be tested by:

1. **Right-click** on protected content
2. **Press F12** to open developer tools
3. **Press Ctrl+Shift+I** to open developer tools
4. **Press PrintScreen** key
5. **Try to drag** images
6. **Try to select** text

All these actions will trigger the payment redirect.

## Environment Configuration

### Backend (.env)
```env
MONGODB_URL=your_mongodb_url
JWT_SECRET_KEY=your-super-secret-jwt-key
JWT_REFRESH_SECRET_KEY=your-super-secret-refresh-key
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key
```

## Features Overview

### Authentication
- ✅ JWT-based authentication with refresh tokens
- ✅ Email verification system
- ✅ Password reset functionality
- ✅ Session management with device tracking
- ✅ Role-based access control (admin/user)

### Admin Features
- ✅ Template upload with image processing
- ✅ Template management (list, delete)
- ✅ Admin-only access control

### User Features
- ✅ View admin-uploaded templates
- ✅ Screenshot protection with payment redirect
- ✅ Session management

### Security Features
- ✅ HTTP-only cookies for JWT storage
- ✅ Route protection middleware
- ✅ Screenshot attempt detection
- ✅ Right-click and developer tools blocking

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error:**
   - Ensure MongoDB is running
   - Check the MONGODB_URL in backend/.env

2. **Port Already in Use:**
   - Change the port in the uvicorn command
   - Update FRONTEND_URL in backend/.env accordingly

3. **Email Not Sending:**
   - In development, emails are printed to console
   - Configure SMTP settings for production

4. **CORS Errors:**
   - Ensure FRONTEND_URL is correctly set in backend/.env
   - Check that the frontend is running on the expected port

### Development Tips

- Use the API documentation at http://localhost:8000/docs for testing endpoints
- Check browser console and backend logs for errors
- The application uses feature-centric architecture for better maintainability
