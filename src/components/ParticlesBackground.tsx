'use client'

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  alpha: number;
  color: string;
}

const LIGHT_COLORS = ["#06b6d4", "#3b82f6", "#8b5cf6", "#22d3ee", "#6366f1"];
const DARK_COLORS = ["#0891b2", "#2563eb", "#7c3aed", "#14b8a6", "#4f46e5"];

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function createParticle(canvas: HTMLCanvasElement, isDarkMode: boolean): Particle {
  const colors = isDarkMode ? DARK_COLORS : LIGHT_COLORS;
  return {
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    radius: randomBetween(0.6, 2.8),
    vx: randomBetween(-0.3, 0.3),
    vy: randomBetween(-0.3, 0.3),
    alpha: randomBetween(0.2, 0.9),
    color: colors[Math.floor(Math.random() * colors.length)],
  };
}

export default function ParticlesBackground({
  isDarkMode,
}: {
  isDarkMode: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const particles: Particle[] = [];
    for (let i = 0; i < 40; i++) {
      particles.push(createParticle(canvas, isDarkMode));
    }

    let animationId: number;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, [isDarkMode]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 pointer-events-none"
    />
  );
}
