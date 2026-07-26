'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft, Package, Loader2, AlertCircle, Info, Tag,
  Truck, Globe, DollarSign, Hash, FileText, MapPin, ToggleLeft, ToggleRight,
} from "lucide-react"
import { usePageTitle } from "@/lib/usePageTitle"
import { getSession } from "@/lib/auth"
import { createProduct, fetchCategories } from "@/lib/marketplace/client"
import { getSupabaseClient, isSupabaseAvailable } from "@/lib/supabase"
import { generateSlug, COUNTRIES, SUPPORTED_CURRENCIES } from "@/lib/marketplace/constants"
import type { MarketplaceCategory } from "@/lib/marketplace/types"

export default function CrearProductoPage() {
  usePageTitle("Crear Producto — MSM Marketplace")
  const router = useRouter()
  const session = getSession()

  const [storeId, setStoreId] = useState<string | null>(null)
  const [categories, setCategories] = useState<MarketplaceCategory[]>([])
  const [loadingStore, setLoadingStore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const [form, setForm] = useState({
    name: "",
    description: "",
    short_description: "",
    sku: "",
    base_price: "",
    final_price: "",
    currency: "USD",
    stock: "",
    free_shipping: false,
    estimated_delivery_days: "",
    shipping_from_country: "US",
    category_id: "",
    tags: "",
    countries_deliver_to: "",
  })

  useEffect(() => {
    if (!isSupabaseAvailable() || !session?.id) {
      setLoadingStore(false)
      return
    }
    const supabase = getSupabaseClient()
    if (!supabase) { setLoadingStore(false); return }

    async function load() {
      const { data: store } = await supabase!
        .from("marketplace_stores")
        .select("id")
        .eq("owner_id", session!.id)
        .single()

      if (store) {
        setStoreId(store.id)
      } else {
        router.push("/marketplace/crear-tienda")
        return
      }

      const cats = await fetchCategories()
      setCategories(cats)
      setLoadingStore(false)
    }
    load()
  }, [session?.id])

  const slug = form.name ? generateSlug(form.name) : ""

  const setField = (field: string, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }))
    setValidationErrors(prev => { const n = { ...prev }; delete n[field]; return n })
    setError("")
  }

  const validate = (): boolean => {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = "El nombre es obligatorio"
    if (!form.base_price || parseFloat(form.base_price) <= 0) e.base_price = "Precio base inválido"
    if (!form.final_price || parseFloat(form.final_price) <= 0) e.final_price = "Precio final inválido"
    if (!form.stock || parseInt(form.stock) < 0) e.stock = "Stock inválido"
    if (!form.estimated_delivery_days || parseInt(form.estimated_delivery_days) < 1) e.estimated_delivery_days = "Días de entrega inválidos"
    if (!form.shipping_from_country) e.shipping_from_country = "Selecciona un país de origen"
    setValidationErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    if (!storeId) { setError("No se encontró tu tienda"); return }

    setLoading(true)
    setError("")

    try {
      const tags = form.tags
        .split(",")
        .map(t => t.trim())
        .filter(Boolean)

      const deliverTo = form.countries_deliver_to
        .split(",")
        .map(c => c.trim().toUpperCase())
        .filter(Boolean)

      const product = await createProduct({
        store_id: storeId,
        name: form.name.trim(),
        slug,
        description: form.description.trim(),
        short_description: form.short_description.trim(),
        sku: form.sku.trim(),
        base_price: parseFloat(form.base_price),
        final_price: parseFloat(form.final_price),
        currency: form.currency,
        stock: parseInt(form.stock),
        free_shipping: form.free_shipping,
        estimated_delivery_days: parseInt(form.estimated_delivery_days),
        shipping_from_country: form.shipping_from_country,
        category_id: form.category_id || null,
        tags,
        countries_deliver_to: deliverTo,
        status: "pending_review",
        source: "own",
        external_id: "",
        external_url: "",
        tax_rate: 0,
        service_fee: 0,
        margin: 0,
        estimated_shipping: 0,
        low_stock_threshold: 5,
        track_inventory: true,
        weight_grams: 0,
        width_cm: 0,
        height_cm: 0,
        depth_cm: 0,
        delivery_modes: [],
        return_policy: "",
        return_days: 30,
        rejection_reason: "",
        sync_status: "manual",
        last_synced_at: null,
        provider_id: null,
        view_count: 0,
        sales_count: 0,
        average_rating: 0,
        review_count: 0,
        favorite_count: 0,
        published_at: null,
      })

      if (!product) {
        setError("Error al crear el producto. Inténtalo de nuevo.")
        setLoading(false)
        return
      }

      router.push("/dashboard/productos")
    } catch {
      setError("Error inesperado. Inténtalo de nuevo.")
      setLoading(false)
    }
  }

  if (loadingStore) return (
    <div className="min-h-screen bg-[#050816] text-white flex items-center justify-center">
      <Loader2 className="w-6 h-6 text-[#197BD2] animate-spin" />
    </div>
  )

  const inputClass = (field: string) =>
    `w-full bg-slate-900/50 border rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none transition-colors ${
      validationErrors[field] ? "border-red-500/50 focus:border-red-500/50" : "border-slate-700/50 focus:border-[#197BD2]/50"
    }`

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/marketplace/vender" className="p-2 rounded-lg hover:bg-slate-800/50 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <Package className="w-5 h-5 text-[#197BD2]" />
          <div>
            <h1 className="text-lg font-black">Crear Producto</h1>
            <p className="text-[9px] text-slate-500">Agrega un nuevo producto a tu tienda</p>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 mb-4">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <p className="text-[10px] text-red-400 leading-relaxed">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Nombre */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1.5">Nombre del producto *</label>
            <input
              type="text" required
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
              placeholder="Ej: Audífonos Bluetooth XYZ"
              className={inputClass("name")}
            />
            {validationErrors.name && <p className="text-[9px] text-red-400 mt-1">{validationErrors.name}</p>}
            {slug && (
              <div className="flex items-center gap-1.5 mt-1.5">
                <Hash className="w-3 h-3 text-slate-600" />
                <p className="text-[8px] text-slate-600">/marketplace/productos/{slug}</p>
              </div>
            )}
          </div>

          {/* Short description */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1.5">Descripción corta</label>
            <input
              type="text"
              value={form.short_description}
              onChange={(e) => setField("short_description", e.target.value)}
              placeholder="Una línea resumen del producto"
              className={inputClass("short_description")}
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1.5">
              <FileText className="w-3 h-3 inline mr-1" />
              Descripción completa
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              placeholder="Describe el producto con detalle: características, materiales, uso..."
              rows={4}
              className={`${inputClass("description")} resize-none`}
            />
          </div>

          {/* SKU */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1.5">SKU</label>
            <input
              type="text"
              value={form.sku}
              onChange={(e) => setField("sku", e.target.value)}
              placeholder="ABC-12345"
              className={inputClass("sku")}
            />
          </div>

          {/* Precios */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1.5">
                <DollarSign className="w-3 h-3 inline mr-1" />
                Precio base *
              </label>
              <input
                type="number" step="0.01" min="0" required
                value={form.base_price}
                onChange={(e) => setField("base_price", e.target.value)}
                placeholder="0.00"
                className={inputClass("base_price")}
              />
              {validationErrors.base_price && <p className="text-[9px] text-red-400 mt-1">{validationErrors.base_price}</p>}
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1.5">
                <DollarSign className="w-3 h-3 inline mr-1 text-[#D4AF37]" />
                Precio final *
              </label>
              <input
                type="number" step="0.01" min="0" required
                value={form.final_price}
                onChange={(e) => setField("final_price", e.target.value)}
                placeholder="0.00"
                className={inputClass("final_price")}
              />
              {validationErrors.final_price && <p className="text-[9px] text-red-400 mt-1">{validationErrors.final_price}</p>}
            </div>
          </div>

          {/* Moneda y Stock */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1.5">Moneda</label>
              <select
                value={form.currency}
                onChange={(e) => setField("currency", e.target.value)}
                className={inputClass("currency")}
              >
                {SUPPORTED_CURRENCIES.map(c => (
                  <option key={c.code} value={c.code}>{c.symbol} {c.code} — {c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1.5">Stock *</label>
              <input
                type="number" min="0" required
                value={form.stock}
                onChange={(e) => setField("stock", e.target.value)}
                placeholder="0"
                className={inputClass("stock")}
              />
              {validationErrors.stock && <p className="text-[9px] text-red-400 mt-1">{validationErrors.stock}</p>}
            </div>
          </div>

          {/* Envío */}
          <div className="p-4 rounded-xl bg-slate-900/30 border border-slate-800/50 space-y-3">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-[#197BD2]" />
              <p className="text-[11px] font-bold text-white">Envío</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1.5">
                  <MapPin className="w-3 h-3 inline mr-1" />
                  Envío desde *
                </label>
                <select
                  value={form.shipping_from_country}
                  onChange={(e) => setField("shipping_from_country", e.target.value)}
                  className={inputClass("shipping_from_country")}
                >
                  {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                </select>
                {validationErrors.shipping_from_country && (
                  <p className="text-[9px] text-red-400 mt-1">{validationErrors.shipping_from_country}</p>
                )}
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1.5">
                  <Globe className="w-3 h-3 inline mr-1" />
                  Días estimados de entrega *
                </label>
                <input
                  type="number" min="1" required
                  value={form.estimated_delivery_days}
                  onChange={(e) => setField("estimated_delivery_days", e.target.value)}
                  placeholder="7"
                  className={inputClass("estimated_delivery_days")}
                />
                {validationErrors.estimated_delivery_days && (
                  <p className="text-[9px] text-red-400 mt-1">{validationErrors.estimated_delivery_days}</p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setField("free_shipping", !form.free_shipping)}
              className="flex items-center gap-2 w-full p-2 rounded-lg hover:bg-slate-800/50 transition-colors"
            >
              {form.free_shipping
                ? <ToggleRight className="w-5 h-5 text-emerald-400" />
                : <ToggleLeft className="w-5 h-5 text-slate-500" />
              }
              <span className="text-[10px] text-slate-400">Envío gratis</span>
            </button>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1.5">Países de destino (separados por coma)</label>
              <input
                type="text"
                value={form.countries_deliver_to}
                onChange={(e) => setField("countries_deliver_to", e.target.value)}
                placeholder="US, MX, CU"
                className={inputClass("countries_deliver_to")}
              />
              <p className="text-[8px] text-slate-600 mt-1">Códigos ISO: US, CU, MX, CA, ES, etc.</p>
            </div>
          </div>

          {/* Categoría y Tags */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1.5">Categoría</label>
            <select
              value={form.category_id}
              onChange={(e) => setField("category_id", e.target.value)}
              className={inputClass("category_id")}
            >
              <option value="">Sin categoría</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1.5">
              <Tag className="w-3 h-3 inline mr-1" />
              Etiquetas (separadas por coma)
            </label>
            <input
              type="text"
              value={form.tags}
              onChange={(e) => setField("tags", e.target.value)}
              placeholder="electrónica, audio, bluetooth, oferta"
              className={inputClass("tags")}
            />
          </div>

          {/* Info */}
          <div className="flex items-start gap-2 p-3 rounded-xl bg-[#197BD2]/5 border border-[#197BD2]/10">
            <Info className="w-4 h-4 text-[#197BD2] shrink-0 mt-0.5" />
            <p className="text-[9px] text-slate-400 leading-relaxed">
              El producto será enviado a revisión antes de ser publicado. Puedes agregar imágenes y variantes después de crearlo.
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
                Creando producto...
              </>
            ) : (
              <>
                <Package className="w-4 h-4" />
                Crear Producto
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
