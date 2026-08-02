'use client'

import { getSupabaseClient } from '@/lib/supabase'
import type { CouncilGuide, CouncilTeaching, CouncilSession, CouncilGoal, CouncilJournalEntry, CouncilPrayer, CouncilAudioFile } from './types'

function getClient() {
  return getSupabaseClient()
}

// ================================================================
// GUIDES
// ================================================================

export async function getGuides(): Promise<CouncilGuide[]> {
  const sb = getClient()
  if (!sb) return []
  const { data } = await sb
    .from('invisible_council_guides')
    .select('*')
    .order('guide_number', { ascending: true })
  return (data as CouncilGuide[]) || []
}

export async function getGuideByNumber(num: number): Promise<CouncilGuide | null> {
  const sb = getClient()
  if (!sb) return null
  const { data } = await sb
    .from('invisible_council_guides')
    .select('*')
    .eq('guide_number', num)
    .single()
  return (data as CouncilGuide) || null
}

export async function confirmGuide(id: string, displayName: string, category: string): Promise<boolean> {
  const sb = getClient()
  if (!sb) return false
  const { error } = await sb
    .from('invisible_council_guides')
    .update({
      display_name: displayName,
      category,
      status: 'confirmed',
      is_confirmed: true,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
  return !error
}

// ================================================================
// TEACHINGS
// ================================================================

export async function getTeachings(): Promise<CouncilTeaching[]> {
  const sb = getClient()
  if (!sb) return []
  const { data } = await sb
    .from('invisible_council_teachings')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
  return (data as CouncilTeaching[]) || []
}

export async function getTeachingsByGuide(guideId: string): Promise<CouncilTeaching[]> {
  const sb = getClient()
  if (!sb) return []
  const { data } = await sb
    .from('invisible_council_teachings')
    .select('*')
    .eq('guide_id', guideId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
  return (data as CouncilTeaching[]) || []
}

// ================================================================
// SESSIONS
// ================================================================

export async function getSessions(): Promise<CouncilSession[]> {
  const sb = getClient()
  if (!sb) return []
  const { data } = await sb
    .from('invisible_council_sessions')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
  return (data as CouncilSession[]) || []
}

export async function createSession(session: Partial<CouncilSession>): Promise<CouncilSession | null> {
  const sb = getClient()
  if (!sb) return null
  const { data } = await sb
    .from('invisible_council_sessions')
    .insert(session)
    .select()
    .single()
  return (data as CouncilSession) || null
}

// ================================================================
// GOALS
// ================================================================

export async function getGoals(): Promise<CouncilGoal[]> {
  const sb = getClient()
  if (!sb) return []
  const { data } = await sb
    .from('invisible_council_goals')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
  return (data as CouncilGoal[]) || []
}

// ================================================================
// JOURNAL
// ================================================================

export async function getJournalEntries(): Promise<CouncilJournalEntry[]> {
  const sb = getClient()
  if (!sb) return []
  const { data } = await sb
    .from('invisible_council_journal_entries')
    .select('*')
    .is('deleted_at', null)
    .order('date', { ascending: false })
  return (data as CouncilJournalEntry[]) || []
}

// ================================================================
// PRAYERS
// ================================================================

export async function getPrayers(): Promise<CouncilPrayer[]> {
  const sb = getClient()
  if (!sb) return []
  const { data } = await sb
    .from('invisible_council_prayers')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
  return (data as CouncilPrayer[]) || []
}

export async function getApprovedPrayer(): Promise<CouncilPrayer | null> {
  const sb = getClient()
  if (!sb) return null
  const { data } = await sb
    .from('invisible_council_prayers')
    .select('*')
    .eq('status', 'approved')
    .eq('type', 'prayer')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
  return (data as CouncilPrayer) || null
}

// ================================================================
// AUDIO
// ================================================================

export async function getAudioFiles(): Promise<CouncilAudioFile[]> {
  const sb = getClient()
  if (!sb) return []
  const { data } = await sb
    .from('invisible_council_audio_files')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
  return (data as CouncilAudioFile[]) || []
}
