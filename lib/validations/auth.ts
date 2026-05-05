import { z } from "zod"

// Password requirements for enterprise-grade security
const passwordRequirements = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: true,
}

// Email validation schema
export const emailSchema = z
  .string()
  .min(1, "Email e obrigatorio")
  .email("Email invalido")
  .max(255, "Email muito longo")
  .transform((email) => email.toLowerCase().trim())

// Password validation schema with enterprise security rules
export const passwordSchema = z
  .string()
  .min(passwordRequirements.minLength, `Senha deve ter no minimo ${passwordRequirements.minLength} caracteres`)
  .max(passwordRequirements.maxLength, `Senha deve ter no maximo ${passwordRequirements.maxLength} caracteres`)
  .refine(
    (password) => /[A-Z]/.test(password),
    "Senha deve conter pelo menos uma letra maiuscula"
  )
  .refine(
    (password) => /[a-z]/.test(password),
    "Senha deve conter pelo menos uma letra minuscula"
  )
  .refine(
    (password) => /[0-9]/.test(password),
    "Senha deve conter pelo menos um numero"
  )
  .refine(
    (password) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    "Senha deve conter pelo menos um caractere especial (!@#$%^&*)"
  )

// Display name validation
export const displayNameSchema = z
  .string()
  .min(2, "Nome deve ter no minimo 2 caracteres")
  .max(50, "Nome deve ter no maximo 50 caracteres")
  .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, "Nome contem caracteres invalidos")
  .transform((name) => name.trim())

// Login form schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Senha e obrigatoria"),
})

// Sign up form schema
export const signUpSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Confirmacao de senha e obrigatoria"),
    displayName: displayNameSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas nao coincidem",
    path: ["confirmPassword"],
  })

// Password reset request schema
export const passwordResetRequestSchema = z.object({
  email: emailSchema,
})

// Password reset schema
export const passwordResetSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Confirmacao de senha e obrigatoria"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas nao coincidem",
    path: ["confirmPassword"],
  })

// Update profile schema
export const updateProfileSchema = z.object({
  displayName: displayNameSchema.optional(),
  avatarUrl: z.string().url("URL invalida").optional().or(z.literal("")),
})

// Invite code validation
export const inviteCodeSchema = z
  .string()
  .length(8, "Codigo de convite deve ter 8 caracteres")
  .regex(/^[A-Z0-9]+$/, "Codigo de convite invalido")
  .transform((code) => code.toUpperCase())

// Types inferred from schemas
export type LoginInput = z.infer<typeof loginSchema>
export type SignUpInput = z.infer<typeof signUpSchema>
export type PasswordResetRequestInput = z.infer<typeof passwordResetRequestSchema>
export type PasswordResetInput = z.infer<typeof passwordResetSchema>
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
export type InviteCodeInput = z.infer<typeof inviteCodeSchema>

// Utility function to get validation errors as a record
export function getValidationErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {}
  error.errors.forEach((err) => {
    if (err.path.length > 0) {
      errors[err.path[0] as string] = err.message
    }
  })
  return errors
}

// Rate limiting helper - returns true if rate limited
export function isRateLimited(
  attempts: Map<string, { count: number; firstAttempt: number }>,
  identifier: string,
  maxAttempts: number = 5,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): boolean {
  const now = Date.now()
  const record = attempts.get(identifier)

  if (!record) {
    attempts.set(identifier, { count: 1, firstAttempt: now })
    return false
  }

  // Reset if window has passed
  if (now - record.firstAttempt > windowMs) {
    attempts.set(identifier, { count: 1, firstAttempt: now })
    return false
  }

  // Increment count
  record.count++
  
  return record.count > maxAttempts
}
