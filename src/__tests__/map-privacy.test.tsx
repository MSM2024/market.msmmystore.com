import { describe, it, expect } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import MapPrivacy from "@/components/world-map/MapPrivacy"
import {
  locationVisibilityToNodeVisibility,
  applyUserPrivacy,
  isSafePreference,
  DEFAULT_PRIVACY,
} from "@/lib/world-map/privacy"

describe("MapPrivacy", () => {
  it("inicia oculto por defecto y sin mostrar opciones", () => {
    expect(DEFAULT_PRIVACY.showOnWorldMap).toBe(false)
    render(<MapPrivacy />)
    expect((screen.getByLabelText(/mostrarme en el mapa/i) as HTMLInputElement).checked).toBe(false)
    expect(screen.queryByRole("radio")).toBeNull()
  })

  it("muestra las opciones de visibilidad al activar 'mostrarme'", () => {
    render(<MapPrivacy />)
    fireEvent.click(screen.getByLabelText(/mostrarme en el mapa/i))
    expect(screen.getByRole("radio", { name: /oculto/i })).toBeInTheDocument()
    expect(screen.getByRole("radio", { name: /país/i })).toBeInTheDocument()
    expect(screen.getByRole("radio", { name: /ciudad/i })).toBeInTheDocument()
    expect(screen.getByText(/nunca se publica tu gps residencial/i)).toBeInTheDocument()
  })

  it("nunca expone el GPS exacto en ninguna preferencia", () => {
    for (const mode of ["OCULTO", "PAÍS", "REGIÓN", "CIUDAD"] as const) {
      const r = applyUserPrivacy(23.1, -82.3, mode)
      expect(r.visibility).not.toBe("PUBLIC")
      if (r.visibility === "PRIVATE") {
        expect(r.public_lat).toBeNull()
        expect(r.public_lng).toBeNull()
      }
    }
  })
})

describe("MapPermissions (core)", () => {
  it("mapea visibilidad de ubicación → visibilidad de nodo", () => {
    expect(locationVisibilityToNodeVisibility("OCULTO")).toBe("PRIVATE")
    expect(locationVisibilityToNodeVisibility("PAÍS")).toBe("APPROXIMATE")
    expect(locationVisibilityToNodeVisibility("REGIÓN")).toBe("APPROXIMATE")
    expect(locationVisibilityToNodeVisibility("CIUDAD")).toBe("APPROXIMATE")
  })

  it("PAÍS/REGIÓN no guardan coordenada puntual", () => {
    expect(applyUserPrivacy(23.1, -82.3, "PAÍS")).toEqual({
      public_lat: null,
      public_lng: null,
      visibility: "APPROXIMATE",
    })
  })

  it("CIUDAD conserva coordenada aproximada pero nunca PUBLIC", () => {
    expect(applyUserPrivacy(23.1, -82.3, "CIUDAD")).toEqual({
      public_lat: 23.1,
      public_lng: -82.3,
      visibility: "APPROXIMATE",
    })
  })

  it("OCULTO siempre es PRIVATE sin coordenadas", () => {
    expect(applyUserPrivacy(23.1, -82.3, "OCULTO")).toEqual({
      public_lat: null,
      public_lng: null,
      visibility: "PRIVATE",
    })
  })

  it("todas las preferencias válidas pasan el chequeo de seguridad", () => {
    expect(isSafePreference(DEFAULT_PRIVACY)).toBe(true)
    expect(isSafePreference({ ...DEFAULT_PRIVACY, locationVisibility: "CIUDAD" })).toBe(true)
  })
})