"use client"

import { X, MapPin, Building2 } from "lucide-react"
import type { PublicNode } from "@/lib/world-map/types"
import { ENTITY_TYPE_LABELS } from "@/lib/world-map/search"
import { formatTimeAt } from "@/lib/world-map/time"

function safeName(node: PublicNode): string | null {
  const raw = node.metadata_public
  if (!raw || typeof raw !== "object") return null
  const name = (raw as Record<string, unknown>).name
  return typeof name === "string" && name.trim() ? name : null
}

function externalUrl(node: PublicNode): string | null {
  const raw = node.metadata_public
  if (!raw || typeof raw !== "object") return null
  const url = (raw as Record<string, unknown>).url
  return typeof url === "string" && /^https?:\/\//.test(url) ? url : null
}

const COUNTRY_LABELS: Record<string, string> = {
  CU: "Cuba",
  PR: "Puerto Rico",
  US: "Estados Unidos",
  ES: "España",
  MX: "México",
  DO: "República Dominicana",
  CO: "Colombia",
  VE: "Venezuela",
  JP: "Japón",
}

/** Localización legible: evita repetir ciudad=región y traduce el país. */
function locationLabel(node: PublicNode): string {
  const parts: string[] = []
  if (node.city) parts.push(node.city)
  else if (node.region) parts.push(node.region)
  if (node.country_code) parts.push(COUNTRY_LABELS[node.country_code] ?? node.country_code)
  return parts.join(", ")
}

/** Tarjeta inferior (móvil) / panel lateral (desktop) con solo datos públicos. */
export default function MapNodeCard({
  node,
  onClose,
}: {
  node: PublicNode
  onClose: () => void
}) {
  const name = safeName(node) ?? ENTITY_TYPE_LABELS[node.entity_type]
  const link = externalUrl(node)
  const location = locationLabel(node)

  return (
    <div className="absolute inset-x-0 bottom-0 sm:inset-x-auto sm:right-3 sm:top-3 sm:bottom-auto sm:w-80 z-10">
      <div className="bg-[#0d0d1a]/95 border border-white/10 rounded-2xl p-4 shadow-2xl backdrop-blur">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 inline-block mb-2">
              {ENTITY_TYPE_LABELS[node.entity_type]}
            </span>
            <h3 className="text-base font-semibold text-white truncate">{name}</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="p-1 rounded-lg hover:bg-white/10 text-white/60"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {location && (
          <p className="mt-2 text-sm text-white/60 inline-flex items-start gap-1.5">
            <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-purple-300" />
            {location}
          </p>
        )}

        <p className="mt-2 text-xs text-white/50">
          Hora local: <span className="tabular-nums text-white/80">{formatTimeAt(node.timezone)}</span>
        </p>

        <div className="mt-4 flex items-center gap-2 text-xs text-white/50">
          <Building2 className="w-3.5 h-3.5" />
          <span>Solo se muestra información pública elegida por el titular.</span>
        </div>

        {link && (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 w-full inline-flex justify-center items-center px-4 py-2 rounded-xl bg-purple-500/90 hover:bg-purple-500 text-white text-sm font-medium transition"
          >
            ABRIR
          </a>
        )}
      </div>
    </div>
  )
}