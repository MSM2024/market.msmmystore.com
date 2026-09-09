// ================================================================
// ORQUESTADOR DE ACCESOS — ELIANA entiende la intención del usuario
// y recomienda el portal correcto del ecosistema MSM.
// ZAFIRO no reconstruye los sistemas externos: solo abre el enlace
// cuando el usuario lo decide (no se envía información a la
// plataforma hasta pulsar ABRIR).
// ================================================================

import { PORTALS, isOpenable, type PortalDef } from "./portals"

// El card de portal solo aparece cuando el usuario expresa intención
// de ACCEDER/ABRIR algo (evita sugerir el link en toda conversación
// temática: "¿qué es el zafiro?" no abre tarjeta, "¿dónde está la
// tienda?" sí).
const INTENT: string[] = [
  "abre", "abrime", "abrir", "abrirme", "entrar", "entra", "quiero ir", "quiero ver",
  "llevame", "llevarme", "ve a", "vamos a", "mandame", "pasame", "muestrame",
  "donde esta", "donde", "dónde", "direccion", "enlace", "link", "link de",
  "plataforma", "pagina", "sitio", "tienda", "portal", "acced", "ingresar",
  "inscrib", "tramitar", "comprar", "leer", "estudiar", "apuntarme", "registrarm",
]

const KEYWORDS: Record<string, string[]> = {
  gemologia: ["gema", "zafiro", "rubi", "piedra", "diamante", "corindon", "kashmir", "padparadscha", "laboratorio", "handbook"],
  universo: ["universo", "mapa de proyectos", "mapa de plataformas"],
  ecosistema: ["ecosistema", "servicios", "servicio", "marca", "proyectos", "empresa", "negocio", "branding"],
  biblioteca: ["libro", "libro.", "biblioteca", "editorial", "publicar", "coleccion", "leer"],
  album: ["album", "fotos", "familia", "recuerdo", "legado", "ancestro", "genealogia"],
  historias: ["historia", "historias", "relato", "memoria", "cuento", "narrativa"],
  escuela: ["curso", "cursos", "clase", "escuela", "certific", "mentor", "estudiar", "formacion", "inscrib"],
  marketplace: [
    "comprar", "vender", "tienda", "producto", "productos", "pedido", "precio",
    "carrito", "proveedor", "articulo", "oferta", "stock", "catalogo",
  ],
  memberships: ["membresia", "membresias", "plan de beneficio", "suscripcion", "cuba plus"],
}

/**
 * Detecta el portal que responde a la INTENCIÓN de acceso del usuario.
 * Devuelve el mejor portal (público/disponible primero) y también
 * responde honestamente por los no publicados (los muestra "Próximamente").
 */
export function recommendPortal(text: string): PortalDef | null {
  if (!text) return null
  const t = text.toLowerCase()

  // Sin intención de acceder/abrir → no hay recomendación de portal.
  if (!INTENT.some((w) => t.includes(w))) return null

  const scorer = (portal: PortalDef) =>
    KEYWORDS[portal.id]?.some((kw) => t.includes(kw)) ?? false

  // Prioridad 1: portal abierto ya (disponible/acceso).
  for (const portal of PORTALS) {
    if (!isOpenable(portal)) continue
    if (scorer(portal)) return portal
  }
  // Prioridad 2: portal no publicado → ELIANA responde "Próximamente".
  for (const portal of PORTALS) {
    if (isOpenable(portal)) continue
    if (scorer(portal)) return portal
  }
  return null
}

/**
 * Abre el portal (externo en pestaña nueva; interno dentro de ZAFIRO).
 * Solo el usuario decide cuándo se abre: aquí no se envía ningún dato.
 * No abre portales que aún no son abribles ("Próximamente").
 */
export function openPortal(portal: PortalDef | null | undefined): void {
  if (typeof window === "undefined") return
  if (!isOpenable(portal)) return
  if (portal.external) {
    window.open(portal.url, "_blank", "noopener,noreferrer")
  } else {
    window.location.href = portal.url
  }
}