import { describe, it, expect } from "vitest"
import { buildWorldStoryPayload, summarizeActivity } from "@/lib/world-map/aggregates"
import type { MapNodeRow } from "@/lib/world-map/types"

function row(overrides: Partial<MapNodeRow>): MapNodeRow {
  return {
    id: "r",
    entity_type: "BUSINESS",
    entity_id: "e",
    country_code: "CU",
    region: null,
    city: null,
    public_lat: 21.5,
    public_lng: -77.7,
    geohash: null,
    timezone: null,
    visibility: "PUBLIC",
    is_active: true,
    priority: 0,
    metadata_public: null,
    created_at: new Date(0).toISOString(),
    updated_at: new Date(0).toISOString(),
    ...overrides,
  }
}

describe("WorldMapStory — agregados", () => {
  it("agrega actividad por país sin filtrar nodos privados", () => {
    const rows: MapNodeRow[] = [
      row({ id: "a", entity_type: "BUSINESS", country_code: "CU" }),
      row({ id: "b", entity_type: "PROJECT", country_code: "ES" }),
      row({ id: "c", entity_type: "USER", country_code: "US", visibility: "PRIVATE" }),
    ]
    const activity = summarizeActivity(rows)
    const cu = activity.find((a) => a.country_code === "CU")
    const es = activity.find((a) => a.country_code === "ES")
    expect(cu?.activeNodes).toBe(1)
    expect(es?.activeNodes).toBe(1)
    // Persona privada: ni siquiera aparece (su país no cuenta).
    expect(activity.find((a) => a.country_code === "US")).toBeUndefined()
  })

  it("construye el payload de la historia con totales correctos", () => {
    const story = buildWorldStoryPayload([
      row({ id: "a", entity_type: "BUSINESS", country_code: "CU" }),
      row({ id: "b", entity_type: "BUSINESS", country_code: "CU", visibility: "APPROXIMATE" }),
      row({ id: "c", entity_type: "PROJECT", country_code: "ES" }),
    ])
    expect(story).not.toBeNull()
    expect(story!.totalActiveNodes).toBe(3)
    expect(story!.newBusinesses).toBe(2)
    expect(story!.activeProjects).toBe(1)
    expect(story!.eventsToday).toBe(0)
    expect(story!.featuredPlace?.kind).toBe("business")
  })

  it("sin actividad visible devuelve null (nunca inventa historias)", () => {
    expect(buildWorldStoryPayload([])).toBeNull()
    expect(buildWorldStoryPayload([row({ visibility: "PRIVATE" })])).toBeNull()
  })
})