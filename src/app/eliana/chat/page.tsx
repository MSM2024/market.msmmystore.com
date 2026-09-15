"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import dynamic from "next/dynamic"
import { usePageTitle } from "@/lib/usePageTitle"

// Chat ELIANA — conecta con ELIANA CENTRAL (eliana.msmmystore.com) vía el
// widget reutilizable. ZAFIRO NO tiene chat propio: la interfaz, voz,
// estados e inteligencia viven en ELIANA CENTRAL; aquí solo montamos el
// acceso y pasamos el source/contexto.
const ElianaCentralWidget = dynamic(
  () => import("@/components/eliana-central/ElianaCentralWidget"),
  { ssr: false },
)

function ElianaChatContent() {
  usePageTitle("ELIANA — ZAFIRO 1.1.0")
  const params = useSearchParams()
  const source = params?.get("src") || "zafiro"
  const context = [params?.get("mod"), params?.get("rt"), params?.get("rid")]
    .filter(Boolean)
    .join("-") || "portal"

  return <ElianaCentralWidget source={source} context={context} view="chat" className="h-dvh" />
}

export default function ElianaChatPage() {
  return (
    <Suspense fallback={<div className="flex min-h-dvh items-center justify-center bg-[#050A1A]" aria-live="polite">Conectando con ELIANA Central...</div>}>
      <ElianaChatContent />
    </Suspense>
  )
}