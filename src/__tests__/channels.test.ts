import { describe, it, expect } from "vitest"
import { CHANNEL_CONFIGS, type ElianaChannel } from "@/lib/eliana/core/types"
import {
  dispatchSafeMessage,
  getAdapter,
  WhatsAppAdapter,
  TelegramAdapter,
  EmailAdapter,
} from "@/lib/eliana/core/adapters"

const ALL_CHANNELS: ElianaChannel[] = ["web", "whatsapp", "telegram", "email", "marketplace", "zafiro", "eliana_domain"]

describe("C10 Canales: CHANNEL_CONFIGS", () => {
  it("cubre todos los canales definidos", () => {
    for (const c of ALL_CHANNELS) {
      expect(CHANNEL_CONFIGS[c], `falta config de ${c}`).toBeDefined()
    }
  })

  it("los canales externos requieren credenciales y están deshabilitados por defecto", () => {
    expect(CHANNEL_CONFIGS.whatsapp.enabled).toBe(false)
    expect(CHANNEL_CONFIGS.telegram.enabled).toBe(false)
    expect(CHANNEL_CONFIGS.email.enabled).toBe(false)
    expect(CHANNEL_CONFIGS.whatsapp.metadata?.requires_credentials).toBe(true)
    expect(CHANNEL_CONFIGS.telegram.metadata?.requires_credentials).toBe(true)
    expect(CHANNEL_CONFIGS.email.metadata?.requires_credentials).toBe(true)
  })

  it("los canales internos están habilitados", () => {
    expect(CHANNEL_CONFIGS.web.enabled).toBe(true)
    expect(CHANNEL_CONFIGS.marketplace.enabled).toBe(true)
    expect(CHANNEL_CONFIGS.zafiro.enabled).toBe(true)
    expect(CHANNEL_CONFIGS.eliana_domain.enabled).toBe(true)
  })
})

describe("C10 Canales: dispatchSafeMessage", () => {
  it("exige confirmación explícita antes de cualquier envío", () => {
    const res = dispatchSafeMessage({ channel: "web", to: "u1", message: "hola", confirmed: false })
    expect(res.sent).toBe(false)
    expect(res.reason).toBe("not_confirmed")
  })

  it("bloquea envíos a canales deshabilitados", () => {
    const res = dispatchSafeMessage({ channel: "whatsapp", to: "+1", message: "hola", confirmed: true })
    expect(res.sent).toBe(false)
    expect(res.reason).toBe("channel_disabled")
  })

  it("bloquea envíos a canales externos sin credenciales", () => {
    for (const ch of ["whatsapp", "telegram", "email"] as ElianaChannel[]) {
      const res = dispatchSafeMessage({ channel: ch, to: "x", message: "hola", confirmed: true })
      expect(res.sent, `canal ${ch} debería bloquearse`).toBe(false)
      expect(["channel_disabled", "missing_credentials"]).toContain(res.reason)
    }
  })

  it("simula el envío en canales internos habilitados y confirmados", () => {
    const res = dispatchSafeMessage({ channel: "web", to: "u1", message: "hola", confirmed: true })
    expect(res.sent).toBe(true)
    expect(res.simulated).toBe(true)
    expect(res.reason).toBe("simulated_sent")
  })
})

describe("C10 Canales: adaptadores", () => {
  it("getAdapter devuelve la clase correcta por canal", () => {
    expect(getAdapter("web").constructor.name).toBe("WebAdapter")
    expect(getAdapter("whatsapp") instanceof WhatsAppAdapter).toBe(true)
    expect(getAdapter("telegram") instanceof TelegramAdapter).toBe(true)
    expect(getAdapter("email") instanceof EmailAdapter).toBe(true)
  })

  it("sendTemplate de WhatsApp es un placeholder seguro", async () => {
    const wa = new WhatsAppAdapter()
    await expect(wa.sendTemplate("+1", "welcome")).resolves.toBe(true)
  })

  it("TelegramAdapter no envía cuando el canal está deshabilitado", async () => {
    const tg = new TelegramAdapter()
    const res = await tg.sendMessage("123", "hola")
    expect(res.sent).toBe(false)
    expect(res.reason).toBe("channel_disabled")
  })

  it("EmailAdapter no envía cuando el canal está deshabilitado", async () => {
    const em = new EmailAdapter()
    const res = await em.sendEmail("a@b.c", "Asunto", "Cuerpo")
    expect(res.sent).toBe(false)
    expect(res.reason).toBe("channel_disabled")
  })
})
