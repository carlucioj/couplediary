import { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
  unauthorizedResponse,
  notFoundResponse,
  serverErrorResponse,
  requireAuth,
  validateBody,
  checkRateLimit,
  addSecurityHeaders,
} from "@/lib/api/utils"
import { updateProfileSchema } from "@/lib/validations/auth"

// GET /api/profile - Get current user's profile
export async function GET() {
  try {
    const { user, error } = await requireAuth()

    if (error || !user) {
      return unauthorizedResponse()
    }

    // Rate limiting
    if (!checkRateLimit(`profile-get-${user.id}`, 100)) {
      return errorResponse("Muitas requisicoes. Tente novamente em alguns minutos.", 429)
    }

    const supabase = await createClient()

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    if (profileError || !profile) {
      return notFoundResponse("Perfil")
    }

    const response = successResponse({
      ...profile,
      email: user.email,
    })
    return addSecurityHeaders(response)
  } catch (err) {
    console.error("[Profile API] Get error:", err)
    return serverErrorResponse()
  }
}

// PATCH /api/profile - Update current user's profile
export async function PATCH(request: NextRequest) {
  try {
    const { user, error } = await requireAuth()

    if (error || !user) {
      return unauthorizedResponse()
    }

    // Rate limiting
    if (!checkRateLimit(`profile-update-${user.id}`, 20)) {
      return errorResponse("Muitas requisicoes. Tente novamente em alguns minutos.", 429)
    }

    const body = await request.json()
    const validation = validateBody(updateProfileSchema, body)

    if (!validation.success) {
      return validationErrorResponse(validation.error)
    }

    const supabase = await createClient()

    // Build update object
    const updateData: Record<string, unknown> = {}
    if (validation.data.displayName !== undefined) {
      updateData.display_name = validation.data.displayName
    }
    if (validation.data.avatarUrl !== undefined) {
      updateData.avatar_url = validation.data.avatarUrl || null
    }

    const { data: profile, error: updateError } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", user.id)
      .select()
      .single()

    if (updateError) {
      console.error("[Profile API] Update error:", updateError)
      return serverErrorResponse()
    }

    const response = successResponse({
      ...profile,
      email: user.email,
    })
    return addSecurityHeaders(response)
  } catch (err) {
    console.error("[Profile API] Update error:", err)
    return serverErrorResponse()
  }
}
