"use client"

import { useState, useEffect } from "react"
import { AlertTriangle, CheckCircle2, Info, RefreshCw, Loader2, Bell } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import type { Alert, AlertSeverity, AlertCategory } from "@/app/api/alertas/route"

const SEV_STYLES: Record<AlertSeverity, { icon: React.ReactNode; badge: string; border: string; row: string }> = {
  critical: {
    icon: <AlertTriangle size={13} className="text-red-400" />,
    badge: "bg-red-500/15 text-red-400 border-red-500/20",
    border: "border-l-red-500",
    row: "bg-red-500/[0.03]",
  },
  warning: {
    icon: <AlertTriangle size={13} className="text-orange-400" />,
    badge: "bg-orange-500/15 text-orange-400 border-orange-500/20",
    border: "border-l-orange-500",
    row: "",
  },
  info: {
    icon: <Info size={13} className="text-white/40" />,
    badge: "bg-white/[0.06] text-white/40 border-white/[0.10]",
    border: "border-l-white/20",
    row: "",
  },
}

const SEV_LABEL: Record<AlertSeverity, string> = {
  critical: "Crítico",
  warning:  "Alerta",
  info:     "Info",
}

const CAT_LABELS: Record<AlertCategory, string> = {
  stock: "Stock", ads: "Publicidad", financiero: "Financiero", conversion: "Conversión",
}

const CAT_COLORS: Record<AlertCategory, string> = {
  stock:      "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  ads:        "text-blue-400 bg-blue-500/10 border-blue-500/20",
  financiero: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  conversion: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
}

export default function AlertasPage() {
  const [alerts, setAlerts]         = useState<Alert[]>([])
  const [resolved, setResolved]     = useState<Set<string>>(new Set())
  const [loading, setLoading]       = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filterSev, setFilterSev]   = useState<AlertSeverity | "all">("all")
  const [filterCat, setFilterCat]   = useState<AlertCategory | "all">("all")

  async function load(showRefresh = false) {
    if (showRefresh) setRefreshing(true)
    else setLoading(true)
    try {
      const res = await fetch("/api/alertas")
      if (res.ok) {
        const data = await res.json()
        setAlerts(data.alerts ?? [])
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { load() }, [])

  const active = alerts.filter(a =>
    !resolved.has(a.id) &&
    (filterSev === "all" || a.severity === filterSev) &&
    (filterCat === "all" || a.category === filterCat)
  )
  const resolvedList = alerts.filter(a => resolved.has(a.id))
  const counts = {
    critical: alerts.filter(a => a.severity === "critical" && !resolved.has(a.id)).length,
    warning:  alerts.filter(a => a.severity === "warning"  && !resolved.has(a.id)).length,
    info:     alerts.filter(a => a.severity === "info"     && !resolved.has(a.id)).length,
  }

  return (
    <div className="min-h-screen bg-[#080d14]">
      <header className="sticky top-0 z-40 flex items-center justify-between px-6 py-3 border-b border-white/[0.06] bg-[#080d14]/90 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Bell size={13} className="text-white/40" />
          <span className="text-sm font-medium text-white">Alertas</span>
          {counts.critical > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/20">
              {counts.critical}
            </span>
          )}
        </div>
        <button onClick={() => load(true)} disabled={refreshing}
          className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors">
          <RefreshCw size={12} className={cn(refreshing && "animate-spin")} />
          Actualizar
        </button>
      </header>

      <div className="px-6 py-6 max-w-[1000px] space-y-5">

        {/* Summary tiles */}
        <div className="grid grid-cols-3 gap-3">
          {(["critical", "warning", "info"] as AlertSeverity[]).map(sev => (
            <div key={sev} className={cn(
              "bg-[#0f1825] border rounded-xl px-5 py-4",
              sev === "critical" ? "border-red-500/20" : sev === "warning" ? "border-orange-500/20" : "border-white/[0.07]"
            )}>
              <p className="text-xs text-white/40 mb-1">{SEV_LABEL[sev]}s activos</p>
              <p className={cn("text-3xl font-bold",
                sev === "critical" ? "text-red-400" : sev === "warning" ? "text-orange-400" : "text-white/50"
              )}>{counts[sev]}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {(["all", "critical", "warning", "info"] as (AlertSeverity | "all")[]).map(sev => (
            <button key={sev} onClick={() => setFilterSev(sev)}
              className={cn("text-xs px-3 py-1.5 rounded-lg border transition-colors",
                filterSev === sev
                  ? "bg-[#4f8ef7]/15 border-[#4f8ef7]/30 text-[#4f8ef7]"
                  : "bg-white/[0.03] border-white/[0.08] text-white/40 hover:text-white/60"
              )}>
              {sev === "all" ? "Todos" : SEV_LABEL[sev]}
            </button>
          ))}
          <div className="w-px h-4 bg-white/[0.08] mx-1" />
          {(["all", "stock", "ads", "financiero", "conversion"] as (AlertCategory | "all")[]).map(cat => (
            <button key={cat} onClick={() => setFilterCat(cat)}
              className={cn("text-xs px-3 py-1.5 rounded-lg border transition-colors",
                filterCat === cat
                  ? "bg-[#4f8ef7]/15 border-[#4f8ef7]/30 text-[#4f8ef7]"
                  : "bg-white/[0.03] border-white/[0.08] text-white/40 hover:text-white/60"
              )}>
              {cat === "all" ? "Todas las categorías" : CAT_LABELS[cat]}
            </button>
          ))}
        </div>

        {/* Active alerts */}
        <div className="bg-[#0f1825] border border-white/[0.07] rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-white/[0.06]">
            <p className="text-xs font-semibold text-white">Alertas activas</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-white/30 text-sm">
              <Loader2 size={14} className="animate-spin" />
              Analizando tu tienda...
            </div>
          ) : active.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle2 size={20} className="text-emerald-400/40 mb-2" />
              <p className="text-sm font-medium text-white/50">Sin alertas activas</p>
              <p className="text-xs text-white/25 mt-0.5">
                {alerts.length === 0
                  ? "Conectá tu tienda para monitorear automáticamente."
                  : "Todo en orden con los filtros actuales."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {active.map(alert => {
                const sev = SEV_STYLES[alert.severity]
                return (
                  <div key={alert.id}
                    className={cn("flex items-start gap-4 px-4 py-4 border-l-2 transition-colors hover:bg-white/[0.02]", sev.border, sev.row)}>
                    <div className="shrink-0 mt-0.5">{sev.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full border", sev.badge)}>
                          {SEV_LABEL[alert.severity]}
                        </span>
                        <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full border", CAT_COLORS[alert.category])}>
                          {CAT_LABELS[alert.category]}
                        </span>
                        {alert.metric && (
                          <span className="text-[10px] font-semibold text-white/40 tabular-nums">{alert.metric}</span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-white/80">{alert.title}</p>
                      <p className="text-xs text-white/40 mt-0.5 leading-relaxed">{alert.detail}</p>
                      {alert.actionLabel && alert.actionHref && (
                        <Link href={alert.actionHref}
                          className="inline-flex items-center gap-1 mt-1.5 text-xs font-medium text-[#4f8ef7] hover:text-[#4f8ef7]/80 transition-colors">
                          {alert.actionLabel} →
                        </Link>
                      )}
                    </div>
                    <button
                      onClick={() => setResolved(prev => new Set([...prev, alert.id]))}
                      className="shrink-0 text-xs px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/40 hover:text-white/70 hover:bg-white/[0.08] transition-colors">
                      Resolver
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Resolved */}
        {resolvedList.length > 0 && (
          <div className="bg-[#0f1825] border border-white/[0.05] rounded-xl overflow-hidden opacity-50">
            <div className="px-4 py-3 border-b border-white/[0.06]">
              <p className="text-xs font-semibold text-white/40">Resueltas ({resolvedList.length})</p>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {resolvedList.map(alert => (
                <div key={alert.id} className="flex items-center gap-4 px-4 py-3">
                  <CheckCircle2 size={13} className="text-emerald-400/50 shrink-0" />
                  <p className="text-xs text-white/30 flex-1 line-through">{alert.title}</p>
                  <button
                    onClick={() => setResolved(prev => { const s = new Set(prev); s.delete(alert.id); return s })}
                    className="text-[11px] text-white/20 hover:text-white/40 transition-colors shrink-0">
                    Reabrir
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
