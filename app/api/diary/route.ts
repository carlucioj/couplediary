import { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
  unauthorizedResponse,
  serverErrorResponse,
  requireCoupleAccess,
  validateBody,
  parseSearchParams,
  checkRateLimit,
  addSecurityHeaders,
} from "@/lib/api/utils"
import { createDiaryEntrySchema, diaryQuerySchema } from "@/lib/validations/data"

// GET /api/diary - List diary entries
export async function GET(request: NextRequest) {
  try {
    const { user, coupleId, error } = await requireCoupleAccess()

    if (error || !user || !coupleId) {
      return unauthorizedResponse()
    }

    // Rate limiting
    if (!checkRateLimit(`diary-list-${user.id}`, 100)) {
      return errorResponse("Muitas requisicoes. Tente novamente em alguns minutos.", 429)
    }

    // Parse and validate query params
    const params = parseSearchParams(request.nextUrl.searchParams)
    const validation = diaryQuerySchema.safeParse(params)

    if (!validation.success) {
      return validationErrorResponse(validation.error)
    }

    const { page, limit, mood, startDate, endDate, search } = validation.data
    const offset = (page - 1) * limit

    const supabase = await createClient()

    // Build query
    let query = supabase
      .from("diary_entries")
      .select("*, author:profiles!diary_entries_author_id_fkey(id, display_name, avatar_url)", { count: "exact" })
      .eq("couple_id", coupleId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (mood) {
      query = query.eq("mood", mood)
    }

    if (startDate) {
      query = query.gte("created_at", `${startDate}T00:00:00`)
    }

    if (endDate) {
      query = query.lte("created_at", `${endDate}T23:59:59`)
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`)
    }

    const { data, error: queryError, count } = await query

    if (queryError) {
      console.error("[Diary API] List error:", queryError)
      return serverErrorResponse()
    }

    const response = successResponse({
      entries: data,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })

    return addSecurityHeaders(response)
  } catch (err) {
    console.error("[Diary API] Unexpected error:", err)
    return serverErrorResponse()
  }
}

// POST /api/diary - Create diary entry
export async function POST(request: NextRequest) {
  try {
    const { user, coupleId, error } = await requireCoupleAccess()

    if (error || !user || !coupleId) {
      return unauthorizedResponse()
    }

    // Rate limiting
    if (!checkRateLimit(`diary-create-${user.id}`, 30)) {
      return errorResponse("Muitas requisicoes. Tente novamente em alguns minutos.", 429)
    }

    const body = await request.json()
    const validation = validateBody(createDiaryEntrySchema, body)

    if (!validation.success) {
      return validationErrorResponse(validation.error)
    }

    const supabase = await createClient()

    const { data, error: insertError } = await supabase
      .from("diary_entries")
      .insert({
        couple_id: coupleId,
        author_id: user.id,
        title: validation.data.title,
        content: validation.data.content,
        mood: validation.data.mood,
        is_private: validation.data.isPrivate,
        media_urls: validation.data.mediaUrls,
      })
      .select("*, author:profiles!diary_entries_author_id_fkey(id, display_name, avatar_url)")
      .single()

    if (insertError) {
      console.error("[Diary API] Insert error:", insertError)
      return serverErrorResponse()
    }

    const response = successResponse(data, 201)
    return addSecurityHeaders(response)
  } catch (err) {
    console.error("[Diary API] Unexpected error:", err)
    return serverErrorResponse()
  }
}
