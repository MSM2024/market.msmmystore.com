'use client'

const PTS_KEY = "zafiro_pts"
const STREAK_KEY = "zafiro_streak"
const EARNED_BADGES_KEY = "zafiro_earned_badges"
const DAILY_ACTIONS_KEY = "zafiro_daily_actions"

export interface PTSAccount {
  userId: string
  balance: number
  totalEarned: number
  totalSpent: number
  level: number
  levelProgress: number
  nextLevelAt: number
}

export interface DailyAction {
  action: string
  count: number
  date: string
}

export type RewardAction =
  | "create_question" | "answer_question" | "received_like"
  | "explore_sponsor" | "create_sponsor_campaign" | "daily_login"
  | "join_circle" | "refer_friend" | "streak_7_days" | "answer_accepted"
  | "referral_bonus"

const ACTION_REWARDS: Record<RewardAction, { pts: number; dailyMax: number; label: string }> = {
  create_question: { pts: 100, dailyMax: 5, label: "Crear una pregunta" },
  answer_question: { pts: 50, dailyMax: 10, label: "Responder una pregunta" },
  received_like: { pts: 10, dailyMax: 999, label: "Recibir like en respuesta" },
  explore_sponsor: { pts: 50, dailyMax: 3, label: "Explorar un sponsor" },
  create_sponsor_campaign: { pts: 500, dailyMax: 1, label: "Crear campaña sponsor" },
  daily_login: { pts: 25, dailyMax: 1, label: "Inicio de sesión diario" },
  join_circle: { pts: 75, dailyMax: 5, label: "Unirte a un círculo" },
  refer_friend: { pts: 200, dailyMax: 999, label: "Referir un amigo" },
  streak_7_days: { pts: 500, dailyMax: 1, label: "Racha de 7 días" },
  answer_accepted: { pts: 30, dailyMax: 999, label: "Respuesta aceptada" },
  referral_bonus: { pts: 100, dailyMax: 999, label: "Bono por referido" },
}

const LEVEL_THRESHOLDS = [0, 1000, 3000, 7000, 15000, 30000, 60000, 100000, 200000, 500000]

const BADGE_DEFS = [
  { id: "first_question", name: "Primera Pregunta", desc: "Publicaste tu primera pregunta", icon: "Star" },
  { id: "streak_7", name: "Racha de 7 Días", desc: "Actividad continua por 7 días", icon: "Flame" },
  { id: "explorer", name: "Explorador", desc: "Visitaste todas las secciones", icon: "Compass" },
  { id: "collaborator", name: "Colaborador", desc: "Respondiste 10 preguntas", icon: "Users" },
  { id: "sponsor", name: "Patrocinador", desc: "Creaste una campaña sponsor", icon: "Target" },
  { id: "legend", name: "Leyenda", desc: "Alcanzaste 100,000 PTS", icon: "Trophy" },
  { id: "circle_full", name: "Círculo Completo", desc: "Eres miembro de 5 círculos", icon: "Users" },
  { id: "mentor", name: "Mentor", desc: "Tu respuesta recibió 100 likes", icon: "Award" },
]

function getToday(): string {
  return new Date().toISOString().split("T")[0]
}

function getAccounts(): Record<string, PTSAccount> {
  if (typeof window === "undefined") return {}
  try { return JSON.parse(localStorage.getItem(PTS_KEY) || "{}") } catch { return {} }
}

function saveAccounts(accounts: Record<string, PTSAccount>) {
  localStorage.setItem(PTS_KEY, JSON.stringify(accounts))
}

function getOrCreateAccount(userId: string): PTSAccount {
  const accounts = getAccounts()
  if (!accounts[userId]) {
    accounts[userId] = { userId, balance: 0, totalEarned: 0, totalSpent: 0, level: 1, levelProgress: 0, nextLevelAt: LEVEL_THRESHOLDS[1] }
    saveAccounts(accounts)
  }
  return accounts[userId]
}

function recalcLevel(account: PTSAccount): PTSAccount {
  let level = 0
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (account.totalEarned >= LEVEL_THRESHOLDS[i]) { level = i + 1; break }
  }
  account.level = level || 1
  const currentThreshold = LEVEL_THRESHOLDS[Math.max(0, account.level - 1)]
  const nextThreshold = LEVEL_THRESHOLDS[Math.min(LEVEL_THRESHOLDS.length - 1, account.level)]
  account.nextLevelAt = nextThreshold
  account.levelProgress = nextThreshold > currentThreshold
    ? Math.min(100, Math.round(((account.totalEarned - currentThreshold) / (nextThreshold - currentThreshold)) * 100))
    : 100
  return account
}

export function earnPTS(userId: string, action: RewardAction): { ok: boolean; pts: number; error?: string } {
  const actionDef = ACTION_REWARDS[action]
  if (!actionDef) return { ok: false, pts: 0, error: "Acción inválida" }

  const dailyActions: Record<string, Record<string, DailyAction[]>> =
    JSON.parse(localStorage.getItem(DAILY_ACTIONS_KEY) || "{}")
  const today = getToday()
  const userDaily = dailyActions[userId] || {}
  const todayActions = userDaily[today] || []
  const actionCount = todayActions.filter((a) => a.action === action).length

  if (actionCount >= actionDef.dailyMax) {
    return { ok: false, pts: 0, error: `Límite diario alcanzado para: ${actionDef.label}` }
  }

  todayActions.push({ action, count: actionCount + 1, date: today })
  userDaily[today] = todayActions
  dailyActions[userId] = userDaily
  localStorage.setItem(DAILY_ACTIONS_KEY, JSON.stringify(dailyActions))

  const account = getOrCreateAccount(userId)
  account.balance += actionDef.pts
  account.totalEarned += actionDef.pts
  recalcLevel(account)
  const accounts = getAccounts()
  accounts[userId] = account
  saveAccounts(accounts)

  return { ok: true, pts: actionDef.pts }
}

export function spendPTS(userId: string, amount: number, concept: string): { ok: boolean; error?: string } {
  const account = getOrCreateAccount(userId)
  if (account.balance < amount) return { ok: false, error: "PTS insuficientes" }
  account.balance -= amount
  account.totalSpent += amount
  const accounts = getAccounts()
  accounts[userId] = account
  saveAccounts(accounts)
  return { ok: true }
}

export function getPTSAccount(userId: string): PTSAccount {
  const account = getOrCreateAccount(userId)
  recalcLevel(account)
  return account
}

export function getStreak(userId: string): number {
  if (typeof window === "undefined") return 0
  const streaks: Record<string, { streak: number; lastDate: string }> =
    JSON.parse(localStorage.getItem(STREAK_KEY) || "{}")
  const s = streaks[userId]
  if (!s) return 0
  const today = getToday()
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0]
  if (s.lastDate === today || s.lastDate === yesterday) return s.streak
  return 0
}

export function markDailyLogin(userId: string): number {
  if (typeof window === "undefined") return 0
  const streaks: Record<string, { streak: number; lastDate: string }> =
    JSON.parse(localStorage.getItem(STREAK_KEY) || "{}")
  const today = getToday()
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0]
  const s = streaks[userId]
  let newStreak = 1
  if (s && s.lastDate === yesterday) newStreak = s.streak + 1
  else if (s && s.lastDate === today) newStreak = s.streak
  streaks[userId] = { streak: newStreak, lastDate: today }
  localStorage.setItem(STREAK_KEY, JSON.stringify(streaks))
  earnPTS(userId, "daily_login")
  if (newStreak > 0 && newStreak % 7 === 0) earnPTS(userId, "streak_7_days")
  return newStreak
}

export function getEarnedBadges(userId: string): string[] {
  if (typeof window === "undefined") return []
  try { return JSON.parse(localStorage.getItem(EARNED_BADGES_KEY) || "{}")[userId] || [] } catch { return [] }
}

export function checkAndAwardBadges(userId: string): string[] {
  const account = getOrCreateAccount(userId)
  const earned: string[] = getEarnedBadges(userId)
  const allBadges: string[] = []
  BADGE_DEFS.forEach((b) => {
    if (earned.includes(b.id)) { allBadges.push(b.id); return }
    let award = false
    if (b.id === "first_question") award = account.totalEarned >= 100
    else if (b.id === "streak_7") award = getStreak(userId) >= 7
    else if (b.id === "legend") award = account.totalEarned >= 100000
    else if (b.id === "collaborator") award = account.totalEarned >= 500
    else award = account.totalEarned >= 200
    if (award) { earned.push(b.id); allBadges.push(b.id) }
  })
  const all: Record<string, string[]> = JSON.parse(localStorage.getItem(EARNED_BADGES_KEY) || "{}")
  all[userId] = earned
  localStorage.setItem(EARNED_BADGES_KEY, JSON.stringify(all))
  return allBadges
}

export { ACTION_REWARDS, BADGE_DEFS }
