// FREQUENCY ORIGIN SERVICE — Clase base del Nudo Único
// Toda operación en el ecosistema MSM hereda de aquí

import { frecuenciaOrigenConfig, type CanalId } from "./frecuencia-origen.config"

export type FrequencyEvent = {
  source_node: string
  event_type: string
  priority: string
  encrypted_payload?: unknown
  guardian_id?: number
}

export class FrequencyOriginService {
  protected readonly config = frecuenciaOrigenConfig

  protected async offlineGuardar(tabla: string, data: unknown): Promise<void> {
    if (typeof window !== "undefined") {
      const key = `zafiro_offline_${tabla}`
      const existing = JSON.parse(localStorage.getItem(key) || "[]")
      existing.push(data)
      localStorage.setItem(key, JSON.stringify(existing))
    }
  }
}
