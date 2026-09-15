// ================================================================
// ELIANA CENTRAL — Configuración ÚNICA de la integración.
// UNA SOLA ELIANA vive en https://eliana.msmmystore.com y TODAS las
// apps del ecosistema se conectan a ella con su `source`.
// ZAFIRO NO tiene ELIANA propia: monta el widget reutilizable.
// ================================================================

export const ELIANA_CENTRAL_URL =
  process.env.NEXT_PUBLIC_ELIANA_URL || "https://eliana.msmmystore.com"

/** Path/branch dentro de ELIANA CENTRAL (chat completo, enfoque lateral, etc.) */
export type ElianaCentralView = "chat" | "home"

export interface ElianaCentralParams {
  source: string
  context?: string
  view?: ElianaCentralView
  returnUrl?: string
}

/**
 * Construye la URL a ELIANA CENTRAL con el contexto del usuario
 * (source obligatorio: "zafiro", "market", "villa-esperanza"...).
 * ELIANA lee estos parámetros para adaptar el contexto sin dejar
 * de ser la MISMA ELIANA.
 */
export function buildElianaCentralUrl({
  source,
  context,
  view = "chat",
  returnUrl,
}: ElianaCentralParams): string {
  const url = new URL(ELIANA_CENTRAL_URL)
  url.searchParams.set("source", source)
  if (context) url.searchParams.set("ctx", context)
  if (view !== "chat") url.searchParams.set("view", view)
  url.searchParams.set("embed", "1")
  if (returnUrl) url.searchParams.set("return", returnUrl)
  return url.toString()
}