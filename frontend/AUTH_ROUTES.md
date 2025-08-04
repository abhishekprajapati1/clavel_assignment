# Auth Route Structure Documentation

This document outlines the new authentication route structure using Next.js 13+ route groups.

## 📁 Route Group Structure

All authentication-related routes are now organized under the `(auth)` route group:

```
app/
├── (auth)/
│   ├── layout.tsx                 # Auth-specific layout
│   ├── signin/
│   │   └── page.tsx              # /signin
│   ├── signup/
│   │   └── page.tsx              # /signup
│   ├── verify-email/
│   │   └── page.tsx              # /verify-email
│   ├── resend-verification/
│   │   └── page.tsx              # /resend-verification
│   ├── forgot-password/
│   │   └── page.tsx              # /forgot-password
│   └── reset-password/
│       └── page.tsx              # /reset-password
├── dashboard/
│   └── page.tsx                  # /dashboard (protected)
├── admin/
│   └── page.tsx                  # /admin (admin only)
└── page.tsx                      # / (home)
```

## 🌐 Available Routes

### Public Auth Routes
- `/signin` - User sign in page
- `/signup` - User registration page
- `/verify-email?token=...` - Email verification with JWT token
- `/resend-verification` - Resend verification email
- `/forgot-password` - Request password reset
- `/reset-password?token=...` - Reset password with JWT token

### Protected Routes
- `/dashboard` - User dashboard (requires authentication)
- `/admin` - Admin panel (requires admin role)

### Public Routes
- `/` - Home page

## 🔒 Route Protection

### Middleware Configuration
The middleware (`middleware.ts`) handles route protection:

```typescript
const publicRoutes = [
  "/",
  "/signin",
  "/signup", 
  "/verify-email",
  "/forgot-password",
  "/reset-password",
  "/resend-verification",
];
```

### Protection Rules
1. **Unauthenticated users** accessing protected routes → redirect to `/signin`
2. **Authenticated users** accessing `/signin` or `/signup` → redirect to `/dashboard`
3. **Non-admin users** accessing `/admin` → handled by page-level role check

## 🎨 Layout Inheritance

### Auth Layout
All routes under `(auth)` inherit from `app/(auth)/layout.tsx`:
- Consistent gradient background
- Centered layout for auth forms
- Responsive design

### Root Layout
All routes inherit from `app/layout.tsx`:
- Global styles and providers
- Toast notifications (if ToastProvider is added)
- Metadata configuration

## 📝 Route Examples

### Email Verification Flow
```
1. User signs up → receives email
2. Email contains: https://app.com/verify-email?token=eyJhbGciOiJIUzI1NiIs...
3. User clicks link → `/verify-email` page handles verification
4. Success → redirect to `/signin`
5. Failure → show resend option
```

### Password Reset Flow
```
1. User visits `/forgot-password`
2. Enters email → receives reset email
3. Email contains: https://app.com/reset-password?token=eyJhbGciOiJIUzI1NiIs...
4. User clicks link → `/reset-password` page handles reset
5. Success → redirect to `/signin`
```

## 🔄 Navigation Links

### Updated Link References
All internal navigation now uses the new route structure:

```tsx
// ✅ Correct
<Link href="/signin">Sign In</Link>
<Link href="/signup">Sign Up</Link>
<Link href="/forgot-password">Forgot Password</Link>

// ❌ Old (removed)
<Link href="/auth/signin">Sign In</Link>
<Link href="/auth/signup">Sign Up</Link>
```

### Programmatic Navigation
```tsx
// Redirect examples
window.location.href = "/signin"
router.push("/verify-email?token=" + token)
router.push("/reset-password?token=" + resetToken)
```

## 🛠 Component Updates

### Updated Components
All auth components have been updated to use new routes:
- `EmailVerificationStatus` → redirects to `/signin`
- `ResendVerificationForm` → redirects to `/signin`
- `VerificationToast` → links to `/signin`
- Auth API interceptors → redirect to `/signin`

### Route Group Benefits
1. **Clean URLs** - No `/auth` prefix needed
2. **Shared Layout** - Consistent styling for all auth pages
3. **Better Organization** - Logical grouping of related routes
4. **Easier Maintenance** - Centralized auth route management

## 📱 SEO and Metadata

Each auth page can define its own metadata:

```tsx
// Example: app/(auth)/signin/page.tsx
export const metadata = {
  title: 'Sign In | Your App',
  description: 'Sign in to your account',
}
```

## 🧪 Testing Routes

### Manual Testing Checklist
- [ ] `/signin` loads correctly
- [ ] `/signup` loads correctly  
- [ ] `/verify-email?token=sample` handles token validation
- [ ] `/forgot-password` sends reset emails
- [ ] `/reset-password?token=sample` handles password reset
- [ ] `/resend-verification` resends verification emails
- [ ] Protected routes redirect unauthenticated users
- [ ] Authenticated users can't access signin/signup

### Route Testing Commands
```bash
# Test route accessibility
curl -I http://localhost:3000/signin
curl -I http://localhost:3000/verify-email?token=test
curl -I http://localhost:3000/dashboard

# Test with authentication
curl -H "Cookie: access_token=valid_token" http://localhost:3000/dashboard
```

## 🚀 Migration Summary

### What Changed
- ✅ Moved `/auth/signin` → `/signin`
- ✅ Moved `/auth/signup` → `/signup`
- ✅ Created `/verify-email` (was outside auth)
- ✅ Created `/forgot-password` (new)
- ✅ Created `/reset-password` (new)
- ✅ Created `/resend-verification` (was outside auth)
- ✅ Updated all component links and redirects
- ✅ Updated middleware route protection
- ✅ Added auth-specific layout

### Benefits Achieved
- 🎯 **Cleaner URLs** - More intuitive and SEO-friendly
- 🎨 **Consistent Styling** - Shared layout for all auth pages
- 🔒 **Better Security** - Centralized route protection
- 📱 **Better UX** - Logical flow between auth pages
- 🛠 **Easier Maintenance** - Organized codebase structure

This new route structure provides a more professional and maintainable authentication system while following Next.js 13+ best practices.