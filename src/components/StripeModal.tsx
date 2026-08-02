'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X, Shield, CheckCircle, AlertTriangle } from 'lucide-react'

interface StripeModalProps {
  isOpen: boolean
  onClose: () => void
  budget: number
  companyName: string
  onSuccess: () => void
}

export const StripeModal = ({ isOpen, onClose, budget, companyName, onSuccess }: StripeModalProps) => {
  const [stripePaying, setStripePaying] = useState(false)
  const [stripeSuccess, setStripeSuccess] = useState(false)
  const [stripeDemoMode, setStripeDemoMode] = useState(false)
  const [stripeError, setStripeError] = useState<string | null>(null)

  const handleSubmit = async () => {
    setStripePaying(true)
    setStripeError(null)
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "marketplace",
          items: [{ name: `Campaña Patrocinada — ${companyName}`, price: budget, quantity: 1, image: "" }],
          source: "marketplace",
        }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else if (res.status === 503 && data.code === "STRIPE_NOT_CONFIGURED") {
        setStripeDemoMode(true)
        setStripeSuccess(true)
      } else {
        setStripeError(data.error || "Error al crear sesión de pago")
        setStripePaying(false)
      }
    } catch {
      setStripeError("Error de conexión con Stripe")
      setStripePaying(false)
    }
  }

  const handleClose = () => {
    if (stripePaying) return
    setStripeError(null)
    setStripeDemoMode(false)
    setStripeSuccess(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/95 z-55 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: 'spring', duration: 0.3 }}
          className="w-full max-w-sm bg-[#0B1220] rounded-2xl border border-slate-800 shadow-2xl overflow-hidden"
        >
          {!stripeSuccess ? (
            <>
              <div className="flex items-center justify-between p-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm font-semibold text-white">Confirmar Campaña</span>
                </div>
                <button
                  onClick={handleClose}
                  disabled={stripePaying}
                  className="text-slate-500 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 border-b border-slate-800">
                <div className="text-xs text-slate-500 mb-1">Nueva campaña patrocinada</div>
                <div className="text-sm text-white font-medium">{companyName}</div>
                <div className="text-lg font-bold text-emerald-400 mt-1">${budget.toLocaleString()} USD</div>
              </div>

              <div className="p-4 space-y-3">
                {stripeError && (
                  <div className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-red-300">{stripeError}</p>
                  </div>
                )}
                {stripeDemoMode && (
                  <div className="flex items-start gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-amber-300 font-medium">Stripe no configurado</p>
                      <p className="text-xs text-slate-400 mt-1">
                        El procesador de pagos real estará disponible cuando se configuren las claves de Stripe en producción.
                        Por ahora la campaña se creará sin cargo.
                      </p>
                    </div>
                  </div>
                )}
                <div className="text-xs text-slate-500 leading-relaxed">
                  Al confirmar aceptas los{' '}
                  <a href="/terms" className="text-[#00D9FF] hover:underline">términos del servicio</a>.
                </div>
              </div>

              <div className="p-4 pt-0">
                {stripePaying ? (
                  <div className="flex items-center justify-center gap-2 py-3">
                    <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-slate-300">Redirigiendo a Stripe...</span>
                  </div>
                ) : (
                  <button
                    onClick={handleSubmit}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-semibold py-3 rounded-xl transition-all duration-200 active:scale-[0.98]"
                  >
                    <Shield className="w-4 h-4" />
                    Crear Campaña — ${budget.toLocaleString()} USD
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="p-8 flex flex-col items-center text-center">
              <CheckCircle className="w-12 h-12 text-emerald-400 mb-4" />
              <h3 className="text-lg font-bold text-white mb-1">{stripeDemoMode ? "¡Campaña Creada (Demo)!" : "¡Campaña Creada!"}</h3>
              <p className="text-sm text-slate-400 mb-6">
                {stripeDemoMode ? (
                  <>
                    <span className="text-amber-400 font-semibold">Modo demo:</span> Stripe no está configurado; la campaña se creó sin cargo real. Conecta Stripe para activar el pago real.
                  </>
                ) : (
                  <>
                    Has ganado <span className="text-emerald-400 font-semibold">+500 PTS de Conocimiento</span>
                  </>
                )}
              </p>
              <button
                onClick={onSuccess}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-semibold py-3 rounded-xl transition-all duration-200 active:scale-[0.98]"
              >
                Finalizar y Ver Campaña
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
