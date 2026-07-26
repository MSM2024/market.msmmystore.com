'use client'

import { useState, useMemo } from "react"
import { FAMOUS_SAPPHIRES } from "@/lib/gemology-data"
import type { FamousSapphire } from "@/lib/gemology-types"
import {
  History, MapPin, Scale, Compass, Search, Globe, Gem,
  Bookmark, ChevronRight, ArrowLeft
} from "lucide-react"

export default function LoreExplorer() {
  const [selectedStone, setSelectedStone] = useState<FamousSapphire>(FAMOUS_SAPPHIRES[0])
  const [searchTerm, setSearchTerm] = useState("")
  const [originFilter, setOriginFilter] = useState("All")
  const [mobileView, setMobileView] = useState<"list" | "detail">("list")

  const origins = useMemo(() => {
    const list = new Set(FAMOUS_SAPPHIRES.map(s => s.origin))
    return ["All", ...Array.from(list)]
  }, [])

  const filteredStones = useMemo(() => {
    return FAMOUS_SAPPHIRES.filter(stone => {
      const matchesSearch = stone.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stone.story.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesOrigin = originFilter === "All" || stone.origin === originFilter
      return matchesSearch && matchesOrigin
    })
  }, [searchTerm, originFilter])

  const selectStoneOnMobile = (stone: FamousSapphire) => {
    setSelectedStone(stone)
    setMobileView("detail")
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-[#090d16] p-4 rounded-2xl border border-[#1e293b] shadow-lg">
        <div className="flex items-center space-x-2.5 text-slate-100 font-serif w-full md:w-auto">
          <History className="w-5 h-5 text-indigo-400" />
          <div>
            <h3 className="text-sm sm:text-base font-semibold">The Royal Archive of Famous Sapphires</h3>
            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider hidden sm:block">Historical provenance registry</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search history, names..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 pl-10 pr-4 py-2.5 bg-[#020308] border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-600"
              style={{ minHeight: "44px" }}
            />
          </div>
          <select
            value={originFilter}
            onChange={(e) => setOriginFilter(e.target.value)}
            className="rounded-xl bg-[#020308] border border-slate-800 px-3.5 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-600"
            style={{ minHeight: "44px" }}
          >
            {origins.map(orig => (
              <option key={orig} value={orig}>{orig === "All" ? "All Provenances" : orig}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className={`${mobileView === "list" ? "block" : "hidden"} lg:block lg:col-span-5 space-y-3.5`}>
          <div className="flex justify-between items-center px-1">
            <p className="text-xs font-mono text-slate-500 uppercase tracking-widest font-bold">
              Archived Artifacts ({filteredStones.length})
            </p>
            {originFilter !== "All" && (
              <span className="text-[10px] font-mono text-indigo-400 uppercase bg-indigo-950/60 border border-indigo-900 px-2 py-0.5 rounded-full">
                {originFilter}
              </span>
            )}
          </div>
          <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
            {filteredStones.map((stone) => {
              const isSelected = selectedStone.id === stone.id
              return (
                <button
                  key={stone.id}
                  onClick={() => selectStoneOnMobile(stone)}
                  className={`w-full text-left p-4 rounded-xl border transition-all duration-300 cursor-pointer flex items-center justify-between group ${
                    isSelected
                      ? "bg-[#0a0e1a] border-indigo-500/80 shadow-[0_0_12px_rgba(79,70,229,0.25)]"
                      : "bg-[#020308] border-slate-800 hover:border-slate-700 hover:bg-[#090d16]"
                  }`}
                  style={{ minHeight: "48px" }}
                >
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block font-bold">
                      {stone.weight} &bull; {stone.origin.split(" ")[0]}
                    </span>
                    <h4 className={`text-xs sm:text-sm font-semibold transition-colors duration-200 ${
                      isSelected ? "text-indigo-400" : "text-slate-200 group-hover:text-slate-100"
                    }`}>
                      {stone.name}
                    </h4>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="p-1.5 rounded-lg bg-[#020308] border border-slate-800 text-slate-400 group-hover:text-indigo-400 transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </button>
              )
            })}
            {filteredStones.length === 0 && (
              <div className="text-center py-12 rounded-xl border border-dashed border-slate-800 p-6">
                <p className="text-sm text-slate-500">No historic sapphires match your query.</p>
                <button
                  onClick={() => { setSearchTerm(""); setOriginFilter("All") }}
                  className="mt-3 px-3 py-2 bg-[#020308] border border-slate-800 text-xs text-slate-300 hover:text-white rounded-lg transition-colors"
                  style={{ minHeight: "40px" }}
                >
                  Reset Filters
                </button>
              </div>
            )}
          </div>
        </div>

        <div className={`${mobileView === "detail" ? "block" : "hidden"} lg:block lg:col-span-7 bg-[#090d16] border border-[#1e293b] rounded-2xl p-5 sm:p-7 space-y-6 relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.85)]`}>
          <div className="lg:hidden flex items-center justify-between border-b border-slate-800 pb-3">
            <button
              onClick={() => setMobileView("list")}
              className="px-3.5 py-2 bg-[#020308] border border-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors flex items-center space-x-2 text-xs font-mono font-bold"
              style={{ minHeight: "44px" }}
            >
              <ArrowLeft className="w-4 h-4 text-indigo-400" />
              <span>Back to Archive List</span>
            </button>
            <span className="text-[10px] font-mono text-slate-500 uppercase">Registry details</span>
          </div>

          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent rounded-bl-full pointer-events-none" />

          <div className="relative border-b border-slate-800 pb-4 space-y-3 z-10">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="px-3 py-1 bg-indigo-950/60 border border-indigo-900/40 text-indigo-400 text-[10px] sm:text-xs font-mono rounded-full uppercase tracking-wider flex items-center gap-1.5 font-bold">
                <Bookmark className="w-3.5 h-3.5" />
                <span>Historic Registry</span>
              </span>
              <div className="flex items-center text-xs font-mono text-slate-500 space-x-4 font-bold">
                <span>FOUND: <strong className="text-slate-300 font-bold">{selectedStone.yearFound}</strong></span>
              </div>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-serif font-bold text-slate-100 tracking-tight">
              {selectedStone.name}
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#020308] p-3 rounded-xl border border-slate-800 text-center font-mono shadow-inner">
              <span className="text-[9px] text-slate-500 uppercase block mb-1 font-bold">Carat Weight</span>
              <span className="text-xs text-indigo-400 font-bold flex items-center justify-center gap-1">
                <Scale className="w-3.5 h-3.5" /> {selectedStone.weight.split(" ")[0]}ct
              </span>
            </div>
            <div className="bg-[#020308] p-3 rounded-xl border border-slate-800 text-center font-mono shadow-inner">
              <span className="text-[9px] text-slate-500 uppercase block mb-1 font-bold">Origin Source</span>
              <span className="text-xs text-rose-400 font-bold flex items-center justify-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> {selectedStone.origin.split(" ")[0]}
              </span>
            </div>
            <div className="bg-[#020308] p-3 rounded-xl border border-slate-800 text-center font-mono shadow-inner">
              <span className="text-[9px] text-slate-500 uppercase block mb-1 font-bold">Gemstone Cut</span>
              <span className="text-xs text-blue-400 font-bold flex items-center justify-center gap-1">
                <Gem className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">{selectedStone.cut.split("-")[0]}</span>
              </span>
            </div>
            <div className="bg-[#020308] p-3 rounded-xl border border-slate-800 text-center font-mono shadow-inner">
              <span className="text-[9px] text-slate-500 uppercase block mb-1 font-bold">Color Grade</span>
              <span className="text-xs text-sky-400 font-bold flex items-center justify-center gap-1">
                <Compass className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">{selectedStone.color}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center py-5 bg-[#020308] rounded-xl border border-slate-800">
            <svg viewBox="0 0 100 100" className="w-20 h-20 sm:w-24 sm:h-24 drop-shadow-[0_4px_12px_rgba(99,102,241,0.25)]">
              <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(99, 102, 241, 0.25)" strokeWidth="1" />
              <circle cx="50" cy="50" r="30" fill="none" stroke="rgba(99, 102, 241, 0.15)" strokeWidth="1" />
              <polygon points="50,15 75,30 75,70 50,85 25,70 25,30" fill="rgba(30, 41, 95, 0.8)" stroke="rgb(99, 102, 241)" strokeWidth="1.2" />
              <polygon points="50,30 65,40 65,60 50,70 35,60 35,40" fill="rgba(56, 189, 248, 0.2)" stroke="rgba(56, 189, 248, 0.5)" strokeWidth="0.8" />
              <line x1="50" y1="15" x2="50" y2="30" stroke="rgb(99, 102, 241)" strokeWidth="1" />
              <line x1="75" y1="30" x2="65" y2="40" stroke="rgb(99, 102, 241)" strokeWidth="1" />
              <line x1="75" y1="70" x2="65" y2="60" stroke="rgb(99, 102, 241)" strokeWidth="1" />
              <line x1="50" y1="85" x2="50" y2="70" stroke="rgb(99, 102, 241)" strokeWidth="1" />
              <line x1="25" y1="70" x2="35" y2="60" stroke="rgb(99, 102, 241)" strokeWidth="1" />
              <line x1="25" y1="30" x2="35" y2="40" stroke="rgb(99, 102, 241)" strokeWidth="1" />
              <circle cx="50" cy="15" r="2" fill="#fff" />
              <circle cx="75" cy="30" r="2" fill="#fff" />
              <circle cx="75" cy="70" r="2" fill="#fff" />
              <circle cx="50" cy="85" r="2" fill="#fff" />
              <circle cx="25" cy="70" r="2" fill="#fff" />
              <circle cx="25" cy="30" r="2" fill="#fff" />
            </svg>
          </div>

          <div className="space-y-2 pb-1">
            <h4 className="text-xs font-mono text-slate-400 uppercase tracking-widest flex items-center gap-1.5 font-bold">
              <History className="w-4 h-4 text-indigo-400" /> Backstory & Historical Lineage
            </h4>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed font-serif">
              {selectedStone.story}
            </p>
          </div>

          <div className="bg-[#020308] rounded-xl p-4 border border-slate-800 flex items-start space-x-3 text-xs">
            <Globe className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-bold">Current Custody</span>
              <span className="text-slate-200 font-medium leading-relaxed block">{selectedStone.location}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
