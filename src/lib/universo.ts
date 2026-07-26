'use client'

import { getProfileByUsername, getProfile, getAllUsernames as getProfilesUsernames, type UserProfile, seedMiguelProfile } from "./profile"

export type PlatformType =
  | "youtube" | "instagram" | "tiktok" | "twitter" | "facebook"
  | "linkedin" | "telegram" | "whatsapp" | "google" | "google-drive"
  | "blog" | "podcast" | "github" | "website" | "store" | "app"
  | "pinterest" | "venmo" | "trustpilot" | "email" | "other"

export type ContentType =
  | "video" | "photo" | "post" | "channel" | "social" | "code"
  | "shop" | "podcast" | "blog" | "document" | "app" | "music"
  | "book" | "payment" | "service" | "other"

export interface ElianaAnalysis {
  summary: string
  categories: string[]
  tags: string[]
  topics: string[]
  keywords: string[]
  knowledgeMapConnections: string[]
  lastAnalysis: string
}

export interface ConnectedPlatform {
  id: string
  type: PlatformType
  url: string
  title: string
  description: string
  image: string
  category: string
  tags: string[]
  summary: string
  stats: Record<string, number>
  connectedAt: string
  lastSync: string
  isActive: boolean
  isVerified: boolean
  contentType: ContentType
  elianaAnalysis: ElianaAnalysis | null
  userId: string
}

export const PLATFORM_META: Record<PlatformType, { label: string; icon: string; color: string }> = {
  youtube: { label: "YouTube", icon: "▶", color: "text-red-400" },
  instagram: { label: "Instagram", icon: "📷", color: "text-pink-400" },
  tiktok: { label: "TikTok", icon: "♪", color: "text-cyan-300" },
  twitter: { label: "X", icon: "𝕏", color: "text-slate-200" },
  facebook: { label: "Facebook", icon: "f", color: "text-blue-400" },
  linkedin: { label: "LinkedIn", icon: "in", color: "text-blue-300" },
  telegram: { label: "Telegram", icon: "✈", color: "text-sky-400" },
  whatsapp: { label: "WhatsApp", icon: "💬", color: "text-emerald-400" },
  google: { label: "Google", icon: "G", color: "text-blue-400" },
  "google-drive": { label: "Google Drive", icon: "▤", color: "text-yellow-400" },
  blog: { label: "Blog", icon: "✎", color: "text-amber-400" },
  podcast: { label: "Podcast", icon: "🎙", color: "text-purple-400" },
  github: { label: "GitHub", icon: "⌘", color: "text-slate-100" },
  website: { label: "Sitio Web", icon: "🌐", color: "text-[#00D9FF]" },
  store: { label: "Tienda", icon: "🛒", color: "text-emerald-400" },
  app: { label: "App Propia", icon: "📱", color: "text-indigo-400" },
  pinterest: { label: "Pinterest", icon: "📌", color: "text-red-500" },
  venmo: { label: "Venmo", icon: "V", color: "text-blue-500" },
  trustpilot: { label: "Trustpilot", icon: "★", color: "text-emerald-500" },
  email: { label: "Email", icon: "✉", color: "text-amber-400" },
  other: { label: "Enlace Externo", icon: "🔗", color: "text-slate-400" },
}

export const CONTENT_LABELS: Record<ContentType, string> = {
  video: "Video",
  photo: "Foto",
  post: "Publicación",
  channel: "Canal",
  social: "Red Social",
  code: "Código",
  shop: "Tienda",
  podcast: "Podcast",
  blog: "Blog",
  document: "Documento",
  app: "Aplicación",
  music: "Música",
  book: "Libro",
  payment: "Pago",
  service: "Servicio",
  other: "Otro",
}

const STORAGE_KEY = "zafiro_universo"

export function getPlatforms(userId: string): ConnectedPlatform[] {
  if (typeof window === "undefined") return []
  try {
    const all: ConnectedPlatform[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")
    return all.filter(p => p.userId === userId)
  } catch {
    return []
  }
}

export function addPlatform(platform: Omit<ConnectedPlatform, "id" | "connectedAt" | "lastSync">): ConnectedPlatform {
  const all: ConnectedPlatform[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")
  const entry: ConnectedPlatform = {
    ...platform,
    id: `uni_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    connectedAt: new Date().toISOString(),
    lastSync: new Date().toISOString(),
  }
  all.push(entry)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
  return entry
}

export function updatePlatform(id: string, updates: Partial<ConnectedPlatform>): ConnectedPlatform | null {
  const all: ConnectedPlatform[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")
  const idx = all.findIndex(p => p.id === id)
  if (idx === -1) return null
  all[idx] = { ...all[idx], ...updates, lastSync: new Date().toISOString() }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
  return all[idx]
}

export function removePlatform(id: string): void {
  const all: ConnectedPlatform[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all.filter(p => p.id !== id)))
}

export function toggleVisibility(id: string): ConnectedPlatform | null {
  const all: ConnectedPlatform[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")
  const idx = all.findIndex(p => p.id === id)
  if (idx === -1) return null
  all[idx].isActive = !all[idx].isActive
  all[idx].lastSync = new Date().toISOString()
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
  return all[idx]
}

export function reorderPlatforms(userId: string, orderedIds: string[]): void {
  const all: ConnectedPlatform[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")
  const userPlatforms = all.filter(p => p.userId === userId)
  const others = all.filter(p => p.userId !== userId)
  const map = new Map(userPlatforms.map(p => [p.id, p]))
  const reordered = orderedIds.map(id => map.get(id)).filter((p): p is ConnectedPlatform => !!p)
  const remaining = userPlatforms.filter(p => !orderedIds.includes(p.id))
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...others, ...reordered, ...remaining]))
}

export function importFromLinktree(userId: string, username: string): ConnectedPlatform[] {
  const now = new Date().toISOString()
  const name = username || "user"
  const links: ConnectedPlatform[] = [
    { id: `lt_facebook_${userId}`, type: "facebook", url: `https://facebook.com/${name}`, title: `${name} en Facebook`, description: "Síguenos en Facebook", image: "", category: "Redes Sociales", tags: ["facebook", "redes"], summary: `Perfil de ${name} en Facebook.`, stats: {}, connectedAt: now, lastSync: now, isActive: true, isVerified: false, contentType: "social", elianaAnalysis: { summary: `Perfil social de ${name} en Facebook.`, categories: ["Redes Sociales"], tags: ["facebook", name], topics: ["Redes Sociales"], keywords: [name, "facebook"], knowledgeMapConnections: [], lastAnalysis: now }, userId },
    { id: `lt_instagram_${userId}`, type: "instagram", url: `https://instagram.com/${name}`, title: `@${name}`, description: "Contenido visual", image: "", category: "Redes Sociales", tags: ["instagram", "visual"], summary: `Feed de Instagram de ${name}.`, stats: {}, connectedAt: now, lastSync: now, isActive: true, isVerified: false, contentType: "photo", elianaAnalysis: { summary: `Galería visual de ${name} en Instagram.`, categories: ["Redes Sociales"], tags: ["instagram", name], topics: ["Contenido Visual"], keywords: [name, "instagram"], knowledgeMapConnections: [], lastAnalysis: now }, userId },
    { id: `lt_tiktok_${userId}`, type: "tiktok", url: `https://tiktok.com/@${name}`, title: `@${name}`, description: "Videos cortos", image: "", category: "Redes Sociales", tags: ["tiktok", "viral"], summary: `TikTok de ${name}.`, stats: {}, connectedAt: now, lastSync: now, isActive: true, isVerified: false, contentType: "video", elianaAnalysis: { summary: `Contenido de ${name} en TikTok.`, categories: ["Redes Sociales"], tags: ["tiktok", name], topics: ["Tendencias"], keywords: [name, "tiktok"], knowledgeMapConnections: [], lastAnalysis: now }, userId },
    { id: `lt_x_${userId}`, type: "twitter", url: `https://x.com/${name}`, title: `@${name}`, description: "Actualizaciones", image: "", category: "Redes Sociales", tags: ["x", "twitter"], summary: `Perfil en X de ${name}.`, stats: {}, connectedAt: now, lastSync: now, isActive: true, isVerified: false, contentType: "social", elianaAnalysis: { summary: `Presencia en X de ${name}.`, categories: ["Redes Sociales"], tags: ["x", name], topics: ["Actualizaciones"], keywords: [name, "x"], knowledgeMapConnections: [], lastAnalysis: now }, userId },
  ]

  const all: ConnectedPlatform[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")
  const filtered = all.filter(p => p.userId !== userId || !p.id.startsWith("lt_"))
  filtered.push(...links)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
  return links
}

export function analyzeWithEliana(platform: ConnectedPlatform): ElianaAnalysis {
  return {
    summary: platform.elianaAnalysis?.summary || `Conexión a ${PLATFORM_META[platform.type].label}: ${platform.title}.`,
    categories: platform.elianaAnalysis?.categories || [platform.category],
    tags: platform.elianaAnalysis?.tags || platform.tags,
    topics: platform.elianaAnalysis?.topics || ["General"],
    keywords: platform.elianaAnalysis?.keywords || [platform.title],
    knowledgeMapConnections: platform.elianaAnalysis?.knowledgeMapConnections || ["Ecosistema Digital"],
    lastAnalysis: new Date().toISOString(),
  }
}

export function getAllConnectedUsers(): { userId: string; name: string; username: string }[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem("zafiro_creator_profiles")
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function getCreatorProfile(username: string): {
  name: string; username: string; bio: string; image: string;
  joinedAt: string; location: string; title: string;
  points: number; streak: number; achievements: number;
  followers: number; communities: number;
  platforms: ConnectedPlatform[];
} | null {
  const profile = getProfileByUsername(username)
  if (profile) {
    const platforms: ConnectedPlatform[] = typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]").filter((p: ConnectedPlatform) => p.userId === profile.userId)
      : []
    return {
      name: profile.publicName || profile.name,
      username: profile.username,
      bio: profile.bioShort || profile.bioLong,
      image: profile.avatar,
      joinedAt: profile.joinedAt,
      location: profile.location,
      title: profile.title,
      points: profile.points,
      streak: profile.streak,
      achievements: profile.achievements,
      followers: profile.followers,
      communities: profile.communities,
      platforms,
    }
  }
  if (username === "msmmystore") {
    const miguel = seedMiguelProfile()
    const platforms: ConnectedPlatform[] = typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]").filter((p: ConnectedPlatform) => p.userId === miguel.userId)
      : []
    return {
      name: miguel.publicName || miguel.name, username: miguel.username,
      bio: miguel.bioShort, image: miguel.avatar,
      joinedAt: miguel.joinedAt, location: miguel.location, title: miguel.title,
      points: miguel.points, streak: miguel.streak, achievements: miguel.achievements,
      followers: miguel.followers, communities: miguel.communities,
      platforms,
    }
  }
  return null
}
