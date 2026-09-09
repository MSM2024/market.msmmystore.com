'use client'

import { useEffect, useRef } from "react"

interface GoldParticle {
  x: number
  y: number
  radius: number
  vx: number
  vy: number
  alpha: number
  baseAlpha: number
  twinkle: number
  phase: number
  color: string
  isGold: boolean
}

// Universo del núcleo: azul profundo (zafiro) + dorado
const PALETTE = ["#9CC5FF", "#7DB4FF", "#3761D0", "#DAA520", "#E8C766", "#F9E7B0"]
const LINE_ALPHA = 0.1

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min
}

function createParticle(w: number, h: number): GoldParticle {
  const color = PALETTE[Math.floor(Math.random() * PALETTE.length)]
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    radius: rand(0.7, 2.6),
    vx: rand(-0.22, 0.22),
    vy: rand(-0.22, 0.22),
    baseAlpha: rand(0.14, 0.6),
    alpha: 0.14,
    twinkle: rand(0.4, 1.2),
    phase: Math.random() * Math.PI * 2,
    color,
    isGold: color.startsWith("#DAA") || color.startsWith("#E8C") || color.startsWith("#F9E"),
  }
}

function drawLinks(
  ctx: CanvasRenderingContext2D,
  particles: GoldParticle[],
  rect: { width: number; height: number },
  alphaScale: number,
  lineMax: number,
) {
  for (let i = 0; i < particles.length; i++) {
    const a = particles[i]
    for (let j = i + 1; j < particles.length; j++) {
      const b = particles[j]
      const dx = a.x - b.x
      const dy = a.y - b.y
      const d2 = dx * dx + dy * dy
      if (d2 > lineMax * lineMax) continue
      const d = Math.sqrt(d2)
      const a2 = (1 - d / lineMax) * LINE_ALPHA * alphaScale
      if (a2 <= 0.004) continue
      ctx.strokeStyle = a.isGold && b.isGold ? "rgba(218, 165, 32, 1)" : "rgba(56, 110, 220, 1)"
      ctx.globalAlpha = a2
      ctx.lineWidth = 0.5
      ctx.beginPath()
      ctx.moveTo(a.x, a.y)
      ctx.lineTo(b.x, b.y)
      ctx.stroke()
    }
  }
}

interface Props {
  className?: string
  density?: number
}

export default function ZafiroParticles({ className = "", density = 48 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false
    const isMobile = window.innerWidth < 640
    const lowEnd =
      typeof navigator !== "undefined" &&
      typeof navigator.hardwareConcurrency === "number" &&
      navigator.hardwareConcurrency > 0 &&
      navigator.hardwareConcurrency <= 4

    const setSize = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.max(1, Math.round(rect.width * dpr))
      canvas.height = Math.max(1, Math.round(rect.height * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, rect.width, rect.height)
      return { width: rect.width, height: rect.height }
    }

    const { width, height } = setSize()
    window.addEventListener("resize", setSize)

    let count = Math.min(density, isMobile ? 22 : density)
    if (lowEnd) count = Math.max(10, Math.floor(count * 0.6))
    const lineMax = lowEnd ? 88 : 112
    const particles: GoldParticle[] = []
    for (let i = 0; i < count; i++) {
      particles.push(createParticle(width, height))
    }

    let raf = 0
    let t = 0
    let running = true

    const onVisibility = () => {
      if (document.hidden) {
        running = false
        cancelAnimationFrame(raf)
      } else if (!reduced && !running) {
        running = true
        draw()
      }
    }
    document.addEventListener("visibilitychange", onVisibility)

    const draw = () => {
      const rect = canvas.getBoundingClientRect()
      ctx.clearRect(0, 0, rect.width, rect.height)

      drawLinks(ctx, particles, rect, 1, lineMax)

      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy
        if (p.x < -8 || p.x > rect.width + 8) p.vx *= -1
        if (p.y < -8 || p.y > rect.height + 8) p.vy *= -1

        p.alpha = reduced ? p.baseAlpha : p.baseAlpha * (0.5 + 0.5 * Math.sin(t * p.twinkle + p.phase))

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fillStyle = p.color
        ctx.globalAlpha = Math.max(0.04, p.alpha)
        ctx.fill()
      }
      ctx.globalAlpha = 1

      t += reduced ? 0 : 0.016
      raf = requestAnimationFrame(draw)
    }

    if (!reduced) {
      draw()
    } else {
      // Static render once for reduced-motion users
      drawLinks(ctx, particles, canvas.getBoundingClientRect(), 0.8, lineMax)
      drawOnce(ctx, particles, canvas.getBoundingClientRect())
    }

    return () => {
      running = false
      cancelAnimationFrame(raf)
      document.removeEventListener("visibilitychange", onVisibility)
      window.removeEventListener("resize", setSize)
    }
  }, [density])

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      aria-hidden="true"
    />
  )
}

function drawOnce(
  ctx: CanvasRenderingContext2D,
  particles: GoldParticle[],
  rect: { width: number; height: number },
) {
  ctx.clearRect(0, 0, rect.width, rect.height)
  for (const p of particles) {
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
    ctx.fillStyle = p.color
    ctx.globalAlpha = Math.max(0.04, p.baseAlpha)
    ctx.fill()
  }
  ctx.globalAlpha = 1
}