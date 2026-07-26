'use client'

export interface EcosystemProject {
  id: string
  name: string
  description: string
  url: string
  icon: string
  color: string
  category: string
  tags: string[]
  status: "activo" | "beta" | "próximamente"
}

export const DEFAULT_ECOSYSTEM: EcosystemProject[] = [
  {
    id: "msm-store", name: "MSM My Store", category: "Tienda Principal",
    description: "Tienda oficial con productos Farmasi, remesas a Cuba, marketing digital y más.",
    url: "https://msmmystore.com", icon: "🛒", color: "text-emerald-400",
    tags: ["e-commerce", "remesas", "farmasi", "cuba"], status: "activo",
  },
  {
    id: "zafiro", name: "ZAFIRO", category: "Plataforma",
    description: "Plataforma inteligente de conocimiento vivo. Núcleo sintético ELIANA.",
    url: "https://zafiro.com", icon: "💎", color: "text-[#00D9FF]",
    tags: ["ia", "conocimiento", "plataforma", "eliana"], status: "activo",
  },
  {
    id: "marketplace", name: "MSM Marketplace", category: "Marketplace",
    description: "Marketplace descentralizado para la comunidad MSM.",
    url: "https://msmmystore.com", icon: "🏪", color: "text-amber-400",
    tags: ["marketplace", "comunidad", "descentralizado"], status: "beta",
  },
  {
    id: "album-vida", name: "Álbum de la Vida", category: "Contenido",
    description: "Libro: El Jardín de las Visualizaciones — filosofía y crecimiento personal.",
    url: "https://blog.msmmystore.com", icon: "📓", color: "text-purple-400",
    tags: ["libro", "visualización", "crecimiento", "filosofía"], status: "activo",
  },
  {
    id: "mente-maestra", name: "MSM Mente Maestra", category: "Comunidad",
    description: "Comunidad de mentalidad, estrategia y desarrollo personal.",
    url: "https://t.me/msmmystor", icon: "🧠", color: "text-indigo-400",
    tags: ["comunidad", "mentalidad", "estrategia"], status: "activo",
  },
  {
    id: "eliana", name: "ELIANA", category: "IA",
    description: "Núcleo sintético de inteligencia artificial de ZAFIRO.",
    url: "/", icon: "✨", color: "text-cyan-300",
    tags: ["ia", "asistente", "conocimiento", "sintético"], status: "activo",
  },
  {
    id: "blog-msm", name: "Blog MSM", category: "Contenido",
    description: "Artículos, reflexiones y contenido de valor sobre visualización y filosofía.",
    url: "https://blog.msmmystore.com", icon: "✎", color: "text-amber-400",
    tags: ["blog", "artículos", "reflexiones", "filosofía"], status: "activo",
  },
  {
    id: "remesas-cuba", name: "Remesas a Cuba", category: "Servicio",
    description: "Envío de remesas a Cuba rápido y seguro en USDT, CUP y MLC.",
    url: "https://msmmystore.com/product-category/remesas-a-cuba", icon: "💵", color: "text-green-400",
    tags: ["remesas", "cuba", "usdt", "cup", "mlc"], status: "activo",
  },
  {
    id: "farmasi-shop", name: "Farmasi MSM", category: "Tienda",
    description: "Productos de belleza y bienestar Farmasi con descuentos exclusivos.",
    url: "https://msmmystore.com/producto/compra-productos-farmasi", icon: "💄", color: "text-pink-400",
    tags: ["farmasi", "belleza", "bienestar", "afiliados"], status: "activo",
  },
  {
    id: "social-media", name: "Redes Sociales", category: "Presencia Digital",
    description: "Presencia unificada en Facebook, Instagram, TikTok, X, Telegram y más.",
    url: "/universo", icon: "🌐", color: "text-blue-400",
    tags: ["redes", "social", "presencia", "digital"], status: "activo",
  },
  {
    id: "marketing-digital", name: "Marketing y Publicidad Digital", category: "Servicio",
    description: "Servicios profesionales de marketing digital y publicidad online.",
    url: "https://msmmystore.com/product-category/marketing-y-publicidad-digital", icon: "📣", color: "text-orange-400",
    tags: ["marketing", "publicidad", "digital", "servicios"], status: "activo",
  },
  {
    id: "payment", name: "MSM Payment", category: "Fintech",
    description: "Soluciones de pago digital: Venmo, USDT y transferencias.",
    url: "https://www.venmo.com/u/msmmystore", icon: "💳", color: "text-blue-500",
    tags: ["pagos", "venmo", "usdt", "fintech"], status: "activo",
  },
]
