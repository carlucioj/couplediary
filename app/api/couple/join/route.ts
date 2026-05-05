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
import { joinCoupleSchema } from "@/lib/validations/data"

// POST /api/couple/join - Join a couple with invite code
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireAuth()

    if (error || !user) {
      return unauthorizedResponse()
    }

    // Strict rate limiting for join attempts (prevents brute force)
    if (!checkRateLimit(`couple-join-${user.id}`, 5, 15 * 60 * 1000)) { // 5 attempts per 15 minutes
      return errorResponse("Muitas tentativas. Tente novamente em 15 minutos.", 429)
    }

    const body = await request.json()
    const validation = validateBody(joinCoupleSchema, body)

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

    // Find couple by invite code
    const { data: couple, error: coupleError } = await supabase
      .from("couples")
      .select("id, name")
      .eq("invite_code", validation.data.inviteCode)
      .single()

    if (coupleError || !couple) {
      return notFoundResponse("Codigo de convite invalido ou expirado")
    }

    // Check if couple already has 2 members
    const { count } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("couple_id", couple.id)

    if (count && count >= 2) {
      return errorResponse("Este casal ja tem dois membros", 400)
    }

    // Join the couple
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ couple_id: couple.id })
      .eq("id", user.id)

    if (updateError) {
      console.error("[Join API] Update error:", updateError)
      return serverErrorResponse()
    }

    // Get partner info
    const { data: partner } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .eq("couple_id", couple.id)
      .neq("id", user.id)
      .single()

    const response = successResponse({
      couple,
      partner: partner || null,
      message: "Voce entrou no casal com sucesso!",
    })
    return addSecurityHeaders(response)
  } catch (err) {
    console.error("[Join API] Error:", err)
    return serverErrorResponse()
  }
}
