'use client'

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { ArrowLeft, Search, Star, Store, Shield, MapPin, Package, Loader2, StoreIcon } from "lucide-react"
import { usePageTitle } from "@/lib/usePageTitle"
import { fetchStores } from "@/lib/marketplace/client"
import { COUNTRIES } from "@/lib/marketplace/constants"
import type { StoreWithStats } from "@/lib/marketplace/types"

const COUNTRY_FLAGS: Record<string, string> = {
  US: "🇺🇸", CU: "🇨🇺", MX: "🇲🇽", CA: "🇨🇦", ES: "🇪🇸", CO: "🇨🇴",
  AR: "🇦🇷", VE: "🇻🇪", BR: "🇧🇷", CL: "🇨🇱", PE: "🇵🇪", EC: "🇪🇨",
  DO: "🇩🇴", PA: "🇵🇦", CR: "🇨🇷", GT: "🇬🇹", HN: "🇭🇳", SV: "🇸🇻",
  NI: "🇳🇮", UY: "🇺🇾", PY: "🇵🇾", BO: "🇧🇴", GB: "🇬🇧", DE: "🇩🇪",
  FR: "🇫🇷", IT: "🇮🇹", JP: "🇯🇵",
}

const FALLBACK_STORES: StoreWithStats[] = [
  { id: "1", owner_id: "", name: "MSM Tech Store", slug: "msm-tech", description: "Electrónica y gadgets premium", logo_url: "", cover_url: "", country: "US", city: "Miami, FL", whatsapp: "", email: "", website: "", social_instagram: "", social_facebook: "", social_tiktok: "", social_youtube: "", currency: "USD", timezone: "", return_policy: "", shipping_policy: "", status: "active", verification_level: "premium", rejection_reason: "", product_count: 45, total_sales: 0, total_revenue: 0, average_rating: 4.8, review_count: 124, follower_count: 0, commission_rate: 0, approved_at: "2024-01-01", suspended_at: null, created_at: "2024-01-01", updated_at: "2024-01-01" },
  { id: "2", owner_id: "", name: "Cuba Express", slug: "cuba-express", description: "Envíos directos a toda Cuba", logo_url: "", cover_url: "", country: "CU", city: "La Habana", whatsapp: "", email: "", website: "", social_instagram: "", social_facebook: "", social_tiktok: "", social_youtube: "", currency: "USD", timezone: "", return_policy: "", shipping_policy: "", status: "active", verification_level: "business_verified", rejection_reason: "", product_count: 128, total_sales: 0, total_revenue: 0, average_rating: 4.6, review_count: 89, follower_count: 0, commission_rate: 0, approved_at: "2024-01-01", suspended_at: null, created_at: "2024-01-01", updated_at: "2024-01-01" },
  { id: "3", owner_id: "", name: "Moda Latina", slug: "moda-latina", description: "Ropa y accesorios de tendencia", logo_url: "", cover_url: "", country: "MX", city: "Ciudad de México", whatsapp: "", email: "", website: "", social_instagram: "", social_facebook: "", social_tiktok: "", social_youtube: "", currency: "USD", timezone: "", return_policy: "", shipping_policy: "", status: "active", verification_level: "email_verified", rejection_reason: "", product_count: 89, total_sales: 0, total_revenue: 0, average_rating: 4.9, review_count: 201, follower_count: 0, commission_rate: 0, approved_at: "2024-01-01", suspended_at: null, created_at: "2024-01-01", updated_at: "2024-01-01" },
  { id: "4", owner_id: "", name: "Hogar Total", slug: "hogar-total", description: "Todo para tu hogar", logo_url: "", cover_url: "", country: "CO", city: "Bogotá", whatsapp: "", email: "", website: "", social_instagram: "", social_facebook: "", social_tiktok: "", social_youtube: "", currency: "USD", timezone: "", return_policy: "", shipping_policy: "", status: "active", verification_level: "none", rejection_reason: "", product_count: 67, total_sales: 0, total_revenue: 0, average_rating: 4.5, review_count: 56, follower_count: 0, commission_rate: 0, approved_at: "2025-01-01", suspended_at: null, created_at: "2025-01-01", updated_at: "2025-01-01" },
  { id: "5", owner_id: "", name: "Deportes Pro", slug: "deportes-pro", description: "Equipamiento deportivo profesional", logo_url: "", cover_url: "", country: "DO", city: "Santo Domingo", whatsapp: "", email: "", website: "", social_instagram: "", social_facebook: "", social_tiktok: "", social_youtube: "", currency: "USD", timezone: "", return_policy: "", shipping_policy: "", status: "active", verification_level: "email_verified", rejection_reason: "", product_count: 34, total_sales: 0, total_revenue: 0, average_rating: 4.7, review_count: 78, follower_count: 0, commission_rate: 0, approved_at: "2025-01-01", suspended_at: null, created_at: "2025-01-01", updated_at: "2025-01-01" },
]

export default function MarketplaceStoresPage() {
  usePageTitle("Tiendas — MSM Marketplace")

  const [stores, setStores] = useState<StoreWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [countryFilter, setCountryFilter] = useState("")

  const loadStores = useCallback(async () => {
    setLoading(true)
    try {
      const { stores: data, total } = await fetchStores({
        status: "active",
        country: countryFilter || undefined,
        search: search || undefined,
        limit: 50,
      })
      if (data.length > 0) {
        setStores(data)
      } else {
        const filtered = FALLBACK_STORES.filter(s => {
          if (countryFilter && s.country !== countryFilter) return false
          if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false
          return true
        })
        setStores(filtered)
      }
    } catch {
      const filtered = FALLBACK_STORES.filter(s => {
        if (countryFilter && s.country !== countryFilter) return false
        if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false
        return true
      })
      setStores(filtered)
    } finally {
      setLoading(false)
    }
  }, [search, countryFilter])

  useEffect(() => {
    const timeout = setTimeout(() => loadStores(), 300)
    return () => clearTimeout(timeout)
  }, [loadStores])

  return (
    <div className="min-h-screen zafiro-page text-white">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#050816]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3 mb-3">
            <Link href="/marketplace" className="p-2 rounded-lg hover:bg-slate-800/50 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar tiendas..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#197BD2]/50 transition-colors"
              />
            </div>
          </div>

          {/* Country Filter */}
          <select
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value)}
            className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 text-[10px] text-white focus:outline-none focus:border-[#197BD2]/50"
          >
            <option value="">Todos los países</option>
            {COUNTRIES.map(c => (
              <option key={c.code} value={c.code}>{COUNTRY_FLAGS[c.code] || ""} {c.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-lg font-black text-white">Tiendas</h1>
            <p className="text-[10px] text-slate-500">
              {loading ? "Cargando..." : `${stores.length} tiendas ${countryFilter ? "en este país" : "activas"}`}
            </p>
          </div>
          <Link
            href="/marketplace/crear-tienda"
            className="flex items-center gap-1.5 px-3 py-2 bg-[#197BD2] text-white rounded-xl text-[10px] font-bold hover:bg-[#197BD2]/90 transition-colors"
          >
            <StoreIcon className="w-3 h-3" />
            Crear Tienda
          </Link>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-[#197BD2] animate-spin mb-3" />
            <p className="text-[10px] text-slate-500">Cargando tiendas...</p>
          </div>
        )}

        {/* Empty */}
        {!loading && stores.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto mb-6">
              <Store className="w-10 h-10 text-slate-600" />
            </div>
            <h2 className="text-lg font-black text-white mb-2">No hay tiendas</h2>
            <p className="text-[10px] text-slate-500 mb-6">
              {search || countryFilter
                ? "No se encontraron tiendas con esos filtros"
                : "Sé el primero en crear una tienda"}
            </p>
            <Link
              href="/marketplace/crear-tienda"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#197BD2] text-white rounded-xl text-sm font-bold hover:bg-[#197BD2]/90 transition-colors"
            >
              <StoreIcon className="w-4 h-4" />
              Crear Tienda
            </Link>
          </div>
        )}

        {/* Store List */}
        {!loading && stores.length > 0 && (
          <div className="space-y-3">
            {stores.map((store) => {
              const flag = COUNTRY_FLAGS[store.country] || "🌍"
              return (
                <Link
                  key={store.id}
                  href={`/marketplace/tiendas/${store.slug}`}
                  className="block rounded-xl bg-slate-900/30 border border-slate-800/50 hover:border-[#197BD2]/30 transition-all overflow-hidden"
                >
                  {/* Cover gradient */}
                  <div className="h-20 bg-gradient-to-br from-[#0C3F6A] to-[#197BD2] relative">
                    {store.cover_url && (
                      <img src={store.cover_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
                    )}
                  </div>

                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#197BD2] to-[#0C3F6A] flex items-center justify-center text-xl -mt-8 border-2 border-[#050816] shrink-0">
                        {flag}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <h3 className="text-sm font-bold text-white truncate">{store.name}</h3>
                          {store.verification_level !== "none" && (
                            <Shield className="w-3.5 h-3.5 text-[#197BD2] shrink-0" />
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 mb-2 line-clamp-1">{store.description}</p>
                        <div className="flex items-center gap-3 flex-wrap">
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-[#D4AF37] fill-[#D4AF37]" />
                            <span className="text-[9px] text-slate-400">{store.average_rating}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Package className="w-3 h-3 text-slate-500" />
                            <span className="text-[9px] text-slate-500">{store.product_count} productos</span>
                          </div>
                          {store.city && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-500" />
                              <span className="text-[9px] text-slate-500">{store.city}</span>
                            </div>
                          )}
                          <span className="text-[9px] text-slate-500">{flag} {store.country}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
