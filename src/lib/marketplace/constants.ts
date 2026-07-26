// ================================================================
// MARKETPLACE CONSTANTS — Estados, labels, configuraciones
// ================================================================

import type {
  StoreStatus, ProductStatus, OrderStatus, DeliveryMode,
  PaymentStatus, PaymentMethod, ShipmentStatus, ShipmentProvider,
  DisputeReason, DisputeStatus, RefundStatus
} from "./types"

// --- Store Status ---
export const STORE_STATUS_LABELS: Record<StoreStatus, string> = {
  draft: "Borrador",
  pending_review: "Revisión pendiente",
  active: "Activa",
  paused: "Pausada",
  suspended: "Suspendida",
  rejected: "Rechazada",
}

export const STORE_STATUS_COLORS: Record<StoreStatus, string> = {
  draft: "text-slate-400 bg-slate-500/10 border-slate-500/20",
  pending_review: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  active: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  paused: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  suspended: "text-red-400 bg-red-500/10 border-red-500/20",
  rejected: "text-red-400 bg-red-500/10 border-red-500/20",
}

// --- Product Status ---
export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  draft: "Borrador",
  pending_review: "Revisión pendiente",
  published: "Publicado",
  out_of_stock: "Agotado",
  paused: "Pausado",
  rejected: "Rechazado",
  archived: "Archivado",
}

export const PRODUCT_STATUS_COLORS: Record<ProductStatus, string> = {
  draft: "text-slate-400 bg-slate-500/10 border-slate-500/20",
  pending_review: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  published: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  out_of_stock: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  paused: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  rejected: "text-red-400 bg-red-500/10 border-red-500/20",
  archived: "text-slate-400 bg-slate-500/10 border-slate-500/20",
}

// --- Order Status ---
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  cart: "Carrito",
  quotation: "Cotización",
  pending_confirmation: "Confirmación pendiente",
  pending_payment: "Pago pendiente",
  payment_under_review: "Pago en revisión",
  paid: "Pagado",
  approved: "Aprobado",
  provider_purchase_pending: "Compra a proveedor pendiente",
  purchased: "Comprado",
  processing: "Procesando",
  shipped: "Enviado",
  in_transit: "En tránsito",
  out_for_delivery: "En camino de entrega",
  delivered: "Entregado",
  completed: "Completado",
  cancelled: "Cancelado",
  refund_requested: "Reembolso solicitado",
  refunded: "Reembolsado",
  disputed: "En disputa",
}

export const ORDER_STATUS_STEP: Record<OrderStatus, number> = {
  cart: 0,
  quotation: 0,
  pending_confirmation: 1,
  pending_payment: 2,
  payment_under_review: 3,
  paid: 3,
  approved: 4,
  provider_purchase_pending: 5,
  purchased: 5,
  processing: 6,
  shipped: 7,
  in_transit: 8,
  out_for_delivery: 9,
  delivered: 10,
  completed: 11,
  cancelled: -1,
  refund_requested: -2,
  refunded: -2,
  disputed: -3,
}

// --- Delivery Mode ---
export const DELIVERY_MODE_LABELS: Record<DeliveryMode, string> = {
  provider_direct: "Envío directo del proveedor",
  msm_delivery: "Envío por MSM",
  seller_delivery: "Envío por el vendedor",
  pickup: "Recoger en tienda",
  cuba_authorized_logistics: "Logística autorizada Cuba",
  international_shipping: "Envío internacional",
  digital_delivery: "Entrega digital",
}

export const DELIVERY_MODE_ICONS: Record<DeliveryMode, string> = {
  provider_direct: "Truck",
  msm_delivery: "Package",
  seller_delivery: "Store",
  pickup: "MapPin",
  cuba_authorized_logistics: "Ship",
  international_shipping: "Globe",
  digital_delivery: "Download",
}

// --- Payment Status ---
export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: "Pendiente",
  processing: "Procesando",
  completed: "Completado",
  failed: "Fallido",
  cancelled: "Cancelado",
  refunded: "Reembolsado",
  partially_refunded: "Reembolso parcial",
  disputed: "Disputado",
}

// --- Payment Method ---
export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  stripe: "Tarjeta (Stripe)",
  paypal: "PayPal",
  bank_transfer: "Transferencia bancaria",
  crypto: "Criptomoneda",
  cash_on_delivery: "Contra entrega",
  cuba_mobile_payment: "Pago móvil Cuba",
  manual: "Manual",
}

// --- Shipment Status ---
export const SHIPMENT_STATUS_LABELS: Record<ShipmentStatus, string> = {
  pending: "Pendiente",
  confirmed: "Confirmado",
  purchased_from_provider: "Comprado al proveedor",
  processing: "Procesando",
  shipped: "Enviado",
  in_transit: "En tránsito",
  out_for_delivery: "En reparto",
  delivered: "Entregado",
  delivery_failed: "Entrega fallida",
  returned: "Devuelto",
  cancelled: "Cancelado",
}

// --- Shipment Provider ---
export const SHIPMENT_PROVIDER_LABELS: Record<ShipmentProvider, string> = {
  provider_direct: "Proveedor directo",
  msm_delivery: "MSM",
  seller_delivery: "Vendedor",
  usps: "USPS",
  fedex: "FedEx",
  ups: "UPS",
  dhl: "DHL",
  correos_cuba: "Correos de Cuba",
  cuba_logistics: "Logística Cuba",
  digital: "Digital",
  other: "Otro",
}

// --- Dispute ---
export const DISPUTE_REASON_LABELS: Record<DisputeReason, string> = {
  product_not_received: "Producto no recibido",
  product_not_as_described: "Producto no coincide con la descripción",
  damaged_product: "Producto dañado",
  wrong_item: "Artículo incorrecto",
  quality_issue: "Problema de calidad",
  seller_no_response: "Vendedor sin respuesta",
  payment_issue: "Problema de pago",
  other: "Otro",
}

export const DISPUTE_STATUS_LABELS: Record<DisputeStatus, string> = {
  open: "Abierta",
  under_review: "En revisión",
  awaiting_response: "Esperando respuesta",
  resolved: "Resuelta",
  escalated: "Escalada",
  closed: "Cerrada",
}

// --- Refund Status ---
export const REFUND_STATUS_LABELS: Record<RefundStatus, string> = {
  requested: "Solicitado",
  under_review: "En revisión",
  approved: "Aprobado",
  rejected: "Rechazado",
  processed: "Procesado",
  completed: "Completado",
}

// --- Monedas soportadas ---
export const SUPPORTED_CURRENCIES = [
  { code: "USD", symbol: "$", name: "Dólar estadounidense" },
  { code: "CUP", symbol: "₱", name: "Peso cubano" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "MXN", symbol: "$", name: "Peso mexicano" },
  { code: "USDT", symbol: "₮", name: "Tether" },
] as const

// --- Países ---
export const COUNTRIES = [
  { code: "US", name: "Estados Unidos" },
  { code: "CU", name: "Cuba" },
  { code: "MX", name: "México" },
  { code: "CA", name: "Canadá" },
  { code: "ES", name: "España" },
  { code: "CO", name: "Colombia" },
  { code: "AR", name: "Argentina" },
  { code: "VE", name: "Venezuela" },
  { code: "BR", name: "Brasil" },
  { code: "CL", name: "Chile" },
  { code: "PE", name: "Perú" },
  { code: "EC", name: "Ecuador" },
  { code: "DO", name: "República Dominicana" },
  { code: "PA", name: "Panamá" },
  { code: "CR", name: "Costa Rica" },
  { code: "GT", name: "Guatemala" },
  { code: "HN", name: "Honduras" },
  { code: "SV", name: "El Salvador" },
  { code: "NI", name: "Nicaragua" },
  { code: "UY", name: "Uruguay" },
  { code: "PY", name: "Paraguay" },
  { code: "BO", name: "Bolivia" },
  { code: "GB", name: "Reino Unido" },
  { code: "DE", name: "Alemania" },
  { code: "FR", name: "Francia" },
  { code: "IT", name: "Italia" },
  { code: "JP", name: "Japón" },
] as const

// --- Países Cuba (provincias) ---
export const CUBA_PROVINCES = [
  "Pinar del Río",
  "Artemisa",
  "Mayabeque",
  "La Habana",
  "Matanzas",
  "Cienfuegos",
  "Villa Clara",
  "Sancti Spíritus",
  "Ciego de Ávila",
  "Camagüey",
  "Las Tunas",
  "Holguín",
  "Granma",
  "Santiago de Cuba",
  "Guantánamo",
  "Isla de la Juventud",
] as const

// --- Formato de precio ---
export function formatPrice(amount: number, currency: string = "USD"): string {
  const curr = SUPPORTED_CURRENCIES.find(c => c.code === currency)
  const symbol = curr?.symbol || "$"
  if (currency === "CUP") {
    return `${symbol} ${amount.toLocaleString("es-CU")}`
  }
  return `${symbol} ${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// --- Generar slug ---
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

// --- Generar número de orden ---
export function generateOrderNumber(): string {
  const now = new Date()
  const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `MSM-${datePart}-${randomPart}`
}
