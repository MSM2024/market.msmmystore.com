const GOLD = "#DAA520"

export default function ElianaDiamond() {
  return (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="zaf101-gem" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#D6EAFF" />
          <stop offset="30%" stopColor="#5A97FF" />
          <stop offset="58%" stopColor="#163E84" />
          <stop offset="82%" stopColor="#A8D4FF" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>
        <linearGradient id="zaf101-crown" x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.6)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.02)" />
        </linearGradient>
        <radialGradient id="zaf101-heart" cx="0.5" cy="0.42" r="0.55">
          <stop offset="0%" stopColor="rgba(226,240,255,0.95)" />
          <stop offset="45%" stopColor="rgba(120,180,255,0.4)" />
          <stop offset="100%" stopColor="rgba(120,180,255,0)" />
        </radialGradient>
      </defs>

      <g className="gem-diamond">
        {/* Silueta exterior (rombo en el contenedor rotado 45°) */}
        <path
          d="M10 10 H90 V90 H10 Z"
          fill="url(#zaf101-gem)"
          stroke={GOLD}
          strokeOpacity="0.6"
          strokeWidth="0.9"
        />

        {/* Mesa superior: luz que cae desde arriba */}
        <path d="M34 34 H66 V66 H34 Z" fill="url(#zaf101-crown)" opacity="0.9" />

        {/* Cuatro facetas radiales alrededor de la mesa */}
        <path d="M50 10 L66 34 L50 50 L34 34 Z" fill="rgba(226,240,255,0.32)" />
        <path d="M90 50 L66 66 L50 50 L66 34 Z" fill="rgba(255,255,255,0.12)" />
        <path d="M50 90 L34 66 L50 50 L66 66 Z" fill="rgba(2,6,23,0.36)" />
        <path d="M10 50 L34 34 L50 50 L34 66 Z" fill="rgba(140,190,255,0.12)" />

        {/* Corazón de luz (enciende el núcleo desde dentro) */}
        <rect x="26" y="28" width="48" height="48" fill="url(#zaf101-heart)" style={{ mixBlendMode: "screen" }} />

        {/* Filigrana dorada (filo lumínico) */}
        <path d="M14 14 H86 V86 H14 Z" fill="none" stroke={GOLD} strokeOpacity="0.3" strokeWidth="0.4" />
      </g>

      {/* Parpadeo fino periódico de una faceta (vida) */}
      <path className="blink" d="M58 34 L66 34 L66 42 Z" fill="rgba(226,240,255,0.95)" />
    </svg>
  )
}