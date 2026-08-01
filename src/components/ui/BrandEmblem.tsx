import Image from "next/image"

interface BrandEmblemProps {
  size?: number
  className?: string
  label?: string
  decorative?: boolean
  priority?: boolean
}

export default function BrandEmblem({ size = 32, className = "", label = "ZAFIRO", decorative = false, priority = false }: BrandEmblemProps) {
  return (
    <Image
      src="/zafiro-mark.svg"
      alt={decorative ? "" : label}
      role={decorative ? "presentation" : undefined}
      aria-hidden={decorative || undefined}
      width={size}
      height={size}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      className={className}
      draggable={false}
    />
  )
}

export function BrandLockup({ size = 28, textClassName = "", emblemClassName = "", decorative = false }: { size?: number; textClassName?: string; emblemClassName?: string; decorative?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <BrandEmblem size={size} decorative={decorative} className={emblemClassName} />
      <span className={`font-black tracking-widest ${textClassName}`}>ZAFIRO</span>
    </span>
  )
}
