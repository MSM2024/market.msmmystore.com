import { type ReactNode } from "react"

interface Props {
  children: ReactNode
  className?: string
  variant?: "default" | "cyan"
  as?: "span" | "h1" | "h2" | "h3" | "p"
}

export default function GradientText({ children, className = "", variant = "default", as: Tag = "span" }: Props) {
  const cls = variant === "cyan" ? "text-gradient-cyan" : "text-gradient"
  return <Tag className={`${cls} ${className}`}>{children}</Tag>
}
