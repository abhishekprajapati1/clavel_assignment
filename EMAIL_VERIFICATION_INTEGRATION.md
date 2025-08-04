# Email Verification Feature Integration Guide

This guide provides step-by-step instructions for integrating the comprehensive email verification feature into your templater application.

## 🚀 Quick Start

### 1. Backend Integration

Ensure your FastAPI backend has the following endpoints working:

```python
# Required endpoints (already implemented in your backend)
POST /api/auth/verify-email       # Verify email with token
POST /api/auth/resend-verification # Resend verification email
```

### 2. Frontend Setup

The email verification feature is already implemented. Here's how to use it:

#### A. Direct URL Access
```
http://localhost:3000/verify-email?token=your_jwt_token_here
```

#### B. Programmatic Navigation
```tsx
import { useRouter } from 'next/navigation'

const router = useRouter()
router.push(`/verify-email?token=${token}`)
```

### 3. Add Toast Provider (Optional but Recommended)

Update your main layout to include global toast notifications:

```tsx
// app/layout.tsx
import { ToastProvider } from '@/components/providers/ToastProvider'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <ToastProvider position="top-right">
          {children}
        </ToastProvider>
      </body>
    </html>
  )
}
```

## 📋 Integration Checklist

### Backend Verification
- [ ] Verify `/api/auth/verify-email` endpoint is working
- [ ] Verify `/api/auth/resend-verification` endpoint is working  
- [ ] Test with valid, invalid, and expired tokens
- [ ] Check CORS configuration allows frontend requests

### Frontend Verification
- [ ] Navigate to `/verify-email` page loads correctly
- [ ] Test with sample JWT token
- [ ] Verify resend functionality works
- [ ] Check responsive design on mobile devices
- [ ] Test error states and loading states

### User Experience Testing
- [ ] Sign up flow redirects to email verification
- [ ] Email contains correct verification link
- [ ] Successful verification redirects to sign-in
- [ ] Failed verification shows helpful error messages
- [ ] Resend email functionality works properly

## 🔧 API Integration

### Verify Email
```tsx
import { authApi } from '@/features/auth/api'

try {
  const result = await authApi.verifyEmail(token)
  console.log(result.message) // "Email verified successfully"
} catch (error) {
  console.error('Verification failed:', error.response?.data?.detail)
}
```

### Resend Verification
```tsx
import { authApi } from '@/features/auth/api'

try {
  const result = await authApi.resendVerification('user@example.com')
  console.log(result.message) // "Verification email sent successfully"
} catch (error) {
  console.error('Resend failed:', error.response?.data?.detail)
}
```

## 🎨 Component Usage

### Email Verification Status
```tsx
import { EmailVerificationStatus } from '@/features/auth/components'

<EmailVerificationStatus
  status="success"
  message="Your email has been verified!"
  email="user@example.com"
  onResendVerification={() => handleResend()}
/>
```

### Resend Verification Form
```tsx
import { ResendVerificationForm } from '@/features/auth/components'

<ResendVerificationForm
  initialEmail="user@example.com"
  onSuccess={(email) => console.log('Sent to:', email)}
  showCancel={true}
/>
```

### Using Hooks
```tsx
import { useEmailVerification } from '@/features/auth/hooks/useEmailVerification'

function MyComponent() {
  const { verifyEmail, isLoading, isSuccess, error } = useEmailVerification()
  
  const handleVerify = async (token: string) => {
    try {
      await verifyEmail(token)
      // Handle success
    } catch (error) {
      // Handle error
    }
  }
}
```

## 🔐 Security Considerations

### Token Validation
```tsx
import { validateEmailVerificationToken } from '@/features/auth/utils/jwt'

const validation = validateEmailVerificationToken(token)
if (!validation.isValid) {
  // Handle invalid token
  console.error(validation.error)
}
```

### Client-Side Token Parsing
```tsx
import { extractEmailFromToken, isTokenExpired } from '@/features/auth/utils/jwt'

// Safe client-side parsing (for display only)
const email = extractEmailFromToken(token)
const expired = isTokenExpired(token)

// ⚠️ Never trust client-side parsing for authentication
// Always validate tokens server-side
```

## 🎯 User Flow Integration

### 1. Sign-Up Flow
```tsx
// pages/auth/signup.tsx
const handleSignUp = async (formData) => {
  try {
    await authApi.signUp(formData)
    
    // Redirect to check email page
    router.push('/check-email?email=' + encodeURIComponent(formData.email))
  } catch (error) {
    // Handle signup error
  }
}
```

### 2. Check Email Page
```tsx
// pages/check-email.tsx
'use client'

import { useSearchParams } from 'next/navigation'
import { ResendVerificationForm } from '@/features/auth/components'

export default function CheckEmailPage() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''

  return (
    <div className="max-w-md mx-auto mt-8">
      <h1>Check Your Email</h1>
      <p>We've sent a verification link to {email}</p>
      
      <div className="mt-6">
        <ResendVerificationForm
          initialEmail={email}
          onSuccess={() => {
            // Show success message
          }}
        />
      </div>
    </div>
  )
}
```

### 3. Navigation Links
```tsx
// In your navigation component
<a href="/resend-verification">
  Resend Verification Email
</a>
```

## 🧪 Testing Integration

### Test Page Usage
Visit the test page to verify all components work:
```
http://localhost:3000/test-verification
```

### Manual Testing Scenarios

1. **Complete Flow Test**
   - Sign up with new email
   - Check email for verification link
   - Click verification link
   - Verify success state and redirect

2. **Error Handling Test**
   - Use expired token: `/verify-email?token=expired_token`
   - Use invalid token: `/verify-email?token=invalid`
   - Test network disconnection during verification

3. **Resend Functionality Test**
   - Go to `/resend-verification`
   - Enter email address
   - Verify email is sent and received

### Automated Testing
```tsx
// __tests__/email-verification.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import { EmailVerificationStatus } from '@/features/auth/components'

test('displays success state correctly', () => {
  render(
    <EmailVerificationStatus
      status="success"
      message="Email verified successfully"
    />
  )
  
  expect(screen.getByText('Email verified successfully')).toBeInTheDocument()
  expect(screen.getByText('Sign In to Your Account')).toBeInTheDocument()
})
```

## 🎨 Customization Options

### Styling Customization
```tsx
// Custom CSS classes
<EmailVerificationStatus
  className="my-custom-styles"
  // ... other props
/>
```

### Toast Positioning
```tsx
<ToastProvider position="bottom-right">
  {children}
</ToastProvider>
```

### Custom Error Messages
```tsx
const customErrorMap = {
  'token-expired': 'Your verification link has expired. Please request a new one.',
  'token-invalid': 'This verification link is not valid.',
  'email-already-verified': 'This email has already been verified.',
}
```

## 🔍 Troubleshooting

### Common Issues

1. **Token Not Found in URL**
   - Check URL format: `/verify-email?token=...`
   - Verify Next.js routing is configured correctly

2. **API Errors**
   - Check network tab for failed requests
   - Verify CORS configuration
   - Check API endpoint URLs in environment variables

3. **Component Not Rendering**
   - Verify all dependencies are installed
   - Check for JavaScript errors in console
   - Ensure components are imported correctly

4. **Styling Issues**
   - Verify Tailwind CSS is configured
   - Check for CSS conflicts
   - Ensure UI component library is set up

### Debug Mode
```tsx
// Enable debug logging in development
import { debugToken } from '@/features/auth/utils/jwt'

if (process.env.NODE_ENV === 'development') {
  debugToken(token) // Logs detailed token info to console
}
```

### Error Boundary Testing
```tsx
// Test error boundary
throw new Error('Test error boundary')
```

## 📱 Mobile Considerations

### Responsive Design
- All components are mobile-responsive
- Touch-friendly button sizes
- Readable text on small screens

### Deep Linking
```tsx
// Handle app deep links
useEffect(() => {
  const url = window.location.href
  if (url.includes('verify-email')) {
    // Handle verification from mobile app
  }
}, [])
```

## 🚀 Production Deployment

### Environment Variables
```env
NEXT_PUBLIC_API_URL=https://your-api-domain.com
NODE_ENV=production
```

### Performance Optimization
- Components are code-split automatically
- JWT parsing is optimized
- Toast animations use CSS transforms

### Monitoring
```tsx
// Add analytics tracking
const trackVerificationSuccess = () => {
  analytics.track('email_verification_success')
}

const trackVerificationFailure = (error: string) => {
  analytics.track('email_verification_failure', { error })
}
```

## 🤝 Support

### Documentation
- Full feature documentation: `/features/auth/EMAIL_VERIFICATION_README.md`
- Component API reference included in code comments
- JWT utilities documentation in `/features/auth/utils/jwt.ts`

### Testing
- Test all components at `/test-verification`
- Run integration tests before deployment
- Monitor verification success rates in production

### Maintenance
- Regularly test email delivery
- Monitor for new error patterns
- Update error messages based on user feedback

---

This integration guide ensures your email verification feature works seamlessly with your application. The feature is designed to be robust, user-friendly, and maintainable.