'use client'

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Star, ShoppingCart, Heart, Truck, Shield, RotateCcw, Store, ChevronRight, Package, Minus, Plus, Share2, Loader2, ImageOff } from "lucide-react"
import { formatPrice } from "@/lib/marketplace/constants"
import { fetchProductBySlug, fetchProductVariants, fetchProductImages, fetchProductReviews } from "@/lib/marketplace/client"
import { useCart } from "@/contexts/CartContext"
import ElianaMarketplaceChat from "@/components/eliana/ElianaMarketplaceChat"
import type { ProductWithStore, ProductVariant, ProductImage, MarketplaceReview } from "@/lib/marketplace/types"

const FALLBACK_PRODUCT: ProductWithStore = {
  id: "fallback-1",
  slug: "iphone-15-pro-max",
  store_id: "s1",
  category_id: "c1",
  provider_id: null,
  name: "iPhone 15 Pro Max 256GB — Titanio Natural",
  description: "El iPhone 15 Pro Max presenta el chip A17 Pro, cámara de 48MP con zoom óptico 5x, y carcasa de titanio. La pantalla Super Retina XDR de 6.7 pulgadas ofrece una experiencia visual incomparable.",
  short_description: "Chip A17 Pro, cámara 48MP, carcasa de titanio",
  source: "own",
  sku: "MSM-IPH15PM-256",
  external_id: "",
  external_url: "",
  base_price: 1299.99,
  final_price: 1199.99,
  currency: "USD",
  tax_rate: 0,
  service_fee: 0,
  margin: 0,
  estimated_shipping: 0,
  shipping_from_country: "US",
  free_shipping: true,
  stock: 15,
  low_stock_threshold: 5,
  track_inventory: true,
  weight_grams: 221,
  width_cm: 0,
  height_cm: 0,
  depth_cm: 0,
  estimated_delivery_days: 4,
  delivery_modes: [],
  return_policy: "30 días de devolución",
  return_days: 30,
  countries_deliver_to: [],
  tags: [],
  status: "published",
  rejection_reason: "",
  sync_status: "",
  last_synced_at: null,
  view_count: 1200,
  sales_count: 342,
  average_rating: 4.8,
  review_count: 124,
  favorite_count: 56,
  published_at: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  store: {
    id: "s1",
    owner_id: "",
    name: "MSM Tech Store",
    slug: "msm-tech",
    description: "",
    logo_url: "",
    cover_url: "",
    country: "US",
    city: "Miami",
    whatsapp: "",
    email: "",
    website: "",
    social_instagram: "",
    social_facebook: "",
    social_tiktok: "",
    social_youtube: "",
    currency: "USD",
    timezone: "",
    return_policy: "30 días",
    shipping_policy: "Envío en 3-5 días",
    status: "active",
    verification_level: "business_verified",
    rejection_reason: "",
    product_count: 50,
    total_sales: 1500,
    total_revenue: 150000,
    average_rating: 4.8,
    review_count: 800,
    follower_count: 200,
    commission_rate: 10,
    approved_at: null,
    suspended_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  category: {
    id: "c1",
    name: "Electrónica",
    slug: "electronica",
    description: "",
    icon: "Smartphone",
    image_url: "",
    parent_id: null,
    sort_order: 1,
    is_active: true,
    product_count: 100,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
}

const FALLBACK_VARIANTS: ProductVariant[] = [
  { id: "v1", product_id: "fallback-1", name: "256GB", sku: "MSM-IPH15PM-256", price_override: null, stock: 10, attributes: { storage: "256GB" }, image_url: "", is_active: true, sort_order: 0, created_at: "", updated_at: "" },
  { id: "v2", product_id: "fallback-1", name: "512GB", sku: "MSM-IPH15PM-512", price_override: 1399.99, stock: 5, attributes: { storage: "512GB" }, image_url: "", is_active: true, sort_order: 1, created_at: "", updated_at: "" },
  { id: "v3", product_id: "fallback-1", name: "1TB", sku: "MSM-IPH15PM-1TB", price_override: 1599.99, stock: 0, attributes: { storage: "1TB" }, image_url: "", is_active: true, sort_order: 2, created_at: "", updated_at: "" },
]

export default function ProductDetailPage() {
  const params = useParams<{ slug: string }>()
  const slug = params?.slug || ""

  const [product, setProduct] = useState<ProductWithStore | null>(null)
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [images, setImages] = useState<ProductImage[]>([])
  const [reviews, setReviews] = useState<MarketplaceReview[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [isFavorite, setIsFavorite] = useState(false)

  const { addItem } = useCart()

  useEffect(() => {
    if (!slug) return
    let cancelled = false

    async function load() {
      setLoading(true)
      setNotFound(false)
      setQuantity(1)
      setSelectedVariant(null)
      setSelectedImage(0)
      setIsFavorite(false)

      try {
        let p = await fetchProductBySlug(slug)
        if (!p && !cancelled) {
          p = { ...FALLBACK_PRODUCT, slug }
        }
        if (cancelled || !p) return

        setProduct(p)

        const [v, img, rev] = await Promise.all([
          fetchProductVariants(p.id),
          fetchProductImages(p.id),
          fetchProductReviews(p.id),
        ])

        if (cancelled) return

        setVariants(v.length > 0 ? v : p.id === "fallback-1" ? FALLBACK_VARIANTS : [])
        setImages(img)
        setReviews(rev)

        if (p.id === "fallback-1") {
          setNotFound(false)
        }
      } catch {
        if (!cancelled) {
          setProduct({ ...FALLBACK_PRODUCT, slug })
          setVariants(FALLBACK_VARIANTS)
          setNotFound(false)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [slug])

  const displayPrice = selectedVariant?.price_override || product?.final_price || 0
  const displayOriginalPrice = product?.base_price || 0
  const hasDiscount = displayOriginalPrice > displayPrice
  const discountPct = hasDiscount ? Math.round(((displayOriginalPrice - displayPrice) / displayOriginalPrice) * 100) : 0
  const stock = selectedVariant ? selectedVariant.stock : product?.stock || 0
  const hasImages = images.length > 0

  const handleAddToCart = () => {
    if (!product) return
    addItem({
      productId: product.id,
      variantId: selectedVariant?.id,
      name: product.name,
      image: hasImages ? images[0].url : "",
      price: displayPrice,
      quantity,
      storeId: product.store_id,
      storeName: product.store?.name || "Tienda",
      stock,
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen zafiro-page text-white">
        <div className="sticky top-0 z-40 bg-[#050816]/90 backdrop-blur-xl border-b border-white/5">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
            <Link href="/marketplace/productos" className="p-2 rounded-lg hover:bg-slate-800/50 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="h-3 bg-slate-800/50 rounded w-48 animate-pulse" />
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="grid md:grid-cols-2 gap-6 animate-pulse">
            <div className="aspect-square rounded-2xl bg-slate-900/30 border border-slate-800/50 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-slate-600 animate-spin" />
            </div>
            <div className="space-y-4">
              <div className="h-2 bg-slate-800/50 rounded w-3/4" />
              <div className="h-6 bg-slate-800/50 rounded w-full" />
              <div className="h-8 bg-slate-800/50 rounded w-1/3" />
              <div className="h-10 bg-slate-800/50 rounded w-full" />
              <div className="h-12 bg-[#197BD2]/20 rounded-xl w-full" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (notFound || !product) {
    return (
      <div className="min-h-screen zafiro-page text-white">
        <div className="sticky top-0 z-40 bg-[#050816]/90 backdrop-blur-xl border-b border-white/5">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
            <Link href="/marketplace/productos" className="p-2 rounded-lg hover:bg-slate-800/50 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-sm font-bold text-white">Producto no encontrado</h1>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-20">
          <Package className="w-16 h-16 text-slate-700 mb-4" />
          <p className="text-sm font-bold text-slate-400 mb-1">Producto no encontrado</p>
          <p className="text-[10px] text-slate-600 mb-4">El producto que buscas no existe o fue removido</p>
          <Link href="/marketplace/productos" className="px-4 py-2 rounded-xl bg-[#197BD2] text-white text-[11px] font-bold hover:bg-[#197BD2]/90 transition-colors">
            Ver productos
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen zafiro-page text-white">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#050816]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/marketplace/productos" className="p-2 rounded-lg hover:bg-slate-800/50 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="text-sm font-bold text-white truncate flex-1">{product.name}</h1>
          <button className="p-2 rounded-lg hover:bg-slate-800/50 transition-colors">
            <Share2 className="w-4 h-4 text-slate-300" />
          </button>
          <button onClick={() => setIsFavorite(!isFavorite)} className="p-2 rounded-lg hover:bg-slate-800/50 transition-colors">
            <Heart className={`w-4 h-4 ${isFavorite ? "text-red-400 fill-red-400" : "text-slate-300"}`} />
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Images */}
          <div>
            <div className="aspect-square rounded-2xl bg-slate-900/30 border border-slate-800/50 flex items-center justify-center mb-3 overflow-hidden">
              {hasImages && images[selectedImage] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={images[selectedImage].url} alt={images[selectedImage].alt_text || product.name} className="w-full h-full object-contain" />
              ) : (
                <Package className="w-24 h-24 text-slate-600" />
              )}
            </div>
            {hasImages && images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImage(i)}
                    className={`w-16 h-16 rounded-lg bg-slate-900/30 border flex items-center justify-center shrink-0 overflow-hidden ${
                      selectedImage === i ? "border-[#197BD2]" : "border-slate-800/50"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt={img.alt_text} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
            {!hasImages && (
              <div className="flex gap-2">
                {[0, 1, 2, 3].map((i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`w-16 h-16 rounded-lg bg-slate-900/30 border flex items-center justify-center ${
                      selectedImage === i ? "border-[#197BD2]" : "border-slate-800/50"
                    }`}
                  >
                    <Package className="w-6 h-6 text-slate-600" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            {/* Breadcrumb */}
            <div className="flex items-center gap-1 text-[9px] text-slate-500 mb-2">
              <Link href="/marketplace" className="hover:text-[#197BD2]">Marketplace</Link>
              <ChevronRight className="w-2.5 h-2.5" />
              <Link href="/marketplace/productos" className="hover:text-[#197BD2]">{product.category?.name || "Productos"}</Link>
              <ChevronRight className="w-2.5 h-2.5" />
              <span className="text-slate-400 truncate">{product.name}</span>
            </div>

            <h1 className="text-xl font-black text-white mb-2">{product.name}</h1>

            {/* Rating */}
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className={`w-3.5 h-3.5 ${s <= Math.round(product.average_rating || 0) ? "text-[#D4AF37] fill-[#D4AF37]" : "text-slate-600"}`} />
                ))}
                <span className="text-[10px] text-slate-400 ml-1">{(product.average_rating || 0).toFixed(1)}</span>
              </div>
              <span className="text-[10px] text-slate-500">({product.review_count || 0} reseñas)</span>
              <span className="text-[10px] text-slate-500">{product.sales_count || 0} vendidos</span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-4">
              <span className="text-3xl font-black text-[#197BD2]">{formatPrice(displayPrice, product.currency)}</span>
              {hasDiscount && (
                <>
                  <span className="text-sm text-slate-500 line-through">{formatPrice(displayOriginalPrice, product.currency)}</span>
                  <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">
                    -{discountPct}%
                  </span>
                </>
              )}
            </div>

            {/* Variants */}
            {variants.length > 0 && (
              <div className="mb-4">
                <p className="text-[10px] font-bold text-slate-400 mb-2">Opciones:</p>
                <div className="flex flex-wrap gap-2">
                  {variants.map((v) => {
                    const isActive = selectedVariant?.id === v.id
                    const isAvailable = v.stock > 0
                    return (
                      <label
                        key={v.id}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                          isActive
                            ? "border-[#197BD2] bg-[#197BD2]/10 text-[#197BD2]"
                            : isAvailable
                              ? "border-slate-700/50 text-white hover:border-[#197BD2]/50"
                              : "border-slate-800/30 text-slate-600 cursor-not-allowed"
                        }`}
                      >
                        <input
                          type="radio"
                          name="variant"
                          value={v.id}
                          checked={isActive}
                          disabled={!isAvailable}
                          onChange={() => setSelectedVariant(v)}
                          className="sr-only"
                        />
                        {v.name}
                        {v.price_override && (
                          <span className="text-[8px] opacity-70">— {formatPrice(v.price_override, product.currency)}</span>
                        )}
                        {!isAvailable && <span className="text-[8px] opacity-50">(agotado)</span>}
                      </label>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="mb-4">
              <p className="text-[10px] font-bold text-slate-400 mb-2">Cantidad:</p>
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-slate-700/50 rounded-lg">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-2 hover:bg-slate-800/50 rounded-l-lg transition-colors">
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-4 py-2 text-sm font-bold">{quantity}</span>
                  <button onClick={() => setQuantity(Math.min(stock, quantity + 1))} className="p-2 hover:bg-slate-800/50 rounded-r-lg transition-colors">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                <span className="text-[10px] text-slate-500">{stock} disponibles</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mb-6">
              <button
                onClick={handleAddToCart}
                disabled={stock === 0}
                className="flex-1 flex items-center justify-center gap-2 bg-[#197BD2] text-white py-3 rounded-xl text-sm font-bold hover:bg-[#197BD2]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingCart className="w-4 h-4" /> Agregar al Carrito
              </button>
              <button
                onClick={() => setIsFavorite(!isFavorite)}
                className={`px-4 py-3 rounded-xl border transition-colors ${
                  isFavorite
                    ? "border-red-400/30 text-red-400 bg-red-500/10"
                    : "border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/10"
                }`}
              >
                <Heart className={`w-4 h-4 ${isFavorite ? "fill-red-400" : ""}`} />
              </button>
            </div>

            {/* Shipping Info */}
            <div className="grid grid-cols-3 gap-2 mb-6">
              {[
                { icon: Truck, label: product.free_shipping ? "Envío gratis" : "Envío estimado", sub: `${product.estimated_delivery_days || 3}-${(product.estimated_delivery_days || 3) + 2} días` },
                { icon: Shield, label: "Compra segura", sub: "Protección al comprador" },
                { icon: RotateCcw, label: "Devolución", sub: product.return_policy || "30 días" },
              ].map((info, i) => (
                <div key={i} className="text-center p-2 rounded-lg bg-slate-900/30 border border-slate-800/50">
                  <info.icon className="w-4 h-4 text-[#197BD2] mx-auto mb-1" />
                  <p className="text-[9px] font-bold text-white">{info.label}</p>
                  <p className="text-[7px] text-slate-500">{info.sub}</p>
                </div>
              ))}
            </div>

            {/* Store Card */}
            {product.store && (
              <Link href={`/marketplace/tiendas/${product.store.slug}`} className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/30 border border-slate-800/50 hover:border-[#197BD2]/30 transition-all mb-6">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#197BD2] to-[#0C3F6A] flex items-center justify-center shrink-0">
                  {product.store.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={product.store.logo_url} alt={product.store.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <Store className="w-5 h-5 text-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <p className="text-[11px] font-bold text-white truncate">{product.store.name}</p>
                    {product.store.verification_level && product.store.verification_level !== "none" && (
                      <Shield className="w-3 h-3 text-[#197BD2] shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-2.5 h-2.5 text-[#D4AF37] fill-[#D4AF37]" />
                    <span className="text-[9px] text-slate-400">{(product.store.average_rating || 0).toFixed(1)}</span>
                    <span className="text-[9px] text-slate-600">({product.store.review_count || 0})</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
              </Link>
            )}

            {/* Specs */}
            {product.sku && (
              <div className="mb-6">
                <h3 className="text-xs font-bold text-white mb-3">Especificaciones</h3>
                <div className="space-y-1.5">
                  {[
                    product.sku && { label: "SKU", value: product.sku },
                    product.weight_grams > 0 && { label: "Peso", value: `${product.weight_grams}g` },
                    product.estimated_delivery_days > 0 && { label: "Envío estimado", value: `${product.estimated_delivery_days} días` },
                    product.shipping_from_country && { label: "Envío desde", value: product.shipping_from_country },
                  ].filter(Boolean).map((spec) => spec && (
                    <div key={spec.label} className="flex items-center justify-between py-1.5 border-b border-slate-800/30 last:border-0">
                      <span className="text-[10px] text-slate-400">{spec.label}</span>
                      <span className="text-[10px] font-bold text-white">{spec.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            {product.description && (
              <div className="mb-6">
                <h3 className="text-xs font-bold text-white mb-2">Descripción</h3>
                <p className="text-[10px] text-slate-400 leading-relaxed whitespace-pre-line">{product.description}</p>
              </div>
            )}

            {/* Reviews Section */}
            <div className="mb-6">
              <h3 className="text-xs font-bold text-white mb-3">Reseñas ({reviews.length || product.review_count || 0})</h3>
              {reviews.length === 0 ? (
                <div className="text-center py-6 rounded-xl bg-slate-900/30 border border-slate-800/50">
                  <ImageOff className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                  <p className="text-[10px] text-slate-500">No hay reseñas todavía</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {reviews.map((review) => (
                    <div key={review.id} className="p-3 rounded-xl bg-slate-900/30 border border-slate-800/50">
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} className={`w-2.5 h-2.5 ${s <= review.rating ? "text-[#D4AF37] fill-[#D4AF37]" : "text-slate-600"}`} />
                          ))}
                        </div>
                        {review.is_verified && (
                          <span className="text-[8px] font-bold text-[#197BD2] bg-[#197BD2]/10 px-1.5 py-0.5 rounded-full">Verificada</span>
                        )}
                        <span className="text-[8px] text-slate-600 ml-auto">
                          {new Date(review.created_at).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      </div>
                      {review.title && <p className="text-[10px] font-bold text-white mb-1">{review.title}</p>}
                      {review.comment && <p className="text-[10px] text-slate-400 leading-relaxed">{review.comment}</p>}
                      {review.seller_reply && (
                        <div className="mt-2 p-2 rounded-lg bg-[#197BD2]/5 border border-[#197BD2]/10">
                          <p className="text-[8px] font-bold text-[#197BD2] mb-0.5">Respuesta del vendedor:</p>
                          <p className="text-[9px] text-slate-400">{review.seller_reply}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ELIANA Marketplace Chat */}
      <ElianaMarketplaceChat
        productName={product.name}
        productSlug={product.slug}
        productPrice={displayPrice}
        productCurrency={product.currency}
        storeName={product.store?.name || "MSM Store"}
      />

      {/* Mobile Sticky Add to Cart */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#050816]/95 backdrop-blur-xl border-t border-white/5 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-slate-500 truncate">{product.name}</p>
            <p className="text-sm font-black text-[#197BD2]">{formatPrice(displayPrice, product.currency)}</p>
          </div>
          <button
            onClick={handleAddToCart}
            disabled={stock === 0}
            className="flex items-center justify-center gap-2 bg-[#197BD2] text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-[#197BD2]/90 transition-colors disabled:opacity-50 shrink-0"
          >
            <ShoppingCart className="w-4 h-4" /> Agregar
          </button>
        </div>
      </div>
    </div>
  )
}
