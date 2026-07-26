'use client'

export interface Comentario {
  id: string
  platformId: string
  userId: string
  userName: string
  text: string
  createdAt: string
}

const STORAGE_KEY = "zafiro_comentarios"

export function getComments(platformId: string): Comentario[] {
  if (typeof window === "undefined") return []
  try {
    const all: Comentario[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")
    return all.filter(c => c.platformId === platformId).sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  } catch {
    return []
  }
}

export function addComment(platformId: string, userId: string, userName: string, text: string): Comentario {
  const all: Comentario[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")
  const comment: Comentario = {
    id: `com_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    platformId, userId, userName,
    text: text.trim(),
    createdAt: new Date().toISOString(),
  }
  all.push(comment)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
  return comment
}

export interface Publicacion {
  id: string
  platformId: string
  platformType: string
  title: string
  description: string
  image: string
  url: string
  publishedAt: string
  summary: string
  tags: string[]
}

const POSTS_KEY = "zafiro_publicaciones"

export function getPublicaciones(userId: string): Publicacion[] {
  if (typeof window === "undefined") return []
  try {
    const all: Publicacion[] = JSON.parse(localStorage.getItem(POSTS_KEY) || "[]")
    return all.filter(p => p.platformId.includes(userId)).sort((a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    )
  } catch {
    return []
  }
}

export function getDefaultPublicaciones(userId: string): Publicacion[] {
  return [
    {
      id: `post_yt_${userId}`, platformId: `lt_youtube_${userId}`, platformType: "youtube",
      title: "¿Qué es ZAFIRO? — La plataforma de conocimiento vivo",
      description: "Descubre cómo ZAFIRO y ELIANA están transformando la gestión del conocimiento con inteligencia artificial.",
      image: "https://images.unsplash.com/photo-1611162616475-46b635cb6868?auto=format&fit=crop&q=80&w=400",
      url: "https://youtube.com/watch?v=example1",
      publishedAt: "2026-07-06T14:00:00Z",
      summary: "Video introductorio sobre la plataforma ZAFIRO, su núcleo sintético ELIANA y la visión de conocimiento vivo.",
      tags: ["zafiro", "eliana", "conocimiento", "ia"],
    },
    {
      id: `post_ig_${userId}`, platformId: `lt_instagram_${userId}`, platformType: "instagram",
      title: "Nuevos productos Farmasi disponibles",
      description: "Catálogo de belleza y bienestar con descuentos exclusivos para miembros de la comunidad.",
      image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&q=80&w=400",
      url: "https://instagram.com/p/example1",
      publishedAt: "2026-07-05T10:30:00Z",
      summary: "Lanzamiento de nueva línea de productos Farmasi con beneficios exclusivos para la comunidad.",
      tags: ["farmasi", "belleza", "bienestar", "nuevo"],
    },
    {
      id: `post_fb_${userId}`, platformId: `lt_facebook_${userId}`, platformType: "facebook",
      title: "Remesas a Cuba — Nuevas rutas disponibles",
      description: "Ahora puedes enviar remesas a Cuba desde más países con tarifas preferenciales.",
      image: "https://images.unsplash.com/photo-1580519542036-c47de6196ba5?auto=format&fit=crop&q=80&w=400",
      url: "https://facebook.com/msmmystore/posts/example1",
      publishedAt: "2026-07-04T09:00:00Z",
      summary: "Ampliación de rutas para envío de remesas a Cuba incluyendo USDT, CUP y MLC.",
      tags: ["remesas", "cuba", "usdt", "envíos"],
    },
    {
      id: `post_blog_${userId}`, platformId: `lt_blog_${userId}`, platformType: "blog",
      title: "El Jardín de las Visualizaciones — Capítulo 1",
      description: "Primer capítulo del libro sobre visualización creativa y manifestación consciente.",
      image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=400",
      url: "https://blog.msmmystore.com/el-jardin-de-las-visualizaciones-capitulo-1",
      publishedAt: "2026-07-03T16:00:00Z",
      summary: "Exploración del poder de la visualización creativa como herramienta de transformación personal.",
      tags: ["visualización", "crecimiento", "filosofía", "libro"],
    },
    {
      id: `post_tg_${userId}`, platformId: `lt_telegram_${userId}`, platformType: "telegram",
      title: "Oferta especial: Combo Festivo Nacional",
      description: "Esta semana: descuento del 20% en el Combo Festivo Nacional para miembros del canal.",
      image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=400",
      url: "https://t.me/msmmystor/123",
      publishedAt: "2026-07-02T12:00:00Z",
      summary: "Promoción semanal exclusiva para suscriptores del canal de Telegram.",
      tags: ["promoción", "combo", "descuento", "festivo"],
    },
  ]
}
