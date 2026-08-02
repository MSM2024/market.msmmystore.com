'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Store, Save, Loader2, AlertCircle, CheckCircle } from "lucide-react"
import { usePageTitle } from "@/lib/usePageTitle"
import { getSession } from "@/lib/auth"
import { getSupabaseClient, isSupabaseAvailable } from "@/lib/supabase"
import { updateStore } from "@/lib/marketplace/client"
import { COUNTRIES } from "@/lib/marketplace/constants"
import type { MarketplaceStore } from "@/lib/marketplace/types"

export default function DashboardTiendaPage() {
  usePageTitle("Mi Tienda — Dashboard")
  const router = useRouter()
  const userId = getSession()?.id
  const [store, setStore] = useState<MarketplaceStore | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null)
  const [form, setForm] = useState({
    name: "", description: "", country: "", city: "",
    whatsapp: "", email: "", website: "",
    return_policy: "", shipping_policy: "",
  })

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!userId) { setLoading(false); return }
    const supabase = getSupabaseClient()
    if (!supabase || !isSupabaseAvailable()) { setLoading(false); return }

    async function load() {
      const { data } = await supabase!
        .from("marketplace_stores")
        .select("*")
        .eq("owner_id", userId!)
        .single()
      if (!data) { router.replace("/marketplace/crear-tienda"); return }
      setStore(data)
      setForm({
        name: data.name || "", description: data.description || "",
        country: data.country || "", city: data.city || "",
        whatsapp: data.whatsapp || "", email: data.email || "",
        website: data.website || "", return_policy: data.return_policy || "",
        shipping_policy: data.shipping_policy || "",
      })
      setLoading(false)
    }
    load()
  }, [userId, router])

  async function handleSave() {
    if (!store) return
    setSaving(true)
    setMsg(null)
    const updated = await updateStore(store.id, { ...form } as Partial<MarketplaceStore>)
    if (updated) {
      setStore(updated)
      setMsg({ type: "ok", text: "Tienda actualizada correctamente" })
    } else {
      setMsg({ type: "err", text: "Error al guardar cambios" })
    }
    setSaving(false)
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-6 h-6 text-[#197BD2] animate-spin" />
    </div>
  )

  if (!store) return null

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Store className="w-5 h-5 text-[#D4AF37]" />
          <h1 className="text-lg font-black text-white">Configurar Tienda</h1>
        </div>
      </div>

      {msg && (
        <div className={`flex items-center gap-2 p-3 rounded-xl mb-4 text-[11px] font-bold ${
          msg.type === "ok" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"
        }`}>
          {msg.type === "ok" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {msg.text}
        </div>
      )}

      <div className="space-y-4 max-w-2xl">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 mb-1">Nombre de la tienda</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#197BD2]/50 transition-colors" />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 mb-1">Descripción</label>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3}
            className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#197BD2]/50 transition-colors resize-none" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1">País</label>
            <select value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })}
              className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#197BD2]/50 transition-colors">
              <option value="">Seleccionar</option>
              {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1">Ciudad</label>
            <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#197BD2]/50 transition-colors" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1">WhatsApp</label>
            <input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
              className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#197BD2]/50 transition-colors" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1">Correo</label>
            <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#197BD2]/50 transition-colors" />
          </div>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 mb-1">Sitio web</label>
          <input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })}
            className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#197BD2]/50 transition-colors" />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 mb-1">Política de devoluciones</label>
          <textarea value={form.return_policy} onChange={(e) => setForm({ ...form, return_policy: e.target.value })} rows={2}
            className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#197BD2]/50 transition-colors resize-none" />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 mb-1">Política de envíos</label>
          <textarea value={form.shipping_policy} onChange={(e) => setForm({ ...form, shipping_policy: e.target.value })} rows={2}
            className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#197BD2]/50 transition-colors resize-none" />
        </div>

        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#197BD2] text-white text-xs font-bold hover:bg-[#197BD2]/90 transition-colors disabled:opacity-50">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Guardando..." : "Guardar Cambios"}
        </button>
      </div>
    </div>
  )
}
