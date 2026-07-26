'use client'

import { Home, Globe, Users, User, Plus, Gem, Award } from 'lucide-react'

interface BottomNavProps {
  activeNav: string
  onNavChange: (nav: string) => void
  onAddQuestion: () => void
}

const navItems = [
  { key: 'Inicio', label: 'Inicio', icon: Home },
  { key: 'Explorar', label: 'Explorar', icon: Globe },
  { key: 'Gemología', label: 'Gemología', icon: Gem },
  { key: 'Comunidades', label: 'Círculos', icon: Users },
  { key: 'Sponsors', label: 'Sponsors', icon: Award },
  { key: 'Perfil', label: 'Perfil', icon: User },
]

export default function BottomNav({ activeNav, onNavChange, onAddQuestion }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 border-t border-slate-800/60 backdrop-blur-xl bg-[#050816]/85 flex items-center justify-around px-1 z-50 lg:hidden" style={{paddingBottom:"env(safe-area-inset-bottom,0px)"}}>
      {navItems.map((item) => {
        const isActive = activeNav === item.key
        const Icon = item.icon
        return (
          <button
            key={item.key}
            onClick={() => onNavChange(item.key)}
            className="relative flex flex-col items-center justify-center w-14 h-full gap-0.5 transition-all duration-200"
          >
            <Icon
              size={18}
              className={`transition-all duration-200 ${
                isActive
                  ? 'text-[#00D9FF] drop-shadow-[0_0_6px_rgba(0,217,255,0.5)] scale-110'
                  : 'text-slate-400'
              }`}
            />
            <span
              className={`text-[8px] font-mono font-bold leading-tight transition-all duration-200 ${
                isActive
                  ? 'text-[#00D9FF]'
                  : 'text-slate-500'
              }`}
            >
              {item.label}
            </span>
          </button>
        )
      })}

      <button
        onClick={onAddQuestion}
        className="relative flex items-center justify-center w-12 h-full"
      >
        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#00D9FF] to-[#2563EB] flex items-center justify-center shadow-[0_0_16px_rgba(0,217,255,0.35)] hover:shadow-[0_0_24px_rgba(0,217,255,0.5)] transition-all duration-200 active:scale-95">
          <Plus size={22} className="text-[#050816]" strokeWidth={2.5} />
        </div>
      </button>
    </nav>
  )
}
