'use client'

import { useState, useEffect, use } from "react"
import Link from "next/link"
import {
  ArrowLeft, Star, Shield, Package, MapPin, MessageCircle, Mail,
  Calendar, RotateCcw, Truck, Heart, Loader2, ExternalLink,
} from "lucide-react"
import { usePageTitle } from "@/lib/usePageTitle"
import { fetchStoreBySlug, fetchProducts } from "@/lib/marketplace/client"
import { formatPrice, COUNTRIES } from "@/lib/marketplace/constants"
import type { StoreWithStats, ProductWithStore } from "@/lib/marketplace/types"

const COUNTRY_FLAGS: Record<string, string> = {
  US: "🇺🇸", CU: "🇨🇺", MX: "🇲🇽", CA: "🇨🇦", ES: "🇪🇸", CO: "🇨🇴",
  AR: "🇦🇷", VE: "🇻🇪", BR: "🇧🇷", CL: "🇨🇱", PE: "🇵🇪", EC: "🇪🇨",
  DO: "🇩🇴", PA: "🇵🇦", CR: "🇨🇷", GT: "🇬🇹", HN: "🇭🇳", SV: "🇸🇻",
  NI: "🇳🇮", UY: "🇺🇾", PY: "🇵🇾", BO: "🇧🇴", GB: "🇬🇧", DE: "🇩🇪",
  FR: "🇫🇷", IT: "🇮🇹", JP: "🇯🇵",
}

export default function StoreDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  usePageTitle("Tienda — MSM Marketplace")

  const [store, setStore] = useState<StoreWithStats | null>(null)
  const [products, setProducts] = useState<ProductWithStore[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [following, setFollowing] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const s = await fetchStoreBySlug(slug)
        if (cancelled) return
        if (!s) {
          setNotFound(true)
          return
        }
        setStore(s)
        const { products: p } = await fetchProducts({ store_id: s.id, status: "published", limit: 50 })
        if (cancelled) return
        setProducts(p)
      } catch {
        if (!cancelled) setNotFound(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050816] text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#197BD2] animate-spin" />
      </div>
    )
  }

  if (notFound || !store) {
    return (
      <div className="min-h-screen bg-[#050816] text-white">
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <div className="w-20 h-20 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto mb-6">
            <Package className="w-10 h-10 text-slate-600" />
          </div>
          <h1 className="text-xl font-black mb-2">Tienda No Encontrada</h1>
          <p className="text-[10px] text-slate-500 mb-6">Esta tienda no existe o fue removida</p>
          <Link
            href="/marketplace/tiendas"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#197BD2] text-white rounded-xl text-sm font-bold hover:bg-[#197BD2]/90 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a Tiendas
          </Link>
        </div>
      </div>
    )
  }

  const flag = COUNTRY_FLAGS[store.country] || "🌍"
  const countryName = COUNTRIES.find(c => c.code === store.country)?.name || store.country
  const memberSince = store.created_at ? new Date(store.created_at).getFullYear() : "—"

  const whatsappUrl = store.whatsapp
    ? `https://wa.me/${store.whatsapp.replace(/[^0-9]/g, "")}`
    : null

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      {/* Cover */}
      <div className="h-36 bg-gradient-to-br from-[#0C3F6A] to-[#197BD2] relative">
        {store.cover_url && (
          <img src={store.cover_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
        )}
        <Link
          href="/marketplace/tiendas"
          className="absolute top-3 left-3 p-2 rounded-lg bg-black/30 hover:bg-black/50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
      </div>

      <div className="max-w-7xl mx-auto px-4">
        {/* Store Info */}
        <div className="relative -mt-10 mb-6">
          <div className="flex items-end gap-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#197BD2] to-[#0C3F6A] flex items-center justify-center text-3xl border-4 border-[#050816] shrink-0">
              {flag}
            </div>
            <div className="flex-1 pb-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl font-black text-white truncate">{store.name}</h1>
                {store.verification_level !== "none" && (
                  <Shield className="w-5 h-5 text-[#197BD2] shrink-0" />
                )}
              </div>
              <div className="flex items-center gap-3 text-[10px] text-slate-400 flex-wrap">
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-[#D4AF37] fill-[#D4AF37]" />
                  <span>{store.average_rating}</span>
                  {store.review_count > 0 && (
                    <span className="text-slate-500">({store.review_count})</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Package className="w-3 h-3" />
                  <span>{store.product_count} productos</span>
                </div>
                {store.city && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <span>{store.city}, {countryName}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>Miembro desde {memberSince}</span>
                </div>
              </div>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 mt-3">{store.description}</p>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={() => setFollowing(!following)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-bold transition-colors ${
                following
                  ? "bg-[#197BD2]/10 text-[#197BD2] border border-[#197BD2]/30"
                  : "bg-slate-800/50 text-slate-300 border border-slate-700/50 hover:border-[#197BD2]/30"
              }`}
            >
              <Heart className={`w-3 h-3 ${following ? "fill-[#197BD2]" : ""}`} />
              {following ? "Siguiendo" : "Seguir"}
            </button>
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
              >
                <MessageCircle className="w-3 h-3" />
                WhatsApp
              </a>
            )}
            {store.email && (
              <a
                href={`mailto:${store.email}`}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-bold bg-slate-800/50 text-slate-300 border border-slate-700/50 hover:border-[#197BD2]/30 transition-colors"
              >
                <Mail className="w-3 h-3" />
                Email
              </a>
            )}
            {store.website && (
              <a
                href={store.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-bold bg-slate-800/50 text-slate-300 border border-slate-700/50 hover:border-[#197BD2]/30 transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                Web
              </a>
            )}
          </div>
        </div>

        {/* Policies */}
        {(store.return_policy || store.shipping_policy) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {store.return_policy && (
              <div className="p-3 rounded-xl bg-slate-900/30 border border-slate-800/50">
                <div className="flex items-center gap-1.5 mb-1">
                  <RotateCcw className="w-3 h-3 text-[#197BD2]" />
                  <p className="text-[9px] font-bold text-slate-400">Devolución</p>
                </div>
                <p className="text-[10px] text-white">{store.return_policy}</p>
              </div>
            )}
            {store.shipping_policy && (
              <div className="p-3 rounded-xl bg-slate-900/30 border border-slate-800/50">
                <div className="flex items-center gap-1.5 mb-1">
                  <Truck className="w-3 h-3 text-[#197BD2]" />
                  <p className="text-[9px] font-bold text-slate-400">Envío</p>
                </div>
                <p className="text-[10px] text-white">{store.shipping_policy}</p>
              </div>
            )}
          </div>
        )}

        {/* Products */}
        <h2 className="text-sm font-bold text-white mb-3">Productos de la tienda</h2>
        {products.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-[10px] text-slate-500">Esta tienda aún no tiene productos publicados</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pb-10">
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/marketplace/productos/${product.slug}`}
                className="group rounded-xl bg-slate-900/30 border border-slate-800/50 hover:border-[#197BD2]/30 transition-all overflow-hidden"
              >
                <div className="h-32 bg-slate-800/30 flex items-center justify-center">
                  <Package className="w-10 h-10 text-slate-600" />
                </div>
                <div className="p-3">
                  <p className="text-[11px] font-bold text-white mb-1 line-clamp-2 group-hover:text-[#197BD2] transition-colors">
                    {product.name}
                  </p>
                  <div className="flex items-center gap-1 mb-1">
                    <Star className="w-2.5 h-2.5 text-[#D4AF37] fill-[#D4AF37]" />
                    <span className="text-[9px] text-slate-400">
                      {product.average_rating} ({product.review_count})
                    </span>
                  </div>
                  <span className="text-sm font-black text-[#197BD2]">{formatPrice(product.final_price)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
