'use client'

import { motion } from "motion/react"

type Variant = "diamond" | "halo" | "animated" | "avatar" | "loader"
type Size = 16 | 24 | 32 | 48 | 64 | 128 | 256 | 512

const SIZE_MAP: Record<Size, number> = {
  16: 16, 24: 24, 32: 32, 48: 48, 64: 64, 128: 128, 256: 256, 512: 512,
}

interface Props {
  size?: Size | number
  variant?: Variant
  className?: string
}

const SVG_VIEWBOX = "0 0 100 140"

const defs = (
  <defs>
    <linearGradient id="d-top" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#00D9FF" />
      <stop offset="50%" stopColor="#2563eb" />
      <stop offset="100%" stopColor="#7c3aed" />
    </linearGradient>
    <linearGradient id="d-crown-l" x1="0" y1="1" x2="1" y2="0">
      <stop offset="0%" stopColor="#1a4b8c" />
      <stop offset="60%" stopColor="#00D9FF" />
      <stop offset="100%" stopColor="#38bdf8" />
    </linearGradient>
    <linearGradient id="d-crown-r" x1="1" y1="1" x2="0" y2="0">
      <stop offset="0%" stopColor="#1e3a5f" />
      <stop offset="50%" stopColor="#2563eb" />
      <stop offset="100%" stopColor="#7c3aed" />
    </linearGradient>
    <linearGradient id="d-crown-m" x1="0.5" y1="1" x2="0.5" y2="0">
      <stop offset="0%" stopColor="#0f1f3d" />
      <stop offset="100%" stopColor="#00D9FF" />
    </linearGradient>
    <linearGradient id="d-girdle" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#7c3aed" />
      <stop offset="50%" stopColor="#2563eb" />
      <stop offset="100%" stopColor="#00D9FF" />
    </linearGradient>
    <linearGradient id="d-pav-l" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#1a4b8c" />
      <stop offset="50%" stopColor="#6366f1" />
      <stop offset="100%" stopColor="#d946ef" />
    </linearGradient>
    <linearGradient id="d-pav-r" x1="1" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#0f1f3d" />
      <stop offset="50%" stopColor="#7c3aed" />
      <stop offset="100%" stopColor="#ec4899" />
    </linearGradient>
    <linearGradient id="d-pav-m" x1="0.5" y1="0" x2="0.5" y2="1">
      <stop offset="0%" stopColor="#2563eb" />
      <stop offset="60%" stopColor="#1a4b8c" />
      <stop offset="100%" stopColor="#0a1628" />
    </linearGradient>
    <linearGradient id="d-bottom" x1="0.5" y1="0" x2="0.5" y2="1">
      <stop offset="0%" stopColor="#6366f1" />
      <stop offset="100%" stopColor="#d946ef" />
    </linearGradient>
    <radialGradient id="d-glow" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stopColor="#00D9FF" stopOpacity="0.3" />
      <stop offset="50%" stopColor="#7c3aed" stopOpacity="0.1" />
      <stop offset="100%" stopColor="#050816" stopOpacity="0" />
    </radialGradient>
    <radialGradient id="d-halo" cx="50%" cy="45%" r="70%">
      <stop offset="0%" stopColor="#00D9FF" stopOpacity="0.25" />
      <stop offset="40%" stopColor="#7c3aed" stopOpacity="0.12" />
      <stop offset="70%" stopColor="#2563eb" stopOpacity="0.05" />
      <stop offset="100%" stopColor="transparent" stopOpacity="0" />
    </radialGradient>
    <filter id="d-shine">
      <feGaussianBlur in="SourceGraphic" stdDeviation="0.5" />
    </filter>
  </defs>
)

const diamondPaths = (
  <>
    {/* Crown - left top triangular facet */}
    <polygon points="50,5 30,30 50,40" fill="url(#d-crown-l)" opacity="0.9" />
    {/* Crown - right top triangular facet */}
    <polygon points="50,5 70,30 50,40" fill="url(#d-crown-r)" opacity="0.85" />
    {/* Crown - center trapezoid */}
    <polygon points="30,30 50,40 50,40 35,45" fill="url(#d-crown-m)" opacity="0.7" />
    {/* Crown - left trapezoid */}
    <polygon points="12,40 30,30 35,45 15,48" fill="url(#d-crown-l)" opacity="0.75" />
    {/* Crown - right trapezoid */}
    <polygon points="88,40 70,30 65,45 85,48" fill="url(#d-crown-r)" opacity="0.7" />
    {/* Crown - center top highlight */}
    <polygon points="50,5 40,20 50,30 60,20" fill="url(#d-crown-m)" opacity="0.6" />
    {/* Girdle band */}
    <polygon points="15,48 35,45 50,48 65,45 85,48 88,44 88,52 85,55 65,53 50,55 35,53 15,55 12,52 12,44" fill="url(#d-girdle)" opacity="0.8" />
    {/* Pavilion - left facet */}
    <polygon points="15,52 35,53 50,115 50,130" fill="url(#d-pav-l)" opacity="0.85" />
    {/* Pavilion - right facet */}
    <polygon points="85,52 65,53 50,115 50,130" fill="url(#d-pav-r)" opacity="0.8" />
    {/* Pavilion - center left */}
    <polygon points="35,53 50,55 50,115 50,115" fill="url(#d-pav-m)" opacity="0.75" />
    {/* Pavilion - center right */}
    <polygon points="65,53 50,55 50,115 50,115" fill="url(#d-pav-m)" opacity="0.7" />
    {/* Pavilion - lower left */}
    <polygon points="15,55 35,53 50,130 50,130" fill="url(#d-pav-l)" opacity="0.6" />
    {/* Pavilion - lower right */}
    <polygon points="85,55 65,53 50,130 50,130" fill="url(#d-pav-r)" opacity="0.55" />
    {/* Bottom tip */}
    <polygon points="45,125 50,135 55,125 50,130" fill="url(#d-bottom)" opacity="0.9" />
    {/* Shine - top */}
    <polygon points="50,5 44,15 50,22 56,15" fill="white" opacity="0.5" filter="url(#d-shine)" />
    {/* Shine - left */}
    <polygon points="15,48 18,44 22,46 20,52" fill="white" opacity="0.25" filter="url(#d-shine)" />
    {/* Shine - right */}
    <polygon points="85,48 82,44 78,46 80,52" fill="white" opacity="0.2" filter="url(#d-shine)" />
    {/* Shine - bottom */}
    <polygon points="48,128 50,133 52,128 50,130" fill="white" opacity="0.35" filter="url(#d-shine)" />
    {/* Inner glow overlay */}
    <ellipse cx="50" cy="65" rx="20" ry="25" fill="url(#d-glow)" opacity="0.4" />
  </>
)

export default function ElianaDiamond({ size = 48, variant = "diamond", className = "" }: Props) {
  const px = typeof size === "number" && size in SIZE_MAP ? SIZE_MAP[size as Size] : typeof size === "number" ? size : 48

  if (variant === "loader") {
    return (
      <motion.div
        className={`relative flex items-center justify-center ${className}`}
        style={{ width: px, height: px }}
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      >
        <svg viewBox={SVG_VIEWBOX} width={px} height={px} xmlns="http://www.w3.org/2000/svg">
          {defs}
          <circle cx="50" cy="70" r="60" fill="url(#d-halo)" opacity="0.3" />
          {diamondPaths}
        </svg>
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-[#00D9FF]/30"
          animate={{ rotate: -360, opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        />
      </motion.div>
    )
  }

  if (variant === "animated") {
    return (
      <motion.div
        className={`relative ${className}`}
        style={{ width: px, height: px * 1.4 }}
        animate={{ scale: [1, 1.03, 1], opacity: [0.9, 1, 0.9] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg viewBox={SVG_VIEWBOX} width={px} height={px * 1.4} xmlns="http://www.w3.org/2000/svg">
          {defs}
          <motion.circle
            cx="50" cy="70" r="55"
            fill="url(#d-halo)"
            animate={{ opacity: [0.2, 0.4, 0.2], scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          {diamondPaths}
        </svg>
      </motion.div>
    )
  }

  if (variant === "avatar") {
    return (
      <div className={`relative rounded-full bg-[#050816] p-1 ${className}`} style={{ width: px + 4, height: px + 4 }}>
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#00D9FF]/30 via-[#7c3aed]/20 to-[#050816] animate-pulse-glow" />
        <svg viewBox={SVG_VIEWBOX} width={px} height={px * 1.4} xmlns="http://www.w3.org/2000/svg" className="relative z-10">
          {defs}
          {diamondPaths}
        </svg>
      </div>
    )
  }

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      {variant === "halo" && (
        <svg viewBox={SVG_VIEWBOX} width={px * 2.2} height={px * 2.2} className="absolute" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="70" r="55" fill="url(#d-halo)" />
          <ellipse cx="50" cy="65" rx="30" ry="35" fill="url(#d-glow)" opacity="0.3" />
        </svg>
      )}
      <svg viewBox={SVG_VIEWBOX} width={px} height={px * 1.4} xmlns="http://www.w3.org/2000/svg" className="relative z-10">
        {defs}
        {diamondPaths}
      </svg>
    </div>
  )
}
