import { describe, it, expect } from "vitest"
import {
  MAX_UPLOAD_BYTES,
  ALLOWED_EXTENSIONS,
  ALLOWED_CATEGORIES,
  CATEGORY_TO_PRIVACY_LEVEL,
  chunkText,
  splitMarkdownSections,
  normalizeTitle,
} from "@/lib/biblioteca/ingest"

describe("ingesta biblioteca: restricciones", () => {
  it("limita el tamaño a 5 MB", () => {
    expect(MAX_UPLOAD_BYTES).toBe(5 * 1024 * 1024)
  })

  it("solo acepta txt, md y markdown", () => {
    expect(ALLOWED_EXTENSIONS).toEqual([".txt", ".md", ".markdown"])
  })

  it("excluye categorías privadas de la ingesta manual", () => {
    expect(ALLOWED_CATEGORIES).toEqual(["publico", "interno"])
    expect(ALLOWED_CATEGORIES).not.toContain("privado")
    expect(ALLOWED_CATEGORIES).not.toContain("confidencial")
  })

  it("mapea categorías a niveles de privacidad existentes", () => {
    expect(CATEGORY_TO_PRIVACY_LEVEL.publico).toBe("publico")
    expect(CATEGORY_TO_PRIVACY_LEVEL.interno).toBe("interno_eliana")
  })
})

describe("splitMarkdownSections", () => {
  it("divide por encabezados de nivel 1 y 2", () => {
    const sections = splitMarkdownSections(
      "# El Reino\n\nPrimer texto.\n\n## Capitulo Uno\n\nSegundo texto.",
    )
    expect(sections.map(s => s.title)).toEqual(["El Reino", "Capitulo Uno"])
    expect(sections[1].body).toBe("Segundo texto.")
  })

  it("devuelve un único bloque sin encabezados", () => {
    const sections = splitMarkdownSections("Texto sin estructura.\nSegunda línea.")
    expect(sections).toHaveLength(1)
    expect(sections[0].body).toContain("Texto sin estructura.")
  })
})

describe("chunkText", () => {
  it("respeta el tamaño máximo por fragmento", () => {
    const text = Array.from({ length: 80 }, (_, i) => `Párrafo número ${i} con contenido repetido para superar el umbral de partición.`)
      .join("\n\n")
    const chunks = chunkText(text, 500)
    expect(chunks.length).toBeGreaterThan(1)
    for (const c of chunks) expect(c.length).toBeLessThanOrEqual(1000)
    expect(chunks.join(" ").replace(/\s+/g, " ").length).toBeGreaterThan(text.length / 2)
  })

  it("no genera fragmentos vacíos", () => {
    const chunks = chunkText("", 500)
    expect(chunks).toEqual([])
  })

  it("preserva el texto de documentos cortos en un solo fragmento", () => {
    const chunks = chunkText("Obra breve.", 2000)
    expect(chunks).toEqual(["Obra breve."])
  })
})

describe("normalizeTitle", () => {
  it("normaliza mayúsculas, acentos y separadores", () => {
    expect(normalizeTitle("  El Reino de los Cielos  ")).toBe("el reino de los cielos")
    expect(normalizeTitle("Canción de Hielo")).toBe("cancion de hielo")
  })
})
