'use client'

import { motion, AnimatePresence } from "motion/react"
import { Gem, X, Sparkles } from "lucide-react"

interface AddQuestionModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: { title: string; category: string; details: string }) => void
}

export default function AddQuestionModal({ isOpen, onClose, onSubmit }: AddQuestionModalProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    onSubmit({
      title: formData.get("title") as string,
      category: formData.get("category") as string,
      details: formData.get("details") as string,
    })
    ;(e.target as HTMLFormElement).reset()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
          initial={{ scale: 0.9, y: 50 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 50 }}
        >
          <div className="max-w-md w-full rounded-3xl border border-slate-800 bg-[#050816]/98 p-5">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Gem className="w-5 h-5 text-blue-400" />
                <h2 className="text-lg font-semibold text-white">Sintonizar Consulta</h2>
              </div>
              <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-1.5">¿Cuál es tu pregunta principal?</label>
                <input
                  name="title"
                  type="text"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-1.5">Canal o Categoría</label>
                <select
                  name="category"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-700 text-white focus:outline-none focus:border-blue-500 text-sm"
                >
                  <option value="">Selecciona una categoría</option>
                  <option value="Inteligencia Artificial">Inteligencia Artificial</option>
                  <option value="Ciberseguridad">Ciberseguridad</option>
                  <option value="Economía de Datos">Economía de Datos</option>
                  <option value="Ciencia Espacial">Ciencia Espacial</option>
                  <option value="Biotecnología">Biotecnología</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-1.5">Detalles y Contexto Científico</label>
                <textarea
                  name="details"
                  rows={4}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm resize-none"
                />
              </div>

              <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-950/40 border border-blue-900/50">
                <Sparkles className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                <p className="text-xs text-slate-400">
                  Publicar esta pregunta sintoniza 100 PTS para tu reputación global.
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl text-white font-medium text-sm bg-gradient-to-r from-[#00D9FF] to-blue-600 hover:opacity-90 transition-opacity"
              >
                Sintonizar Pregunta en la Red
              </button>
            </form>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
