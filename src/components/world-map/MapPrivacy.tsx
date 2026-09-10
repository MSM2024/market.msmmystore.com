"use client"

import { useState } from "react"
import { ShieldCheck } from "lucide-react"
import {
  DEFAULT_PRIVACY,
  isSafePreference,
  locationVisibilityToNodeVisibility,
  type LocationVisibility,
  type MapUserPrivacyPreference,
} from "@/lib/world-map/privacy"

const VISIBILITY_OPTIONS: { value: LocationVisibility; label: string; hint: string }[] = [
  { value: "OCULTO", label: "Oculto", hint: "Nunca te mostramos en el mapa" },
  { value: "PAÍS", label: "País", hint: "Solo se muestra tu país" },
  { value: "REGIÓN", label: "Región", hint: "Nivel región" },
  { value: "CIUDAD", label: "Ciudad", hint: "Nivel ciudad (nunca tu GPS exacto)" },
]

/**
 * Preferencias de privacidad del Mapa Mundial. Ningún valor expone el GPS
 * residencial: siempre se convierte a APPROXIMATE/PRIVATE.
 */
export default function MapPrivacy() {
  const [pref, setPref] = useState<MapUserPrivacyPreference>({ ...DEFAULT_PRIVACY })

  const set = (patch: Partial<MapUserPrivacyPreference>) =>
    setPref((p) => {
      const next = { ...p, ...patch }
      if (!isSafePreference(next)) return p
      return next
    })

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center gap-2 mb-3">
        <ShieldCheck className="w-4 h-4 text-emerald-300" />
        <h3 className="text-sm font-semibold text-white">Mi privacidad en el mapa</h3>
      </div>

      <label className="flex items-center gap-2 text-sm text-white/70">
        <input
          type="checkbox"
          checked={pref.showOnWorldMap}
          onChange={(e) => set({ showOnWorldMap: e.target.checked })}
          className="accent-purple-500"
        />
        Mostrarme en el Mapa Mundial
      </label>

      {pref.showOnWorldMap && (
        <div className="mt-3 space-y-1.5">
          {VISIBILITY_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className="flex items-start gap-2 text-sm cursor-pointer"
            >
              <input
                type="radio"
                name="wm-location-visibility"
                checked={pref.locationVisibility === opt.value}
                onChange={() => set({ locationVisibility: opt.value })}
                className="accent-purple-500 mt-0.5"
              />
              <span className="text-white/70">
                <span className="text-white/90">{opt.label}</span>{" "}
                <span className="text-xs text-white/50">{opt.hint}</span>
              </span>
            </label>
          ))}
          <p className="text-xs text-white/45 pt-1">
            Visibilidad resultante:{" "}
            <span className="text-purple-300">
              {locationVisibilityToNodeVisibility(pref.locationVisibility)}
            </span>
            . Nunca se publica tu GPS residencial.
          </p>
        </div>
      )}
    </div>
  )
}