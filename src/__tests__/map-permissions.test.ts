import { describe, it, expect } from "vitest"
import {
  publicNodes,
  isPubliclyVisible,
  toPublicNode,
  MAX_PUBLIC_NODES,
} from "@/lib/world-map/privacy"
import type { MapNodeRow } from "@/lib/world-map/types"

function row(overrides: Partial<MapNodeRow> = {}): MapNodeRow {
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

describe("MapPermissions — visibilidad y saneado", () => {
  it("PRIVATE y no activos nunca son público", () => {
    expect(isPubliclyVisible(row())).toBe(true)
    expect(isPubliclyVisible(row({ visibility: "PRIVATE" }))).toBe(false)
    expect(isPubliclyVisible(row({ is_active: false }))).toBe(false)
  })

  it("publicNodes excluye PRIVATE, ordena por prioridad y corta en el tope", () => {
    // 605 filas con 61 PRIVATE → quedan 544 visibles → se corta en 500.
    const many = Array.from({ length: MAX_PUBLIC_NODES + 105 }, (_, i) =>
      row({ id: `n${i}`, priority: i, visibility: i % 10 === 0 ? "PRIVATE" : "APPROXIMATE" }),
    )
    const out = publicNodes(many)
    expect(out.every((n) => n.visibility !== "PRIVATE")).toBe(true)
    expect(out.length).toBe(MAX_PUBLIC_NODES)
    // Primero el de mayor prioridad.
    expect(out[0].priority).toBe(Math.max(...many.map((m) => m.priority)))
  })

  it("toPublicNode solo expone campos públicos", () => {
    const source = row({
      id: "n1",
      metadata_public: { name: "Café" },
    }) as MapNodeRow & { private_note: string; email: string }
    source.private_note = "secreto"
    source.email = "x@x.com"

    const pub = toPublicNode(source)
    const keys = Object.keys(pub).sort()
    expect(keys).toEqual(
      [
        "id",
        "entity_type",
        "entity_id",
        "country_code",
        "region",
        "city",
        "public_lat",
        "public_lng",
        "timezone",
        "priority",
        "metadata_public",
      ].sort(),
    )
    expect(pub).not.toHaveProperty("private_note")
    expect(pub).not.toHaveProperty("email")
    expect(pub.metadata_public).toEqual({ name: "Café" })
  })
})