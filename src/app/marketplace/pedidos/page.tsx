'use client'

import { useState } from "react"
import Link from "next/link"
import {
  ArrowLeft, ShoppingBag, Trash2, Plus, Minus, Package,
  Clock, CheckCircle, Truck, XCircle, CreditCard,
  MapPin, Phone, User, FileText, Check, ArrowRight, Shield,
} from "lucide-react"
import { usePageTitle } from "@/lib/usePageTitle"
import { useCart } from "@/contexts/CartContext"
import { createOrder } from "@/lib/marketplace/client"
import { formatPrice, ORDER_STATUS_LABELS, generateOrderNumber } from "@/lib/marketplace/constants"
import type { OrderStatus } from "@/lib/marketplace/types"

const STATUS_ICONS: Record<string, typeof Package> = {
  pending_confirmation: Clock,
  pending_payment: Clock,
  paid: CheckCircle,
  shipped: Truck,
  delivered: CheckCircle,
  completed: CheckCircle,
  cancelled: XCircle,
}

const STATUS_COLORS: Record<string, string> = {
  completed: "text-emerald-400",
  delivered: "text-emerald-400",
  shipped: "text-blue-400",
  cancelled: "text-red-400",
  paid: "text-emerald-400",
  pending_confirmation: "text-amber-400",
  pending_payment: "text-amber-400",
}

const STATUS_BG: Record<string, string> = {
  completed: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  delivered: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  shipped: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  cancelled: "bg-red-500/10 text-red-400 border border-red-500/20",
  paid: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
}

interface CheckoutForm {
  nombre: string
  telefono: string
  direccion: string
  ciudad: string
  pais: string
  notas: string
}

export default function CartPage() {
  usePageTitle("Carrito — MSM Marketplace")

  const { items, subtotal, removeItem, updateQuantity, clearCart } = useCart()
  const [showCheckout, setShowCheckout] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null)
  const [orderError, setOrderError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState<CheckoutForm>({
    nombre: "", telefono: "", direccion: "", ciudad: "", pais: "US", notas: "",
  })

  const shipping = subtotal * 0.05
  const tax = 0
  const total = subtotal + shipping + tax

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (items.length === 0) return
    setSubmitting(true)

    try {
      setOrderError(null)
      const orderNumber = generateOrderNumber()
      const order = await createOrder(
        {
          order_number: orderNumber,
          status: "pending_confirmation" as OrderStatus,
          subtotal,
          shipping_cost: shipping,
          tax_amount: tax,
          service_fee: 0,
          discount_amount: 0,
          total_amount: total,
          currency: "USD",
          delivery_mode: "international_shipping",
          delivery_info: {},
          shipping_name: form.nombre,
          shipping_phone: form.telefono,
          shipping_address: form.direccion,
          shipping_city: form.ciudad,
          shipping_state: "",
          shipping_zip: "",
          shipping_country: form.pais,
          buyer_notes: form.notas,
          seller_notes: "",
        },
        items.map(item => ({
          product_id: item.productId,
          variant_id: item.variantId || null,
          product_name: item.name,
          product_image: item.image,
          variant_name: "",
          quantity: item.quantity,
          unit_price: item.price,
          total_price: item.price * item.quantity,
          item_status: "pending",
        }))
      )

      if (order) {
        setOrderSuccess(order.order_number || orderNumber)
        clearCart()
      } else {
        setOrderError("No se pudo registrar el pedido: la base de datos no está configurada. Conecta Supabase para crear pedidos reales.")
      }
    } catch {
      setOrderError("Error al crear el pedido. Inténtalo de nuevo.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleStripeCheckout = async () => {
    if (items.length === 0) return
    setSubmitting(true)
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "marketplace",
          items: items.map(i => ({ name: i.name, price: i.price, quantity: i.quantity, image: i.image })),
          source: "marketplace",
        }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert(data.error || "Error al crear sesión de pago")
      }
    } catch {
      alert("Error de conexión con Stripe")
    } finally {
      setSubmitting(false)
    }
  }

  if (orderError) {
    return (
      <div className="min-h-screen zafiro-page text-white">
        <div className="max-w-2xl mx-auto px-4 py-12 text-center">
          <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-10 h-10 text-red-400" />
          </div>
          <h1 className="text-xl font-black mb-2">No se pudo crear el pedido</h1>
          <p className="text-sm text-slate-400 mb-6">{orderError}</p>
          <button
            onClick={() => setOrderError(null)}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-800 text-white rounded-xl text-sm font-bold hover:bg-slate-700 transition-colors"
          >
            Volver al carrito
          </button>
        </div>
      </div>
    )
  }

  if (orderSuccess) {
    return (
      <div className="min-h-screen zafiro-page text-white">
        <div className="max-w-2xl mx-auto px-4 py-12 text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-emerald-400" />
          </div>
          <h1 className="text-xl font-black mb-2">¡Pedido Realizado!</h1>
          <p className="text-sm text-slate-400 mb-2">Tu número de orden es:</p>
          <p className="text-lg font-mono font-bold text-[#197BD2] mb-6">{orderSuccess}</p>
          <p className="text-[10px] text-slate-500 mb-8">
            Recibirás una confirmación por correo electrónico. El vendedor será notificado de tu pedido.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/marketplace/productos"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#197BD2] text-white rounded-xl text-sm font-bold hover:bg-[#197BD2]/90 transition-colors"
            >
              <ShoppingBag className="w-4 h-4" />
              Seguir Comprando
            </Link>
            <Link
              href="/marketplace"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-800 text-white rounded-xl text-sm font-bold hover:bg-slate-700 transition-colors"
            >
              Volver al Marketplace
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen zafiro-page text-white">
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/marketplace" className="p-2 rounded-lg hover:bg-slate-800/50 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <ShoppingBag className="w-5 h-5 text-[#197BD2]" />
          <div>
            <h1 className="text-lg font-black">Mi Carrito</h1>
            <p className="text-[9px] text-slate-500">
              {items.length === 0 ? "Vacío" : `${items.reduce((a, b) => a + b.quantity, 0)} artículos`}
            </p>
          </div>
        </div>

        {/* Empty Cart */}
        {items.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="w-10 h-10 text-slate-600" />
            </div>
            <h2 className="text-lg font-black text-white mb-2">Tu carrito está vacío</h2>
            <p className="text-[10px] text-slate-500 mb-6">Explora nuestros productos y encuentra algo que te guste</p>
            <Link
              href="/marketplace/productos"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#197BD2] text-white rounded-xl text-sm font-bold hover:bg-[#197BD2]/90 transition-colors"
            >
              <ShoppingBag className="w-4 h-4" />
              Explorar Productos
            </Link>
          </div>
        )}

        {/* Cart Items */}
        {items.length > 0 && (
          <>
            <div className="space-y-3 mb-6">
              {items.map((item) => {
                const lineTotal = item.price * item.quantity
                return (
                  <div
                    key={`${item.productId}-${item.variantId || ""}`}
                    className="p-4 rounded-xl bg-slate-900/30 border border-slate-800/50"
                  >
                    <div className="flex gap-3">
                      {/* Image placeholder */}
                      <div className="w-16 h-16 rounded-lg bg-slate-800/50 flex items-center justify-center shrink-0">
                        <Package className="w-6 h-6 text-slate-600" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="text-[11px] font-bold text-white line-clamp-2">{item.name}</h3>
                          <button
                            onClick={() => removeItem(item.productId, item.variantId)}
                            className="p-1 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-[9px] text-slate-500 mb-2">{item.storeName}</p>

                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-400">{formatPrice(item.price)} c/u</span>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => updateQuantity(item.productId, Math.max(1, item.quantity - 1), item.variantId)}
                              className="w-7 h-7 rounded-lg bg-slate-800/50 border border-slate-700/50 flex items-center justify-center text-slate-400 hover:border-[#197BD2]/30 transition-colors"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-8 text-center text-[11px] font-bold text-white">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.productId, Math.min(item.stock, item.quantity + 1), item.variantId)}
                              disabled={item.quantity >= item.stock}
                              className="w-7 h-7 rounded-lg bg-slate-800/50 border border-slate-700/50 flex items-center justify-center text-slate-400 hover:border-[#197BD2]/30 transition-colors disabled:opacity-30"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <span className="text-sm font-black text-[#197BD2]">{formatPrice(lineTotal)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Cart Summary */}
            <div className="p-4 rounded-xl bg-slate-900/30 border border-slate-800/50 mb-6">
              <h3 className="text-[10px] font-bold text-slate-400 mb-3 uppercase tracking-wider">Resumen del Pedido</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-[10px] text-slate-400">Subtotal</span>
                  <span className="text-[10px] text-white">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] text-slate-400">Envío estimado (5%)</span>
                  <span className="text-[10px] text-white">{formatPrice(shipping)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] text-slate-400">Impuestos</span>
                  <span className="text-[10px] text-white">{formatPrice(tax)}</span>
                </div>
                <div className="pt-2 border-t border-slate-800/50 flex justify-between">
                  <span className="text-sm font-bold text-white">Total</span>
                  <span className="text-sm font-black text-[#197BD2]">{formatPrice(total)}</span>
                </div>
              </div>
            </div>

            {/* Checkout Toggle */}
            {!showCheckout ? (
              <button
                onClick={() => setShowCheckout(true)}
                className="w-full flex items-center justify-center gap-2 bg-[#197BD2] text-white py-3.5 rounded-xl text-sm font-bold hover:bg-[#197BD2]/90 transition-colors"
              >
                <CreditCard className="w-4 h-4" />
                Proceder al Pago
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              /* Checkout Form */
              <div className="p-4 rounded-xl bg-slate-900/30 border border-[#197BD2]/20">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-[#197BD2]" />
                    <h3 className="text-sm font-bold text-white">Datos de Envío</h3>
                  </div>
                  <button
                    onClick={() => setShowCheckout(false)}
                    className="text-[9px] text-slate-500 hover:text-white transition-colors"
                  >
                    Cerrar
                  </button>
                </div>

                <form onSubmit={handleSubmitOrder} className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">
                      <User className="w-3 h-3 inline mr-1" />
                      Nombre Completo *
                    </label>
                    <input
                      type="text" required
                      value={form.nombre}
                      onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                      placeholder="Juan García"
                      className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[#197BD2]/50 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">
                      <Phone className="w-3 h-3 inline mr-1" />
                      Teléfono *
                    </label>
                    <input
                      type="tel" required
                      value={form.telefono}
                      onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                      placeholder="+1 305 123 4567"
                      className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[#197BD2]/50 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">
                      <MapPin className="w-3 h-3 inline mr-1" />
                      Dirección *
                    </label>
                    <input
                      type="text" required
                      value={form.direccion}
                      onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                      placeholder="123 Main St, Apt 4B"
                      className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[#197BD2]/50 transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">Ciudad *</label>
                      <input
                        type="text" required
                        value={form.ciudad}
                        onChange={(e) => setForm({ ...form, ciudad: e.target.value })}
                        placeholder="Miami"
                        className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[#197BD2]/50 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">País *</label>
                      <input
                        type="text" required
                        value={form.pais}
                        onChange={(e) => setForm({ ...form, pais: e.target.value })}
                        placeholder="US"
                        className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[#197BD2]/50 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">
                      <FileText className="w-3 h-3 inline mr-1" />
                      Notas (opcional)
                    </label>
                    <textarea
                      value={form.notas}
                      onChange={(e) => setForm({ ...form, notas: e.target.value })}
                      placeholder="Instrucciones especiales de entrega..."
                      rows={2}
                      className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[#197BD2]/50 transition-colors resize-none"
                    />
                  </div>

                  <div className="p-3 rounded-xl bg-[#197BD2]/5 border border-[#197BD2]/10">
                    <p className="text-[9px] text-slate-400 leading-relaxed">
                      Al confirmar tu pedido, este será enviado al vendedor para su procesamiento. El pago se acordará directamente con el vendedor.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 bg-[#197BD2] text-white py-3.5 rounded-xl text-sm font-bold hover:bg-[#197BD2]/90 transition-colors disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        Confirmar Pedido — {formatPrice(total)}
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    disabled={submitting}
                    onClick={handleStripeCheckout}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#635BFF] to-[#7A73FF] text-white py-3.5 rounded-xl text-sm font-bold hover:from-[#5549f0] hover:to-[#6a63f0] transition-colors disabled:opacity-50 mt-2"
                  >
                    <Shield className="w-4 h-4" />
                    Pagar con Stripe — {formatPrice(total)}
                  </button>
                </form>
              </div>
            )}

            {/* Orders Section */}
            <div className="mt-10 pt-6 border-t border-slate-800/50">
              <div className="flex items-center gap-2 mb-4">
                <Package className="w-4 h-4 text-[#197BD2]" />
                <h2 className="text-sm font-bold text-white">Mis Pedidos</h2>
              </div>
              <div className="text-center py-8">
                <p className="text-[10px] text-slate-500">
                  Inicia sesión para ver tu historial de pedidos
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
