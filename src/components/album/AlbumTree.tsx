"use client"

import { useState } from "react"
import { Plus, User as UserIcon } from "lucide-react"
import type { AlbumFamilyDetail, AlbumMemberRow } from "@/lib/album/repository"

interface AlbumTreeProps {
  family: AlbumFamilyDetail | null
  isOwner: boolean
  onChanged: () => void
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase()
}

function formatDate(d: string | null): string {
  if (!d) return ""
  const [y, m, day] = d.split("-")
  return [day, m, y].filter(Boolean).join("/")
}

function lifeSpan(member: AlbumMemberRow): string {
  const b = formatDate(member.birth_date)
  const d = formatDate(member.death_date)
  if (b && d) return `${b} – ${d}`
  if (b) return `n. ${b}`
  return ""
}

function NodeCard({ member }: { member: AlbumMemberRow }) {
  return (
    <li className="flex flex-col items-center gap-1.5 text-center" aria-label={member.full_name}>
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-black shadow-lg shadow-purple-500/20 border border-white/10">
        {initials(member.full_name)}
      </div>
      <div className="text-center">
        <p className="text-[11px] font-bold text-white leading-tight max-w-[110px]">{member.full_name}</p>
        <p className="text-[9px] font-mono text-white/40">{lifeSpan(member)}</p>
        {member.relation !== "hijo" && (
          <span className="inline-block mt-0.5 text-[8px] font-mono uppercase tracking-wider text-purple-300/80">
            {member.relation}
          </span>
        )}
      </div>
    </li>
  )
}

function Node({ member, byParent, accent }: { member: AlbumMemberRow; byParent: Map<string | null, AlbumMemberRow[]>; accent: string }) {
  const children = byParent.get(member.id) ?? []
  return (
    <li className="flex flex-col items-center gap-3">
      <NodeCard member={member} />
      {children.length > 0 && (
        <>
          <div className="w-px h-4" style={{ backgroundColor: accent }} aria-hidden="true" />
          <ul className="flex items-start gap-4 flex-wrap justify-center">
            {children.map((c) => (
              <Node key={c.id} member={c} byParent={byParent} accent={accent} />
            ))}
          </ul>
        </>
      )}
    </li>
  )
}

const EMPTY_FORM = { full_name: "", relation: "hijo" as const, birth_date: "", parent_id: "" }

export default function AlbumTree({ family, isOwner, onChanged }: AlbumTreeProps) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  const members = family?.members ?? []
  const byParent = new Map<string | null, AlbumMemberRow[]>()
  for (const m of members) {
    const key = m.parent_id ?? null
    if (!byParent.has(key)) byParent.set(key, [])
    byParent.get(key)!.push(m)
  }
  const roots = byParent.get(null) ?? []
  const accent = family?.accent_color || "#7C3AED"

  const reset = () => { setForm(EMPTY_FORM); setShowForm(false); setError("") }

  const createMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!family || !form.full_name.trim()) return
    setBusy(true); setError("")
    try {
      const res = await fetch(`/api/album/families/${family.id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          family_id: family.id,
          full_name: form.full_name.trim(),
          relation: form.relation,
          birth_date: form.birth_date || null,
          parent_id: form.parent_id || null,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || "No se pudo añadir el miembro")
        return
      }
      reset()
      onChanged()
    } catch {
      setError("Error de conexión")
    } finally {
      setBusy(false)
    }
  }

  if (!family) {
    return (
      <div className="text-center py-16">
        <UserIcon className="w-10 h-10 text-white/20 mx-auto mb-3" />
        <p className="text-sm text-white/40">Crea o selecciona una familia para ver el árbol genealógico</p>
      </div>
    )
  }

  return (
    <section aria-label={`Árbol de ${family.name}`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold" style={{ color: accent }}>{family.name}</h2>
          {family.subtitle && <p className="text-xs text-white/40">{family.subtitle}</p>}
        </div>
        {isOwner && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600/20 border border-purple-500/30 text-purple-300 text-xs font-semibold hover:bg-purple-600/30 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Añadir miembro
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={createMember} className="mb-6 p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="member-name" className="block text-[10px] font-mono font-bold text-white/40 uppercase tracking-wider mb-1">Nombre completo *</label>
              <input id="member-name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:border-purple-500 outline-none" placeholder="Ej: Abuela Rosa" />
            </div>
            <div>
              <label htmlFor="member-relation" className="block text-[10px] font-mono font-bold text-white/40 uppercase tracking-wider mb-1">Relación</label>
              <select id="member-relation" value={form.relation} onChange={(e) => setForm({ ...form, relation: e.target.value as typeof form.relation })}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:border-purple-500 outline-none">
                <option value="hijo">Hijo/a</option>
                <option value="pareja">Pareja</option>
                <option value="raiz">Raíz</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <div>
              <label htmlFor="member-birth" className="block text-[10px] font-mono font-bold text-white/40 uppercase tracking-wider mb-1">Nacimiento</label>
              <input id="member-birth" type="date" value={form.birth_date} onChange={(e) => setForm({ ...form, birth_date: e.target.value })}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:border-purple-500 outline-none" />
            </div>
            <div>
              <label htmlFor="member-parent" className="block text-[10px] font-mono font-bold text-white/40 uppercase tracking-wider mb-1">Hijo/a de</label>
              <select id="member-parent" value={form.parent_id} onChange={(e) => setForm({ ...form, parent_id: e.target.value })}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:border-purple-500 outline-none">
                <option value="">— Raíz —</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>{m.full_name}</option>
                ))}
              </select>
            </div>
          </div>
          {error && <p className="text-[11px] text-red-400">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={busy}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-white text-xs font-semibold hover:opacity-90 disabled:opacity-50 cursor-pointer">
              {busy ? "Guardando..." : "Guardar miembro"}
            </button>
            <button type="button" onClick={reset}
              className="px-4 py-2 rounded-xl bg-white/10 text-white/60 text-xs font-semibold hover:bg-white/20 transition cursor-pointer">
              Cancelar
            </button>
          </div>
        </form>
      )}

      {members.length === 0 ? (
        <div className="text-center py-12 rounded-2xl bg-white/[0.03] border border-white/5">
          <p className="text-sm text-white/40 mb-2">Aún no hay miembros en este árbol</p>
          {isOwner && <p className="text-xs text-white/30">Añade a tus familiares para construir el legado</p>}
        </div>
      ) : (
        <ul className="flex flex-col items-center gap-4 py-4 overflow-x-auto" aria-label={`Árbol familiar de ${family.name}`}>
          {roots.map((m) => (
            <Node key={m.id} member={m} byParent={byParent} accent={accent} />
          ))}
        </ul>
      )}
    </section>
  )
}
