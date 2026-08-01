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
  badges: string[]
}

export interface PublicProfile {
  id: string
  name: string
  username: string
  role: string | null
  avatar: string | null
  created_at: string | null
  status: string | null
}

export async function getProfileByUsername(username: string): Promise<PublicProfile | null> {
  try {
    const res = await fetch(`/api/profiles/by-username/${encodeURIComponent(username)}`)
    const data = await res.json()
    return data.profile || null
  } catch {
    return null
  }
}

export async function getProfileFromAPI(): Promise<UserProfile | null> {
  try {
    const res = await fetch("/api/user-profile")
    const data = await res.json()
    return data.profile || null
  } catch {
    return null
  }
}

export async function saveProfileToAPI(updates: Partial<UserProfile>): Promise<boolean> {
  try {
    await fetch("/api/user-profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    })
    return true
  } catch {
    return false
  }
}

export async function getProfile(): Promise<UserProfile | null> {
  return getProfileFromAPI()
}

export async function updateProfile(updates: Partial<UserProfile>): Promise<boolean> {
  return saveProfileToAPI(updates)
}
