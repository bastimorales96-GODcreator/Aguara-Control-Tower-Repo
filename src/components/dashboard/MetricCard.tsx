"use client"

import { useState, useRef, useEffect } from "react"
import { TrendingUp, TrendingDown, Eye, EyeOff, MoreHorizontal, ExternalLink, Pin } from "lucide-react"
import { ResponsiveContainer, AreaChart, Area } from "recharts"
import { cn, formatCurrency, formatPercent } from "@/lib/utils"
import type { MetricData } from "@/types"
import Link from "next/link"

interface MetricCardProps {
  metric: MetricData
  onToggleVisibility?: (id: string) => void
}

function formatValue(value: number, format: MetricData["format"]): string {
  switch (format) {
    case "currency": return formatCurrency(value)
    case "percent":  return `${value.toFixed(2)}%`
    case "ratio":    return `${value.toFixed(2)}`
    case "number":   return value.toLocaleString("es-AR")
    default:         return value.toString()
  }
}

const MetricIcon = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
    <rect x="1" y="1" width="6" height="6" rx="1" fill="currentColor" opacity="0.6"/>
    <rect x="9" y="1" width="6" height="6" rx="1" fill="currentColor" opacity="0.6"/>
    <rect x="1" y="9" width="6" height="6" rx="1" fill="currentColor"/>
    <rect x="9" y="9" width="6" height="6" rx="1" fill="currentColor" opacity="0.3"/>
  </svg>
)

export function MetricCard({ metric, onToggleVisibility }: MetricCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener("mousedown", onClickOutside)
    return () => document.removeEventListener("mousedown", onClickOutside)
  }, [])

  const isPositiveChange = metric.changePercent > 0
  const isGoodTrend = metric.invertTrend ? !isPositiveChange : isPositiveChange
  const sparkData = metric.sparklineData.map((v, i) => ({ v, i }))
  const strokeColor = isGoodTrend ? "#4f8ef7" : metric.changePercent < 0 ? "#f87171" : "#4f8ef7"

  if (!metric.visible) {
    return (
      <div
        className="relative bg-[#0f1825]/50 border border-white/[0.04] border-dashed rounded-xl p-4 flex items-center justify-center gap-2 cursor-pointer group hover:border-white/[0.10] transition-colors"
        onClick={() => onToggleVisibility?.(metric.id)}
      >
        <EyeOff size={12} className="text-white/20 group-hover:text-white/40 transition-colors" />
        <span className="text-[11px] text-white/20 group-hover:text-white/40 transition-colors">{metric.label}</span>
      </div>
    )
  }

  return (
    <div className="relative bg-[#0f1825] border border-white/[0.06] rounded-xl p-4 flex flex-col gap-2 group hover:border-white/[0.10] transition-colors overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-white/40">
          <MetricIcon />
          <span className="text-[11px] font-medium">{metric.label}</span>
        </div>
        {/* Botones con touch target p-2 (≥44px al combinarse con el icon) */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onToggleVisibility?.(metric.id)}
            aria-label="Ocultar métrica"
            className="p-2 rounded hover:bg-white/[0.08] text-white/30 hover:text-white/60 transition-colors touch-manipulation"
          >
            <Eye size={11} />
          </button>
          <div ref={menuRef} className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Más opciones"
              className="p-2 rounded hover:bg-white/[0.08] text-white/30 hover:text-white/60 transition-colors touch-manipulation"
            >
              <MoreHorizontal size={11} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-[#0f1825] border border-white/[0.10] rounded-xl shadow-2xl shadow-black/40 overflow-hidden z-50">
                <button
                  onClick={() => { onToggleVisibility?.(metric.id); setMenuOpen(false) }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-white/60 hover:bg-white/[0.04] hover:text-white transition-colors"
                >
                  <EyeOff size={11} /> Ocultar métrica
                </button>
                <button className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-white/60 hover:bg-white/[0.04] hover:text-white transition-colors">
                  <Pin size={11} /> Fijar arriba
                </button>
                {metric.detailHref && (
                  <Link
                    href={metric.detailHref}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2.5 text-xs text-white/60 hover:bg-white/[0.04] hover:text-white transition-colors border-t border-white/[0.06]"
                  >
                    <ExternalLink size={11} /> Ver detalle
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Value + Change */}
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-semibold text-white tracking-tight tabular-nums">
          {formatValue(metric.value, metric.format)}
        </span>
        {metric.changePercent !== 0 && (
          <div className={cn(
            "flex items-center gap-0.5 text-[11px] font-medium",
            isGoodTrend ? "text-emerald-400" : "text-red-400"
          )}>
            {isPositiveChange ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            <span>{formatPercent(metric.changePercent)}</span>
          </div>
        )}
      </div>

      {/* Ver detalle inline — only on cost cards */}
      {metric.detailHref && (
        <Link
          href={metric.detailHref}
          className="absolute top-3 right-3 opacity-0 group-hover:opacity-0 text-[10px] font-semibold px-2 py-1 rounded-md bg-[#4f8ef7]/15 text-[#4f8ef7] border border-[#4f8ef7]/20 hover:bg-[#4f8ef7]/25 transition-all"
          style={{ opacity: undefined }}
        >
          Ver detalle
        </Link>
      )}

      {/* Sparkline */}
      <div className="h-12 -mx-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={sparkData} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
            <defs>
              <linearGradient id={`grad-${metric.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={strokeColor} stopOpacity={0.25} />
                <stop offset="95%" stopColor={strokeColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="v"
              stroke={strokeColor}
              strokeWidth={1.5}
              fill={`url(#grad-${metric.id})`}
              dot={false}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
