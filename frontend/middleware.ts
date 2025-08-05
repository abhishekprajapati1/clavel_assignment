import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Handle API proxying to backend
  if (pathname.startsWith("/api")) {
    const backendUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const apiPath = pathname.replace("/api", "/api");
    const url = new URL(apiPath, backendUrl);

    // Copy search params
    request.nextUrl.searchParams.forEach((value, key) => {
      url.searchParams.set(key, value);
    });

    return NextResponse.rewrite(url);
  }

  // Public routes that don't require authentication
  const publicRoutes = [
    "/",
    "/signin",
    "/signup",
    "/verify-email",
    "/forgot-password",
    "/reset-password",
    "/resend-verification",
  ];

  // Check if the current path is a public route
  const isPublicRoute = publicRoutes.some((route) => {
    if (route === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(route + "/") || pathname === route;
  });

  // Get the access token from cookies
  const accessToken = request.cookies.get("access_token")?.value;

  // If accessing a protected route without authentication, redirect to signin
  if (!isPublicRoute && !accessToken) {
    const signInUrl = new URL("/signin", request.url);
    signInUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(signInUrl);
  }
  // If accessing auth pages while already authenticated, redirect to dashboard
  if (
    accessToken &&
    (pathname.startsWith("/signin") || pathname.startsWith("/signup"))
  ) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Admin route protection
  if (pathname.startsWith("/admin")) {
    // For admin routes, we'll let the page handle the role check
    // since we need to fetch user data to check the role
    if (!accessToken) {
      return NextResponse.redirect(new URL("/signin", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
