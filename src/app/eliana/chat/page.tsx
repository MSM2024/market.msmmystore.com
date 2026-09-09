'use client'

import dynamic from "next/dynamic"
import { usePageTitle } from "@/lib/usePageTitle"

// Chat ELIANA v1.0.1: SOLO SESIÓN ACTUAL (sin histórico permanente).
// La implementación real vive en ElianaVivaChat (sessionStorage efímero,
// sin Supabase, sin cola offline en localStorage). Este route unifica
// TODOS los puntos de entrada de conversación bajo el mismo motor.
const ElianaVivaChat = dynamic(
  () => import("@/components/zafiro101/ElianaVivaChat"),
  { ssr: false },
)

export default function ElianaChatPage() {
  usePageTitle("ELIANA — ZAFIRO 1.0.1")
  return <ElianaVivaChat />
}