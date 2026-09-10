import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import MapNodeCard from "@/components/world-map/MapNodeCard"
import type { PublicNode } from "@/lib/world-map/types"

function makeNode(overrides: Partial<PublicNode> = {}): PublicNode {
  return {
    id: "n1",
    entity_type: "BUSINESS",
    entity_id: "e1",
    country_code: "CU",
    region: "La Habana",
    city: "La Habana",
    public_lat: 23.1,
    public_lng: -82.3,
    timezone: "America/Havana",
    priority: 1,
    metadata_public: { name: "Café La Aurora", url: "https://example.com/cafe" },
    ...overrides,
  }
}

describe("MapNodeCard", () => {
  it("muestra nombre, tipo y localización pública", () => {
    render(<MapNodeCard node={makeNode()} onClose={() => {}} />)
    expect(screen.getByText("Café La Aurora")).toBeInTheDocument()
    expect(screen.getByText("Negocios")).toBeInTheDocument()
    // Ciudad + país legible, sin duplicar ciudad=región ni mostrar código crudo.
    expect(screen.getByText("La Habana, Cuba")).toBeInTheDocument()
  })

  it("abre el enlace público elegido por el titular", () => {
    render(<MapNodeCard node={makeNode()} onClose={() => {}} />)
    const link = screen.getByRole("link", { name: "ABRIR" })
    expect(link).toHaveAttribute("href", "https://example.com/cafe")
    expect(link).toHaveAttribute("target", "_blank")
  })

  it("no muestra botón ABRIR sin URL pública", () => {
    render(<MapNodeCard node={makeNode({ metadata_public: { name: "Sin URL" } })} onClose={() => {}} />)
    expect(screen.queryByRole("link", { name: "ABRIR" })).toBeNull()
  })

  it("timezone inválida muestra '-' sin inventar huso", () => {
    render(
      <MapNodeCard node={makeNode({ timezone: "NO/EXISTE" })} onClose={() => {}} />,
    )
    expect(screen.getByText("-")).toBeInTheDocument()
  })
})