'use client'

import { useState, useMemo } from "react"
import {
  Sparkles, Layers, Sun, ShieldCheck, Scale, RefreshCw,
  MapPin, Award, Zap, Eye, CheckCircle, X
} from "lucide-react"
import type { SapphireCut, SapphireColor, SapphireClarity, SapphireOrigin, GemLabConfig } from "@/lib/gemology-types"
import {
  COLOR_DEFINITIONS, CUT_DEFINITIONS, CLARITY_DESCRIPTIONS,
  ORIGIN_FACTS, calculateSapphireValuation
} from "@/lib/gemology-data"

export default function GemLab() {
  const [config, setConfig] = useState<GemLabConfig>({
    cut: "Oval",
    color: "Royal Blue",
    clarity: "VVS1",
    carat: 2.5,
    origin: "Ceylon (Sri Lanka)",
    treated: false,
    angle: 45,
    refraction: 1.76,
  })

  const [showRays, setShowRays] = useState(true)
  const [uvMode, setUvMode] = useState(false)
  const [isGeneratingCert, setIsGeneratingCert] = useState(false)
  const [certificateId, setCertificateId] = useState("ZF-8842-109")
  const [showCertOverlay, setShowCertOverlay] = useState(false)

  const handleRegenId = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    const nums = "0123456789"
    let result = "ZF-"
    for (let i = 0; i < 4; i++) result += nums[Math.floor(Math.random() * nums.length)]
    result += "-"
    for (let i = 0; i < 3; i++) result += chars[Math.floor(Math.random() * chars.length)]
    setCertificateId(result)
  }

  const selectedColorDef = useMemo(() => COLOR_DEFINITIONS[config.color], [config.color])
  const selectedCutDef = useMemo(() => CUT_DEFINITIONS[config.cut], [config.cut])
  const selectedClarityDef = useMemo(() => CLARITY_DESCRIPTIONS[config.clarity], [config.clarity])
  const selectedOriginDef = useMemo(() => ORIGIN_FACTS[config.origin], [config.origin])

  const valuation = useMemo(() => {
    return calculateSapphireValuation(config.carat, config.color, config.clarity, config.origin, config.treated)
  }, [config.carat, config.color, config.clarity, config.origin, config.treated])

  const loadRoyalCeylonPreset = () => {
    setConfig(prev => ({ ...prev, color: "Royal Blue", origin: "Ceylon (Sri Lanka)", clarity: "IF", carat: 3.8, treated: false }))
    handleRegenId()
  }

  const loadPadparadschaPreset = () => {
    setConfig(prev => ({ ...prev, color: "Padparadscha", origin: "Ceylon (Sri Lanka)", clarity: "VVS1", carat: 2.1, treated: false }))
    handleRegenId()
  }

  const loadKashmirPreset = () => {
    setConfig(prev => ({ ...prev, color: "Cornflower Blue", origin: "Kashmir", clarity: "VVS2", carat: 5.2, treated: false }))
    handleRegenId()
  }

  const handlePrintCertificate = () => {
    setIsGeneratingCert(true)
    setTimeout(() => {
      setIsGeneratingCert(false)
      setShowCertOverlay(true)
    }, 1200)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <div className="lg:col-span-7 space-y-6">
        <div className="relative rounded-2xl bg-[#090d16] border border-[#1e293b] p-4 sm:p-6 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.85)]">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#111827_1px,transparent_1px),linear-gradient(to_bottom,#111827_1px,transparent_1px)] bg-[size:24px_24px] opacity-20 pointer-events-none" />

          <div className="relative flex items-center justify-between z-10 border-b border-slate-800 pb-3 mb-4">
            <div className="flex items-center space-x-2">
              <span className="flex h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] animate-pulse" />
              <span className="text-[10px] sm:text-xs font-mono text-slate-400 uppercase tracking-widest">Active Simulation Lab</span>
            </div>
            <div className="flex items-center space-x-2 text-xs">
              <button
                onClick={() => { setShowRays(!showRays); if (showCertOverlay) setShowCertOverlay(false) }}
                className={`px-2 py-1.5 sm:px-3 sm:py-1.5 rounded-lg border font-mono text-[10px] sm:text-xs transition-all duration-200 flex items-center space-x-1.5 ${
                  showRays
                    ? "bg-indigo-600 border-indigo-500/30 text-white shadow-[0_0_10px_rgba(79,70,229,0.3)]"
                    : "bg-[#020308] border-slate-800 text-slate-400 hover:text-slate-300"
                }`}
                style={{ minHeight: "40px" }}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Light Rays</span>
              </button>
              <button
                onClick={() => { setUvMode(!uvMode); if (showCertOverlay) setShowCertOverlay(false) }}
                className={`px-2 py-1.5 sm:px-3 sm:py-1.5 rounded-lg border font-mono text-[10px] sm:text-xs transition-all duration-200 flex items-center space-x-1.5 ${
                  uvMode
                    ? "bg-rose-600 border-rose-500/30 text-white shadow-[0_0_10px_rgba(225,29,72,0.3)]"
                    : "bg-[#020308] border-slate-800 text-slate-400 hover:text-slate-300"
                }`}
                style={{ minHeight: "40px" }}
              >
                <Zap className="w-3.5 h-3.5 text-rose-400" />
                <span>UV Glow</span>
              </button>
            </div>
          </div>

          <div className="relative h-[280px] xs:h-[350px] sm:h-[380px] w-full flex items-center justify-center rounded-xl bg-[#020308] border border-slate-800/80 p-4 overflow-hidden transition-colors duration-500 shadow-[inset_0_4px_12px_rgba(0,0,0,0.8)]">
            <div
              style={{
                background: uvMode
                  ? "radial-gradient(circle, rgba(244,63,94,0.2) 0%, rgba(244,63,94,0.0) 70%)"
                  : `radial-gradient(circle, ${selectedColorDef.hex}22 0%, ${selectedColorDef.hex}00 70%)`,
                filter: "blur(15px)"
              }}
              className="absolute inset-0 transition-all duration-500"
            />

            {uvMode && (
              <div className="absolute inset-x-0 bottom-4 text-center z-10 pointer-events-none px-2">
                <span className="px-3 py-1 bg-rose-950/90 border border-rose-800/80 text-rose-400 text-[9px] sm:text-[10px] font-mono rounded-full uppercase tracking-wider shadow-[0_0_10px_rgba(244,63,94,0.2)] animate-pulse">
                  Luminescence: Chromium Red (365nm UV)
                </span>
              </div>
            )}

            {!showCertOverlay && (
              <svg
                viewBox="-50 -50 300 300"
                className="w-56 h-56 xs:w-64 xs:h-64 select-none drop-shadow-[0_15px_35px_rgba(0,0,0,0.95)] z-10 overflow-visible transition-all duration-300"
              >
                <defs>
                  <radialGradient id="gem-radial-grad" cx="50%" cy="45%" r="50%">
                    <stop offset="0%" stopColor={uvMode ? "#FDA4AF" : selectedColorDef.hex} stopOpacity="0.95" />
                    <stop offset="45%" stopColor={uvMode ? "#E11D48" : selectedColorDef.hex} stopOpacity="0.8" />
                    <stop offset="90%" stopColor={uvMode ? "#4C0519" : "#030712"} stopOpacity="0.95" />
                  </radialGradient>
                  <linearGradient id="dispersion-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.6" />
                    <stop offset="50%" stopColor="#818cf8" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#ec4899" stopOpacity="0.6" />
                  </linearGradient>
                </defs>

                {showRays && !uvMode && (
                  <g id="laboratory-light-rays">
                    <line x1={100 + Math.cos((config.angle - 90) * Math.PI / 180) * 140}
                      y1={100 + Math.sin((config.angle - 90) * Math.PI / 180) * 140}
                      x2="100" y2="100" stroke="#ffffff" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.5" />
                    <line x1="100" y1="100"
                      x2={100 + Math.cos((config.angle / config.refraction) * Math.PI / 180) * 60}
                      y2={100 + Math.sin((config.angle / config.refraction) * Math.PI / 180) * 60}
                      stroke={selectedColorDef.hex} strokeWidth="2" opacity="0.8" />
                    <line x1="100" y1="100"
                      x2={100 + Math.cos(((config.angle / config.refraction) + 8) * Math.PI / 180) * 60}
                      y2={100 + Math.sin(((config.angle / config.refraction) + 8) * Math.PI / 180) * 60}
                      stroke="#38bdf8" strokeWidth="1" opacity="0.5" strokeDasharray="2 2" />
                    <path d={`M ${100 + Math.cos((config.angle / config.refraction) * Math.PI / 180) * 60} ${100 + Math.sin((config.angle / config.refraction) * Math.PI / 180) * 60} L 20 220`}
                      stroke="rgba(56, 189, 248, 0.45)" strokeWidth="1" />
                    <path d={`M ${100 + Math.cos(((config.angle / config.refraction) + 8) * Math.PI / 180) * 60} ${100 + Math.sin(((config.angle / config.refraction) + 8) * Math.PI / 180) * 60} L 180 220`}
                      stroke="rgba(244, 114, 182, 0.45)" strokeWidth="1" />
                  </g>
                )}

                <g style={{
                  transform: `rotate(${config.angle / 12}deg)`,
                  transformOrigin: "100px 100px"
                }}>
                  <path d={selectedCutDef.paths.outline}
                    fill="url(#gem-radial-grad)"
                    stroke={uvMode ? "#f43f5e" : selectedColorDef.hex}
                    strokeWidth="2.5" className="transition-all duration-500" />

                  {config.color === "Star Sapphire" && !uvMode && (
                    <g className="pointer-events-none">
                      <circle cx="100" cy="100" r="18" fill="#e2e8f0" opacity="0.25" className="animate-pulse" />
                      <line x1="100" y1="50" x2="100" y2="150" stroke="#f1f5f9" strokeWidth="3" opacity="0.75" />
                      <line x1="50" y1="100" x2="150" y2="100" stroke="#f1f5f9" strokeWidth="3" opacity="0.75" />
                      <line x1="65" y1="65" x2="135" y2="135" stroke="#f1f5f9" strokeWidth="2" opacity="0.6" />
                      <line x1="135" y1="65" x2="65" y2="135" stroke="#f1f5f9" strokeWidth="2" opacity="0.6" />
                      <circle cx="100" cy="100" r="4" fill="#ffffff" opacity="0.9" />
                    </g>
                  )}

                  {selectedCutDef.paths.facets.map((facetPath, idx) => {
                    const scintillationSeed = Math.sin((idx * 24 + config.angle) * Math.PI / 180)
                    const opacity = Math.max(0.08, Math.min(0.75, (scintillationSeed * 0.4) + 0.35))
                    const useDispersion = idx % 5 === 0 && !uvMode && config.color !== "Star Sapphire"
                    const facetFill = useDispersion
                      ? "url(#dispersion-grad)"
                      : (uvMode ? `rgba(244, 63, 94, ${opacity * 1.2})` : `rgba(255, 255, 255, ${opacity})`)

                    return (
                      <path key={idx} d={facetPath}
                        fill={facetFill}
                        stroke={uvMode ? "rgba(190, 24, 74, 0.6)" : "rgba(15, 23, 42, 0.4)"}
                        strokeWidth="1.2" className="transition-all duration-300" />
                    )
                  })}

                  {config.clarity !== "IF" && (
                    <g opacity="0.45">
                      {["VS1", "VS2", "SI1"].includes(config.clarity) && (
                        <>
                          <line x1="85" y1="75" x2="115" y2="85" stroke="rgba(255,255,255,0.45)" strokeWidth="0.8" strokeDasharray="1 3" />
                          <line x1="75" y1="120" x2="90" y2="140" stroke="rgba(255,255,255,0.3)" strokeWidth="0.6" />
                        </>
                      )}
                      {config.clarity === "SI1" && (
                        <>
                          <path d="M 120 110 C 122 115, 125 112, 130 118" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" strokeDasharray="2 1" />
                          <circle cx="100" cy="125" r="1.5" fill="rgba(255,255,255,0.6)" />
                        </>
                      )}
                      {["VVS1", "VVS2"].includes(config.clarity) && (
                        <circle cx="112" cy="95" r="0.6" fill="rgba(255,255,255,0.6)" />
                      )}
                    </g>
                  )}
                </g>
              </svg>
            )}

            {!showCertOverlay && (
              <>
                <div className="absolute top-12 left-16 animate-bounce text-yellow-400/80">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="absolute bottom-16 right-16 animate-pulse text-sky-400/60">
                  <Sparkles className="w-4 h-4" />
                </div>
              </>
            )}

            {!showCertOverlay && (
              <>
                <div className="absolute bottom-4 left-4 bg-[#0a0e1a] px-3 py-1.5 rounded-lg border border-slate-800 text-[10px] sm:text-[11px] font-mono text-slate-300 space-y-0.5 shadow-md">
                  <div className="flex justify-between space-x-3">
                    <span className="text-slate-500">REFRACTION:</span>
                    <span className="text-blue-400 font-semibold">{config.refraction.toFixed(2)} nD</span>
                  </div>
                  <div className="flex justify-between space-x-3">
                    <span className="text-slate-500">DISPERSION:</span>
                    <span className="text-blue-400">0.018</span>
                  </div>
                </div>
                <div className="absolute top-4 right-4 bg-[#0a0e1a] px-3 py-1.5 rounded-lg border border-slate-800 text-[10px] sm:text-[11px] font-mono text-slate-300 shadow-md">
                  <span className="text-slate-500">WEIGHT:</span> <span className="text-emerald-400 font-semibold">{config.carat.toFixed(2)} ct</span>
                </div>
              </>
            )}

            {showCertOverlay && (
              <div className="absolute inset-0 bg-[#070a13] p-5 flex flex-col justify-between z-40 animate-fade-in">
                <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <ShieldCheck className="w-5 h-5 text-emerald-400" />
                      <h4 className="text-xs font-mono text-slate-100 uppercase tracking-widest font-bold">CRYPTO-GRADED LEDGER</h4>
                    </div>
                    <p className="text-[10px] text-slate-500 font-mono">EXPORT SECURED VIA GIA PROTOCOL</p>
                  </div>
                  <button onClick={() => setShowCertOverlay(false)}
                    className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 my-3 bg-[#020308] border border-emerald-900/30 rounded-xl p-4 flex flex-col justify-center space-y-2.5 relative">
                  <div className="absolute right-4 top-4 flex flex-col items-center">
                    <div className="w-16 h-8 bg-slate-950 border border-slate-800 flex items-center justify-around px-1 overflow-hidden">
                      <div className="w-[2px] h-6 bg-slate-400" /><div className="w-[1px] h-6 bg-slate-400" />
                      <div className="w-[3px] h-6 bg-slate-400" /><div className="w-[1px] h-6 bg-slate-400" />
                      <div className="w-[2px] h-6 bg-slate-400" /><div className="w-[4px] h-6 bg-slate-400" />
                    </div>
                    <span className="text-[7px] font-mono text-slate-500 mt-1">{certificateId}</span>
                  </div>
                  <div className="text-center text-xs text-emerald-400 font-mono font-bold flex items-center justify-center gap-1.5">
                    <CheckCircle className="w-4 h-4" /> LEDGER INTEGRITY CONFIRMED
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] font-mono text-slate-300">
                    <div><span className="text-slate-500">ID:</span> {certificateId}</div>
                    <div><span className="text-slate-500">MASS:</span> {config.carat.toFixed(2)}ct</div>
                    <div><span className="text-slate-500">VARIETY:</span> {config.color}</div>
                    <div><span className="text-slate-500">CLARITY:</span> {config.clarity}</div>
                    <div><span className="text-slate-500">GEOMETRY:</span> {config.cut}</div>
                    <div><span className="text-slate-500">ORIGIN:</span> {config.origin.split(" ")[0]}</div>
                  </div>
                  <div className="pt-2 border-t border-slate-800/60 flex justify-between items-center text-[11px] font-mono">
                    <span className="text-slate-500 uppercase">Appraised Bracket:</span>
                    <span className="text-emerald-400 font-bold">${valuation.min.toLocaleString()} - ${valuation.max.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => setShowCertOverlay(false)}
                    className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono rounded-lg transition-all">
                    Close Preview
                  </button>
                  <button onClick={() => alert(`Mock PDF print triggered for certificate ${certificateId}.`)}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold rounded-lg transition-all shadow-md shadow-emerald-950/40">
                    Print PDF
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4 mt-5">
            <div>
              <div className="flex justify-between text-xs font-mono mb-1.5">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Sun className="w-3.5 h-3.5 text-amber-500" /> Light Angle Projection
                </span>
                <span className="text-blue-400 font-bold">{config.angle}°</span>
              </div>
              <input type="range" min="0" max="360" value={config.angle}
                onChange={(e) => setConfig({ ...config, angle: parseInt(e.target.value) })}
                className="w-full accent-blue-500 cursor-pointer h-2 bg-[#020308] rounded-lg border border-slate-800" />
            </div>
            <div>
              <div className="flex justify-between text-xs font-mono mb-1.5">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-emerald-500" /> Carat Mass
                </span>
                <span className="text-emerald-400 font-bold">{config.carat.toFixed(2)} ct</span>
              </div>
              <input type="range" min="0.5" max="10.0" step="0.1" value={config.carat}
                onChange={(e) => { setConfig({ ...config, carat: parseFloat(e.target.value) }); handleRegenId() }}
                className="w-full accent-emerald-500 cursor-pointer h-2 bg-[#020308] rounded-lg border border-slate-800" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-[#090d16] border border-[#1e293b] p-4 shadow-lg">
          <h4 className="text-xs font-mono text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5 font-bold">
            <Layers className="w-3.5 h-3.5 text-indigo-400" /> Load Fine Collectible Presets
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button onClick={loadKashmirPreset}
              className="px-3 py-2 bg-[#020308] hover:bg-indigo-950/50 border border-slate-800 hover:border-indigo-600 rounded-xl text-left transition-all group flex flex-col justify-between"
              style={{ minHeight: "52px" }}>
              <p className="text-[9px] font-mono text-slate-500 uppercase font-semibold">01. Kashmir Silk</p>
              <p className="text-xs font-semibold text-slate-300 group-hover:text-blue-400 transition-colors">Cornflower Blue</p>
            </button>
            <button onClick={loadRoyalCeylonPreset}
              className="px-3 py-2 bg-[#020308] hover:bg-indigo-950/50 border border-slate-800 hover:border-indigo-600 rounded-xl text-left transition-all group flex flex-col justify-between"
              style={{ minHeight: "52px" }}>
              <p className="text-[9px] font-mono text-slate-500 uppercase font-semibold">02. Royal Ceylon</p>
              <p className="text-xs font-semibold text-slate-300 group-hover:text-blue-400 transition-colors">Vivid Royal 3.8ct</p>
            </button>
            <button onClick={loadPadparadschaPreset}
              className="px-3 py-2 bg-[#020308] hover:bg-orange-950/40 border border-slate-800 hover:border-orange-600 rounded-xl text-left transition-all group flex flex-col justify-between"
              style={{ minHeight: "52px" }}>
              <p className="text-[9px] font-mono text-slate-500 uppercase font-semibold">03. Sacred Lotus</p>
              <p className="text-xs font-semibold text-slate-300 group-hover:text-orange-400 transition-colors">Padparadscha</p>
            </button>
          </div>
        </div>
      </div>

      <div className="lg:col-span-5 space-y-6">
        <div className="rounded-2xl bg-[#090d16] border border-[#1e293b] p-4 sm:p-6 space-y-5 shadow-[0_20px_50px_rgba(0,0,0,0.85)]">
          <h3 className="text-sm sm:text-base font-semibold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
            <Layers className="w-5 h-5 text-blue-500" />
            <span>Gemstone Configurator</span>
          </h3>

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-slate-400 uppercase tracking-wider block">1. Facet Cut Geometry</label>
            <select value={config.cut}
              onChange={(e) => setConfig({ ...config, cut: e.target.value as SapphireCut })}
              className="w-full rounded-xl bg-[#020308] border border-slate-800 px-3 py-2.5 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-indigo-600"
              style={{ minHeight: "44px" }}>
              {Object.keys(CUT_DEFINITIONS).map((cut) => (
                <option key={cut} value={cut}>{cut} ({CUT_DEFINITIONS[cut as SapphireCut].refractiveFacets} facets)</option>
              ))}
            </select>
            <p className="text-[10px] sm:text-[11px] text-slate-500 leading-relaxed italic">{selectedCutDef.description}</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-slate-400 uppercase tracking-wider block">2. Optical Chromatic Shade</label>
            <select value={config.color}
              onChange={(e) => setConfig({ ...config, color: e.target.value as SapphireColor })}
              className="w-full rounded-xl bg-[#020308] border border-slate-800 px-3 py-2.5 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-indigo-600"
              style={{ minHeight: "44px" }}>
              {Object.keys(COLOR_DEFINITIONS).map((color) => (
                <option key={color} value={color}>{color}</option>
              ))}
            </select>
            <div className="flex items-start gap-2.5 bg-[#020308] p-3 rounded-xl border border-slate-800">
              <span style={{ backgroundColor: selectedColorDef.hex }}
                className="w-3.5 h-3.5 rounded-full mt-0.5 border border-white/20 shrink-0" />
              <div className="text-[11px] text-slate-400 space-y-1">
                <p>{selectedColorDef.description}</p>
                <p className="text-[10px] text-slate-500 font-mono italic font-semibold">{selectedColorDef.absorptionSpectrum}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xs:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-400 uppercase tracking-wider block">3. Clarity Grade</label>
              <select value={config.clarity}
                onChange={(e) => setConfig({ ...config, clarity: e.target.value as SapphireClarity })}
                className="w-full rounded-xl bg-[#020308] border border-slate-800 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-600"
                style={{ minHeight: "44px" }}>
                {Object.keys(CLARITY_DESCRIPTIONS).map((cl) => (
                  <option key={cl} value={cl}>{cl}</option>
                ))}
              </select>
              <p className="text-[10px] text-slate-500 leading-tight">{selectedClarityDef.desc}</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-400 uppercase tracking-wider block">4. Thermal Care</label>
              <div className="flex items-center space-x-2 bg-[#020308] px-3 border border-slate-800 rounded-xl h-11">
                <input type="checkbox" checked={config.treated}
                  onChange={(e) => setConfig({ ...config, treated: e.target.checked })}
                  className="w-4 h-4 accent-indigo-600 rounded bg-[#020308] border-slate-800" />
                <span className="text-xs font-bold text-slate-300">Heat Treated</span>
              </div>
              <p className="text-[10px] text-slate-500 leading-tight pt-0.5">
                {config.treated ? "Color thermal-stabilized (+90% of trade)." : "Strictly unheated. Commands 2x-3x collector premium."}
              </p>
            </div>
          </div>

          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-mono text-slate-400 uppercase tracking-wider block flex items-center gap-1 font-bold">
              <MapPin className="w-3.5 h-3.5 text-rose-500" /> 5. Geologic Provenance
            </label>
            <select value={config.origin}
              onChange={(e) => setConfig({ ...config, origin: e.target.value as SapphireOrigin })}
              className="w-full rounded-xl bg-[#020308] border border-slate-800 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-600"
              style={{ minHeight: "44px" }}>
              {Object.keys(ORIGIN_FACTS).map((orig) => (
                <option key={orig} value={orig}>{orig}</option>
              ))}
            </select>
            <p className="text-[10.5px] sm:text-[11px] text-slate-400 bg-[#020308] p-3 rounded-lg leading-relaxed border border-slate-800">
              {selectedOriginDef.description}
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-[#090d16] border border-[#1e293b] p-4 sm:p-6 space-y-5 relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.85)]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent rounded-bl-full pointer-events-none" />

          <div className="flex justify-between items-start border-b border-slate-800 pb-3">
            <div className="space-y-0.5">
              <h4 className="text-[9px] sm:text-xs font-mono text-indigo-400 uppercase tracking-widest font-bold">Grading Ledger & Appraisal</h4>
              <p className="text-base sm:text-lg font-serif font-semibold text-slate-100 flex items-center gap-1.5">
                <Award className="w-5 h-5 text-indigo-400" />
                <span>Grading Report</span>
              </p>
            </div>
            <div className="text-right">
              <span className="text-[9px] font-mono text-slate-500 block uppercase font-bold">Report Token</span>
              <span className="text-xs font-mono font-bold text-slate-300 flex items-center justify-end gap-1">
                {certificateId}
                <button onClick={handleRegenId}
                  className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded">
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </span>
            </div>
          </div>

          <div className="bg-[#020308] rounded-2xl p-4 border border-slate-800 space-y-3 shadow-inner">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-baseline gap-1">
              <span className="text-[10px] sm:text-xs text-slate-400 font-mono uppercase font-bold">Estimated Retail Value</span>
              <span className="text-xl sm:text-2xl font-sans font-extrabold text-emerald-400 tracking-tight">
                ${valuation.min.toLocaleString()} - ${valuation.max.toLocaleString()}
              </span>
            </div>
            <div className="space-y-1">
              <div className="relative w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                <div style={{ width: `${Math.min(100, Math.max(10, (valuation.min / 45000) * 100))}%` }}
                  className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500 shadow-[0_0_8px_rgba(52,211,153,0.4)]" />
              </div>
              <div className="flex justify-between text-[9px] text-slate-500 font-mono uppercase font-bold">
                <span>Standard Grade</span>
                <span>Prestige Reserve ($45k+)</span>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-800/60 flex justify-between items-center text-xs text-slate-400 font-mono">
              <span className="font-semibold">Unit Rate:</span>
              <span className="text-slate-300 font-bold">${valuation.basePricePerCarat.toLocaleString()} / carat</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-y-2.5 gap-x-4 text-xs font-mono border-t border-b border-slate-800 py-3.5">
            <div className="flex justify-between border-b border-slate-800/40 pb-1.5">
              <span className="text-slate-500 uppercase font-semibold">Mineral:</span>
              <span className="text-slate-300">Natural Corundum</span>
            </div>
            <div className="flex justify-between border-b border-slate-800/40 pb-1.5">
              <span className="text-slate-500 uppercase font-semibold">Variety:</span>
              <span className="text-blue-400 font-bold">{config.color}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800/40 pb-1.5">
              <span className="text-slate-500 uppercase font-semibold">Carat Mass:</span>
              <span className="text-slate-300 font-bold">{config.carat.toFixed(2)} ct</span>
            </div>
            <div className="flex justify-between border-b border-slate-800/40 pb-1.5">
              <span className="text-slate-500 uppercase font-semibold">Clarity:</span>
              <span className="text-slate-300 font-bold">{config.clarity}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 uppercase font-semibold">Cut Shape:</span>
              <span className="text-slate-300">{config.cut}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 uppercase font-semibold">Provenance:</span>
              <span className="text-rose-400 font-bold">{config.origin.split(" ")[0]}</span>
            </div>
          </div>

          <p className="text-[9.5px] sm:text-[10px] text-slate-500 leading-relaxed italic text-center">
            Appraisal formulated following GIA corundum matrices and current auction indexes.
          </p>

          <button onClick={handlePrintCertificate} disabled={isGeneratingCert}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-700 hover:from-indigo-500 hover:to-blue-600 text-xs font-semibold text-white tracking-widest uppercase transition-all flex items-center justify-center space-x-2 shadow-[0_4px_15px_rgba(79,70,229,0.3)] border border-indigo-500/30 disabled:opacity-50"
            style={{ minHeight: "44px" }}>
            {isGeneratingCert ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-indigo-200" />
                <span className="font-mono">Generating certified crypt-ledger...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Export Official Certificate</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
