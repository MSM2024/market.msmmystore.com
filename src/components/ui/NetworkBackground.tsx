export default function NetworkBackground({ className = "" }: { className?: string }) {
  return (
    <div className={`fixed inset-0 pointer-events-none overflow-hidden z-0 ${className}`}>
      <svg className="w-full h-full opacity-[0.04]" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="nb-cyan" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#00D9FF"/><stop offset="100%" stopColor="#2563eb"/></linearGradient>
          <linearGradient id="nb-violet" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#7c3aed"/><stop offset="100%" stopColor="#d946ef"/></linearGradient>
        </defs>
        {/* Horizontal connection lines */}
        <line x1="100" y1="200" x2="350" y2="200" stroke="url(#nb-cyan)" strokeWidth="0.5" />
        <line x1="350" y1="200" x2="600" y2="180" stroke="url(#nb-cyan)" strokeWidth="0.5" />
        <line x1="600" y1="180" x2="900" y2="220" stroke="url(#nb-violet)" strokeWidth="0.5" />
        <line x1="900" y1="220" x2="1200" y2="190" stroke="url(#nb-cyan)" strokeWidth="0.5" />
        <line x1="200" y1="450" x2="500" y2="420" stroke="url(#nb-violet)" strokeWidth="0.5" />
        <line x1="500" y1="420" x2="800" y2="460" stroke="url(#nb-cyan)" strokeWidth="0.5" />
        <line x1="800" y1="460" x2="1100" y2="430" stroke="url(#nb-cyan)" strokeWidth="0.5" />
        <line x1="150" y1="650" x2="450" y2="620" stroke="url(#nb-cyan)" strokeWidth="0.5" />
        <line x1="450" y1="620" x2="750" y2="660" stroke="url(#nb-violet)" strokeWidth="0.5" />
        <line x1="750" y1="660" x2="1050" y2="640" stroke="url(#nb-cyan)" strokeWidth="0.5" />
        {/* Cross connections */}
        <line x1="100" y1="200" x2="200" y2="450" stroke="url(#nb-violet)" strokeWidth="0.3" />
        <line x1="600" y1="180" x2="500" y2="420" stroke="url(#nb-cyan)" strokeWidth="0.3" />
        <line x1="900" y1="220" x2="800" y2="460" stroke="url(#nb-violet)" strokeWidth="0.3" />
        <line x1="1200" y1="190" x2="1100" y2="430" stroke="url(#nb-cyan)" strokeWidth="0.3" />
        <line x1="350" y1="200" x2="500" y2="420" stroke="url(#nb-cyan)" strokeWidth="0.3" />
        <line x1="800" y1="460" x2="750" y2="660" stroke="url(#nb-violet)" strokeWidth="0.3" />
        {/* Nodes */}
        <circle cx="100" cy="200" r="3" fill="#00D9FF" opacity="0.6" />
        <circle cx="350" cy="200" r="2" fill="#00D9FF" opacity="0.4" />
        <circle cx="600" cy="180" r="3" fill="#00D9FF" opacity="0.5" />
        <circle cx="900" cy="220" r="2" fill="#7c3aed" opacity="0.4" />
        <circle cx="1200" cy="190" r="3" fill="#00D9FF" opacity="0.5" />
        <circle cx="200" cy="450" r="2" fill="#7c3aed" opacity="0.4" />
        <circle cx="500" cy="420" r="3" fill="#00D9FF" opacity="0.5" />
        <circle cx="800" cy="460" r="2" fill="#00D9FF" opacity="0.4" />
        <circle cx="1100" cy="430" r="3" fill="#00D9FF" opacity="0.5" />
        <circle cx="150" cy="650" r="2" fill="#00D9FF" opacity="0.3" />
        <circle cx="450" cy="620" r="2" fill="#7c3aed" opacity="0.4" />
        <circle cx="750" cy="660" r="3" fill="#00D9FF" opacity="0.5" />
        <circle cx="1050" cy="640" r="2" fill="#00D9FF" opacity="0.3" />
        {/* Center cluster */}
        <circle cx="650" cy="400" r="4" fill="#00D9FF" opacity="0.7" />
        <line x1="650" y1="400" x2="500" y2="420" stroke="url(#nb-cyan)" strokeWidth="0.4" />
        <line x1="650" y1="400" x2="800" y2="460" stroke="url(#nb-violet)" strokeWidth="0.4" />
        <line x1="650" y1="400" x2="600" y2="180" stroke="url(#nb-cyan)" strokeWidth="0.4" />
        <line x1="650" y1="400" x2="450" y2="620" stroke="url(#nb-cyan)" strokeWidth="0.3" />
      </svg>
    </div>
  )
}
