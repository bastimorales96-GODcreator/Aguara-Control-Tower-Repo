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
  const strokeColor = isGoodTrend ? "#7c3aed" : metric.changePercent < 0 ? "#f87171" : "#7c3aed"

  if (!metric.visible) {
    return (
      <div
        className="relative bg-[#faf8ff] border border-black/[0.06] border-dashed rounded-xl p-4 flex items-center justify-center gap-2 cursor-pointer group hover:border-black/[0.10] transition-colors"
        onClick={() => onToggleVisibility?.(metric.id)}
      >
        <EyeOff size={12} className="text-[#9ca3af] group-hover:text-[#6b7280] transition-colors" />
        <span className="text-[11px] text-[#9ca3af] group-hover:text-[#6b7280] transition-colors">{metric.label}</span>
      </div>
    )
  }

  return (
    <div className="relative bg-white border border-black/[0.08] rounded-xl p-4 flex flex-col gap-2 group hover:border-black/[0.10] transition-colors overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[#6b7280]">
          <MetricIcon />
          <span className="text-[11px] font-medium">{metric.label}</span>
        </div>
        {/* Botones con touch target p-2 (≥44px al combinarse con el icon) */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onToggleVisibility?.(metric.id)}
            aria-label="Ocultar métrica"
            className="p-2 rounded hover:bg-black/[0.06] text-[#9ca3af] hover:text-[#374151] transition-colors touch-manipulation"
          >
            <Eye size={11} />
          </button>
          <div ref={menuRef} className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Más opciones"
              className="p-2 rounded hover:bg-black/[0.06] text-[#9ca3af] hover:text-[#374151] transition-colors touch-manipulation"
            >
              <MoreHorizontal size={11} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-black/[0.10] rounded-xl shadow-2xl shadow-black/10 overflow-hidden z-50">
                <button
                  onClick={() => { onToggleVisibility?.(metric.id); setMenuOpen(false) }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-[#374151] hover:bg-black/[0.04] hover:text-[#0f0f12] transition-colors"
                >
                  <EyeOff size={11} /> Ocultar métrica
                </button>
                <button className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-[#374151] hover:bg-black/[0.04] hover:text-[#0f0f12] transition-colors">
                  <Pin size={11} /> Fijar arriba
                </button>
                {metric.detailHref && (
                  <Link
                    href={metric.detailHref}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2.5 text-xs text-[#374151] hover:bg-black/[0.04] hover:text-[#0f0f12] transition-colors border-t border-black/[0.08]"
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
        <span className="text-2xl font-semibold text-[#0f0f12] tracking-tight tabular-nums">
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
          className="absolute top-3 right-3 opacity-0 group-hover:opacity-0 text-[10px] font-semibold px-2 py-1 rounded-md bg-[#7c3aed]/15 text-[#7c3aed] border border-[#7c3aed]/20 hover:bg-[#7c3aed]/25 transition-all"
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
