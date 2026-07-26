import { type ReactNode } from "react"

interface Props {
  children: ReactNode
  className?: string
  hover?: boolean
  glow?: "cyan" | "violet" | "none"
  as?: "div" | "button" | "a"
  onClick?: () => void
  href?: string
}

export default function GlassCard({ children, className = "", hover = true, glow = "none", as: Tag = "div", ...props }: Props) {
  const glowClass = glow === "cyan" ? "glow-cyan" : glow === "violet" ? "glow-violet" : ""
  return (
    <Tag
      className={`glass rounded-2xl ${hover ? "glass-hover card-3d" : ""} ${glowClass} ${className}`}
      {...props}
    >
      {children}
    </Tag>
  )
}
