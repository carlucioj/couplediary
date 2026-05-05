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
import { createMemorySchema, memoryQuerySchema } from "@/lib/validations/data"

// GET /api/memories - List memories
export async function GET(request: NextRequest) {
  try {
    const { user, coupleId, error } = await requireCoupleAccess()

    if (error || !user || !coupleId) {
      return unauthorizedResponse()
    }

    // Rate limiting
    if (!checkRateLimit(`memories-list-${user.id}`, 100)) {
      return errorResponse("Muitas requisicoes. Tente novamente em alguns minutos.", 429)
    }

    // Parse and validate query params
    const params = parseSearchParams(request.nextUrl.searchParams)
    const validation = memoryQuerySchema.safeParse(params)

    if (!validation.success) {
      return validationErrorResponse(validation.error)
    }

    const { page, limit, tag, startDate, endDate, search } = validation.data
    const offset = (page - 1) * limit

    const supabase = await createClient()

    // Build query
    let query = supabase
      .from("memories")
      .select("*, author:profiles!memories_author_id_fkey(id, display_name, avatar_url)", { count: "exact" })
      .eq("couple_id", coupleId)
      .order("date", { ascending: false })
      .range(offset, offset + limit - 1)

    if (tag) {
      query = query.contains("tags", [tag])
    }

    if (startDate) {
      query = query.gte("date", startDate)
    }

    if (endDate) {
      query = query.lte("date", endDate)
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,location.ilike.%${search}%`)
    }

    const { data, error: queryError, count } = await query

    if (queryError) {
      console.error("[Memories API] List error:", queryError)
      return serverErrorResponse()
    }

    const response = successResponse({
      memories: data,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })

    return addSecurityHeaders(response)
  } catch (err) {
    console.error("[Memories API] Unexpected error:", err)
    return serverErrorResponse()
  }
}

// POST /api/memories - Create memory
export async function POST(request: NextRequest) {
  try {
    const { user, coupleId, error } = await requireCoupleAccess()

    if (error || !user || !coupleId) {
      return unauthorizedResponse()
    }

    // Rate limiting
    if (!checkRateLimit(`memories-create-${user.id}`, 30)) {
      return errorResponse("Muitas requisicoes. Tente novamente em alguns minutos.", 429)
    }

    const body = await request.json()
    const validation = validateBody(createMemorySchema, body)

    if (!validation.success) {
      return validationErrorResponse(validation.error)
    }

    const supabase = await createClient()

    const { data, error: insertError } = await supabase
      .from("memories")
      .insert({
        couple_id: coupleId,
        author_id: user.id,
        title: validation.data.title,
        description: validation.data.description,
        date: validation.data.date,
        location: validation.data.location,
        media_urls: validation.data.mediaUrls,
        tags: validation.data.tags,
      })
      .select("*, author:profiles!memories_author_id_fkey(id, display_name, avatar_url)")
      .single()

    if (insertError) {
      console.error("[Memories API] Insert error:", insertError)
      return serverErrorResponse()
    }

    const response = successResponse(data, 201)
    return addSecurityHeaders(response)
  } catch (err) {
    console.error("[Memories API] Unexpected error:", err)
    return serverErrorResponse()
  }
}
