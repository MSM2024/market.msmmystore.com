'use client'

import { useState } from "react"
import { motion } from "motion/react"
import Link from "next/link"
import { usePageTitle } from "@/lib/usePageTitle"
import { Gem, FlaskConical, BookOpen, Sparkles, ScrollText, ArrowLeft } from "lucide-react"
import GemLab from "@/components/gemology/GemLab"
import Handbook from "@/components/gemology/Handbook"
import AiAssistant from "@/components/gemology/AiAssistant"
import LoreExplorer from "@/components/gemology/LoreExplorer"

type GemTab = "lab" | "handbook" | "ai" | "lore"

const tabs: { key: GemTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "lab", label: "Laboratorio", icon: FlaskConical },
  { key: "handbook", label: "Handbook", icon: BookOpen },
  { key: "ai", label: "Zafiro AI", icon: Sparkles },
  { key: "lore", label: "Lore", icon: ScrollText },
]

export default function GemologiaPage() {
  usePageTitle("Gemología")
  const [activeTab, setActiveTab] = useState<GemTab>("lab")

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-[#050816]/90 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-xl border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-950/60 border border-indigo-800/40">
                <Gem className="w-5 h-5 text-indigo-400" />
              </div>
              <h1 className="text-lg font-bold font-serif text-slate-100">Gemología</h1>
            </div>
          </div>
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold">
            Zafiro Lab · v2.4
          </span>
        </div>

        <nav className="max-w-6xl mx-auto px-4 pb-2 flex gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key
            const Icon = tab.icon
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "bg-indigo-950/40 text-indigo-300 border-indigo-800/40 shadow-[0_0_12px_rgba(99,102,241,0.08)]"
                    : "text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900/40"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          {activeTab === "lab" && <GemLab />}
          {activeTab === "handbook" && <Handbook />}
          {activeTab === "ai" && <AiAssistant />}
          {activeTab === "lore" && <LoreExplorer />}
        </motion.div>
      </main>
    </div>
  )
}
