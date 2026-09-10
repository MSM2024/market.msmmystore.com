import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import WorldMapPage from "@/components/world-map/WorldMapPage"
import { WORLD_MAP_EMPTY_MESSAGE } from "@/lib/world-map/flags"
import { worldMapEnabled } from "@/lib/world-map/flags"

describe("WorldMap (flags apagadas por defecto)", () => {
  it("no carga el mapa cuando worldMap.enabled=false", () => {
    expect(worldMapEnabled()).toBe(false)
    const { container } = render(<WorldMapPage />)
    expect(screen.getByRole("heading", { name: /mapa mundial/i })).toBeInTheDocument()
    expect(screen.getAllByText(WORLD_MAP_EMPTY_MESSAGE).length).toBeGreaterThan(0)
    // Placeholder honesto: no hay lienzo de mapa ni canvas de maplibre.
    expect(container.querySelector(".maplibregl-map")).toBeNull()
    expect(container.querySelector("canvas")).toBeNull()
  })
})