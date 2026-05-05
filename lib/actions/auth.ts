"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { 
  loginSchema, 
  signUpSchema, 
  passwordResetRequestSchema,
  getValidationErrors,
  type LoginInput,
  type SignUpInput 
} from "@/lib/validations/auth"

export type AuthResult = {
  success: boolean
  error?: string
  errors?: Record<string, string>
}

export async function signIn(formData: FormData): Promise<AuthResult> {
  const rawData = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  }

  // Validate input
  const result = loginSchema.safeParse(rawData)
  if (!result.success) {
    return {
      success: false,
      errors: getValidationErrors(result.error),
    }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: result.data.email,
    password: result.data.password,
  })

  if (error) {
    // Generic error message to prevent user enumeration
    return {
      success: false,
      error: "Email ou senha invalidos",
    }
  }

  return { success: true }
}

export async function signUp(formData: FormData): Promise<AuthResult> {
  const rawData = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    confirmPassword: formData.get("confirmPassword") as string,
    displayName: formData.get("displayName") as string,
  }

  // Validate input
  const result = signUpSchema.safeParse(rawData)
  if (!result.success) {
    return {
      success: false,
      errors: getValidationErrors(result.error),
    }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email: result.data.email,
    password: result.data.password,
    options: {
      emailRedirectTo:
        process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ??
        `${process.env.NEXT_PUBLIC_SITE_URL || ""}/auth/callback`,
      data: {
        display_name: result.data.displayName,
      },
    },
  })

  if (error) {
    // Check for specific errors while avoiding user enumeration
    if (error.message.includes("already registered")) {
      return {
        success: false,
        error: "Este email ja esta cadastrado",
      }
    }
    return {
      success: false,
      error: "Erro ao criar conta. Por favor, tente novamente.",
    }
  }

  return { success: true }
}

export async function signOut(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/auth/login")
}

export async function requestPasswordReset(formData: FormData): Promise<AuthResult> {
  const rawData = {
    email: formData.get("email") as string,
  }

  // Validate input
  const result = passwordResetRequestSchema.safeParse(rawData)
  if (!result.success) {
    return {
      success: false,
      errors: getValidationErrors(result.error),
    }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(result.data.email, {
    redirectTo:
      process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ??
      `${process.env.NEXT_PUBLIC_SITE_URL || ""}/auth/reset-password`,
  })

  // Always return success to prevent email enumeration
  if (error) {
    console.error("[Password Reset] Error:", error.message)
  }

  return { success: true }
}

export async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return user
}

export async function getCurrentSession() {
  const supabase = await createClient()
  const { data: { session }, error } = await supabase.auth.getSession()

  if (error || !session) {
    return null
  }

  return session
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/auth/login")
  }
  return user
}

export async function requireNoAuth() {
  const user = await getCurrentUser()
  if (user) {
    redirect("/dashboard")
  }
}
