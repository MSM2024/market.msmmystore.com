// ZAFIRO Visual Universe — fondo premium reutilizable
// Azul zafiro profundo · luz celestial · destellos dorados · diamante central
// SVG/CSS nativo (0 imágenes externas): responsive sin deformación, sin repeticiones.

export type ZafiroVariant =
  | "default"
  | "home"
  | "auth"
  | "control"
  | "eliana"
  | "knowledge"
  | "legado"
  | "marketplace"
  | "economia"
  | "rutas"

interface Sparkle {
  x: number
  y: number
  r: number
  d: number
  o: number
}

const SPARKLES: Sparkle[] = [
  { x: 6, y: 14, r: 1.4, d: 0.2, o: 0.9 },
  { x: 14, y: 36, r: 1.0, d: 1.1, o: 0.7 },
  { x: 9, y: 64, r: 1.6, d: 2.3, o: 0.8 },
  { x: 21, y: 82, r: 1.1, d: 0.7, o: 0.6 },
  { x: 34, y: 12, r: 1.2, d: 3.0, o: 0.8 },
  { x: 42, y: 44, r: 0.9, d: 1.8, o: 0.6 },
  { x: 58, y: 8, r: 1.5, d: 0.5, o: 0.9 },
  { x: 66, y: 30, r: 1.0, d: 2.6, o: 0.7 },
  { x: 74, y: 56, r: 1.3, d: 1.4, o: 0.8 },
  { x: 82, y: 16, r: 1.1, d: 3.4, o: 0.7 },
  { x: 90, y: 42, r: 1.5, d: 0.9, o: 0.9 },
  { x: 95, y: 68, r: 1.0, d: 2.0, o: 0.6 },
  { x: 88, y: 86, r: 1.4, d: 0.3, o: 0.8 },
  { x: 31, y: 26, r: 1.0, d: 2.9, o: 0.7 },
  { x: 47, y: 62, r: 1.1, d: 1.6, o: 0.8 },
  { x: 12, y: 50, r: 0.9, d: 3.6, o: 0.6 },
  { x: 70, y: 74, r: 1.2, d: 0.8, o: 0.7 },
  { x: 53, y: 90, r: 1.5, d: 2.2, o: 0.8 },
  { x: 24, y: 6, r: 1.1, d: 4.1, o: 0.7 },
  { x: 97, y: 22, r: 1.0, d: 3.1, o: 0.6 },
]

const DIAMOND_OUTLINE = "100,18 150,44 182,100 150,156 100,182 50,156 18,100 50,44"
const DIAMOND_TABLE = "100,52 138,74 154,100 138,126 100,148 62,126 46,100 62,74"

// Corona: 8 facetas triangulares (tabla → borde del diamante)
const DIAMOND_FACETS: string[] = [
  `100,18 ${DIAMOND_TABLE.split(" ")[0]} ${DIAMOND_TABLE.split(" ")[1]}`,
  `150,44 ${DIAMOND_TABLE.split(" ")[1]} ${DIAMOND_TABLE.split(" ")[2]}`,
  `182,100 ${DIAMOND_TABLE.split(" ")[2]} ${DIAMOND_TABLE.split(" ")[3]}`,
  `150,156 ${DIAMOND_TABLE.split(" ")[3]} ${DIAMOND_TABLE.split(" ")[4]}`,
  `100,182 ${DIAMOND_TABLE.split(" ")[4]} ${DIAMOND_TABLE.split(" ")[5]}`,
  `50,156 ${DIAMOND_TABLE.split(" ")[5]} ${DIAMOND_TABLE.split(" ")[6]}`,
  `18,100 ${DIAMOND_TABLE.split(" ")[6]} ${DIAMOND_TABLE.split(" ")[7]}`,
  `50,44 ${DIAMOND_TABLE.split(" ")[7]} ${DIAMOND_TABLE.split(" ")[0]}`,
]

function DiamondSvg() {
  return (
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <radialGradient id="zafiro-table" cx="38%" cy="32%" r="80%">
          <stop offset="0%" stopColor="#f7edc3" />
          <stop offset="35%" stopColor="#8fc8ff" />
          <stop offset="70%" stopColor="#2e78ff" />
          <stop offset="100%" stopColor="#0e2a5c" />
        </radialGradient>
        <linearGradient id="zafiro-facet-a" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3f8cff" />
          <stop offset="100%" stopColor="#10224a" />
        </linearGradient>
        <linearGradient id="zafiro-facet-b" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2e78ff" />
          <stop offset="100%" stopColor="#0a1630" />
        </linearGradient>
        <linearGradient id="zafiro-rim" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f9e7b0" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#d4af37" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#8a6d1f" stopOpacity="0.4" />
        </linearGradient>
      </defs>

      {/* Facetas de la corona (alternadas para efecto espejo) */}
      {DIAMOND_FACETS.map((points, i) => (
        <polygon
          key={`f${i}`}
          points={points}
          fill={i % 2 === 0 ? "url(#zafiro-facet-a)" : "url(#zafiro-facet-b)"}
          opacity={0.85}
          stroke="url(#zafiro-rim)"
          strokeWidth="0.5"
        />
      ))}

      {/* Tabla central */}
      <polygon
        points={DIAMOND_TABLE}
        fill="url(#zafiro-table)"
        stroke="url(#zafiro-rim)"
        strokeWidth="1"
      />

      {/* Borde exterior dorado sutil */}
      <polygon
        points={DIAMOND_OUTLINE}
        fill="none"
        stroke="url(#zafiro-rim)"
        strokeWidth="1.2"
      />

      {/* Destello dorado central */}
      <path
        d="M100 78 L103 94 L118 98 L103 102 L100 118 L97 102 L82 98 L97 94 Z"
        fill="#f9e7b0"
        opacity="0.85"
      />
    </svg>
  )
}

function EnergyLines() {
  return (
    <svg
      className="zafiro-bg__lines"
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="zafiro-line" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2e78ff" stopOpacity="0" />
          <stop offset="50%" stopColor="#d4af37" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#2e78ff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g opacity="0.10" fill="none" stroke="url(#zafiro-line)" strokeWidth="0.6">
        <path d="M120 220 L380 200 L620 240 L920 190 L1240 230" />
        <path d="M220 460 L520 430 L820 470 L1140 440" />
        <path d="M160 660 L460 630 L760 670 L1060 650" />
        <path d="M120 220 L220 460 L160 660" />
        <path d="M620 240 L520 430 L460 630" />
        <path d="M920 190 L820 470 L760 670" />
      </g>
      <g opacity="0.35">
        <circle cx="120" cy="220" r="2.4" fill="#d4af37" />
        <circle cx="380" cy="200" r="1.8" fill="#7eb6ff" />
        <circle cx="620" cy="240" r="2.6" fill="#f1d98c" />
        <circle cx="920" cy="190" r="1.8" fill="#d4af37" />
        <circle cx="1240" cy="230" r="2.4" fill="#7eb6ff" />
        <circle cx="520" cy="430" r="2.2" fill="#f1d98c" />
        <circle cx="820" cy="470" r="1.8" fill="#d4af37" />
        <circle cx="460" cy="630" r="2.2" fill="#7eb6ff" />
        <circle cx="760" cy="670" r="2.0" fill="#f1d98c" />
      </g>
    </svg>
  )
}

export default function ZafiroBackground({
  variant = "default",
  lite = false,
}: {
  variant?: ZafiroVariant
  lite?: boolean
}) {
  return (
    <div
      className={`zafiro-bg zafiro-bg--${variant}${lite ? " zafiro-bg--lite" : ""}`}
      aria-hidden="true"
    >
      <div className="zafiro-bg__base" />
      <div className="zafiro-bg__celestial" />
      <EnergyLines />
      <div className="zafiro-bg__diamond">
        <DiamondSvg />
      </div>
      <div className="zafiro-bg__sparkles">
        {SPARKLES.map((s, i) => (
          <span
            key={i}
            className="zafiro-bg__sparkle"
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: s.r * 2,
              height: s.r * 2,
              opacity: s.o,
              animationDelay: `${s.d}s`,
              animationDuration: `${3 + (i % 4)}s`,
            }}
          />
        ))}
      </div>
      <div className="zafiro-bg__scrim" />
    </div>
  )
}
