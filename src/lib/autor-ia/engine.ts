import { GoogleGenAI } from "@google/genai"
import { checkInputSafety } from "@/lib/knowledge/guardrails"
import { isUsableApiKey } from "@/lib/eliana/provider"

export const AUTHOR_MODEL = process.env.AUTOR_IA_MODEL || "gemini-2.0-flash"

export function getGeminiKey(): string | undefined {
  const gemini = process.env.GEMINI_API_KEY
  if (isUsableApiKey(gemini)) return gemini
  const google = process.env.GOOGLE_API_KEY
  if (isUsableApiKey(google)) return google
  return undefined
}

export interface GenerateOptions {
  systemPrompt: string
  userPrompt: string
  apiKey?: string
  model?: string
  temperature?: number
  maxOutputTokens?: number
  timeoutMs?: number
}

export async function generateText(options: GenerateOptions): Promise<string | null> {
  const apiKey = options.apiKey || getGeminiKey()
  if (!apiKey) return null

  try {
    const ai = new GoogleGenAI({ apiKey })
    const response = await ai.models.generateContent({
      model: options.model || AUTHOR_MODEL,
      contents: [{ role: "user", parts: [{ text: options.userPrompt }] }],
      config: {
        systemInstruction: options.systemPrompt,
        temperature: options.temperature ?? 0.6,
        maxOutputTokens: options.maxOutputTokens ?? 6000,
        httpOptions: { timeout: options.timeoutMs ?? 60_000 },
      },
    })

    const text = response?.candidates?.[0]?.content?.parts?.[0]?.text
    if (text) return text.trim()

    console.error("Autor IA: Gemini no devolvió contenido")
    return null
  } catch (error) {
    const info = error instanceof Error ? `name=${error.name}, msg=${error.message}` : "unknown"
    console.error(`Autor IA: error de Gemini [${info}]`)
    return null
  }
}

export interface GeneratedSection {
  title: string
  content: string
}

export function extractSectionsFromMarkdown(text: string): GeneratedSection[] {
  const lines = text.split(/\r?\n/)
  const sections: GeneratedSection[] = []
  let current: GeneratedSection | null = null

  for (const line of lines) {
    const match = line.match(/^#{2,3}\s+(.+)$/)
    if (match) {
      if (current && current.content.trim()) sections.push(current)
      current = { title: match[1].trim(), content: "" }
    } else if (current) {
      current.content += line + "\n"
    } else if (line.trim()) {
      if (!current) current = { title: "Contenido", content: "" }
      current.content += line + "\n"
    }
  }
  if (current && current.content.trim()) sections.push(current)

  return sections.map(s => ({ title: s.title, content: s.content.trim() }))
}

export function sanitizeGeneratedText(text: string): { ok: boolean; sanitized: string; reason?: string } {
  const safety = checkInputSafety(text)
  if (safety.blocked) {
    return { ok: false, sanitized: "", reason: safety.reason }
  }
  return { ok: true, sanitized: safety.sanitized || text }
}
