import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/dashboard"
  const error = searchParams.get("error")
  const errorDescription = searchParams.get("error_description")

  // Handle OAuth/email errors
  if (error) {
    console.error("[Auth Callback] Error:", error, errorDescription)
    return NextResponse.redirect(
      `${origin}/auth/error?error=${encodeURIComponent(error)}&description=${encodeURIComponent(errorDescription || "")}`
    )
  }

  if (code) {
    const supabase = await createClient()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error("[Auth Callback] Exchange error:", exchangeError.message)
      return NextResponse.redirect(
        `${origin}/auth/error?error=exchange_failed&description=${encodeURIComponent(exchangeError.message)}`
      )
    }

    // Successful authentication - redirect to intended destination
    const forwardedHost = request.headers.get("x-forwarded-host")
    const isLocalEnv = process.env.NODE_ENV === "development"

    if (isLocalEnv) {
      return NextResponse.redirect(`${origin}${next}`)
    } else if (forwardedHost) {
      return NextResponse.redirect(`https://${forwardedHost}${next}`)
    } else {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // No code provided - redirect to error
  return NextResponse.redirect(
    `${origin}/auth/error?error=no_code&description=${encodeURIComponent("No authorization code provided")}`
  )
}
