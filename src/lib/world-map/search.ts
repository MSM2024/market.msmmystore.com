/**
 * ZAFIRO WORLD MAP — Traductor de intención humana → MAP_SEARCH.
 * Convierte frases como "Muéstrame neveras en Cuba" en un objeto
 * MapSearchIntent SIN generar coordenadas imaginarias: la ubicación solo
 * se resuelve contra KNOWN_PLACES / base / geocoder autorizado.
 */

import { resolvePlace } from "./places"
import type { MapSearchIntent, MapLocationRef, WorldMapEntityType } from "./types"

const ENTITY_RULES: { types: WorldMapEntityType[]; words: string[] }[] = [
  {
    types: ["USER"],
    words: ["personas", "persona", "gente", "miembros", "miembro", "usuarios", "usuario", "amigos", "amiga", "quienes", "conectados"],
  },
  {
    types: ["BUSINESS"],
    words: ["negocio", "negocios", "comercio", "comercios", "empresa", "empresas", "vendedores", "vendedor", "locales", "local"],
  },
  {
    types: ["PRODUCT"],
    words: ["producto", "productos", "article", "articulo", "artículos", "nevera", "neveras", "celular", "telefono", "smartphone", "ropa", "zapatos", "oferta", "ofertas", "stock", "inventario"],
  },
  {
    types: ["SERVICE"],
    words: ["servicio", "servicios", "agencia", "asesoria", "consultoria", "diseño", "diseño web", "marketing", "fotografia", "traduccion"],
  },
  {
    types: ["PROJECT"],
    words: ["proyecto", "proyectos", "iniciativa", "iniciativas", "emprendimiento", "emprendimientos", "startup"],
  },
  {
    types: ["EVENT"],
    words: ["evento", "eventos", "actividad", "actividades", "taller", "talleres", "concierto", "feria", "reunion", "que esta pasando", "que pasa hoy", "hoy en"],
  },
  {
    types: ["COMMUNITY"],
    words: ["comunidad", "comunidades", "grupo", "grupos", "circulo", "circulos"],
  },
  {
    types: ["VILLA"],
    words: ["villa esperanza", "villa", "villas"],
  },
  {
    types: ["MSM_NODE"],
    words: ["nodo", "nodos", "punto msm", "punto de encuentro"],
  },
  {
    types: ["OPPORTUNITY"],
    words: ["oportunidad", "oportunidades", "empleo", "trabajo junto", "convocatoria"],
  },
]

const DEFAULT_MARKERS = [
  "muestrame", "muéstrame", "busca", "buscar", "donde esta", "dónde está", "donde hay",
  "hay ", "existe", "cerca de", "en el mapa", "en el world map", "world map", "mapa",
  "recomienda", "encuentra", "localiza", "que proyectos", "que negocios", "que eventos",
]

/** Marcador nominal "producto" que sirve de categoría para el filtro. */
function extractCategory(text: string): string | undefined {
  const m = text.match(/neveras?|celulares?|smartphones?|ropa|zapatos|electrodomesticos?/i)
  return m ? m[0].toLowerCase() : undefined
}

function extractRadius(text: string): number | null {
  const m = text.match(/(?:a|en|menos de|por debajo de|dentro de|de)\s*([0-9]{1,4}(?:\.[0-9]+)?)\s*(?:kilometros|kilómetros|kilometro|km)/i)
  if (m) return parseFloat(m[1])
  if (/cerca de (mi|mí|aqui|aquí)/i.test(text)) return 50
  if (/alrededor\s*$/i.test(text)) return null
  return null
}

/** Predetecta si un texto habla del mundo/mapa (evita secuestrar otras conversaciones). */
export function mentionsWorldMap(text: string): boolean {
  if (!text) return false
  return DEFAULT_MARKERS.some((marker) => text.toLowerCase().includes(marker))
}

/**
 * Parsea una frase del usuario en un intento MAP_SEARCH completo.
 * Devuelve null cuando no hay intención geográfica (la conversación
 * normal de ELIANA no se interrumpe).
 */
export function parseMapIntent(text: string): MapSearchIntent | null {
  if (!text || !mentionsWorldMap(text)) return null
  const normalized = text.toLowerCase()

  const entityTypes: WorldMapEntityType[] = []
  for (const rule of ENTITY_RULES) {
    for (const word of rule.words) {
      if (normalized.includes(word)) {
        if (!entityTypes.includes(rule.types[0])) entityTypes.push(rule.types[0])
        break
      }
    }
  }

  const place = resolvePlace(text)
  let location: MapLocationRef | null = null
  if (place) {
    location = {
      name: place.name,
      type: place.type,
      country_code: place.country_code,
      region: place.region,
      city: place.city,
      center: place.center,
      timezone: place.timezone,
    }
  }

  const radiusKm = extractRadius(normalized)

  const online = /conectados? (ahora|en linea|online)|membresia online|que estan online/i.test(normalized)

  let sort: MapSearchIntent["sort"] = null
  if (/mas recientes|más recientes|nuevos primero|recibidas/.test(normalized)) sort = "created_at"
  else if (/mas cerca|más cerca|por distancia|distancia/.test(normalized)) sort = "distance"

  const hasAnything = entityTypes.length > 0 || !!location || radiusKm !== null || online

  if (!hasAnything) return null

  return {
    intent: "MAP_SEARCH",
    entityTypes,
    location,
    radiusKm,
    filters: {
      category: extractCategory(normalized),
      online: online || undefined,
    },
    sort,
    raw: text,
  }
}

export const ENTITY_TYPE_LABELS: Record<WorldMapEntityType, string> = {
  USER: "Personas",
  BUSINESS: "Negocios",
  PRODUCT: "Productos",
  SERVICE: "Servicios",
  PROJECT: "Proyectos",
  EVENT: "Eventos",
  COMMUNITY: "Comunidades",
  VILLA: "Villa Esperanza",
  MSM_NODE: "Nodos MSM",
  OPPORTUNITY: "Oportunidades",
}