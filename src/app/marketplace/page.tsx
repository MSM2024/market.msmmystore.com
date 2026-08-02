'use client'

import { useState, useEffect } from "react"
import Link from "next/link"
import { Package, Store, Star, ChevronRight, Grid3X3, List, Truck, Shield, Zap } from "lucide-react"
import { usePageTitle } from "@/lib/usePageTitle"
import { formatPrice } from "@/lib/marketplace/constants"
import { fetchCategories, fetchStores, fetchProducts } from "@/lib/marketplace/client"
import type { ProductStatus } from "@/lib/marketplace/types"

interface HomeProduct {
  id: string; name: string; slug: string; final_price: number; base_price: number;
  image: string; store: { name: string }; average_rating: number; review_count: number;
  free_shipping: boolean; status: ProductStatus
}

const FALLBACK_CATEGORIES = [
  { name: "Electrónica", slug: "electronica", icon: "📱", product_count: 234 },
  { name: "Hogar y Cocina", slug: "hogar-cocina", icon: "🏠", product_count: 189 },
  { name: "Moda", slug: "moda-accesorios", icon: "👕", product_count: 312 },
  { name: "Belleza", slug: "belleza-salud", icon: "💄", product_count: 156 },
  { name: "Deportes", slug: "deportes-aires-libre", icon: "⚽", product_count: 98 },
  { name: "Automotriz", slug: "automotriz", icon: "🚗", product_count: 67 },
  { name: "Mascotas", slug: "mascotas", icon: "🐾", product_count: 45 },
  { name: "Libros", slug: "libros-educacion", icon: "📚", product_count: 203 },
]

const FALLBACK_STORES = [
  { name: "MSM Tech Store", slug: "msm-tech", average_rating: 4.8, product_count: 45, country: "US", logo_url: "" },
  { name: "Cuba Express", slug: "cuba-express", average_rating: 4.6, product_count: 128, country: "CU", logo_url: "" },
  { name: "Moda Latina", slug: "moda-latina", average_rating: 4.9, product_count: 89, country: "MX", logo_url: "" },
]

const FALLBACK_PRODUCTS: HomeProduct[] = [
  { id: "1", name: "iPhone 15 Pro Max 256GB", slug: "iphone-15-pro-max-256gb", final_price: 1199.99, base_price: 1299.99, image: "", store: { name: "MSM Tech Store" }, average_rating: 4.8, review_count: 124, free_shipping: true, status: "published" },
  { id: "2", name: "Samsung Galaxy S24 Ultra", slug: "samsung-galaxy-s24-ultra", final_price: 1049.99, base_price: 1199.99, image: "", store: { name: "MSM Tech Store" }, average_rating: 4.7, review_count: 89, free_shipping: false, status: "published" },
  { id: "3", name: "MacBook Air M3 15\"", slug: "macbook-air-m3-15", final_price: 1499.00, base_price: 1499.00, image: "", store: { name: "MSM Tech Store" }, average_rating: 4.9, review_count: 201, free_shipping: true, status: "published" },
  { id: "4", name: "AirPods Pro 2da Gen", slug: "airpods-pro-2da-gen", final_price: 189.99, base_price: 249.99, image: "", store: { name: "MSM Tech Store" }, average_rating: 4.6, review_count: 567, free_shipping: true, status: "published" },
  { id: "5", name: "iPad Air M2 256GB", slug: "ipad-air-m2-256gb", final_price: 749.00, base_price: 799.00, image: "", store: { name: "MSM Tech Store" }, average_rating: 4.8, review_count: 156, free_shipping: false, status: "published" },
  { id: "6", name: "Apple Watch Series 9", slug: "apple-watch-series-9", final_price: 349.99, base_price: 399.99, image: "", store: { name: "MSM Tech Store" }, average_rating: 4.7, review_count: 234, free_shipping: true, status: "published" },
]

const COUNTRY_FLAGS: Record<string, string> = {
  US: "🇺🇸", CU: "🇨🇺", MX: "🇲🇽", CA: "🇨🇦", ES: "🇪🇸", CO: "🇨🇴",
  AR: "🇦🇷", VE: "🇻🇪", BR: "🇧🇷", CL: "🇨🇱", PE: "🇵🇪", EC: "🇪🇨",
}

function getBadge(product: HomeProduct) {
  if (product.final_price < product.base_price) return { label: "Oferta", color: "bg-red-500/20 text-red-400" }
  if (product.review_count > 200) return { label: "Popular", color: "bg-[#197BD2]/20 text-[#197BD2]" }
  return null
}

export default function MarketplacePage() {
  usePageTitle("Marketplace — MSM")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  const [categories, setCategories] = useState(FALLBACK_CATEGORIES)
  const [stores, setStores] = useState(FALLBACK_STORES)
  const [products, setProducts] = useState<HomeProduct[]>(FALLBACK_PRODUCTS)
  const [, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [catRes, storeRes, prodRes] = await Promise.all([
          fetchCategories(),
          fetchStores({ limit: 6 }),
          fetchProducts({ limit: 6, sort: "popular" }),
        ])

        if (catRes.length > 0) {
          setCategories(catRes.map(c => ({
            name: c.name,
            slug: c.slug,
            icon: c.icon,
            product_count: c.product_count,
          })))
        }

        if (storeRes.stores.length > 0) {
          setStores(storeRes.stores.map(s => ({
            name: s.name,
            slug: s.slug,
            average_rating: s.average_rating,
            product_count: s.product_count,
            country: s.country,
            logo_url: s.logo_url,
          })))
        }

        if (prodRes.products.length > 0) {
          setProducts(prodRes.products.map(p => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
            final_price: p.final_price,
            base_price: p.base_price,
            image: p.images?.[0]?.url || "",
            store: p.store ? { name: p.store.name } : { name: "" },
            average_rating: p.average_rating,
            review_count: p.review_count,
            free_shipping: p.free_shipping,
            status: p.status,
          })))
        }
      } catch {
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="min-h-screen zafiro-page text-white">
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0C3F6A] via-[#197BD2] to-[#0C3F6A] rounded-2xl p-6 md:p-8">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 right-4 w-32 h-32 border border-white/20 rounded-full" />
          <div className="absolute bottom-4 left-4 w-24 h-24 border border-white/20 rounded-full" />
        </div>
        <div className="relative z-10">
          <h1 className="text-2xl md:text-3xl font-black zafiro-gold-text mb-2">
            MSM <span className="text-[#F1D98C]">Marketplace</span>
          </h1>
          <p className="text-sm text-white/70 mb-4 max-w-md">
            Compra y vende con confianza. Envíos a Cuba, Estados Unidos y Latinoamérica.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link href="/marketplace/productos" className="inline-flex items-center gap-2 bg-white text-[#0C3F6A] px-4 py-2 rounded-xl text-sm font-bold hover:bg-white/90 transition-colors">
              <Package className="w-4 h-4" /> Explorar Productos
            </Link>
            <Link href="/marketplace/crear-tienda" className="inline-flex items-center gap-2 bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30 px-4 py-2 rounded-xl text-sm font-bold hover:bg-[#D4AF37]/30 transition-colors">
              <Store className="w-4 h-4" /> Crear Mi Tienda
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mt-4">
        {[
          { icon: Truck, label: "Envío Directo", sub: "Del proveedor a tu puerta" },
          { icon: Shield, label: "Pago Seguro", sub: "Protección al comprador" },
          { icon: Zap, label: "Entrega Rápida", sub: "3-7 días hábiles" },
        ].map((b, i) => (
          <div key={i} className="text-center p-3 rounded-xl bg-slate-900/30 border border-slate-800/50">
            <b.icon className="w-5 h-5 text-[#197BD2] mx-auto mb-1" />
            <p className="text-[10px] font-bold text-white">{b.label}</p>
            <p className="text-[8px] text-slate-500">{b.sub}</p>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-white">Categorías</h2>
          <Link href="/marketplace/productos" className="text-[10px] text-[#197BD2] hover:underline flex items-center gap-1">
            Ver todo <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/marketplace/productos?category=${cat.slug}`}
              className="flex-shrink-0 flex flex-col items-center gap-1 p-3 rounded-xl bg-slate-900/30 border border-slate-800/50 hover:border-[#197BD2]/30 transition-all min-w-[80px]"
            >
              <span className="text-2xl">{cat.icon}</span>
              <span className="text-[9px] font-bold text-white text-center">{cat.name}</span>
              <span className="text-[7px] text-slate-500">{cat.product_count}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-white">Tiendas Destacadas</h2>
          <Link href="/marketplace/tiendas" className="text-[10px] text-[#197BD2] hover:underline flex items-center gap-1">
            Ver todas <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
          {stores.map((store) => (
            <Link
              key={store.slug}
              href={`/marketplace/tiendas/${store.slug}`}
              className="flex-shrink-0 w-48 p-4 rounded-xl bg-slate-900/30 border border-slate-800/50 hover:border-[#197BD2]/30 transition-all"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#197BD2] to-[#0C3F6A] flex items-center justify-center text-lg overflow-hidden">
                  {store.logo_url ? (
                    <img src={store.logo_url} alt={store.name} className="w-full h-full object-cover" />
                  ) : (
                    COUNTRY_FLAGS[store.country] || "🌍"
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-white truncate">{store.name}</p>
                  <div className="flex items-center gap-1">
                    <Star className="w-2.5 h-2.5 text-[#D4AF37] fill-[#D4AF37]" />
                    <span className="text-[9px] text-slate-400">{store.average_rating}</span>
                  </div>
                </div>
              </div>
              <p className="text-[9px] text-slate-500">{store.product_count} productos</p>
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-white">Productos Recomendados</h2>
          <div className="flex items-center gap-1">
            <button onClick={() => setViewMode("grid")} className={`p-1.5 rounded-lg ${viewMode === "grid" ? "bg-[#197BD2]/20 text-[#197BD2]" : "text-slate-500"}`}>
              <Grid3X3 className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setViewMode("list")} className={`p-1.5 rounded-lg ${viewMode === "list" ? "bg-[#197BD2]/20 text-[#197BD2]" : "text-slate-500"}`}>
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <div className={viewMode === "grid" ? "grid grid-cols-2 md:grid-cols-3 gap-3" : "space-y-3"}>
          {products.map((product) => {
            const badge = getBadge(product)
            return (
              <Link
                key={product.id}
                href={`/marketplace/productos/${product.slug}`}
                className={`group rounded-xl bg-slate-900/30 border border-slate-800/50 hover:border-[#197BD2]/30 transition-all overflow-hidden ${viewMode === "list" ? "flex" : ""}`}
              >
                <div className={`bg-slate-800/30 flex items-center justify-center ${viewMode === "list" ? "w-28 h-28 shrink-0" : "h-36"}`}>
                  {product.image ? (
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-10 h-10 text-slate-600" />
                  )}
                </div>
                <div className={`p-3 ${viewMode === "list" ? "flex-1" : ""}`}>
                  {badge && (
                    <span className={`inline-block text-[7px] font-bold px-1.5 py-0.5 rounded-full mb-1 ${badge.color}`}>
                      {badge.label}
                    </span>
                  )}
                  <p className="text-[11px] font-bold text-white mb-1 line-clamp-2 group-hover:text-[#197BD2] transition-colors">{product.name}</p>
                  <p className="text-[9px] text-slate-500 mb-2">{product.store.name}</p>
                  <div className="flex items-center gap-1 mb-1">
                    <Star className="w-2.5 h-2.5 text-[#D4AF37] fill-[#D4AF37]" />
                    <span className="text-[9px] text-slate-400">{product.average_rating} ({product.review_count})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-[#197BD2]">{formatPrice(product.final_price)}</span>
                    {product.base_price > product.final_price && (
                      <span className="text-[9px] text-slate-500 line-through">{formatPrice(product.base_price)}</span>
                    )}
                  </div>
                  <p className="text-[8px] text-emerald-400 mt-1">{product.free_shipping ? "Envío gratis" : ""}</p>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      <div className="mt-8 mb-8 p-6 rounded-2xl bg-gradient-to-br from-[#D4AF37]/10 to-[#D4AF37]/5 border border-[#D4AF37]/20 text-center">
        <Store className="w-8 h-8 text-[#D4AF37] mx-auto mb-2" />
        <h3 className="text-sm font-bold text-white mb-1">¿Tienes algo para vender?</h3>
        <p className="text-[10px] text-slate-400 mb-3 max-w-sm mx-auto">
          Crea tu tienda gratis y llega a miles de compradores en Cuba, USA y Latinoamérica.
        </p>
        <Link href="/marketplace/crear-tienda" className="inline-flex items-center gap-2 bg-[#D4AF37] text-[#14171A] px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-[#D4AF37]/90 transition-colors">
          <Store className="w-4 h-4" /> Crear Mi Tienda
        </Link>
      </div>
    </div>
  )
}
