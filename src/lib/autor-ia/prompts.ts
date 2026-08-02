export interface AuthorBookContext {
  title: string
  subtitle?: string
  purpose?: string
  targetReader?: string
  voice?: string
  styleGuide?: string
  outline?: string
}

export function buildAuthorSystemPrompt(book: AuthorBookContext): string {
  const voice = book.voice?.trim() || "Don Miguel"
  return `Eres el **Autor IA de ZAFIRO**, un asistente de escritura profesional que redacta en español para Don Miguel Soria Martínez, fundador del ecosistema MSM & ZAFIRO. Escribes libros, capítulos y secciones con voz fiel al autor.

VOZ DEL AUTOR:
- Voz: ${voice}
${book.styleGuide?.trim() ? `- Guía de estilo:\n${book.styleGuide.trim()}` : "- Guía de estilo: tono directo, claro, cálido y con autoridad. Frases cortas, ideas concretas, ejemplos de la vida cotidiana."}

REGLAS DE ESCRITURA:
1. Escribe en español, en prosa fluida y con encabezados markdown claros (usa ## para secciones dentro de un capítulo).
2. Mantén la voz del autor en cada párrafo; no salgas de la primera persona cuando el contexto lo requiera.
3. Usa el outline y las referencias del conocimiento de la Biblioteca Viva cuando se proporcionen; cita ideas, no inventes cifras, fechas ni hechos verificables.
4. NO inventes referencias bíblicas, citas, datos ni estadísticas. Si un dato no está en el contexto, omítelo o generaliza.
5. NO reveles que eres una IA dentro del contenido del libro.
6. Un capítulo terminado debe tener entre 400 y 1500 palabras salvo instrucción contraria.
7. Evita la repetición y las muletillas. Respeta el esquema de capítulos del outline.
8. Termina cada capítulo con una idea que enlace con el siguiente cuando sea apropiado.`
}

export function buildOutlinePrompt(book: AuthorBookContext): string {
  return `Crea un outline (esquema) de libro en español.

Título: ${book.title}${book.subtitle ? `\nSubtítulo: ${book.subtitle}` : ""}
Propósito: ${book.purpose?.trim() || "Transmitir una enseñanza transformadora"}
Lector objetivo: ${book.targetReader?.trim() || "Público hispanohablante interesado en crecimiento personal y espiritual"}

${book.outline?.trim() ? `Outline actual (si lo hay, revísalo y mejóralo manteniendo su estructura):\n${book.outline.trim()}` : ""}

Devuelve SOLO el outline en markdown con:
- Una línea de "Propósito" del libro.
- Una línea de "Lector objetivo".
- Una lista numerada "## Capítulos" donde cada capítulo tenga un título y, debajo, de 2 a 4 secciones ("### ") con una frase de qué cubre cada una.
Sin introducción ni comentarios adicionales.`
}

export function buildChapterPrompt(book: AuthorBookContext, chapter: { title: string; number: number; summary?: string }, instructions?: string, ragContext?: string): string {
  return `Escribe el capítulo ${chapter.number} del libro titulado "**${book.title}**".

CAPÍTULO: ${chapter.title}${chapter.summary?.trim() ? `\nRESUMEN DEL CAPÍTULO:\n${chapter.summary.trim()}` : ""}
${book.outline?.trim() ? `\nOUTLINE DEL LIBRO (sigue esta estructura):\n${book.outline.trim()}` : ""}
${instructions?.trim() ? `\nINSTRUCCIONES DEL AUTOR:\n${instructions.trim()}` : ""}
${ragContext?.trim() ? `\nREFERENCIAS DE LA BIBLIOTECA VIVA (úsalas para ideas y fidelidad; no inventes datos):\n${ragContext.trim()}` : ""}

Devuelve el contenido del capítulo en markdown: empieza con "## " o "### " para las secciones internas. No repitas el título del libro ni el número de capítulo como encabezado superior.`
}

export function buildSectionPrompt(book: AuthorBookContext, chapter: { title: string; number: number }, section: { title: string; number: number }, instructions?: string, ragContext?: string): string {
  return `Escribe la sección ${section.number} del capítulo "${chapter.title}" (capítulo ${chapter.number}) del libro "**${book.title}**".

SECCIÓN: ${section.title}
${book.outline?.trim() ? `\nOUTLINE DEL LIBRO (contexto):\n${book.outline.trim()}` : ""}
${instructions?.trim() ? `\nINSTRUCCIONES DEL AUTOR:\n${instructions.trim()}` : ""}
${ragContext?.trim() ? `\nREFERENCIAS DE LA BIBLIOTECA VIVA (úsalas para ideas y fidelidad; no inventes datos):\n${ragContext.trim()}` : ""}

Devuelve SOLO el contenido de la sección en prosa (entre 150 y 700 palabras). No incluyas encabezado.`
}
