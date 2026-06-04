"use client"

import { useState, useEffect } from "react"
import { Sparkles, ChevronDown, ChevronUp, RefreshCw, ExternalLink, AlertTriangle, TrendingUp, Info, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import type { Insight, InsightSeverity } from "@/app/api/insights/route"

const SEVERITY_STYLES: Record<InsightSeverity, { icon: React.ReactNode; badge: string; border: string }> = {
  critical: {
    icon: <AlertTriangle size={12} />,
    badge: "bg-red-500/15 text-red-400 border-red-500/20",
    border: "border-l-red-500/60",
  },
  warning: {
    icon: <AlertTriangle size={12} />,
    badge: "bg-orange-500/15 text-orange-400 border-orange-500/20",
    border: "border-l-orange-500/60",
  },
  positive: {
    icon: <TrendingUp size={12} />,
    badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    border: "border-l-emerald-500/60",
  },
  info: {
    icon: <Info size={12} />,
    badge: "bg-white/[0.06] text-white/40 border-white/[0.10]",
    border: "border-l-white/[0.20]",
  },
}

const SEVERITY_LABEL: Record<InsightSeverity, string> = {
  critical: "Crítico",
  warning:  "Atención",
  positive: "Positivo",
  info:     "Info",
}

const DEFAULT_VISIBLE = 3

export function InsightsWidget() {
  const [insights, setInsights]     = useState<Insight[]>([])
  const [loading, setLoading]       = useState(true)
  const [expanded, setExpanded]     = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  async function load(showRefresh = false) {
    if (showRefresh) setRefreshing(true)
    else setLoading(true)
    try {
      const res = await fetch("/api/insights")
      if (res.ok) {
        const data = await res.json()
        setInsights(data.insights ?? [])
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { load() }, [])

  const criticalCount = insights.filter(i => i.severity === "critical").length
  const visible       = expanded ? insights : insights.slice(0, DEFAULT_VISIBLE)
  const hasMore       = insights.length > DEFAULT_VISIBLE

  return (
    <div className="bg-[#0f1825] border border-white/[0.06] rounded-xl overflow-hidden mb-4">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Sparkles size={13} className="text-[#4f8ef7]" />
          <span className="text-xs font-semibold text-white">Insights</span>
          {criticalCount > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/20">
              {criticalCount} crítico{criticalCount > 1 ? "s" : ""}
            </span>
          )}
        </div>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="p-1.5 rounded hover:bg-white/[0.06] text-white/30 hover:text-white/60 transition-colors"
        >
          <RefreshCw size={11} className={cn(refreshing && "animate-spin")} />
        </button>
      </div>

      {/* Body */}
      <div className="divide-y divide-white/[0.04]">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="px-4 py-3 flex gap-3 animate-pulse">
              <div className="w-1 rounded-full bg-white/[0.08] self-stretch" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-white/[0.06] rounded w-3/4" />
                <div className="h-2.5 bg-white/[0.04] rounded w-full" />
              </div>
            </div>
          ))
        ) : insights.length === 0 ? (
          <div className="px-4 py-6 text-center">
            <CheckCircle2 size={16} className="text-white/20 mx-auto mb-2" />
            <p className="text-xs text-white/30">Conectá tu tienda para ver insights automáticos.</p>
          </div>
        ) : (
          visible.map(insight => {
            const style = SEVERITY_STYLES[insight.severity]
            return (
              <div
                key={insight.id}
                className={cn("flex gap-3 px-4 py-3 border-l-2", style.border)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className={cn("flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border", style.badge)}>
                      {style.icon}
                      {SEVERITY_LABEL[insight.severity]}
                    </span>
                    {insight.metric && (
                      <span className="text-[10px] font-semibold text-white/50 tabular-nums">{insight.metric}</span>
                    )}
                  </div>
                  <p className="text-xs font-medium text-white/80 mb-0.5">{insight.title}</p>
                  <p className="text-[11px] text-white/40 leading-relaxed">{insight.detail}</p>
                  {insight.actionLabel && insight.actionHref && (
                    <Link
                      href={insight.actionHref}
                      className="inline-flex items-center gap-1 mt-1.5 text-[11px] font-medium text-[#4f8ef7] hover:text-[#4f8ef7]/80 transition-colors"
                    >
                      {insight.actionLabel}
                      <ExternalLink size={9} />
                    </Link>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Show more / less */}
      {hasMore && !loading && (
        <button
          onClick={() => setExpanded(v => !v)}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 text-[11px] text-white/30 hover:text-white/60 hover:bg-white/[0.03] transition-colors border-t border-white/[0.04]"
        >
          {expanded
            ? <><ChevronUp size={11} /> Mostrar menos</>
            : <><ChevronDown size={11} /> Ver {insights.length - DEFAULT_VISIBLE} más</>
          }
        </button>
      )}
    </div>
  )
}
