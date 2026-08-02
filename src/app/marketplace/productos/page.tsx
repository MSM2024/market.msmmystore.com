'use client'

import { useState, useEffect, useCallback, useRef, Suspense } from "react"
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

function makeFallbackProduct(p: Partial<ProductWithStore> & Pick<ProductWithStore, "id" | "slug" | "name" | "final_price">): ProductWithStore {
  const store = p.store ? { ...storeBase, ...p.store } : storeBase
  return {
    store_id: "",
    category_id: null,
    provider_id: null,
    description: "",
    short_description: "",
    source: "own",
    sku: "",
    external_id: "",
    external_url: "",
    base_price: p.base_price || p.final_price,
    currency: "USD",
    tax_rate: 0,
    service_fee: 0,
    margin: 0,
    estimated_shipping: 0,
    shipping_from_country: "US",
    free_shipping: false,
    stock: 0,
    low_stock_threshold: 0,
    track_inventory: false,
    weight_grams: 0,
    width_cm: 0,
    height_cm: 0,
    depth_cm: 0,
    estimated_delivery_days: 0,
    delivery_modes: [],
    return_policy: "",
    return_days: 0,
    countries_deliver_to: [],
    tags: [],
    status: "published",
    rejection_reason: "",
    sync_status: "",
    last_synced_at: null,
    view_count: 0,
    sales_count: 0,
    average_rating: 0,
    review_count: 0,
    favorite_count: 0,
    published_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...p,
    store: store as ProductWithStore["store"],
  }
}

const storeBase = {
  id: "s1",
  name: "MSM Tech Store",
  slug: "msm-tech",
  country: "US",
  city: "Miami",
  average_rating: 4.8,
}

const FALLBACK_PRODUCTS: ProductWithStore[] = [
  makeFallbackProduct({ id: "1", slug: "iphone-15-pro-max", name: "iPhone 15 Pro Max 256GB", final_price: 1199.99, base_price: 1299.99, average_rating: 4.8, review_count: 124, free_shipping: true, shipping_from_country: "US", sales_count: 342 }),
  makeFallbackProduct({ id: "2", slug: "samsung-galaxy-s24-ultra", name: "Samsung Galaxy S24 Ultra", final_price: 1049.99, base_price: 1199.99, average_rating: 4.7, review_count: 89, free_shipping: false, sales_count: 200 }),
  makeFallbackProduct({ id: "3", slug: "macbook-air-m3-15", name: 'MacBook Air M3 15"', final_price: 1499.0, average_rating: 4.9, review_count: 201, free_shipping: true, sales_count: 150 }),
  makeFallbackProduct({ id: "4", slug: "airpods-pro-2da-gen", name: "AirPods Pro 2da Gen", final_price: 189.99, base_price: 249.99, average_rating: 4.6, review_count: 567, free_shipping: true, sales_count: 800 }),
  makeFallbackProduct({ id: "5", slug: "ipad-air-m2-256gb", name: "iPad Air M2 256GB", final_price: 749.0, base_price: 799.0, average_rating: 4.8, review_count: 156, free_shipping: false, sales_count: 300 }),
  makeFallbackProduct({ id: "6", slug: "apple-watch-series-9", name: "Apple Watch Series 9", final_price: 349.99, base_price: 399.99, average_rating: 4.7, review_count: 234, free_shipping: true, sales_count: 250 }),
  makeFallbackProduct({ id: "7", slug: "playstation-5-slim", name: "PlayStation 5 Slim", final_price: 449.99, base_price: 499.99, average_rating: 4.8, review_count: 312, free_shipping: false, sales_count: 500 }),
  makeFallbackProduct({ id: "8", slug: "nintendo-switch-oled", name: "Nintendo Switch OLED", final_price: 329.99, base_price: 349.99, average_rating: 4.7, review_count: 189, free_shipping: true, sales_count: 400 }),
  makeFallbackProduct({ id: "9", slug: "dyson-v15-detect", name: "Dyson V15 Detect", final_price: 649.99, base_price: 749.99, average_rating: 4.6, review_count: 98, free_shipping: true, sales_count: 120 }),
  makeFallbackProduct({ id: "10", slug: "sony-wh-1000xm5", name: "Sony WH-1000XM5", final_price: 298.0, base_price: 399.99, average_rating: 4.9, review_count: 445, free_shipping: true, sales_count: 600 }),
  makeFallbackProduct({ id: "11", slug: "canon-eos-r50", name: "Canon EOS R50", final_price: 679.0, base_price: 749.0, average_rating: 4.7, review_count: 67, free_shipping: false, sales_count: 80 }),
  makeFallbackProduct({ id: "12", slug: "bose-quietcomfort-ultra", name: "Bose QuietComfort Ultra", final_price: 379.0, base_price: 429.0, average_rating: 4.8, review_count: 201, free_shipping: true, sales_count: 180 }),
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

  const loadProducts = useCallback(async (reset: boolean, currentOffset: number, q: string) => {
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
    if (q) filters.search = q
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
  }, [sortBy, selectedCountry, freeShipping])

  const loadProductsRef = useRef(loadProducts)
  useEffect(() => {
    loadProductsRef.current = loadProducts
  })

  const searchRef = useRef(search)
  useEffect(() => {
    searchRef.current = search
  })

  useEffect(() => {
    Promise.resolve().then(() => loadProductsRef.current(true, 0, searchRef.current))
  }, [sortBy, selectedCountry, freeShipping])

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadProductsRef.current(true, 0, search)
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
                  onClick={() => loadProducts(false, offset, search)}
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
      <div className="min-h-screen zafiro-page flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#197BD2] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <MarketplaceProductsContent />
    </Suspense>
  )
}
