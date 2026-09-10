/**
 * ZAFIRO WORLD MAP — Registro de lugares conocidos (semilla).
 * Base mínima y real (países + ciudades con timezone IANA). En un release
 * futuro esta tabla se reemplaza por entidades reales/geocoder autorizado.
 * NO se inventan coordenadas: los lugares sin centro confirmado lo dejan
 * en `center: undefined` para que ELIANA no "panee" a un punto falso.
 */

export type KnownPlaceType = "country" | "region" | "city"

export interface KnownPlace {
  name: string
  type: KnownPlaceType
  country_code?: string
  region?: string
  city?: string
  center?: { lat: number; lng: number }
  timezone?: string
  aliases?: string[]
}

const PLACES: KnownPlace[] = [
  { name: "Cuba", type: "country", country_code: "CU", center: { lat: 21.5218, lng: -77.7812 }, timezone: "America/Havana", aliases: ["cuba"] },
  { name: "La Habana", type: "city", country_code: "CU", region: "La Habana", city: "La Habana", center: { lat: 23.1136, lng: -82.3666 }, timezone: "America/Havana", aliases: ["la habana", "habana", "ciudad de la habana"] },
  { name: "Santiago de Cuba", type: "city", country_code: "CU", region: "Oriente", city: "Santiago de Cuba", center: { lat: 20.0208, lng: -75.8267 }, timezone: "America/Havana", aliases: ["santiago de cuba", "santiago"] },
  { name: "La Habana Vieja", type: "region", country_code: "CU", region: "La Habana", city: "La Habana", timezone: "America/Havana", aliases: ["habana vieja"] },
  { name: "Villa Esperanza", type: "city", country_code: "CU", region: "Occidente", city: "Villa Esperanza", timezone: "America/Havana", aliases: ["villa esperanza", "la villa"] },
  { name: "Pinar del Río", type: "city", country_code: "CU", region: "Pinar del Río", city: "Pinar del Río", center: { lat: 22.4167, lng: -83.6961 }, timezone: "America/Havana", aliases: ["pinar del rio", "pinar"] },
  { name: "Matanzas", type: "city", country_code: "CU", region: "Matanzas", city: "Matanzas", center: { lat: 23.0414, lng: -81.5775 }, timezone: "America/Havana", aliases: ["matanzas"] },
  { name: "Cienfuegos", type: "city", country_code: "CU", region: "Cienfuegos", city: "Cienfuegos", center: { lat: 22.1496, lng: -80.4366 }, timezone: "America/Havana", aliases: ["cienfuegos"] },
  { name: "Camagüey", type: "city", country_code: "CU", region: "Camagüey", city: "Camagüey", center: { lat: 21.3839, lng: -77.9075 }, timezone: "America/Havana", aliases: ["camaguey"] },
  { name: "Holguín", type: "city", country_code: "CU", region: "Holguín", city: "Holguín", center: { lat: 20.8872, lng: -76.2631 }, timezone: "America/Havana", aliases: ["holguin"] },
  { name: "Guantánamo", type: "city", country_code: "CU", region: "Guantánamo", city: "Guantánamo", center: { lat: 20.1446, lng: -75.2099 }, timezone: "America/Havana", aliases: ["guantanamo"] },
  { name: "Santa Clara", type: "city", country_code: "CU", region: "Villa Clara", city: "Santa Clara", center: { lat: 22.4039, lng: -79.9712 }, timezone: "America/Havana", aliases: ["santa clara"] },
  { name: "Puerto Rico", type: "country", country_code: "PR", center: { lat: 18.2208, lng: -66.5901 }, timezone: "America/Puerto_Rico", aliases: ["puerto rico", "boricua", "borinquen"] },
  { name: "San Juan", type: "city", country_code: "PR", city: "San Juan", center: { lat: 18.4655, lng: -66.1057 }, timezone: "America/Puerto_Rico", aliases: ["san juan"] },
  { name: "Ponce", type: "city", country_code: "PR", city: "Ponce", center: { lat: 18.011, lng: -66.614 }, timezone: "America/Puerto_Rico", aliases: ["ponce"] },
  { name: "Mayagüez", type: "city", country_code: "PR", city: "Mayagüez", center: { lat: 18.2013, lng: -67.1456 }, timezone: "America/Puerto_Rico", aliases: ["mayaguez"] },
  { name: "Estados Unidos", type: "country", country_code: "US", center: { lat: 39.8283, lng: -98.5795 }, timezone: "America/New_York", aliases: ["estados unidos", "ee. uu.", "eeuu", "usa", "united states", "america"] },
  { name: "Miami", type: "city", country_code: "US", region: "Florida", city: "Miami", center: { lat: 25.7617, lng: -80.1918 }, timezone: "America/New_York", aliases: ["miami"] },
  { name: "Nueva York", type: "city", country_code: "US", region: "Nueva York", city: "Nueva York", center: { lat: 40.7128, lng: -74.006 }, timezone: "America/New_York", aliases: ["nueva york", "new york", "nyc"] },
  { name: "Orlando", type: "city", country_code: "US", region: "Florida", city: "Orlando", center: { lat: 28.5383, lng: -81.3792 }, timezone: "America/New_York", aliases: ["orlando"] },
  { name: "Tampa", type: "city", country_code: "US", region: "Florida", city: "Tampa", center: { lat: 27.9506, lng: -82.4572 }, timezone: "America/New_York", aliases: ["tampa"] },
  { name: "España", type: "country", country_code: "ES", center: { lat: 40.4168, lng: -3.7038 }, timezone: "Europe/Madrid", aliases: ["espana", "españa"] },
  { name: "Madrid", type: "city", country_code: "ES", city: "Madrid", center: { lat: 40.4168, lng: -3.7038 }, timezone: "Europe/Madrid", aliases: ["madrid"] },
  { name: "Barcelona", type: "city", country_code: "ES", city: "Barcelona", center: { lat: 41.3874, lng: 2.1686 }, timezone: "Europe/Madrid", aliases: ["barcelona"] },
  { name: "Japón", type: "country", country_code: "JP", center: { lat: 36.2048, lng: 138.2529 }, timezone: "Asia/Tokyo", aliases: ["japon", "japón"] },
  { name: "Tokio", type: "city", country_code: "JP", city: "Tokio", center: { lat: 35.6762, lng: 139.6503 }, timezone: "Asia/Tokyo", aliases: ["tokio", "tokyo"] },
  { name: "México", type: "country", country_code: "MX", center: { lat: 23.6345, lng: -102.5528 }, timezone: "America/Mexico_City", aliases: ["mexico", "méxico"] },
  { name: "República Dominicana", type: "country", country_code: "DO", center: { lat: 18.7357, lng: -70.1627 }, timezone: "America/Santo_Domingo", aliases: ["republica dominicana", "rd", "quisqueya"] },
  { name: "Colombia", type: "country", country_code: "CO", center: { lat: 4.5709, lng: -74.2973 }, timezone: "America/Bogota", aliases: ["colombia"] },
  { name: "Venezuela", type: "country", country_code: "VE", center: { lat: 6.4238, lng: -66.5897 }, timezone: "America/Caracas", aliases: ["venezuela"] },
]

export const KNOWN_PLACES: KnownPlace[] = PLACES

/** Concepto especial: Villa Esperanza puede mostrarse como nodo VILLA con permisos válidos. */
export const VILLA_ESPERANZA_PLACE: KnownPlace | undefined = PLACES.find(
  (p) => p.name === "Villa Esperanza",
)

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
}

/** Busca la localización correspondiente a un texto SIN inventar coordenadas. */
export function resolvePlace(text: string): KnownPlace | null {
  if (!text) return null
  const t = normalize(text)
  let best: KnownPlace | null = null
  let bestLen = 0
  for (const place of PLACES) {
    const needles = [place.name, ...(place.aliases ?? [])].map(normalize)
    for (const needle of needles) {
      if (needle.length < 3) continue
      if (t.includes(needle) && needle.length > bestLen) {
        best = place
        bestLen = needle.length
      }
    }
  }
  return best
}