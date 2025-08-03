import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/auth/signin', '/auth/signup', '/auth/verify-email', '/auth/forgot-password', '/auth/reset-password']
  
  // Check if the current path is a public route
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

  // Get the access token from cookies
  const accessToken = request.cookies.get('access_token')?.value

  // If accessing a protected route without authentication, redirect to signin
  if (!isPublicRoute && !accessToken) {
    const signInUrl = new URL('/auth/signin', request.url)
    signInUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(signInUrl)
  }

  // If accessing auth pages while already authenticated, redirect to dashboard
  if (accessToken && (pathname.startsWith('/auth/signin') || pathname.startsWith('/auth/signup'))) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Admin route protection
  if (pathname.startsWith('/admin')) {
    // For admin routes, we'll let the page handle the role check
    // since we need to fetch user data to check the role
    if (!accessToken) {
      return NextResponse.redirect(new URL('/auth/signin', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
} 