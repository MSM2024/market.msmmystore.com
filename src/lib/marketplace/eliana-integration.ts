// ================================================================
// ELIANA MARKETPLACE INTEGRATION
// Recopila y organiza información de clientes que buscan productos
// ELIANA pregunta y organiza. El equipo humano revisa y ejecuta.
// ================================================================

export interface ElianaMarketplaceIntake {
  name: string
  country: string
  city: string
  product_search: string
  quantity: number
  budget_min: number
  budget_max: number
  destination_address: string
  destination_country: string
  estimated_date: string
  delivery_method: string
  phone: string
  email: string
  notes: string
}

export interface ElianaMarketplaceFiling {
  id: string
  intake: ElianaMarketplaceIntake
  status: 'collected' | 'reviewing' | 'quoted' | 'approved' | 'rejected' | 'completed'
  created_at: string
  assigned_to?: string
  quote_amount?: number
  notes?: string
}

// Preguntas que ELIANA hace al cliente
export const ELIANA_INTAKE_QUESTIONS = [
  { field: "name", question: "¿Cuál es tu nombre completo?", type: "text", required: true },
  { field: "country", question: "¿En qué país estás?", type: "select", required: true },
  { field: "city", question: "¿Ciudad?", type: "text", required: true },
  { field: "product_search", question: "¿Qué producto estás buscando?", type: "text", required: true },
  { field: "quantity", question: "¿Cuántas unidades necesitas?", type: "number", required: true },
  { field: "budget_min", question: "¿Cuál es tu presupuesto mínimo (USD)?", type: "number", required: false },
  { field: "budget_max", question: "¿Cuál es tu presupuesto máximo (USD)?", type: "number", required: false },
  { field: "destination_country", question: "¿A qué país quieres que se envíe?", type: "select", required: true },
  { field: "destination_address", question: "¿Dirección de entrega?", type: "text", required: true },
  { field: "estimated_date", question: "¿Para cuándo lo necesitas?", type: "date", required: false },
  { field: "delivery_method", question: "¿Método de entrega preferido? (envío directo, recoger, etc.)", type: "select", required: false },
  { field: "phone", question: "¿Tu número de teléfono?", type: "tel", required: true },
  { field: "email", question: "¿Tu correo electrónico?", type: "email", required: true },
  { field: "notes", question: "¿Alguna observación adicional?", type: "textarea", required: false },
]

// Generar ficha estructurada
export function generateMarketplaceFiling(intake: ElianaMarketplaceIntake): ElianaMarketplaceFiling {
  return {
    id: `ELI-MKT-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    intake,
    status: "collected",
    created_at: new Date().toISOString(),
  }
}

// Resumen de la ficha para el equipo
export function formatFilingSummary(filing: ElianaMarketplaceFiling): string {
  const i = filing.intake
  return [
    `📋 FICHA MARKETPLACE — ${filing.id}`,
    `📅 ${new Date(filing.created_at).toLocaleDateString("es")}`,
    ``,
    `👤 Cliente: ${i.name}`,
    `📍 Ubicación: ${i.city}, ${i.country}`,
    `📞 ${i.phone} | 📧 ${i.email}`,
    ``,
    `🔍 Producto buscado: ${i.product_search}`,
    `📦 Cantidad: ${i.quantity}`,
    `💰 Presupuesto: $${i.budget_min || 0} - $${i.budget_max || "sin límite"}`,
    ``,
    `🚚 Envío a: ${i.destination_country}`,
    `📍 Dirección: ${i.destination_address}`,
    `📅 Necesita para: ${i.estimated_date || "Flexible"}`,
    `🚗 Método de entrega: ${i.delivery_method || "Por definir"}`,
    ``,
    `📝 Notas: ${i.notes || "Ninguna"}`,
    ``,
    `Estado: ${filing.status}`,
  ].join("\n")
}

// Reglas que ELIANA respeta
export const ELIANA_MARKETPLACE_RULES = {
  // ELIANA solamente recopila y organiza
  collects_and_organizes: true,

  // ELIANA NO hace estas cosas:
  does_not: [
    "Programa sola el proyecto completo",
    "Aprueba vendedores",
    "Confirma pagos",
    "Compra productos",
    "Autoriza devoluciones",
    "Cambia precios",
    "Promete entregas",
    "Publica productos sin revisión",
  ],

  // Principio fundamental
  principle: "ELIANA pregunta y organiza. El equipo humano revisa, crea, aprueba y ejecuta.",
} as const
