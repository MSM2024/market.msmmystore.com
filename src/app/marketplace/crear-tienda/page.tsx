'use client'

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft, Store, Upload, Info, Globe, MessageCircle, Mail,
  LinkIcon, RotateCcw, Truck, Loader2, AlertCircle,
} from "lucide-react"
import { usePageTitle } from "@/lib/usePageTitle"
import { createStore } from "@/lib/marketplace/client"
import { isSupabaseAvailable } from "@/lib/supabase"
import { COUNTRIES, generateSlug } from "@/lib/marketplace/constants"

export default function CreateStorePage() {
  usePageTitle("Crear Tienda — MSM Marketplace")
  const router = useRouter()

  const [form, setForm] = useState({
    name: "", description: "", country: "US", city: "",
    whatsapp: "", email: "", website: "",
    return_policy: "", shipping_policy: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const slug = form.name ? generateSlug(form.name) : ""

  const validate = (): boolean => {
    const errors: Record<string, string> = {}
    if (!form.name.trim()) errors.name = "El nombre es obligatorio"
    if (!form.country) errors.country = "Selecciona un país"
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = "Email inválido"
    }
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    setError("")

    try {
      if (!isSupabaseAvailable()) {
        setError("Se requiere conexión a Supabase para crear una tienda. Configura las variables de entorno en .env.local")
        setLoading(false)
        return
      }

      const result = await createStore({
        name: form.name.trim(),
        slug,
        description: form.description.trim(),
        country: form.country,
        city: form.city.trim(),
        whatsapp: form.whatsapp.trim(),
        email: form.email.trim(),
        website: form.website.trim(),
        return_policy: form.return_policy.trim(),
        shipping_policy: form.shipping_policy.trim(),
        status: "pending_review",
        currency: "USD",
        verification_level: "none",
        logo_url: "",
        cover_url: "",
        social_instagram: "",
        social_facebook: "",
        social_tiktok: "",
        social_youtube: "",
        timezone: "",
        rejection_reason: "",
        product_count: 0,
        total_sales: 0,
        total_revenue: 0,
        average_rating: 0,
        review_count: 0,
        follower_count: 0,
        commission_rate: 0,
      })

      if (!result) {
        setError("Error al crear la tienda. Inténtalo de nuevo.")
        setLoading(false)
        return
      }

      router.push("/dashboard/tienda")
    } catch {
      setError("Error inesperado. Inténtalo de nuevo.")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen zafiro-page text-white">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/marketplace/tiendas" className="p-2 rounded-lg hover:bg-slate-800/50 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <Store className="w-5 h-5 text-[#D4AF37]" />
          <div>
            <h1 className="text-lg font-black">Crear Mi Tienda</h1>
            <p className="text-[9px] text-slate-500">Configura tu espacio de venta</p>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 mb-4">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <p className="text-[10px] text-red-400 leading-relaxed">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombre */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1.5">Nombre de la tienda *</label>
            <input
              type="text" required
              value={form.name}
              onChange={(e) => { setForm({ ...form, name: e.target.value }); setValidationErrors({}); setError(""); }}
              placeholder="Mi Tienda MSM"
              className={`w-full bg-slate-900/50 border rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none transition-colors ${
                validationErrors.name ? "border-red-500/50 focus:border-red-500/50" : "border-slate-700/50 focus:border-[#197BD2]/50"
              }`}
            />
            {validationErrors.name && (
              <p className="text-[9px] text-red-400 mt-1">{validationErrors.name}</p>
            )}
            {slug && (
              <div className="flex items-center gap-1.5 mt-1.5">
                <LinkIcon className="w-3 h-3 text-slate-600" />
                <p className="text-[8px] text-slate-600">/marketplace/tiendas/{slug}</p>
              </div>
            )}
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1.5">Descripción</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe tu tienda, qué vendes, por qué comprarte..."
              rows={3}
              className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[#197BD2]/50 transition-colors resize-none"
            />
          </div>

          {/* País y Ciudad */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1.5">País *</label>
              <select
                value={form.country}
                onChange={(e) => { setForm({ ...form, country: e.target.value }); setValidationErrors({}); }}
                className={`w-full bg-slate-900/50 border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none transition-colors ${
                  validationErrors.country ? "border-red-500/50" : "border-slate-700/50 focus:border-[#197BD2]/50"
                }`}
              >
                {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
              </select>
              {validationErrors.country && (
                <p className="text-[9px] text-red-400 mt-1">{validationErrors.country}</p>
              )}
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1.5">Ciudad</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="Miami"
                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[#197BD2]/50 transition-colors"
              />
            </div>
          </div>

          {/* Contacto */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1.5">
                <MessageCircle className="w-3 h-3 inline mr-1" />
                WhatsApp
              </label>
              <input
                type="tel"
                value={form.whatsapp}
                onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                placeholder="+1 305 123 4567"
                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[#197BD2]/50 transition-colors"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1.5">
                <Mail className="w-3 h-3 inline mr-1" />
                Correo
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => { setForm({ ...form, email: e.target.value }); setValidationErrors({}); }}
                placeholder="tienda@msm.com"
                className={`w-full bg-slate-900/50 border rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none transition-colors ${
                  validationErrors.email ? "border-red-500/50" : "border-slate-700/50 focus:border-[#197BD2]/50"
                }`}
              />
              {validationErrors.email && (
                <p className="text-[9px] text-red-400 mt-1">{validationErrors.email}</p>
              )}
            </div>
          </div>

          {/* Website */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1.5">
              <Globe className="w-3 h-3 inline mr-1" />
              Sitio Web
            </label>
            <input
              type="url"
              value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
              placeholder="https://mitienda.com"
              className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[#197BD2]/50 transition-colors"
            />
          </div>

          {/* Logo y Portada */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1.5">Logo</label>
              <div className="border-2 border-dashed border-slate-700/50 rounded-xl p-6 text-center hover:border-[#197BD2]/30 transition-colors cursor-pointer">
                <Upload className="w-6 h-6 text-slate-600 mx-auto mb-1" />
                <p className="text-[9px] text-slate-500">Subir logo</p>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1.5">Portada</label>
              <div className="border-2 border-dashed border-slate-700/50 rounded-xl p-6 text-center hover:border-[#197BD2]/30 transition-colors cursor-pointer">
                <Upload className="w-6 h-6 text-slate-600 mx-auto mb-1" />
                <p className="text-[9px] text-slate-500">Subir portada</p>
              </div>
            </div>
          </div>

          {/* Políticas */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1.5">
              <RotateCcw className="w-3 h-3 inline mr-1" />
              Política de devolución
            </label>
            <textarea
              value={form.return_policy}
              onChange={(e) => setForm({ ...form, return_policy: e.target.value })}
              placeholder="Ej: Aceptamos devoluciones dentro de los primeros 30 días..."
              rows={2}
              className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[#197BD2]/50 transition-colors resize-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1.5">
              <Truck className="w-3 h-3 inline mr-1" />
              Política de envío
            </label>
            <textarea
              value={form.shipping_policy}
              onChange={(e) => setForm({ ...form, shipping_policy: e.target.value })}
              placeholder="Ej: Envío en 24-48 horas, envío gratis en compras mayores a $50..."
              rows={2}
              className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[#197BD2]/50 transition-colors resize-none"
            />
          </div>

          {/* Info */}
          <div className="flex items-start gap-2 p-3 rounded-xl bg-[#197BD2]/5 border border-[#197BD2]/10">
            <Info className="w-4 h-4 text-[#197BD2] shrink-0 mt-0.5" />
            <p className="text-[9px] text-slate-400 leading-relaxed">
              Tu tienda será revisada por nuestro equipo antes de ser publicada. Esto toma generalmente 24-48 horas. Recibirás una notificación cuando sea aprobada.
            </p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-[#D4AF37] text-[#14171A] py-3 rounded-xl text-sm font-bold hover:bg-[#D4AF37]/90 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creando tienda...
              </>
            ) : (
              <>
                <Store className="w-4 h-4" />
                Crear Tienda
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
