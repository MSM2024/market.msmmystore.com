'use client'

export interface UserProject {
  id: string
  name: string
  description: string
  url: string
  status: "activo" | "beta" | "próximamente"
  icon: string
  color: string
  tags: string[]
}

export interface SocialLink {
  id: string
  platform: string
  url: string
  label: string
}

export interface UserProfile {
  userId: string
  name: string
  publicName: string
  username: string
  title: string
  company: string
  location: string
  website: string
  linktree: string
  roles: string[]
  bioShort: string
  bioLong: string
  avatar: string
  coverImage: string
  email: string
  joinedAt: string
  points: number
  streak: number
  level: string
  followers: number
  following: number
  questions: number
  answers: number
  communities: number
  achievements: number
  sponsors: number
  projects: number
  visits: number
  customProjects: UserProject[]
  socialLinks: SocialLink[]
}

const PROFILES_KEY = "zafiro_profiles"

function emptyProfile(): UserProfile {
  return {
    userId: "",
    name: "",
    publicName: "",
    username: "",
    title: "",
    company: "",
    location: "",
    website: "",
    linktree: "",
    roles: [],
    bioShort: "",
    bioLong: "",
    avatar: "",
    coverImage: "",
    email: "",
    joinedAt: new Date().toISOString(),
    points: 0,
    streak: 0,
    level: "Novato",
    followers: 0,
    following: 0,
    questions: 0,
    answers: 0,
    communities: 0,
    achievements: 0,
    sponsors: 0,
    projects: 0,
    visits: 0,
    customProjects: [],
    socialLinks: [],
  }
}

export function getProfiles(): Record<string, UserProfile> {
  if (typeof window === "undefined") return {}
  try {
    return JSON.parse(localStorage.getItem(PROFILES_KEY) || "{}")
  } catch {
    return {}
  }
}

function saveProfiles(profiles: Record<string, UserProfile>) {
  localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles))
}

export function getProfile(userId: string): UserProfile | null {
  const profiles = getProfiles()
  return profiles[userId] || null
}

export function getProfileByUsername(username: string): UserProfile | null {
  const profiles = getProfiles()
  for (const p of Object.values(profiles)) {
    if (p.username === username) return p
  }
  return null
}

export function updateProfile(userId: string, updates: Partial<UserProfile>): UserProfile | null {
  const profiles = getProfiles()
  if (!profiles[userId]) return null
  profiles[userId] = { ...profiles[userId], ...updates }
  saveProfiles(profiles)
  return profiles[userId]
}

export function createProfile(userId: string, email: string, name: string): UserProfile {
  const profiles = getProfiles()
  const base = emptyProfile()
  const username = name.toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9]/g, "")
  const profile: UserProfile = {
    ...base,
    userId,
    name,
    email,
    username,
    joinedAt: new Date().toISOString(),
  }
  profiles[userId] = profile
  saveProfiles(profiles)
  return profile
}

export function getAllUsernames(): { userId: string; name: string; username: string }[] {
  const profiles = getProfiles()
  return Object.values(profiles).map(p => ({ userId: p.userId, name: p.name, username: p.username }))
}

export function addProject(userId: string, project: Omit<UserProject, "id">): UserProject | null {
  const profiles = getProfiles()
  if (!profiles[userId]) return null
  const proj: UserProject = { ...project, id: `proj_${Date.now()}_${Math.random().toString(36).slice(2, 7)}` }
  profiles[userId].customProjects.push(proj)
  profiles[userId].projects = profiles[userId].customProjects.length
  saveProfiles(profiles)
  return proj
}

export function updateProject(userId: string, projectId: string, updates: Partial<UserProject>): UserProject | null {
  const profiles = getProfiles()
  if (!profiles[userId]) return null
  const idx = profiles[userId].customProjects.findIndex(p => p.id === projectId)
  if (idx === -1) return null
  profiles[userId].customProjects[idx] = { ...profiles[userId].customProjects[idx], ...updates }
  saveProfiles(profiles)
  return profiles[userId].customProjects[idx]
}

export function removeProject(userId: string, projectId: string): boolean {
  const profiles = getProfiles()
  if (!profiles[userId]) return false
  profiles[userId].customProjects = profiles[userId].customProjects.filter(p => p.id !== projectId)
  profiles[userId].projects = profiles[userId].customProjects.length
  saveProfiles(profiles)
  return true
}

export function addSocialLink(userId: string, link: Omit<SocialLink, "id">): SocialLink | null {
  const profiles = getProfiles()
  if (!profiles[userId]) return null
  const sl: SocialLink = { ...link, id: `sl_${Date.now()}_${Math.random().toString(36).slice(2, 7)}` }
  profiles[userId].socialLinks.push(sl)
  saveProfiles(profiles)
  return sl
}

export function updateSocialLink(userId: string, linkId: string, updates: Partial<SocialLink>): SocialLink | null {
  const profiles = getProfiles()
  if (!profiles[userId]) return null
  const idx = profiles[userId].socialLinks.findIndex(l => l.id === linkId)
  if (idx === -1) return null
  profiles[userId].socialLinks[idx] = { ...profiles[userId].socialLinks[idx], ...updates }
  saveProfiles(profiles)
  return profiles[userId].socialLinks[idx]
}

export function removeSocialLink(userId: string, linkId: string): boolean {
  const profiles = getProfiles()
  if (!profiles[userId]) return false
  profiles[userId].socialLinks = profiles[userId].socialLinks.filter(l => l.id !== linkId)
  saveProfiles(profiles)
  return true
}

export function seedMiguelProfile(): UserProfile {
  const profiles = getProfiles()
  const userId = "seed_miguel"
  if (profiles[userId]) return profiles[userId]

  const profile: UserProfile = {
    userId,
    name: "Miguel Soria Martínez",
    publicName: "Yo Soy Don Miguel",
    username: "msmmystore",
    title: "CEO | Fundador de MSM MY STORE LLC",
    company: "MSM MY STORE LLC",
    location: "Port St. Lucie, Florida, USA",
    website: "https://msmmystore.com",
    linktree: "https://linktr.ee/msmmystore",
    roles: ["Creador", "Emprendedor", "Visionario", "Inventor", "Fundador del ecosistema MSM"],
    bioShort: "Creador de MSM MY STORE LLC y del ecosistema MSM. Emprendedor, visionario e inventor construyendo plataformas digitales con inteligencia artificial, comercio, conocimiento, propósito y tecnología para conectar personas, proyectos y oportunidades.",
    bioLong: "Soy Miguel Soria Martínez, fundador de MSM MY STORE LLC y creador del ecosistema MSM. Trabajo en la construcción de ZAFIRO, MSM Marketplace, Álbum de la Vida, MSM Mente Maestra, ELIANA y futuras aplicaciones conectadas bajo una sola identidad digital. Mi visión es crear herramientas que ayuden a las personas a aprender, emprender, conectar, vender, recordar, crecer y construir propósito con tecnología e inteligencia artificial.",
    avatar: "",
    coverImage: "",
    email: "msmmystore@gmail.com",
    joinedAt: "2023-04-25",
    points: 12500,
    streak: 45,
    level: "Diamante",
    followers: 1280,
    following: 28,
    questions: 47,
    answers: 156,
    communities: 4,
    achievements: 7,
    sponsors: 3,
    projects: 5,
    visits: 8200,
    customProjects: [
      { id: "proj_zafiro", name: "ZAFIRO", description: "Red Social del Conocimiento impulsada por Inteligencia Artificial", url: "https://zafiro.com", status: "activo", icon: "💎", color: "text-[#00D9FF]", tags: ["ia", "conocimiento", "red-social"] },
      { id: "proj_marketplace", name: "MSM Marketplace", description: "Plataforma de comercio digital del ecosistema MSM", url: "https://msmmystore.com", status: "beta", icon: "🏪", color: "text-amber-400", tags: ["comercio", "marketplace"] },
      { id: "proj_album", name: "Álbum de la Vida", description: "Plataforma para preservar recuerdos, historias familiares y legado", url: "https://blog.msmmystore.com", status: "activo", icon: "📓", color: "text-purple-400", tags: ["memorias", "legado", "familia"] },
      { id: "proj_mente", name: "MSM Mente Maestra", description: "Plataforma de crecimiento, disciplina, propósito y comunidad", url: "https://t.me/msmmystor", status: "activo", icon: "🧠", color: "text-indigo-400", tags: ["crecimiento", "comunidad", "disciplina"] },
      { id: "proj_eliana", name: "ELIANA", description: "Asistente virtual e inteligencia central del ecosistema MSM", url: "https://elianamsm.com", status: "activo", icon: "✨", color: "text-cyan-300", tags: ["ia", "asistente", "inteligencia"] },
    ],
    socialLinks: [
      { id: "sl_website", platform: "Sitio Web", url: "https://msmmystore.com", label: "MSM My Store" },
      { id: "sl_linktree", platform: "Linktree", url: "https://linktr.ee/msmmystore", label: "Linktree MSM" },
      { id: "sl_blog", platform: "Blog", url: "https://blog.msmmystore.com", label: "Blog MSM" },
      { id: "sl_eliana_web", platform: "ELIANA Web", url: "https://elianamsm.com", label: "ELIANA" },
      { id: "sl_wa_promos", platform: "WhatsApp", url: "https://whatsapp.com/channel/0029VbAdHwtHwXbDhKRsZv2t", label: "Canal WhatsApp Promos" },
      { id: "sl_wa_capacitacion", platform: "WhatsApp", url: "https://whatsapp.com/channel/0029VbB4UZG0AgWAXr7pIl3b", label: "Canal WhatsApp Capacitación MSM" },
      { id: "sl_wa_elevacion", platform: "WhatsApp", url: "https://whatsapp.com/channel/0029Vb6lXMRICVfk2mqq1n3i", label: "Canal WhatsApp Elevación Consciente" },
    ],
  }
  profiles[userId] = profile
  saveProfiles(profiles)
  return profile
}
