import { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  successResponse,
  validationErrorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  serverErrorResponse,
  requireCoupleAccess,
  validateBody,
  checkRateLimit,
  addSecurityHeaders,
} from "@/lib/api/utils"
import { updateDiaryEntrySchema } from "@/lib/validations/data"
import { z } from "zod"

const paramsSchema = z.object({
  id: z.string().uuid("ID invalido"),
})

type RouteParams = { params: Promise<{ id: string }> }

// GET /api/diary/[id] - Get single diary entry
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { user, coupleId, error } = await requireCoupleAccess()

    if (error || !user || !coupleId) {
      return unauthorizedResponse()
    }

    const resolvedParams = await params
    const validation = paramsSchema.safeParse(resolvedParams)

    if (!validation.success) {
      return validationErrorResponse(validation.error)
    }

    // Rate limiting
    if (!checkRateLimit(`diary-get-${user.id}`, 100)) {
      return addSecurityHeaders(
        forbiddenResponse()
      )
    }

    const supabase = await createClient()

    const { data, error: queryError } = await supabase
      .from("diary_entries")
      .select("*, author:profiles!diary_entries_author_id_fkey(id, display_name, avatar_url)")
      .eq("id", validation.data.id)
      .eq("couple_id", coupleId)
      .single()

    if (queryError || !data) {
      return notFoundResponse("Entrada do diario")
    }

    const response = successResponse(data)
    return addSecurityHeaders(response)
  } catch (err) {
    console.error("[Diary API] Get error:", err)
    return serverErrorResponse()
  }
}

// PATCH /api/diary/[id] - Update diary entry
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { user, coupleId, error } = await requireCoupleAccess()

    if (error || !user || !coupleId) {
      return unauthorizedResponse()
    }

    const resolvedParams = await params
    const paramsValidation = paramsSchema.safeParse(resolvedParams)

    if (!paramsValidation.success) {
      return validationErrorResponse(paramsValidation.error)
    }

    // Rate limiting
    if (!checkRateLimit(`diary-update-${user.id}`, 30)) {
      return addSecurityHeaders(
        forbiddenResponse()
      )
    }

    const body = await request.json()
    const bodyValidation = validateBody(updateDiaryEntrySchema, body)

    if (!bodyValidation.success) {
      return validationErrorResponse(bodyValidation.error)
    }

    const supabase = await createClient()

    // Check ownership
    const { data: existing, error: checkError } = await supabase
      .from("diary_entries")
      .select("author_id")
      .eq("id", paramsValidation.data.id)
      .eq("couple_id", coupleId)
      .single()

    if (checkError || !existing) {
      return notFoundResponse("Entrada do diario")
    }

    if (existing.author_id !== user.id) {
      return forbiddenResponse()
    }

    // Build update object
    const updateData: Record<string, unknown> = {}
    if (bodyValidation.data.title !== undefined) updateData.title = bodyValidation.data.title
    if (bodyValidation.data.content !== undefined) updateData.content = bodyValidation.data.content
    if (bodyValidation.data.mood !== undefined) updateData.mood = bodyValidation.data.mood
    if (bodyValidation.data.isPrivate !== undefined) updateData.is_private = bodyValidation.data.isPrivate
    if (bodyValidation.data.mediaUrls !== undefined) updateData.media_urls = bodyValidation.data.mediaUrls

    const { data, error: updateError } = await supabase
      .from("diary_entries")
      .update(updateData)
      .eq("id", paramsValidation.data.id)
      .select("*, author:profiles!diary_entries_author_id_fkey(id, display_name, avatar_url)")
      .single()

    if (updateError) {
      console.error("[Diary API] Update error:", updateError)
      return serverErrorResponse()
    }

    const response = successResponse(data)
    return addSecurityHeaders(response)
  } catch (err) {
    console.error("[Diary API] Update error:", err)
    return serverErrorResponse()
  }
}

// DELETE /api/diary/[id] - Delete diary entry
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { user, coupleId, error } = await requireCoupleAccess()

    if (error || !user || !coupleId) {
      return unauthorizedResponse()
    }

    const resolvedParams = await params
    const validation = paramsSchema.safeParse(resolvedParams)

    if (!validation.success) {
      return validationErrorResponse(validation.error)
    }

    // Rate limiting
    if (!checkRateLimit(`diary-delete-${user.id}`, 20)) {
      return addSecurityHeaders(
        forbiddenResponse()
      )
    }

    const supabase = await createClient()

    // Check ownership
    const { data: existing, error: checkError } = await supabase
      .from("diary_entries")
      .select("author_id")
      .eq("id", validation.data.id)
      .eq("couple_id", coupleId)
      .single()

    if (checkError || !existing) {
      return notFoundResponse("Entrada do diario")
    }

    if (existing.author_id !== user.id) {
      return forbiddenResponse()
    }

    const { error: deleteError } = await supabase
      .from("diary_entries")
      .delete()
      .eq("id", validation.data.id)

    if (deleteError) {
      console.error("[Diary API] Delete error:", deleteError)
      return serverErrorResponse()
    }

    const response = successResponse({ deleted: true })
    return addSecurityHeaders(response)
  } catch (err) {
    console.error("[Diary API] Delete error:", err)
    return serverErrorResponse()
  }
}
