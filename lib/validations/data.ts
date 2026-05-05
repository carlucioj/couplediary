import { z } from "zod"

// ============================================================================
// COUPLE VALIDATIONS
// ============================================================================

export const createCoupleSchema = z.object({
  name: z
    .string()
    .min(2, "Nome deve ter no minimo 2 caracteres")
    .max(100, "Nome deve ter no maximo 100 caracteres")
    .optional(),
  anniversaryDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data invalida (formato: YYYY-MM-DD)")
    .optional(),
})

export const updateCoupleSchema = z.object({
  name: z
    .string()
    .min(2, "Nome deve ter no minimo 2 caracteres")
    .max(100, "Nome deve ter no maximo 100 caracteres")
    .optional(),
  anniversaryDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data invalida (formato: YYYY-MM-DD)")
    .optional()
    .nullable(),
})

export const joinCoupleSchema = z.object({
  inviteCode: z
    .string()
    .length(8, "Codigo de convite deve ter 8 caracteres")
    .regex(/^[A-Z0-9]+$/, "Codigo de convite invalido")
    .transform((code) => code.toUpperCase()),
})

// ============================================================================
// DIARY ENTRY VALIDATIONS
// ============================================================================

export const moodSchema = z.enum([
  "happy",
  "love",
  "grateful",
  "excited",
  "peaceful",
  "sad",
  "anxious",
  "angry",
  "neutral",
])

export const createDiaryEntrySchema = z.object({
  title: z
    .string()
    .min(1, "Titulo e obrigatorio")
    .max(200, "Titulo deve ter no maximo 200 caracteres"),
  content: z
    .string()
    .min(1, "Conteudo e obrigatorio")
    .max(50000, "Conteudo deve ter no maximo 50000 caracteres"),
  mood: moodSchema.optional(),
  isPrivate: z.boolean().default(false),
  mediaUrls: z
    .array(z.string().url("URL de midia invalida"))
    .max(10, "Maximo de 10 midias por entrada")
    .default([]),
})

export const updateDiaryEntrySchema = z.object({
  title: z
    .string()
    .min(1, "Titulo e obrigatorio")
    .max(200, "Titulo deve ter no maximo 200 caracteres")
    .optional(),
  content: z
    .string()
    .min(1, "Conteudo e obrigatorio")
    .max(50000, "Conteudo deve ter no maximo 50000 caracteres")
    .optional(),
  mood: moodSchema.optional().nullable(),
  isPrivate: z.boolean().optional(),
  mediaUrls: z
    .array(z.string().url("URL de midia invalida"))
    .max(10, "Maximo de 10 midias por entrada")
    .optional(),
})

// ============================================================================
// MEMORY VALIDATIONS
// ============================================================================

export const createMemorySchema = z.object({
  title: z
    .string()
    .min(1, "Titulo e obrigatorio")
    .max(200, "Titulo deve ter no maximo 200 caracteres"),
  description: z
    .string()
    .max(5000, "Descricao deve ter no maximo 5000 caracteres")
    .optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data invalida (formato: YYYY-MM-DD)"),
  location: z
    .string()
    .max(500, "Local deve ter no maximo 500 caracteres")
    .optional(),
  mediaUrls: z
    .array(z.string().url("URL de midia invalida"))
    .max(20, "Maximo de 20 midias por memoria")
    .default([]),
  tags: z
    .array(
      z
        .string()
        .min(1, "Tag nao pode ser vazia")
        .max(50, "Tag deve ter no maximo 50 caracteres")
    )
    .max(10, "Maximo de 10 tags")
    .default([]),
})

export const updateMemorySchema = z.object({
  title: z
    .string()
    .min(1, "Titulo e obrigatorio")
    .max(200, "Titulo deve ter no maximo 200 caracteres")
    .optional(),
  description: z
    .string()
    .max(5000, "Descricao deve ter no maximo 5000 caracteres")
    .optional()
    .nullable(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data invalida (formato: YYYY-MM-DD)")
    .optional(),
  location: z
    .string()
    .max(500, "Local deve ter no maximo 500 caracteres")
    .optional()
    .nullable(),
  mediaUrls: z
    .array(z.string().url("URL de midia invalida"))
    .max(20, "Maximo de 20 midias por memoria")
    .optional(),
  tags: z
    .array(
      z
        .string()
        .min(1, "Tag nao pode ser vazia")
        .max(50, "Tag deve ter no maximo 50 caracteres")
    )
    .max(10, "Maximo de 10 tags")
    .optional(),
})

// ============================================================================
// SPECIAL DATE VALIDATIONS
// ============================================================================

export const specialDateTypeSchema = z.enum([
  "anniversary",
  "birthday",
  "first_date",
  "engagement",
  "wedding",
  "custom",
])

export const createSpecialDateSchema = z.object({
  title: z
    .string()
    .min(1, "Titulo e obrigatorio")
    .max(200, "Titulo deve ter no maximo 200 caracteres"),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data invalida (formato: YYYY-MM-DD)"),
  type: specialDateTypeSchema.default("custom"),
  reminderEnabled: z.boolean().default(true),
})

export const updateSpecialDateSchema = z.object({
  title: z
    .string()
    .min(1, "Titulo e obrigatorio")
    .max(200, "Titulo deve ter no maximo 200 caracteres")
    .optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data invalida (formato: YYYY-MM-DD)")
    .optional(),
  type: specialDateTypeSchema.optional(),
  reminderEnabled: z.boolean().optional(),
})

// ============================================================================
// PAGINATION & QUERY VALIDATIONS
// ============================================================================

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export const diaryQuerySchema = paginationSchema.extend({
  mood: moodSchema.optional(),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data invalida")
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data invalida")
    .optional(),
  search: z.string().max(200).optional(),
})

export const memoryQuerySchema = paginationSchema.extend({
  tag: z.string().max(50).optional(),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data invalida")
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data invalida")
    .optional(),
  search: z.string().max(200).optional(),
})

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type CreateCoupleInput = z.infer<typeof createCoupleSchema>
export type UpdateCoupleInput = z.infer<typeof updateCoupleSchema>
export type JoinCoupleInput = z.infer<typeof joinCoupleSchema>
export type CreateDiaryEntryInput = z.infer<typeof createDiaryEntrySchema>
export type UpdateDiaryEntryInput = z.infer<typeof updateDiaryEntrySchema>
export type CreateMemoryInput = z.infer<typeof createMemorySchema>
export type UpdateMemoryInput = z.infer<typeof updateMemorySchema>
export type CreateSpecialDateInput = z.infer<typeof createSpecialDateSchema>
export type UpdateSpecialDateInput = z.infer<typeof updateSpecialDateSchema>
export type PaginationInput = z.infer<typeof paginationSchema>
export type DiaryQueryInput = z.infer<typeof diaryQuerySchema>
export type MemoryQueryInput = z.infer<typeof memoryQuerySchema>
export type Mood = z.infer<typeof moodSchema>
export type SpecialDateType = z.infer<typeof specialDateTypeSchema>
