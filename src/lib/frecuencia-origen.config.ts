// FRECUENCIA ORIGEN — Nudo Único del Ecosistema MSM
// Creador: Miguel Soria Martínez — MSM MY STORE LLC
// Todo nodo, molécula y servicio hereda de esta frecuencia

export const frecuenciaOrigenConfig = {
  version: "1.0.9",
  name: "FRECUENCIA ORIGEN — NUDO ÚNICO MSM",
  checksum: "FRECUENCIA_ORIGEN_109_MSM",

  identity: {
    node_name: "frecuencia_origen",
    creator: "Miguel Soria Martínez",
    entity: "MSM MY STORE LLC",
    protocol: "FRECUENCIA ORIGEN v1",
  },

  // Los 7 Guardianes del Ecosistema
  guardianes: [
    { id: 1, nombre: "Identidad", descripcion: "Verifica origen y destino de cada operación" },
    { id: 2, nombre: "Integridad", descripcion: "Detecta alteraciones en datos y montos" },
    { id: 3, nombre: "Privacidad", descripcion: "Cifra datos sensibles extremo a extremo" },
    { id: 4, nombre: "Red", descripcion: "Enruta por canal disponible (wifi, LoRa, BLE, sat)" },
    { id: 5, nombre: "Resiliencia", descripcion: "Opera offline, sincroniza al reconectar" },
    { id: 6, nombre: "Verdad", descripcion: "Audita toda operación con traza inmutable" },
    { id: 7, nombre: "Restauracion", descripcion: "Backup automático cada 24h" },
  ],

  // Canales de frecuencia disponibles
  canales: [
    { id: "wifi_5_6", nombre: "WiFi 5.6 GHz", prioridad: "alta" },
    { id: "lora_433", nombre: "LoRa 433 MHz", prioridad: "baja" },
    { id: "ble_mesh", nombre: "BLE Mesh", prioridad: "baja" },
    { id: "sat_gps", nombre: "Satélite GPS", prioridad: "emergencia" },
  ],

  // Reglas inmutable del Nudo Único
  reglas: {
    offine_first: true,
    sync_when_online: true,
    every_operation_needs_code: true,
    every_tasa_needs_source_and_date: true,
    no_invented_tasa: true,
    audit_mandatory: true,
  },
} as const

export type GuardianId = (typeof frecuenciaOrigenConfig.guardianes)[number]["id"]
export type CanalId = (typeof frecuenciaOrigenConfig.canales)[number]["id"]
