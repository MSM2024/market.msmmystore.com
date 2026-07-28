import { z } from "zod"

// ================================================================
// ELIANA API VALIDATION SCHEMAS
// Server-side input validation using Zod
// ================================================================

export const ChatRequestSchema = z.object({
  message: z
    .string()
    .min(1, "El mensaje no puede estar vacío")
    .max(2000, "El mensaje no puede exceder 2000 caracteres")
    .trim(),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant", "system"]),
        text: z.string().max(4000).optional(),
        content: z.string().max(4000).optional(),
      })
    )
    .max(20, "El historial no puede exceder 20 mensajes")
    .optional()
    .default([]),
})

export type ChatRequest = z.infer<typeof ChatRequestSchema>

export const MarketplaceBridgeSchema = z.object({
  action: z.enum([
    "getCustomerContext",
    "searchProducts",
    "getProductDetails",
    "handoff",
    "searchOrders",
  ]),
  data: z.record(z.string(), z.unknown()).optional().default({}),
})

export const SearchOrdersSchema = z.object({
  userId: z.string().uuid("userId must be a valid UUID"),
  orderNumber: z.string().max(50).optional(),
})

export type MarketplaceBridgeRequest = z.infer<typeof MarketplaceBridgeSchema>

export const SearchProductsSchema = z.object({
  query: z.string().max(200).optional().default(""),
  limit: z.number().int().min(1).max(25).optional().default(10),
  offset: z.number().int().min(0).optional().default(0),
  categoryId: z.string().uuid().optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  country: z.string().length(2).optional(),
  freeShipping: z.boolean().optional(),
  sort: z
    .enum(["newest", "price_asc", "price_desc", "rating", "popular"])
    .optional()
    .default("newest"),
})

export const GetProductDetailsSchema = z.object({
  productId: z.string().uuid().optional(),
  slug: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug inválido")
    .optional(),
})

export const HandoffSchema = z.object({
  reason: z
    .enum([
      "purchase_help",
      "order_issue",
      "refund_request",
      "product_question",
      "seller_dispute",
      "general",
    ])
    .optional()
    .default("general"),
  customerMessage: z.string().max(4000).optional().default(""),
  customerId: z.string().uuid().optional(),
  sessionId: z.string().max(100).optional(),
  conversationHistory: z.array(z.unknown()).max(50).optional(),
})

// --- Sanitization helpers ---

const DANGEROUS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /data:text\/html/gi,
]

export function sanitizeHtml(input: string): string {
  let clean = input
  for (const pattern of DANGEROUS_PATTERNS) {
    clean = clean.replace(pattern, "")
  }
  return clean
}
