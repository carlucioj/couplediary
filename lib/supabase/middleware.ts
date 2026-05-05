import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/lib/supabase/types'

/**
 * Supabase middleware for session management
 * 
 * Security features:
 * - Refreshes auth tokens automatically
 * - Protects routes from unauthorized access
 * - Validates session on every request
 * - Implements secure redirect patterns
 */

// Routes that require authentication
const PROTECTED_ROUTES = [
  '/dashboard',
  '/diary',
  '/couple',
  '/settings',
  '/api/diary',
  '/api/couple',
  '/api/memories',
]

// Routes that should redirect to dashboard if authenticated
const AUTH_ROUTES = ['/auth/login', '/auth/sign-up']

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // IMPORTANT: Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Check if route is protected
  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  )

  // Check if route is an auth route
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route))

  // Redirect unauthenticated users from protected routes
  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    url.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users from auth routes to dashboard
  if (isAuthRoute && user) {
    const url = request.nextUrl.clone()
    const redirectTo = request.nextUrl.searchParams.get('redirectTo') || '/dashboard'
    url.pathname = redirectTo
    return NextResponse.redirect(url)
  }

  // Add security headers
  supabaseResponse.headers.set('X-Content-Type-Options', 'nosniff')
  supabaseResponse.headers.set('X-Frame-Options', 'DENY')
  supabaseResponse.headers.set('X-XSS-Protection', '1; mode=block')
  supabaseResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  return supabaseResponse
}
