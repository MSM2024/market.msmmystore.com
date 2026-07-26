'use client'

import { earnPTS } from "./rewards"

const REFERRAL_CODES_KEY = "zafiro_referral_codes"
const REFERRAL_TRACKING_KEY = "zafiro_referral_tracking"
const REFERRAL_BONUS_PTS = 100

export interface ReferralCode {
  userId: string
  code: string
  createdAt: string
}

export interface ReferralRecord {
  referrerUserId: string
  referredUserId: string
  referredEmail: string
  bonusAwarded: number
  createdAt: string
}

function getCodes(): ReferralCode[] {
  if (typeof window === "undefined") return []
  try { return JSON.parse(localStorage.getItem(REFERRAL_CODES_KEY) || "[]") } catch { return [] }
}

function saveCodes(codes: ReferralCode[]) {
  localStorage.setItem(REFERRAL_CODES_KEY, JSON.stringify(codes))
}

function getTracking(): ReferralRecord[] {
  if (typeof window === "undefined") return []
  try { return JSON.parse(localStorage.getItem(REFERRAL_TRACKING_KEY) || "[]") } catch { return [] }
}

function saveTracking(t: ReferralRecord[]) {
  localStorage.setItem(REFERRAL_TRACKING_KEY, JSON.stringify(t))
}

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let code = ""
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

export function generateReferralCode(userId: string): ReferralCode {
  const codes = getCodes()
  const existing = codes.find((c) => c.userId === userId)
  if (existing) return existing
  let code = generateCode()
  while (codes.find((c) => c.code === code)) code = generateCode()
  const entry: ReferralCode = { userId, code, createdAt: new Date().toISOString() }
  codes.push(entry)
  saveCodes(codes)
  return entry
}

export function getReferralCode(userId: string): ReferralCode | null {
  return getCodes().find((c) => c.userId === userId) || null
}

export function getReferralCodeByCode(code: string): ReferralCode | null {
  return getCodes().find((c) => c.code === code.toUpperCase()) || null
}

export function applyReferralCode(code: string, newUserId: string, newEmail: string): { ok: boolean; error?: string } {
  const referral = getReferralCodeByCode(code)
  if (!referral) return { ok: false, error: "Código de referido inválido" }
  if (referral.userId === newUserId) return { ok: false, error: "No puedes usar tu propio código" }
  const tracking = getTracking()
  const alreadyReferred = tracking.find(
    (r) => r.referredEmail === newEmail || r.referredUserId === newUserId
  )
  if (alreadyReferred) return { ok: false, error: "Este usuario ya fue referido" }
  const record: ReferralRecord = {
    referrerUserId: referral.userId,
    referredUserId: newUserId,
    referredEmail: newEmail,
    bonusAwarded: REFERRAL_BONUS_PTS,
    createdAt: new Date().toISOString(),
  }
  tracking.push(record)
  saveTracking(tracking)
  earnPTS(referral.userId, "referral_bonus")
  return { ok: true }
}

export function getReferrals(userId: string): ReferralRecord[] {
  return getTracking().filter((r) => r.referrerUserId === userId)
}

export function getReferralEarnings(userId: string): number {
  return getTracking()
    .filter((r) => r.referrerUserId === userId)
    .reduce((sum, r) => sum + r.bonusAwarded, 0)
}

export function getReferralCount(userId: string): number {
  return getTracking().filter((r) => r.referrerUserId === userId).length
}
