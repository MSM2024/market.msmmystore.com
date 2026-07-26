'use client'

import { useState } from "react"
import {
  BookOpen, Layers, Flame, Eye, Compass, Cpu, Award
} from "lucide-react"

interface SpectroPreset {
  name: string
  chemical: string
  description: string
  absorptionBands: number[]
  transmittancePeak: string
}

const SPECTROSCOPE_PRESETS: SpectroPreset[] = [
  {
    name: "Natural Blue Sapphire",
    chemical: "Fe2+ -> Ti4+ charge transfer + trace Fe3+",
    description: "Features highly distinctive iron absorption bands at 450nm and 470nm in the blue region, and a thin band at 388nm in the near-ultraviolet.",
    absorptionBands: [15, 22, 26, 85],
    transmittancePeak: "Maximum transmittance peaks between 460nm and 480nm (royal blue)."
  },
  {
    name: "Natural Ruby (Red Corundum)",
    chemical: "Cr3+ (Chromium substitution for Al3+)",
    description: "Deep absorption across violet-blue (400-450nm) and yellow-green (540-580nm). Sharp red emission doublet at 694nm.",
    absorptionBands: [10, 11, 48, 50, 52, 54, 56, 96, 98],
    transmittancePeak: "High transmission in red (620-700nm) and slight transmission in blue (470nm)."
  },
  {
    name: "Padparadscha Sapphire",
    chemical: "Cr3+ (Pink) + Color Centers (Orange)",
    description: "Subtle chromium absorption lines merged with an iron absorption slope. Creates the legendary pinkish-orange bloom.",
    absorptionBands: [10, 48, 50, 96],
    transmittancePeak: "Broad peak encompassing yellow, orange, and pink spectra (580-640nm)."
  },
  {
    name: "Verneuil Synthetic Sapphire",
    chemical: "Artificial iron-free melt coloring",
    description: "Lacks iron absorption bands at 450nm due to pure chemically-synthesized base material.",
    absorptionBands: [88],
    transmittancePeak: "Uniform, sterile transmission profile with zero natural mineral fingerprint."
  }
]

export default function Handbook() {
  const [activeTab, setActiveTab] = useState<"specs" | "spectro" | "diagnostics">("specs")
  const [selectedSpectro, setSelectedSpectro] = useState<SpectroPreset>(SPECTROSCOPE_PRESETS[0])

  return (
    <div className="space-y-6">
      <div className="flex border-b border-slate-800 bg-[#020308] p-1 rounded-xl border border-slate-800/80">
        <button
          onClick={() => setActiveTab("specs")}
          className={`flex-1 sm:flex-initial px-3 sm:px-5 py-2.5 text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider transition-all rounded-lg ${
            activeTab === "specs"
              ? "bg-[#090d16] text-blue-400 border border-indigo-500/25 shadow-md"
              : "text-slate-400 hover:text-slate-200"
          }`}
          style={{ minHeight: "40px" }}
        >
          Corundum
        </button>
        <button
          onClick={() => setActiveTab("spectro")}
          className={`flex-1 sm:flex-initial px-3 sm:px-5 py-2.5 text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider transition-all rounded-lg ${
            activeTab === "spectro"
              ? "bg-[#090d16] text-blue-400 border border-indigo-500/25 shadow-md"
              : "text-slate-400 hover:text-slate-200"
          }`}
          style={{ minHeight: "40px" }}
        >
          Spectroscope
        </button>
        <button
          onClick={() => setActiveTab("diagnostics")}
          className={`flex-1 sm:flex-initial px-3 sm:px-5 py-2.5 text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider transition-all rounded-lg ${
            activeTab === "diagnostics"
              ? "bg-[#090d16] text-blue-400 border border-indigo-500/25 shadow-md"
              : "text-slate-400 hover:text-slate-200"
          }`}
          style={{ minHeight: "40px" }}
        >
          Diagnostics
        </button>
      </div>

      {activeTab === "specs" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#090d16] border border-[#1e293b] rounded-2xl p-5 space-y-4 shadow-lg">
            <div className="flex items-center space-x-2 text-blue-400">
              <Layers className="w-5 h-5" />
              <h4 className="font-semibold text-sm text-slate-100">Chemical Formulation</h4>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Sapphires are members of the **Corundum** family, a mineral consisting of aluminum oxide (Al₂O₃). In its pure form, corundum is completely colorless (Leucosapphire).
            </p>
            <div className="bg-[#020308] p-3.5 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300 space-y-1.5 shadow-inner">
              <div><span className="text-slate-500 font-bold">SYSTEM:</span> Trigonal (Hexagonal)</div>
              <div><span className="text-slate-500 font-bold">IMPURITIES:</span> Iron (Fe), Titanium (Ti), Cr</div>
              <div><span className="text-slate-500 font-bold">GRAVITY:</span> 3.99 - 4.01 (High density)</div>
            </div>
          </div>
          <div className="bg-[#090d16] border border-[#1e293b] rounded-2xl p-5 space-y-4 shadow-lg">
            <div className="flex items-center space-x-2 text-emerald-400">
              <Compass className="w-5 h-5" />
              <h4 className="font-semibold text-sm text-slate-100">Optical Properties</h4>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              As a uniaxial negative crystal, sapphire splits entering light rays into two distinct paths—a property known as birefringence.
            </p>
            <div className="bg-[#020308] p-3.5 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300 space-y-1.5 shadow-inner">
              <div><span className="text-slate-500 font-bold">REFRACTIVE INDEX:</span> 1.762 - 1.770</div>
              <div><span className="text-slate-500 font-bold">BIREFRINGENCE:</span> 0.008</div>
              <div><span className="text-slate-500 font-bold">DISPERSION:</span> 0.018 (Rainbow fire)</div>
            </div>
          </div>
          <div className="bg-[#090d16] border border-[#1e293b] rounded-2xl p-5 space-y-4 shadow-lg">
            <div className="flex items-center space-x-2 text-rose-400">
              <Award className="w-5 h-5" />
              <h4 className="font-semibold text-sm text-slate-100">Physical Durability</h4>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Sustaining a rating of **9.0** on the Mohs Hardness Scale, corundum is exceptionally resistant to abrasion.
            </p>
            <div className="bg-[#020308] p-3.5 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300 space-y-1.5 shadow-inner">
              <div><span className="text-slate-500 font-bold">MOHS SCALE:</span> 9.0 (Exceptional)</div>
              <div><span className="text-slate-500 font-bold">CLEAVAGE:</span> None (Conchoidal)</div>
              <div><span className="text-slate-500 font-bold">USES:</span> Haute Joaillerie, Tech Crystals</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "spectro" && (
        <div className="bg-[#090d16] border border-[#1e293b] rounded-2xl p-4 sm:p-6 space-y-6 shadow-lg">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-indigo-400">
              <Cpu className="w-5 h-5" />
              <h4 className="font-semibold text-sm text-slate-100">Diffraction Spectroscope Simulator</h4>
            </div>
            <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
              A spectroscope separates white light transmitted through a gemstone into its spectral colors, revealing black absorption bands where specific elements have trapped light.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {SPECTROSCOPE_PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => setSelectedSpectro(preset)}
                className={`px-3 py-2 text-[11px] sm:text-xs font-mono rounded-lg transition-all border ${
                  selectedSpectro.name === preset.name
                    ? "bg-indigo-600 border-indigo-500 text-white font-bold shadow-md shadow-indigo-950/50"
                    : "bg-[#020308] border-slate-800 text-slate-400 hover:text-slate-300"
                }`}
                style={{ minHeight: "40px" }}
              >
                {preset.name}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <span className="text-[9px] sm:text-[10px] font-mono text-slate-500 uppercase tracking-widest block font-bold">
              Simulated Optical Spectrum Output (400nm - 700nm)
            </span>
            <div className="relative rounded-xl overflow-hidden border border-slate-800 h-16 shadow-[inset_0_4px_12px_rgba(0,0,0,0.9)] flex">
              <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-blue-500 via-cyan-400 via-green-400 via-yellow-400 via-orange-500 to-red-600 pointer-events-none" />
              {selectedSpectro.absorptionBands.map((pos, idx) => (
                <div
                  key={idx}
                  style={{ left: `${pos}%` }}
                  className="absolute top-0 bottom-0 w-1 sm:w-[5px] bg-black/95 shadow-md shadow-black"
                />
              ))}
              <div className="absolute inset-x-0 bottom-1 flex justify-between px-3 text-[9px] font-mono text-black font-semibold uppercase tracking-wider select-none mix-blend-difference">
                <span>Violet (400nm)</span>
                <span>Green (550nm)</span>
                <span>Red (700nm)</span>
              </div>
            </div>
          </div>

          <div className="bg-[#020308] rounded-xl p-4 border border-slate-800 space-y-2.5 font-mono text-[11px] sm:text-xs shadow-inner">
            <div className="flex justify-between border-b border-slate-800/60 pb-2 text-slate-400">
              <span className="font-bold">TARGET SPECIES:</span>
              <span className="text-slate-200 font-extrabold">{selectedSpectro.name}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800/60 pb-2 text-slate-400">
              <span className="font-bold">CHROMATIC CHROMOPHORE:</span>
              <span className="text-indigo-400 font-bold">{selectedSpectro.chemical}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800/60 pb-2 text-slate-400">
              <span className="font-bold">TRANSMITTANCE:</span>
              <span className="text-emerald-400 font-bold">{selectedSpectro.transmittancePeak}</span>
            </div>
            <div className="pt-2 text-xs text-slate-300 leading-relaxed">
              <strong className="text-indigo-300 font-mono text-[10px] uppercase block mb-1">Diagnostics:</strong>
              {selectedSpectro.description}
            </div>
          </div>
        </div>
      )}

      {activeTab === "diagnostics" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#090d16] border border-[#1e293b] rounded-2xl p-5 space-y-4 shadow-lg">
            <div className="flex items-center space-x-2 text-amber-400">
              <Eye className="w-5 h-5" />
              <h4 className="font-semibold text-sm text-slate-100">Natural Inclusions Fingerprints</h4>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Natural corundum grows slowly over millions of years, trapping mineral crystals and liquid bubbles that prove authenticity.
            </p>
            <div className="space-y-3">
              <div className="bg-[#020308] p-3.5 rounded-xl border border-slate-800 text-xs shadow-inner">
                <p className="font-semibold text-slate-300">1. Rutile Silk (Asterism)</p>
                <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">Fine needles of Titanium Dioxide at 60/120 degrees. Proves natural slow growth.</p>
              </div>
              <div className="bg-[#020308] p-3.5 rounded-xl border border-slate-800 text-xs shadow-inner">
                <p className="font-semibold text-slate-300">2. Fingerprints & Feathers</p>
                <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">Partially healed fractures with microscopic fluid-filled cavities.</p>
              </div>
            </div>
          </div>
          <div className="bg-[#090d16] border border-[#1e293b] rounded-2xl p-5 space-y-4 shadow-lg">
            <div className="flex items-center space-x-2 text-rose-500">
              <Flame className="w-5 h-5" />
              <h4 className="font-semibold text-sm text-slate-100">Thermal Heat Treatments</h4>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Heating sapphires to 1500°C-1800°C dissolves rutile silk, deepens blue saturation, and clears foggy inclusions.
            </p>
            <div className="space-y-3">
              <div className="bg-[#020308] p-3.5 rounded-xl border border-slate-800 text-xs shadow-inner">
                <p className="font-semibold text-slate-300">Detection under Loupe</p>
                <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">Heated stones display &apos;halo&apos; discoid fractures and melted facet junctions.</p>
              </div>
              <div className="bg-[#020308] p-3.5 rounded-xl border border-slate-800 text-xs shadow-inner">
                <p className="font-semibold text-slate-300">Beryllium Diffusion (Warning)</p>
                <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">Forcing Beryllium into the lattice at extreme heats to artificially color pale stones.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
