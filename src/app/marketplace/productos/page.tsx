'use client'

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Search, Filter, Grid3X3, List, Star, Package, ArrowLeft, Truck, Loader2 } from "lucide-react"
import { formatPrice, COUNTRIES } from "@/lib/marketplace/constants"
import { fetchProducts } from "@/lib/marketplace/client"
import type { ProductWithStore } from "@/lib/marketplace/types"

const SORT_OPTIONS = [
  { value: "newest", label: "Más recientes" },
  { value: "price_asc", label: "Precio: menor a mayor" },
  { value: "price_desc", label: "Precio: mayor a menor" },
  { value: "rating", label: "Mejor valorados" },
  { value: "popular", label: "Más populares" },
]

const PAGE_SIZE = 24

const FALLBACK_PRODUCTS: ProductWithStore[] = [
  { id: "1", slug: "iphone-15-pro-max", name: "iPhone 15 Pro Max 256GB", final_price: 1199.99, base_price: 1299.99, currency: "USD", average_rating: 4.8, review_count: 124, free_shipping: true, shipping_from_country: "US", sales_count: 342, status: "published", store: { id: "s1", name: "MSM Tech Store", slug: "msm-tech", country: "US", city: "Miami", average_rating: 4.8 } as any, category: { id: "c1", name: "Electrónica", slug: "electronica", icon: "Smartphone" } as any } as any,
  { id: "2", slug: "samsung-galaxy-s24-ultra", name: "Samsung Galaxy S24 Ultra", final_price: 1049.99, base_price: 1199.99, currency: "USD", average_rating: 4.7, review_count: 89, free_shipping: false, shipping_from_country: "US", sales_count: 200, status: "published", store: { id: "s1", name: "MSM Tech Store", slug: "msm-tech", country: "US", city: "Miami", average_rating: 4.8 } as any, category: { id: "c1", name: "Electrónica", slug: "electronica", icon: "Smartphone" } as any } as any,
  { id: "3", slug: "macbook-air-m3-15", name: 'MacBook Air M3 15"', final_price: 1499.00, base_price: 1499.00, currency: "USD", average_rating: 4.9, review_count: 201, free_shipping: true, shipping_from_country: "US", sales_count: 150, status: "published", store: { id: "s1", name: "MSM Tech Store", slug: "msm-tech", country: "US", city: "Miami", average_rating: 4.8 } as any, category: { id: "c1", name: "Electrónica", slug: "electronica", icon: "Laptop" } as any } as any,
  { id: "4", slug: "airpods-pro-2da-gen", name: "AirPods Pro 2da Gen", final_price: 189.99, base_price: 249.99, currency: "USD", average_rating: 4.6, review_count: 567, free_shipping: true, shipping_from_country: "US", sales_count: 800, status: "published", store: { id: "s1", name: "MSM Tech Store", slug: "msm-tech", country: "US", city: "Miami", average_rating: 4.8 } as any, category: { id: "c1", name: "Electrónica", slug: "electronica", icon: "Headphones" } as any } as any,
  { id: "5", slug: "ipad-air-m2-256gb", name: "iPad Air M2 256GB", final_price: 749.00, base_price: 799.00, currency: "USD", average_rating: 4.8, review_count: 156, free_shipping: false, shipping_from_country: "US", sales_count: 300, status: "published", store: { id: "s1", name: "MSM Tech Store", slug: "msm-tech", country: "US", city: "Miami", average_rating: 4.8 } as any, category: { id: "c1", name: "Electrónica", slug: "electronica", icon: "Tablet" } as any } as any,
  { id: "6", slug: "apple-watch-series-9", name: "Apple Watch Series 9", final_price: 349.99, base_price: 399.99, currency: "USD", average_rating: 4.7, review_count: 234, free_shipping: true, shipping_from_country: "US", sales_count: 250, status: "published", store: { id: "s1", name: "MSM Tech Store", slug: "msm-tech", country: "US", city: "Miami", average_rating: 4.8 } as any, category: { id: "c1", name: "Electrónica", slug: "electronica", icon: "Watch" } as any } as any,
  { id: "7", slug: "playstation-5-slim", name: "PlayStation 5 Slim", final_price: 449.99, base_price: 499.99, currency: "USD", average_rating: 4.8, review_count: 312, free_shipping: false, shipping_from_country: "US", sales_count: 500, status: "published", store: { id: "s1", name: "MSM Tech Store", slug: "msm-tech", country: "US", city: "Miami", average_rating: 4.8 } as any, category: { id: "c2", name: "Gaming", slug: "gaming", icon: "Gamepad2" } as any } as any,
  { id: "8", slug: "nintendo-switch-oled", name: "Nintendo Switch OLED", final_price: 329.99, base_price: 349.99, currency: "USD", average_rating: 4.7, review_count: 189, free_shipping: true, shipping_from_country: "US", sales_count: 400, status: "published", store: { id: "s1", name: "MSM Tech Store", slug: "msm-tech", country: "US", city: "Miami", average_rating: 4.8 } as any, category: { id: "c2", name: "Gaming", slug: "gaming", icon: "Gamepad2" } as any } as any,
  { id: "9", slug: "dyson-v15-detect", name: "Dyson V15 Detect", final_price: 649.99, base_price: 749.99, currency: "USD", average_rating: 4.6, review_count: 98, free_shipping: true, shipping_from_country: "US", sales_count: 120, status: "published", store: { id: "s1", name: "MSM Tech Store", slug: "msm-tech", country: "US", city: "Miami", average_rating: 4.8 } as any, category: { id: "c3", name: "Hogar", slug: "hogar", icon: "Home" } as any } as any,
  { id: "10", slug: "sony-wh-1000xm5", name: "Sony WH-1000XM5", final_price: 298.00, base_price: 399.99, currency: "USD", average_rating: 4.9, review_count: 445, free_shipping: true, shipping_from_country: "US", sales_count: 600, status: "published", store: { id: "s1", name: "MSM Tech Store", slug: "msm-tech", country: "US", city: "Miami", average_rating: 4.8 } as any, category: { id: "c1", name: "Electrónica", slug: "electronica", icon: "Headphones" } as any } as any,
  { id: "11", slug: "canon-eos-r50", name: "Canon EOS R50", final_price: 679.00, base_price: 749.00, currency: "USD", average_rating: 4.7, review_count: 67, free_shipping: false, shipping_from_country: "US", sales_count: 80, status: "published", store: { id: "s1", name: "MSM Tech Store", slug: "msm-tech", country: "US", city: "Miami", average_rating: 4.8 } as any, category: { id: "c4", name: "Fotografía", slug: "fotografia", icon: "Camera" } as any } as any,
  { id: "12", slug: "bose-quietcomfort-ultra", name: "Bose QuietComfort Ultra", final_price: 379.00, base_price: 429.00, currency: "USD", average_rating: 4.8, review_count: 201, free_shipping: true, shipping_from_country: "US", sales_count: 180, status: "published", store: { id: "s1", name: "MSM Tech Store", slug: "msm-tech", country: "US", city: "Miami", average_rating: 4.8 } as any, category: { id: "c1", name: "Electrónica", slug: "electronica", icon: "Headphones" } as any } as any,
]

function SkeletonCard({ listMode }: { listMode: boolean }) {
  return (
    <div className={`rounded-xl bg-slate-900/30 border border-slate-800/50 overflow-hidden animate-pulse ${listMode ? "flex" : ""}`}>
      <div className={`bg-slate-800/30 ${listMode ? "w-28 h-28 shrink-0" : "h-36"}`} />
      <div className={`p-3 ${listMode ? "flex-1" : ""}`}>
        <div className="h-3 bg-slate-800/50 rounded w-3/4 mb-2" />
        <div className="h-2 bg-slate-800/50 rounded w-1/3 mb-2" />
        <div className="h-2 bg-slate-800/50 rounded w-1/4 mb-2" />
        <div className="h-4 bg-slate-800/50 rounded w-1/2" />
      </div>
    </div>
  )
}

function MarketplaceProductsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const initialQ = searchParams.get("q") || ""
  const initialSort = searchParams.get("sort") || "newest"
  const initialCountry = searchParams.get("country") || ""
  const initialFreeShipping = searchParams.get("free_shipping") === "true"

  const [search, setSearch] = useState(initialQ)
  const [sortBy, setSortBy] = useState(initialSort)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [showFilters, setShowFilters] = useState(false)
  const [selectedCountry, setSelectedCountry] = useState(initialCountry)
  const [freeShipping, setFreeShipping] = useState(initialFreeShipping)
  const [products, setProducts] = useState<ProductWithStore[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [usedFallback, setUsedFallback] = useState(false)

  const updateURL = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    router.replace(`/marketplace/productos?${params.toString()}`, { scroll: false })
  }

  const loadProducts = async (reset = false) => {
    const currentOffset = reset ? 0 : offset
    if (reset) {
      setLoading(true)
      setProducts([])
      setOffset(0)
      setHasMore(true)
    } else {
      setLoadingMore(true)
    }

    const filters: Record<string, unknown> = {
      sort: sortBy as "newest" | "price_asc" | "price_desc" | "rating" | "popular",
      limit: PAGE_SIZE,
      offset: currentOffset,
    }
    if (search) filters.search = search
    if (selectedCountry) filters.country = selectedCountry
    if (freeShipping) filters.free_shipping = true

    try {
      const result = await fetchProducts(filters as Parameters<typeof fetchProducts>[0])
      if (result.products.length === 0 && currentOffset === 0) {
        setProducts(FALLBACK_PRODUCTS)
        setTotal(FALLBACK_PRODUCTS.length)
        setUsedFallback(true)
        setHasMore(false)
      } else {
        if (reset || currentOffset === 0) {
          setProducts(result.products)
        } else {
          setProducts(prev => [...prev, ...result.products])
        }
        setTotal(result.total)
        setUsedFallback(false)
        setHasMore(currentOffset + result.products.length < result.total)
        if (!reset && currentOffset > 0) {
          setOffset(currentOffset + PAGE_SIZE)
        } else {
          setOffset(PAGE_SIZE)
        }
      }
    } catch {
      setProducts(FALLBACK_PRODUCTS)
      setTotal(FALLBACK_PRODUCTS.length)
      setUsedFallback(true)
      setHasMore(false)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    loadProducts(true)
  }, [sortBy, selectedCountry, freeShipping])

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadProducts(true)
    }, 400)
    return () => clearTimeout(timeout)
  }, [search])

  const handleSearchChange = (value: string) => {
    setSearch(value)
    updateURL("q", value)
  }

  const handleSortChange = (value: string) => {
    setSortBy(value)
    updateURL("sort", value)
  }

  const handleCountryChange = (value: string) => {
    setSelectedCountry(value)
    updateURL("country", value)
  }

  const handleFreeShippingToggle = () => {
    const next = !freeShipping
    setFreeShipping(next)
    updateURL("free_shipping", next ? "true" : "")
  }

  return (
    <div className="min-h-screen bg-[#050816] text-white">
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
                placeholder="Buscar productos..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#197BD2]/50 transition-colors"
              />
            </div>
            <button onClick={() => setShowFilters(!showFilters)} className={`p-2.5 rounded-xl border transition-colors ${showFilters ? "bg-[#197BD2]/20 border-[#197BD2]/50 text-[#197BD2]" : "bg-slate-900/50 border-slate-700/50 hover:border-[#197BD2]/30 text-slate-300"}`}>
              <Filter className="w-4 h-4" />
            </button>
          </div>

          {/* Filters Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
              className="bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-1.5 text-[10px] text-white focus:outline-none focus:border-[#197BD2]/50"
            >
              {SORT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <select
              value={selectedCountry}
              onChange={(e) => handleCountryChange(e.target.value)}
              className="bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-1.5 text-[10px] text-white focus:outline-none focus:border-[#197BD2]/50"
            >
              <option value="">Todos los países</option>
              {COUNTRIES.map(c => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
            <button
              onClick={handleFreeShippingToggle}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all whitespace-nowrap ${
                freeShipping
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : "bg-slate-900/50 border-slate-700/50 text-slate-400"
              }`}
            >
              <Truck className="w-3 h-3" />
              Envío gratis
            </button>
            <div className="flex items-center gap-1 ml-auto">
              <button onClick={() => setViewMode("grid")} className={`p-1.5 rounded-lg ${viewMode === "grid" ? "bg-[#197BD2]/20 text-[#197BD2]" : "text-slate-500"}`}>
                <Grid3X3 className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setViewMode("list")} className={`p-1.5 rounded-lg ${viewMode === "list" ? "bg-[#197BD2]/20 text-[#197BD2]" : "text-slate-500"}`}>
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        {loading ? (
          <>
            <div className="h-2 bg-slate-800/50 rounded w-32 mb-3 animate-pulse" />
            <div className={viewMode === "grid" ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3" : "space-y-3"}>
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonCard key={i} listMode={viewMode === "list"} />
              ))}
            </div>
          </>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Package className="w-16 h-16 text-slate-700 mb-4" />
            <p className="text-sm font-bold text-slate-400 mb-1">No se encontraron productos</p>
            <p className="text-[10px] text-slate-600">Intenta con otros filtros o términos de búsqueda</p>
          </div>
        ) : (
          <>
            <p className="text-[10px] text-slate-500 mb-3">
              {usedFallback ? "Mostrando productos de ejemplo" : `${total} productos encontrados`}
            </p>

            <div className={viewMode === "grid" ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3" : "space-y-3"}>
              {products.map((product) => {
                const hasDiscount = product.base_price > product.final_price
                const discountPct = hasDiscount ? Math.round(((product.base_price - product.final_price) / product.base_price) * 100) : 0
                const slug = product.slug || product.id

                return (
                  <Link
                    key={product.id}
                    href={`/marketplace/productos/${slug}`}
                    className={`group rounded-xl bg-slate-900/30 border border-slate-800/50 hover:border-[#197BD2]/30 transition-all overflow-hidden ${viewMode === "list" ? "flex" : ""}`}
                  >
                    <div className={`bg-slate-800/30 flex items-center justify-center relative ${viewMode === "list" ? "w-28 h-28 shrink-0" : "h-36"}`}>
                      <Package className="w-10 h-10 text-slate-600" />
                      {hasDiscount && (
                        <span className="absolute top-2 left-2 text-[8px] font-bold text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded-full">
                          -{discountPct}%
                        </span>
                      )}
                      {product.free_shipping && (
                        <span className="absolute top-2 right-2 text-[8px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
                          Envío gratis
                        </span>
                      )}
                    </div>
                    <div className={`p-3 ${viewMode === "list" ? "flex-1" : ""}`}>
                      <p className="text-[11px] font-bold text-white mb-1 line-clamp-2 group-hover:text-[#197BD2] transition-colors">{product.name}</p>
                      <p className="text-[9px] text-slate-500 mb-2">{product.store?.name || "Tienda"}</p>
                      <div className="flex items-center gap-1 mb-1">
                        <Star className="w-2.5 h-2.5 text-[#D4AF37] fill-[#D4AF37]" />
                        <span className="text-[9px] text-slate-400">{product.average_rating?.toFixed(1) || "0.0"} ({product.review_count || 0})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-[#197BD2]">{formatPrice(product.final_price, product.currency)}</span>
                        {hasDiscount && (
                          <span className="text-[9px] text-slate-500 line-through">{formatPrice(product.base_price, product.currency)}</span>
                        )}
                      </div>
                      {!product.free_shipping && (
                        <p className="text-[8px] text-slate-600 mt-1">Envío estimado</p>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="flex justify-center mt-6">
                <button
                  onClick={() => loadProducts(false)}
                  disabled={loadingMore}
                  className="px-6 py-2.5 rounded-xl bg-slate-900/50 border border-slate-700/50 text-[11px] font-bold text-white hover:border-[#197BD2]/30 transition-colors disabled:opacity-50"
                >
                  {loadingMore ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Cargando...
                    </span>
                   ) : (
                    "Cargar más productos"
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default function MarketplaceProductsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#050816] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#197BD2] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <MarketplaceProductsContent />
    </Suspense>
  )
}
