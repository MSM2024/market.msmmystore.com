import { type LucideIcon } from "lucide-react"
import GlassCard from "./GlassCard"

interface Props {
  icon: LucideIcon
  label: string
  value: string
  sublabel?: string
  color?: string
  glow?: "cyan" | "violet" | "none"
}

export default function StatCard({ icon: Icon, label, value, sublabel, color = "text-[#00D9FF]", glow = "none" }: Props) {
  return (
    <GlassCard glow={glow} className="p-3 text-center">
      <Icon className={`w-4 h-4 ${color} mx-auto mb-1.5`} />
      <p className="text-sm font-black text-white">{value}</p>
      <p className="text-[8px] text-slate-400">{label}</p>
      {sublabel && <p className="text-[6px] text-slate-600 mt-0.5">{sublabel}</p>}
    </GlassCard>
  )
}
