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
import { createCoupleSchema, updateCoupleSchema, joinCoupleSchema } from "@/lib/validations/data"

// GET /api/couple - Get current user's couple
export async function GET() {
  try {
    const { user, error } = await requireAuth()

    if (error || !user) {
      return unauthorizedResponse()
    }

    // Rate limiting
    if (!checkRateLimit(`couple-get-${user.id}`, 100)) {
      return errorResponse("Muitas requisicoes. Tente novamente em alguns minutos.", 429)
    }

    const supabase = await createClient()

    // Get user's profile with couple info
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("couple_id")
      .eq("id", user.id)
      .single()

    if (profileError || !profile) {
      return notFoundResponse("Perfil")
    }

    if (!profile.couple_id) {
      return successResponse({ couple: null, partner: null })
    }

    // Get couple details
    const { data: couple, error: coupleError } = await supabase
      .from("couples")
      .select("*")
      .eq("id", profile.couple_id)
      .single()

    if (coupleError || !couple) {
      return notFoundResponse("Casal")
    }

    // Get partner info
    const { data: partner } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url, email")
      .eq("couple_id", profile.couple_id)
      .neq("id", user.id)
      .single()

    const response = successResponse({ couple, partner: partner || null })
    return addSecurityHeaders(response)
  } catch (err) {
    console.error("[Couple API] Get error:", err)
    return serverErrorResponse()
  }
}

// POST /api/couple - Create a new couple
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireAuth()

    if (error || !user) {
      return unauthorizedResponse()
    }

    // Rate limiting
    if (!checkRateLimit(`couple-create-${user.id}`, 10)) {
      return errorResponse("Muitas requisicoes. Tente novamente em alguns minutos.", 429)
    }

    const body = await request.json()
    const validation = validateBody(createCoupleSchema, body)

    if (!validation.success) {
      return validationErrorResponse(validation.error)
    }

    const supabase = await createClient()

    // Check if user already has a couple
    const { data: profile } = await supabase
      .from("profiles")
      .select("couple_id")
      .eq("id", user.id)
      .single()

    if (profile?.couple_id) {
      return errorResponse("Voce ja pertence a um casal", 400)
    }

    // Create couple
    const { data: couple, error: createError } = await supabase
      .from("couples")
      .insert({
        name: validation.data.name,
        anniversary_date: validation.data.anniversaryDate,
      })
      .select()
      .single()

    if (createError) {
      console.error("[Couple API] Create error:", createError)
      return serverErrorResponse()
    }

    // Update user's profile with couple_id
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ couple_id: couple.id })
      .eq("id", user.id)

    if (updateError) {
      console.error("[Couple API] Update profile error:", updateError)
      // Rollback couple creation
      await supabase.from("couples").delete().eq("id", couple.id)
      return serverErrorResponse()
    }

    const response = successResponse(couple, 201)
    return addSecurityHeaders(response)
  } catch (err) {
    console.error("[Couple API] Create error:", err)
    return serverErrorResponse()
  }
}

// PATCH /api/couple - Update couple
export async function PATCH(request: NextRequest) {
  try {
    const { user, error } = await requireAuth()

    if (error || !user) {
      return unauthorizedResponse()
    }

    // Rate limiting
    if (!checkRateLimit(`couple-update-${user.id}`, 20)) {
      return errorResponse("Muitas requisicoes. Tente novamente em alguns minutos.", 429)
    }

    const body = await request.json()
    const validation = validateBody(updateCoupleSchema, body)

    if (!validation.success) {
      return validationErrorResponse(validation.error)
    }

    const supabase = await createClient()

    // Get user's couple_id
    const { data: profile } = await supabase
      .from("profiles")
      .select("couple_id")
      .eq("id", user.id)
      .single()

    if (!profile?.couple_id) {
      return errorResponse("Voce nao pertence a um casal", 400)
    }

    // Build update object
    const updateData: Record<string, unknown> = {}
    if (validation.data.name !== undefined) updateData.name = validation.data.name
    if (validation.data.anniversaryDate !== undefined) {
      updateData.anniversary_date = validation.data.anniversaryDate
    }

    const { data: couple, error: updateError } = await supabase
      .from("couples")
      .update(updateData)
      .eq("id", profile.couple_id)
      .select()
      .single()

    if (updateError) {
      console.error("[Couple API] Update error:", updateError)
      return serverErrorResponse()
    }

    const response = successResponse(couple)
    return addSecurityHeaders(response)
  } catch (err) {
    console.error("[Couple API] Update error:", err)
    return serverErrorResponse()
  }
}
