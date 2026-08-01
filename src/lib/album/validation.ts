import { z } from "zod"

export const FAMILY_PRIVACY = ["solo_yo", "familia", "comunidad", "publica"] as const
export const MEMBER_RELATION = ["raiz", "pareja", "hijo", "otro"] as const
export const EVENT_CATEGORY = ["nacimiento", "boda", "viaje", "logro", "recuerdo", "otro"] as const
export const MEDIA_TYPE = ["image", "video", "audio", "document"] as const

export const albumFamilySchema = z.object({
  name: z.string().trim().min(1, "El nombre de la familia es obligatorio").max(120),
  subtitle: z.string().max(300).optional().default(""),
  privacy: z.enum(FAMILY_PRIVACY).optional().default("solo_yo"),
  accent_color: z.string().max(20).optional().default("#7C3AED"),
})

export const albumMemberSchema = z.object({
  family_id: z.string().uuid("Identificador de familia inválido"),
  parent_id: z.string().uuid().nullable().optional(),
  full_name: z.string().trim().min(1, "El nombre del miembro es obligatorio").max(160),
  birth_date: z.string().nullable().optional(),
  death_date: z.string().nullable().optional(),
  bio: z.string().max(4000).optional().default(""),
  relation: z.enum(MEMBER_RELATION).optional().default("hijo"),
  legacy_notes: z.string().max(4000).optional().default(""),
  sort_order: z.number().int().min(0).optional().default(0),
})

export const albumMemberPatchSchema = albumMemberSchema.omit({ family_id: true }).partial()

export const albumEventSchema = z.object({
  family_id: z.string().uuid("Identificador de familia inválido"),
  member_id: z.string().uuid().nullable().optional(),
  title: z.string().trim().min(1, "El título del evento es obligatorio").max(200),
  description: z.string().max(4000).optional().default(""),
  event_date: z.string().nullable().optional(),
  category: z.enum(EVENT_CATEGORY).optional().default("recuerdo"),
})

export const albumEventPatchSchema = albumEventSchema.omit({ family_id: true }).partial()

export const albumMediaSchema = z.object({
  event_id: z.string().uuid("Identificador de evento inválido"),
  member_id: z.string().uuid().nullable().optional(),
  media_type: z.enum(MEDIA_TYPE).optional().default("image"),
  url: z.string().url("La URL del archivo debe ser válida").max(2000),
  storage_path: z.string().max(2000).optional().default(""),
  filename: z.string().max(255).optional().default(""),
  caption: z.string().max(1000).optional().default(""),
})
