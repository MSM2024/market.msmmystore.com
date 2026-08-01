"use client"

import { useState } from "react"
import { Plus, Users } from "lucide-react"
import type { AlbumFamilyRow } from "@/lib/album/repository"

interface AlbumFamiliesProps {
  families: AlbumFamilyRow[]
  selectedId: string | null
  isOwner: boolean
  loading: boolean
  onSelect: (id: string) => void
  onCreated: (family: AlbumFamilyRow) => void
}

export default function AlbumFamilies({ families, selectedId, isOwner, loading, onSelect, onCreated }: AlbumFamiliesProps) {
  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState("")
  const [subtitle, setSubtitle] = useState("")
  const [privacy, setPrivacy] = useState<AlbumFamilyRow["privacy"]>("solo_yo")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  const createFamily = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setBusy(true); setError("")
    try {
      const res = await fetch("/api/album/families", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), subtitle, privacy }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || "No se pudo crear la familia")
        return
      }
      onCreated(data.family)
      setShowCreate(false); setName(""); setSubtitle("")
    } catch {
      setError("Error de conexión")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-wider">Familias</h3>
        {isOwner && !showCreate && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1 text-[11px] text-purple-300 hover:text-purple-200 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Crear familia
          </button>
        )}
      </div>

      {showCreate && (
        <form onSubmit={createFamily} className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-2.5">
          <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Nombre de la familia *"
            className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:border-purple-500 outline-none" />
          <input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="Subtítulo (opcional)"
            className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:border-purple-500 outline-none" />
          <select value={privacy} onChange={(e) => setPrivacy(e.target.value as AlbumFamilyRow["privacy"])}
            className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:border-purple-500 outline-none">
            <option value="solo_yo">Solo yo</option>
            <option value="familia">Familia</option>
            <option value="comunidad">Comunidad</option>
            <option value="publica">Pública</option>
          </select>
          {error && <p className="text-[11px] text-red-400">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={busy}
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-500 text-white text-[11px] font-semibold hover:opacity-90 disabled:opacity-50 cursor-pointer">
              {busy ? "Creando..." : "Crear"}
            </button>
            <button type="button" onClick={() => { setShowCreate(false); setError("") }}
              className="px-3 py-1.5 rounded-lg bg-white/10 text-white/60 text-[11px] font-semibold hover:bg-white/20 transition cursor-pointer">
              Cancelar
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-xs text-white/30 py-2">Cargando familias...</p>
      ) : families.length === 0 ? (
        <p className="text-xs text-white/30 py-2 flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" /> Aún no hay familias
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {families.map((f) => (
            <button
              key={f.id}
              onClick={() => onSelect(f.id)}
              aria-pressed={selectedId === f.id}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                selectedId === f.id
                  ? "bg-purple-600 text-white border-purple-400"
                  : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10"
              }`}
            >
              {f.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
