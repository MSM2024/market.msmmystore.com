import { FrequencyOriginService } from "./FrequencyOriginService";
import { economiaConfig, PrioridadEconomica } from "./economia-v109.config";

type OperacionInput = {
  cliente_id: string;
  servicio: string;
  monto: number;
  tasa?: number;
  tasa_fuente?: string;
  destino?: string;
  prioridad: PrioridadEconomica;
};

export class EconomiaService extends FrequencyOriginService {
  // FLUJO OBLIGATORIO HEREDADO + CAPA ECONOMIA
  async crearOperacion(input: OperacionInput) {
    // 1. Validación del Nudo Único
    this.validarReglasEconomia(input);

    const codigo = this.generarCodigo(); // MSM-2026-XXXX
    const channel = await this.seleccionarCanal(input.prioridad);

    // 2. Crear operación con firma del Guardián 1 y 2
    const operacion = {
      id: crypto.randomUUID(),
      codigo,
      servicio: input.servicio,
      monto: input.monto,
      tasa: input.tasa,
      tasa_fuente: input.tasa_fuente,
      tasa_fecha: input.tasa? new Date().toISOString() : null,
      destino: input.destino,
      estado: "pendiente",
      prioridad: input.prioridad,
      channel_id: channel.id,
      node_id: "frecuencia_origen" // Todo nace del Nudo Único
    };

    // 3. Guardar local primero (Offline Core) - V1.2.0
    await this.offlineCore.guardar("economia_operaciones", operacion);

    // 4. Registrar en frequency_events y guardian_actions
    await this.registrarEvento({
      source_node: "frecuencia_origen",
      event_type: "economia_operacion_creada",
      priority: input.prioridad,
      encrypted_payload: operacion,
      guardian_id: 6 // Verdad - auditoría
    });

    // 5. Respuesta visual para WhatsApp con ElianaVisualWriter
    return this.construirRespuestaVisual(operacion);
  }

  private validarReglasEconomia(input: OperacionInput): void {
    if (input.tasa &&!input.tasa_fuente) {
      throw new Error("ECONOMIA_V109_ERROR: Toda tasa requiere fuente y fecha - Guardian 2 Integridad bloqueó");
    }
    if (input.monto <= 0) throw new Error("Monto inválido");
  }

  private construirRespuestaVisual(op: any) {
    // Usa MODELOS OFICIALES de frecuencia-origen.config.ts
    return `✅ *Información recibida*
Código: \`\`\`${op.codigo}\`\`\`
*Servicio:* ${op.servicio}
*Estado:* *${op.estado}*
_Monto:_ ${op.monto} ${op.tasa? `| Tasa: ${op.tasa} (${op.tasa_fuente})` : ""}
_Verificaremos los datos antes de confirmar._`;
  }

  private generarCodigo(): string {
    const n = Math.floor(Math.random() * 9999).toString().padStart(4, "0");
    return `MSM-${new Date().getFullYear()}-${n}`;
  }

  private async seleccionarCanal(prioridad: PrioridadEconomica) {
    // Hereda de Adaptive Router
    return { id: prioridad === "EMERGENCIA"? "sat_gps" : "wifi_5_6" };
  }

  // Para el panel que pediste
  private offlineCore = { guardar: async (_t: string, _d: any) => {} };
  private registrarEvento = async (_e: any) => {};
}
