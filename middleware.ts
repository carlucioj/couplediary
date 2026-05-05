import { type NextRequest, NextResponse } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"

// Routes that require authentication
const protectedRoutes = ["/dashboard", "/diary", "/memories", "/settings", "/couple"]

// Routes that should redirect to dashboard if authenticated
const authRoutes = ["/auth/login", "/auth/sign-up", "/auth/forgot-password"]

// Public routes (no authentication check)
const publicRoutes = ["/", "/auth/callback", "/auth/error", "/auth/sign-up-success", "/auth/reset-password"]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Add security headers to all responses
  const response = await updateSession(request)
  
  // Security headers
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-XSS-Protection", "1; mode=block")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co wss://*.supabase.co"
  )
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")

  // Skip middleware for static files and API routes (API has its own auth)
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".") // Static files
  ) {
    return response
  }

  // Check if route is public
  const isPublicRoute = publicRoutes.some((route) => pathname === route || pathname.startsWith(route + "/"))
  if (isPublicRoute) {
    return response
  }

  // Check authentication status from response headers/cookies
  // The updateSession function handles session refresh
  const supabaseAuthToken = request.cookies.get("sb-access-token") || 
                           request.cookies.getAll().find(c => c.name.includes("auth-token"))
  
  const isAuthenticated = !!supabaseAuthToken

  // Redirect authenticated users away from auth pages
  const isAuthRoute = authRoutes.some((route) => pathname === route || pathname.startsWith(route + "/"))
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  // Redirect unauthenticated users to login for protected routes
  const isProtectedRoute = protectedRoutes.some((route) => pathname === route || pathname.startsWith(route + "/"))
  if (isProtectedRoute && !isAuthenticated) {
    const redirectUrl = new URL("/auth/login", request.url)
    redirectUrl.searchParams.set("next", pathname)
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
