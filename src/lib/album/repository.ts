import type { SupabaseClient } from "@supabase/supabase-js"

export interface AlbumFamilyRow {
  id: string
  owner_id: string
  name: string
  subtitle: string
  privacy: "solo_yo" | "familia" | "comunidad" | "publica"
  accent_color: string
  created_at: string
  updated_at: string
}

export interface AlbumMemberRow {
  id: string
  family_id: string
  parent_id: string | null
  full_name: string
  birth_date: string | null
  death_date: string | null
  bio: string
  relation: "raiz" | "pareja" | "hijo" | "otro"
  avatar_media_id: string | null
  legacy_notes: string
  sort_order: number
  created_by: string
  created_at: string
  updated_at: string
}

export interface AlbumTimelineEventRow {
  id: string
  family_id: string
  member_id: string | null
  title: string
  description: string
  event_date: string | null
  category: "nacimiento" | "boda" | "viaje" | "logro" | "recuerdo" | "otro"
  created_by: string
  created_at: string
  updated_at: string
}

export interface AlbumFamilyDetail extends AlbumFamilyRow {
  members: AlbumMemberRow[]
  events: AlbumTimelineEventRow[]
}

export interface AlbumFamilyInput {
  owner_id: string
  name: string
  subtitle?: string
  privacy?: AlbumFamilyRow["privacy"]
  accent_color?: string
}

export interface AlbumMemberInput {
  family_id: string
  created_by: string
  parent_id?: string | null
  full_name: string
  birth_date?: string | null
  death_date?: string | null
  bio?: string
  relation?: AlbumMemberRow["relation"]
  legacy_notes?: string
  sort_order?: number
}

export interface AlbumEventInput {
  family_id: string
  created_by: string
  member_id?: string | null
  title: string
  description?: string
  event_date?: string | null
  category?: AlbumTimelineEventRow["category"]
}

export class AlbumRepository {
  constructor(private readonly client: SupabaseClient | null) {}

  private get db(): SupabaseClient | null {
    return this.client
  }

  // ---------- Familias ----------
  async listFamilies(): Promise<AlbumFamilyRow[]> {
    if (!this.db) return []
    const { data } = await this.db
      .from("album_families")
      .select("*")
      .order("updated_at", { ascending: false })
    return (data ?? []) as AlbumFamilyRow[]
  }

  async getFamily(id: string): Promise<AlbumFamilyDetail | null> {
    if (!this.db) return null
    const { data: family, error } = await this.db
      .from("album_families")
      .select("*")
      .eq("id", id)
      .single()
    if (error || !family) return null
    const { data: members } = await this.db
      .from("album_members")
      .select("*")
      .eq("family_id", id)
      .order("sort_order", { ascending: true })
    const { data: events } = await this.db
      .from("album_timeline_events")
      .select("*")
      .eq("family_id", id)
      .order("event_date", { ascending: false })
    return { ...family, members: members ?? [], events: events ?? [] } as AlbumFamilyDetail
  }

  async familyOwnedBy(familyId: string, userId: string): Promise<boolean> {
    if (!this.db) return false
    const { data, error } = await this.db
      .from("album_families")
      .select("owner_id")
      .eq("id", familyId)
      .single()
    return !error && !!data && data.owner_id === userId
  }

  async createFamily(input: AlbumFamilyInput): Promise<AlbumFamilyRow | null> {
    if (!this.db) return null
    const { data, error } = await this.db
      .from("album_families")
      .insert({
        owner_id: input.owner_id,
        name: input.name,
        subtitle: input.subtitle ?? "",
        privacy: input.privacy ?? "solo_yo",
        accent_color: input.accent_color ?? "#7C3AED",
      })
      .select()
      .single()
    if (error) { console.error("Album createFamily", error); return null }
    return data as AlbumFamilyRow
  }

  async updateFamily(id: string, patch: Partial<Omit<AlbumFamilyInput, "owner_id">>): Promise<AlbumFamilyRow | null> {
    if (!this.db) return null
    const { data, error } = await this.db
      .from("album_families")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()
    if (error) { console.error("Album updateFamily", error); return null }
    return data as AlbumFamilyRow
  }

  async deleteFamily(id: string): Promise<boolean> {
    if (!this.db) return false
    const { error } = await this.db.from("album_families").delete().eq("id", id)
    if (error) { console.error("Album deleteFamily", error); return false }
    return true
  }

  // ---------- Miembros ----------
  async getMember(id: string): Promise<AlbumMemberRow | null> {
    if (!this.db) return null
    const { data } = await this.db.from("album_members").select("*").eq("id", id).single()
    return data ? (data as AlbumMemberRow) : null
  }

  async createMember(input: AlbumMemberInput): Promise<AlbumMemberRow | null> {
    if (!this.db) return null
    const { data, error } = await this.db
      .from("album_members")
      .insert({
        family_id: input.family_id,
        parent_id: input.parent_id ?? null,
        full_name: input.full_name,
        birth_date: input.birth_date ?? null,
        death_date: input.death_date ?? null,
        bio: input.bio ?? "",
        relation: input.relation ?? "hijo",
        legacy_notes: input.legacy_notes ?? "",
        sort_order: input.sort_order ?? 0,
        created_by: input.created_by,
      })
      .select()
      .single()
    if (error) { console.error("Album createMember", error); return null }
    return data as AlbumMemberRow
  }

  async updateMember(id: string, patch: Partial<Omit<AlbumMemberInput, "family_id" | "created_by">>): Promise<AlbumMemberRow | null> {
    if (!this.db) return null
    const { data, error } = await this.db
      .from("album_members")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()
    if (error) { console.error("Album updateMember", error); return null }
    return data as AlbumMemberRow
  }

  async deleteMember(id: string): Promise<boolean> {
    if (!this.db) return false
    const { error } = await this.db.from("album_members").delete().eq("id", id)
    if (error) { console.error("Album deleteMember", error); return false }
    return true
  }

  // ---------- Eventos ----------
  async getEvent(id: string): Promise<AlbumTimelineEventRow | null> {
    if (!this.db) return null
    const { data } = await this.db.from("album_timeline_events").select("*").eq("id", id).single()
    return data ? (data as AlbumTimelineEventRow) : null
  }

  async createEvent(input: AlbumEventInput): Promise<AlbumTimelineEventRow | null> {
    if (!this.db) return null
    const { data, error } = await this.db
      .from("album_timeline_events")
      .insert({
        family_id: input.family_id,
        member_id: input.member_id ?? null,
        title: input.title,
        description: input.description ?? "",
        event_date: input.event_date ?? null,
        category: input.category ?? "recuerdo",
        created_by: input.created_by,
      })
      .select()
      .single()
    if (error) { console.error("Album createEvent", error); return null }
    return data as AlbumTimelineEventRow
  }

  async updateEvent(id: string, patch: Partial<Omit<AlbumEventInput, "family_id" | "created_by">>): Promise<AlbumTimelineEventRow | null> {
    if (!this.db) return null
    const { data, error } = await this.db
      .from("album_timeline_events")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()
    if (error) { console.error("Album updateEvent", error); return null }
    return data as AlbumTimelineEventRow
  }

  async deleteEvent(id: string): Promise<boolean> {
    if (!this.db) return false
    const { error } = await this.db.from("album_timeline_events").delete().eq("id", id)
    if (error) { console.error("Album deleteEvent", error); return false }
    return true
  }
}
