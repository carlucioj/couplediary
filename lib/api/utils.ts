import { NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

// ============================================================================
// API RESPONSE HELPERS
// ============================================================================

export type ApiResponse<T = unknown> = {
  success: boolean
  data?: T
  error?: string
  errors?: Record<string, string>
}

export function successResponse<T>(data: T, status = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ success: true, data }, { status })
}

export function errorResponse(
  error: string,
  status = 400,
  errors?: Record<string, string>
): NextResponse<ApiResponse> {
  return NextResponse.json({ success: false, error, errors }, { status })
}

export function validationErrorResponse(zodError: z.ZodError): NextResponse<ApiResponse> {
  const errors: Record<string, string> = {}
  zodError.errors.forEach((err) => {
    if (err.path.length > 0) {
      errors[err.path.join(".")] = err.message
    }
  })
  return errorResponse("Dados invalidos", 400, errors)
}

export function unauthorizedResponse(): NextResponse<ApiResponse> {
  return errorResponse("Nao autorizado", 401)
}

export function forbiddenResponse(): NextResponse<ApiResponse> {
  return errorResponse("Acesso negado", 403)
}

export function notFoundResponse(resource = "Recurso"): NextResponse<ApiResponse> {
  return errorResponse(`${resource} nao encontrado`, 404)
}

export function serverErrorResponse(): NextResponse<ApiResponse> {
  return errorResponse("Erro interno do servidor", 500)
}

// ============================================================================
// AUTHENTICATION HELPERS
// ============================================================================

export async function requireAuth() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return { user: null, error: "Nao autenticado" }
  }

  return { user, error: null }
}

export async function requireCoupleAccess() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { user: null, profile: null, coupleId: null, error: "Nao autenticado" }
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("couple_id, display_name")
    .eq("id", user.id)
    .single()

  if (profileError || !profile) {
    return { user, profile: null, coupleId: null, error: "Perfil nao encontrado" }
  }

  if (!profile.couple_id) {
    return { user, profile, coupleId: null, error: "Usuario nao pertence a um casal" }
  }

  return { user, profile, coupleId: profile.couple_id, error: null }
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

export function validateBody<T extends z.ZodSchema>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return { success: false, error: result.error }
}

export function validateParams<T extends z.ZodSchema>(
  schema: T,
  params: Record<string, string | string[] | undefined>
): { success: true; data: z.infer<T> } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(params)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return { success: false, error: result.error }
}

export function parseSearchParams(searchParams: URLSearchParams): Record<string, string> {
  const params: Record<string, string> = {}
  searchParams.forEach((value, key) => {
    params[key] = value
  })
  return params
}

// ============================================================================
// RATE LIMITING (simple in-memory)
// ============================================================================

const rateLimitMap = new Map<string, { count: number; firstAttempt: number }>()

export function checkRateLimit(
  identifier: string,
  maxAttempts = 60,
  windowMs = 60 * 1000 // 1 minute
): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(identifier)

  if (!record) {
    rateLimitMap.set(identifier, { count: 1, firstAttempt: now })
    return true
  }

  if (now - record.firstAttempt > windowMs) {
    rateLimitMap.set(identifier, { count: 1, firstAttempt: now })
    return true
  }

  record.count++
  return record.count <= maxAttempts
}

// Clean up old rate limit entries periodically
setInterval(() => {
  const now = Date.now()
  rateLimitMap.forEach((value, key) => {
    if (now - value.firstAttempt > 60 * 60 * 1000) { // 1 hour
      rateLimitMap.delete(key)
    }
  })
}, 5 * 60 * 1000) // Every 5 minutes

// ============================================================================
// SECURITY HEADERS
// ============================================================================

export function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-XSS-Protection", "1; mode=block")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  return response
}
