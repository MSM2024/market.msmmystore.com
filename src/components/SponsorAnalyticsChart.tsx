'use client'

import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { chartData, daysOfWeek } from "@/lib/zafiro-data"

type MetricFilter = "impressions" | "clicks" | "conversions"

const summaryMetrics = [
  { label: "Imp. Totales", value: "110.2K" },
  { label: "Clics", value: "10.1K" },
  { label: "Conversiones", value: "3.28K" },
  { label: "CTR Promedio", value: "9.16%" },
]

const filterOptions: { label: string; key: MetricFilter }[] = [
  { label: "Imp.", key: "impressions" },
  { label: "Clics", key: "clicks" },
  { label: "Conv.", key: "conversions" },
]

const CHART_WIDTH = 310
const CHART_HEIGHT = 110
const PADDING_LEFT = 30
const PADDING_RIGHT = 10
const PADDING_TOP = 5
const PADDING_BOTTOM = 20
const PLOT_WIDTH = CHART_WIDTH - PADDING_LEFT - PADDING_RIGHT
const PLOT_HEIGHT = CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM
const GRID_FRACTIONS = [0, 0.25, 0.5, 0.75, 1]

const SponsorAnalyticsChart = () => {
  const [analyticsMetricFilter, setAnalyticsMetricFilter] = useState<MetricFilter>("impressions")
  const [hoveredChartIndex, setHoveredChartIndex] = useState<number | null>(null)

  const activeValues = chartData[analyticsMetricFilter]
  const maxVal = Math.max(...activeValues)
  const range = maxVal || 1

  const x = (i: number) => PADDING_LEFT + (i / (activeValues.length - 1)) * PLOT_WIDTH
  const y = (v: number) => PADDING_TOP + PLOT_HEIGHT - (v / range) * PLOT_HEIGHT

  const linePoints = activeValues.map((v, i) => `${x(i)},${y(v)}`).join(" ")
  const bottomY = PADDING_TOP + PLOT_HEIGHT
  const areaPath = `M${x(0)},${bottomY} L${linePoints} L${x(activeValues.length - 1)},${bottomY} Z`

  return (
    <div>
      <div className="grid grid-cols-4 gap-2 mb-3">
        {summaryMetrics.map((m) => (
          <div key={m.label} className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-2.5 text-center">
            <p className="text-[10px] text-slate-500 mb-0.5">{m.label}</p>
            <p className="text-sm font-bold text-white">{m.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-3">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold text-white">Rendimiento Semanal</h4>
          <div className="flex gap-1">
            {filterOptions.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setAnalyticsMetricFilter(opt.key)}
                className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                  analyticsMetricFilter === opt.key
                    ? "bg-[#00D9FF]/20 text-[#00D9FF]"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="relative">
          <svg
            width={CHART_WIDTH}
            height={CHART_HEIGHT}
            viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
            className="w-full h-auto"
          >
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00D9FF" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#00D9FF" stopOpacity={0} />
              </linearGradient>
            </defs>

            {GRID_FRACTIONS.map((f) => {
              const gy = PADDING_TOP + PLOT_HEIGHT * (1 - f)
              return (
                <g key={f}>
                  <line
                    x1={PADDING_LEFT}
                    y1={gy}
                    x2={CHART_WIDTH - PADDING_RIGHT}
                    y2={gy}
                    stroke="#1e293b"
                    strokeWidth="0.5"
                  />
                  <text
                    x={PADDING_LEFT - 4}
                    y={gy + 3}
                    textAnchor="end"
                    className="fill-slate-500 text-[7px]"
                  >
                    {Math.round(maxVal * f)}
                  </text>
                </g>
              )
            })}

            <path d={areaPath} fill="url(#areaGradient)" />

            <polyline
              points={linePoints}
              fill="none"
              stroke="#00D9FF"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {activeValues.map((v, i) => {
              const cx = x(i)
              const cy = y(v)
              const isHovered = hoveredChartIndex === i
              return (
                <circle
                  key={i}
                  cx={cx}
                  cy={cy}
                  r={isHovered ? 5 : 3}
                  fill={isHovered ? "#00D9FF" : "#0f172a"}
                  stroke="#00D9FF"
                  strokeWidth={isHovered ? 2 : 1.5}
                  className="cursor-pointer"
                  style={{ transition: "r 0.15s, fill 0.15s, stroke-width 0.15s" }}
                  onMouseEnter={() => setHoveredChartIndex(i)}
                  onMouseLeave={() => setHoveredChartIndex(null)}
                />
              )
            })}

            {daysOfWeek.map((day, i) => (
              <text
                key={day}
                x={x(i)}
                y={CHART_HEIGHT - 2}
                textAnchor="middle"
                className="fill-slate-500 text-[7px]"
              >
                {day}
              </text>
            ))}
          </svg>

          <AnimatePresence>
            {hoveredChartIndex !== null && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                transition={{ duration: 0.15 }}
                className="absolute -top-6 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-[10px] text-white whitespace-nowrap pointer-events-none z-10"
                style={{
                  left: `${(x(hoveredChartIndex) / CHART_WIDTH) * 100}%`,
                  transform: "translateX(-50%)",
                }}
              >
                {daysOfWeek[hoveredChartIndex]}: {activeValues[hoveredChartIndex].toLocaleString()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-3 rounded-2xl border border-slate-800/80 bg-slate-950/60 p-3">
        <p className="text-[10px] text-slate-400 leading-relaxed">
          <span className="text-[#00D9FF] font-medium">Algoritmo Asíncrono Activo:</span>{" "}
          ELIANA optimiza la entrega de contenido patrocinado en función de la resonancia intelectual en
          tiempo real, maximizando el valor sin interrumpir el flujo de sintonización.
        </p>
      </div>
    </div>
  )
}

export default SponsorAnalyticsChart
