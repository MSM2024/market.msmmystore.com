import type { LibraryPrivacyLevel } from "@/lib/biblioteca/types"

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024
export const ALLOWED_EXTENSIONS = [".txt", ".md", ".markdown"]
export const ALLOWED_CATEGORIES = ["publico", "interno"] as const
export const CHUNK_SIZE = 2000
export const CHUNK_OVERLAP = 200

export const CATEGORY_TO_PRIVACY_LEVEL: Record<string, LibraryPrivacyLevel> = {
  publico: "publico",
  interno: "interno_eliana",
}

export function chunkText(text: string, size = CHUNK_SIZE, overlap = CHUNK_OVERLAP): string[] {
  const paragraphs = text
    .split(/\n{2,}/)
    .map(p => p.trim())
    .filter(Boolean)
  const chunks: string[] = []
  let current = ""
  for (const paragraph of paragraphs) {
    if ((current + "\n\n" + paragraph).length > size && current.length > 0) {
      chunks.push(current.trim())
      current = paragraph
    } else if (current.length === 0) {
      current = paragraph
    } else {
      current += "\n\n" + paragraph
    }
    if (current.length >= size) {
      chunks.push(current.trim())
      const words = current.split(/\s+/)
      const overlapWords = words.slice(-Math.floor(overlap / 3)).join(" ")
      current = overlapWords
    }
  }
  if (current.trim().length > 0) chunks.push(current.trim())
  return chunks
}

export function splitMarkdownSections(content: string): { title: string; body: string }[] {
  const lines = content.split(/\r?\n/)
  const sections: { title: string; body: string[] }[] = []
  let current: { title: string; body: string[] } | null = null
  for (const line of lines) {
    const match = line.match(/^#{1,2}\s+(.+)$/)
    if (match) {
      if (current) sections.push(current)
      current = { title: match[1].trim(), body: [] }
    } else if (current) {
      current.body.push(line)
    } else if (line.trim()) {
      if (!current) current = { title: "", body: [] }
      current.body.push(line)
    }
  }
  if (current) sections.push(current)
  if (sections.length === 0 && content.trim()) sections.push({ title: "", body: content.split(/\r?\n/) })
  return sections.map(s => ({ title: s.title, body: s.body.join("\n").trim() }))
}

export function normalizeTitle(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
}
