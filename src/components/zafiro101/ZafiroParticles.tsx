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
}

const PALETTE = ["#DAA520", "#E8C766", "#B8860B", "#F9E7B0"]

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min
}

function createParticle(w: number, h: number): GoldParticle {
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

    const count = Math.min(density, isMobile ? 22 : density)
    const particles: GoldParticle[] = []
    for (let i = 0; i < count; i++) {
      particles.push(createParticle(width, height))
    }

    let raf = 0
    let t = 0

    const draw = () => {
      const rect = canvas.getBoundingClientRect()
      ctx.clearRect(0, 0, rect.width, rect.height)

      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy
        if (p.x < -8 || p.x > rect.width + 8) p.vx *= -1
        if (p.y < -8 || p.y > rect.height + 8) p.vy *= -1

        p.alpha = reduced ? p.baseAlpha : p.baseAlpha * (0.5 + 0.5 * Math.sin(t * p.twinkle + p.phase))

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fillStyle = PALETTE[Math.floor(Math.random() * PALETTE.length)]
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
      drawOnce(ctx, particles, canvas.getBoundingClientRect())
    }

    return () => {
      cancelAnimationFrame(raf)
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
    ctx.fillStyle = PALETTE[Math.floor(Math.random() * PALETTE.length)]
    ctx.globalAlpha = Math.max(0.04, p.baseAlpha)
    ctx.fill()
  }
  ctx.globalAlpha = 1
}