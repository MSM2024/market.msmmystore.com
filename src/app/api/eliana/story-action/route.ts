import { NextResponse } from "next/server"
import { GoogleGenAI } from "@google/genai"
import { isUsableApiKey } from "@/lib/eliana/provider"

const GEMINI_API_KEY = isUsableApiKey(process.env.GEMINI_API_KEY)
  ? process.env.GEMINI_API_KEY
  : isUsableApiKey(process.env.GOOGLE_API_KEY)
    ? process.env.GOOGLE_API_KEY
    : undefined
const AI_MODEL = "gemini-2.0-flash"

const SYSTEM_PROMPTS: Record<string, string> = {
  correct: `Eres un corrector ortográfico y gramatical en español. Corrige errores ortográficos, gramaticales y de puntuación del texto. Preserva el estilo y la voz del autor. Responde SOLO con el texto corregido, sin explicaciones, sin prefacio, sin comentarios, sin markdown.`,
  organize: `Eres un organizador de relatos en español. Reorganiza el texto para mejorar su fluidez y estructura narrativa. Agrupa ideas relacionadas, mejora la transición entre párrafos, pero preserva TODO el contenido original y la voz del autor. Responde SOLO con el texto reorganizado, sin prefacio ni comentarios, sin markdown.`,
  summarize: `Eres un creador de resúmenes en español. Genera un resumen conciso (2-4 oraciones) del texto proporcionado. Captura la esencia, los eventos principales y el tono emocional. Responde SOLO con el resumen, sin prefacio ni comentarios, sin markdown.`,
  title: `Eres un creador de títulos en español. Basado en el contenido, genera un título atractivo y representativo (máximo 12 palabras). Responde SOLO con el título, sin prefacio, sin comillas, sin comentarios, sin markdown.`,
}

export async function POST(request: Request) {
  try {
    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: "ELIANA no está configurada (API key faltante)" }, { status: 503 })
    }

    const body = await request.json()
    const { action, title, content } = body

    if (!action || !content) {
      return NextResponse.json({ error: "Faltan parámetros: action y content son requeridos" }, { status: 400 })
    }

    const systemPrompt = SYSTEM_PROMPTS[action]
    if (!systemPrompt) {
      return NextResponse.json({ error: `Acción desconocida: ${action}` }, { status: 400 })
    }

    const userPrompt = action === "title"
      ? `Contenido de la historia:\n\n${content.slice(0, 8000)}`
      : `Título: ${title || "Sin título"}\n\nContenido:\n\n${content.slice(0, 8000)}`

    const genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY })
    const result = await genAI.models.generateContent({
      model: AI_MODEL,
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      config: {
        systemInstruction: { role: "system", parts: [{ text: systemPrompt }] },
        temperature: 0.3,
        maxOutputTokens: 4096,
      },
    })

    const text = result?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ""

    if (!text) {
      return NextResponse.json({ error: "ELIANA no generó respuesta. Inténtalo de nuevo." }, { status: 502 })
    }

    const response: Record<string, string> = {}
    if (action === "title") response.title = text
    else if (action === "summarize") response.summary = text
    else response.content = text

    return NextResponse.json(response)
  } catch (err) {
    console.error("ELIANA_STORY_ACTION_ERROR", err)
    return NextResponse.json({ error: "Error al conectar con ELIANA" }, { status: 500 })
  }
}
