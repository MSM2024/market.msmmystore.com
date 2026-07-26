'use client'

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Truck, Globe, Shield, Loader2, MapPin } from "lucide-react"
import { usePageTitle } from "@/lib/usePageTitle"
import { fetchProviders } from "@/lib/marketplace/client"
import type { MarketplaceProvider } from "@/lib/marketplace/types"

const TYPE_ICONS: Record<string, typeof Globe> = {
  api: Globe,
  affiliate: Globe,
  manual: Shield,
  msm_inventory: Shield,
  dropship: Truck,
  cuba_supplier: Truck,
}

const TYPE_COLORS: Record<string, string> = {
  api: "text-[#197BD2] bg-[#197BD2]/10 border-[#197BD2]/20",
  affiliate: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  manual: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  msm_inventory: "text-[#D4AF37] bg-[#D4AF37]/10 border-[#D4AF37]/20",
  dropship: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  cuba_supplier: "text-pink-400 bg-pink-500/10 border-pink-500/20",
}

const TYPE_LABELS: Record<string, string> = {
  api: "API",
  affiliate: "Afiliado",
  manual: "Manual",
  msm_inventory: "Inventario MSM",
  dropship: "Dropship",
  cuba_supplier: "Cuba",
}

const STATUS_LABELS: Record<string, string> = {
  active: "Activo",
  inactive: "Inactivo",
  suspended: "Suspendido",
  pending_review: "Pendiente",
}

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  inactive: "bg-slate-500/10 text-slate-400 border border-slate-500/20",
  suspended: "bg-red-500/10 text-red-400 border border-red-500/20",
  pending_review: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
}

const FALLBACK_PROVIDERS: MarketplaceProvider[] = [
  { id: "1", name: "Proveedor Manual", slug: "manual-supplier", description: "Productos ingresados manualmente por el vendedor", provider_type: "manual", status: "active", countries_supported: [], logo_url: "", website_url: "", contact_email: "", contact_phone: "", api_enabled: false, affiliate_enabled: false, resale_enabled: false, dropshipping_enabled: false, credentials_ref: "", default_commission: 0, currency: "USD", product_count: 0, total_sales: 0, average_rating: 0, shipping_from_country: "US", estimated_delivery_days: 7, return_policy: "", created_at: "", updated_at: "" },
  { id: "2", name: "Inventario MSM", slug: "msm-inventory", description: "Productos del inventario propio de MSM", provider_type: "msm_inventory", status: "active", countries_supported: ["US", "CU"], logo_url: "", website_url: "", contact_email: "", contact_phone: "", api_enabled: false, affiliate_enabled: false, resale_enabled: true, dropshipping_enabled: false, credentials_ref: "", default_commission: 0, currency: "USD", product_count: 0, total_sales: 0, average_rating: 0, shipping_from_country: "US", estimated_delivery_days: 5, return_policy: "", created_at: "", updated_at: "" },
  { id: "3", name: "Amazon", slug: "amazon", description: "Amazon Associates — pendiente autorización API", provider_type: "api", status: "inactive", countries_supported: ["US", "CA", "MX"], logo_url: "", website_url: "", contact_email: "", contact_phone: "", api_enabled: false, affiliate_enabled: false, resale_enabled: false, dropshipping_enabled: false, credentials_ref: "", default_commission: 0, currency: "USD", product_count: 0, total_sales: 0, average_rating: 0, shipping_from_country: "US", estimated_delivery_days: 10, return_policy: "", created_at: "", updated_at: "" },
  { id: "4", name: "Walmart", slug: "walmart", description: "Walmart Marketplace — pendiente autorización", provider_type: "api", status: "inactive", countries_supported: ["US"], logo_url: "", website_url: "", contact_email: "", contact_phone: "", api_enabled: false, affiliate_enabled: false, resale_enabled: false, dropshipping_enabled: false, credentials_ref: "", default_commission: 0, currency: "USD", product_count: 0, total_sales: 0, average_rating: 0, shipping_from_country: "US", estimated_delivery_days: 7, return_policy: "", created_at: "", updated_at: "" },
  { id: "5", name: "Sam's Club", slug: "sams-club", description: "Enlaces de afiliado — pendiente", provider_type: "affiliate", status: "inactive", countries_supported: ["US"], logo_url: "", website_url: "", contact_email: "", contact_phone: "", api_enabled: false, affiliate_enabled: false, resale_enabled: false, dropshipping_enabled: false, credentials_ref: "", default_commission: 0, currency: "USD", product_count: 0, total_sales: 0, average_rating: 0, shipping_from_country: "US", estimated_delivery_days: 10, return_policy: "", created_at: "", updated_at: "" },
  { id: "6", name: "Home Depot", slug: "home-depot", description: "Afiliados Home Depot — pendiente", provider_type: "affiliate", status: "inactive", countries_supported: ["US", "MX"], logo_url: "", website_url: "", contact_email: "", contact_phone: "", api_enabled: false, affiliate_enabled: false, resale_enabled: false, dropshipping_enabled: false, credentials_ref: "", default_commission: 0, currency: "USD", product_count: 0, total_sales: 0, average_rating: 0, shipping_from_country: "US", estimated_delivery_days: 10, return_policy: "", created_at: "", updated_at: "" },
  { id: "7", name: "SHEIN", slug: "shein", description: "Dropshipping SHEIN — pendiente", provider_type: "dropship", status: "inactive", countries_supported: ["US", "CA"], logo_url: "", website_url: "", contact_email: "", contact_phone: "", api_enabled: false, affiliate_enabled: false, resale_enabled: false, dropshipping_enabled: false, credentials_ref: "", default_commission: 0, currency: "USD", product_count: 0, total_sales: 0, average_rating: 0, shipping_from_country: "CN", estimated_delivery_days: 20, return_policy: "", created_at: "", updated_at: "" },
  { id: "8", name: "Proveedor Cuba", slug: "cuba-supplier", description: "Logística autorizada para Cuba — pendiente", provider_type: "cuba_supplier", status: "inactive", countries_supported: ["CU"], logo_url: "", website_url: "", contact_email: "", contact_phone: "", api_enabled: false, affiliate_enabled: false, resale_enabled: false, dropshipping_enabled: false, credentials_ref: "", default_commission: 0, currency: "CUP", product_count: 0, total_sales: 0, average_rating: 0, shipping_from_country: "CU", estimated_delivery_days: 15, return_policy: "", created_at: "", updated_at: "" },
]

export default function MarketplaceProvidersPage() {
  usePageTitle("Proveedores — MSM Marketplace")

  const [providers, setProviders] = useState<MarketplaceProvider[]>(FALLBACK_PROVIDERS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchProviders()
        if (data.length > 0) {
          setProviders(data)
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/marketplace" className="p-2 rounded-lg hover:bg-slate-800/50 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <Truck className="w-5 h-5 text-[#197BD2]" />
          <div>
            <h1 className="text-lg font-black">Proveedores</h1>
            <p className="text-[9px] text-slate-500">Fuentes de productos autorizadas</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-[#197BD2] animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            {providers.map((p) => {
              const Icon = TYPE_ICONS[p.provider_type] || Globe
              return (
                <div key={p.id} className="p-4 rounded-xl bg-slate-900/30 border border-slate-800/50">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-[#197BD2]" />
                      <h3 className="text-sm font-bold text-white">{p.name}</h3>
                    </div>
                    <span className={`text-[8px] font-mono px-2 py-0.5 rounded-full ${STATUS_COLORS[p.status] || STATUS_COLORS.inactive}`}>
                      {STATUS_LABELS[p.status] || p.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400">{p.description}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className={`text-[8px] font-mono px-2 py-0.5 rounded-full border ${TYPE_COLORS[p.provider_type] || TYPE_COLORS.manual}`}>
                      {TYPE_LABELS[p.provider_type] || p.provider_type}
                    </span>
                    {p.countries_supported.length > 0 && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-600" />
                        <span className="text-[8px] text-slate-500">{p.countries_supported.join(", ")}</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
