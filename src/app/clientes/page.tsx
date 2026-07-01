"use client"

import { useState, useEffect } from "react"
import { Users, TrendingUp, TrendingDown, Repeat, Star, AlertTriangle, UserPlus, DollarSign, Loader2, Store } from "lucide-react"
import { cn } from "@/lib/utils"
import { DateRangePicker, defaultDateRange } from "@/components/DateRangePicker"
import type { DateRange } from "@/components/DateRangePicker"

// ─── Types ────────────────────────────────────────────────────────────────────
interface SegmentSummary {
  id: string
  count: number
  pct: number
  avgLTV: number
  avgOrders: number
}

interface ClientesData {
  segments: SegmentSummary[]
  kpis: {
    totalCustomers: number
    newThisMonth: number
    returningRate: number
    avgLTV: number
    avgOrdersPerCustomer: number
    avgDaysBetweenOrders: number
    churnRisk: number
  } | null
  cohort: {
    months: string[]
    data: { month: string; cohortSize: number; retention: (number | null)[] }[]
  } | null
}

// ─── Segment meta (UI only, counts come from API) ─────────────────────────────
const SEGMENT_META: Record<string, {
  label: string
  icon: React.ReactNode
  color: string
  bg: string
  description: string
  action: string
}> = {
  champions: {
    label: "Champions",
    icon: <Star size={14} />,
    color: "text-[#a3e635]",
    bg: "bg-[#a3e635]/10 border-[#a3e635]/20",
    description: "Compran frecuentemente, alto ticket, recientes.",
    action: "Programas de fidelización, acceso anticipado",
  },
  loyal: {
    label: "Leales",
    icon: <Repeat size={14} />,
    color: "text-[#7c3aed]",
    bg: "bg-[#7c3aed]/10 border-[#7c3aed]/20",
    description: "Compran de forma recurrente con buen ticket.",
    action: "Upsell, cross-sell, descuentos por volumen",
  },
  promising: {
    label: "Prometedores",
    icon: <TrendingUp size={14} />,
    color: "text-yellow-400",
    bg: "bg-yellow-500/10 border-yellow-500/20",
    description: "Clientes activos con potencial de recompra.",
    action: "Email de segunda compra, retargeting",
  },
  "at-risk": {
    label: "En riesgo",
    icon: <AlertTriangle size={14} />,
    color: "text-orange-400",
    bg: "bg-orange-500/10 border-orange-500/20",
    description: "Antes activos, sin compras recientes (60-120 días).",
    action: "Win-back campaign, descuento especial",
  },
  lost: {
    label: "Perdidos",
    icon: <TrendingDown size={14} />,
    color: "text-red-400",
    bg: "bg-red-500/10 border-red-500/20",
    description: "Sin actividad en más de 120 días.",
    action: "Reactivación agresiva o dar de baja",
  },
  new: {
    label: "Nuevos",
    icon: <UserPlus size={14} />,
    color: "text-[#374151]",
    bg: "bg-black/[0.04] border-black/[0.08]",
    description: "Primera compra en los últimos 30 días.",
    action: "Onboarding, post-purchase sequence",
  },
}

function pctColor(v: number | null) {
  if (v === null) return "bg-black/[0.04] text-[#9ca3af]"
  if (v === 100)  return "bg-[#7c3aed]/20 text-[#7c3aed]"
  if (v >= 35)    return "bg-emerald-500/25 text-emerald-400"
  if (v >= 20)    return "bg-yellow-500/20 text-yellow-400"
  return "bg-red-500/15 text-red-400"
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ClientesPage() {
  const [dateRange, setDateRange]       = useState<DateRange>(defaultDateRange)
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null)
  const [data, setData]                 = useState<ClientesData | null>(null)
  const [loading, setLoading]           = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch("/api/clientes")
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const kpis   = data?.kpis   ?? null
  const cohort = data?.cohort ?? null
  const segments = data?.segments ?? []

  return (
    <div className="min-h-dvh overflow-x-hidden bg-white">
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 border-b border-black/[0.08] bg-white/90 backdrop-blur-sm">
        <span className="text-sm font-medium text-[#0f0f12]">Clientes</span>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </header>

      <div className="px-4 lg:px-6 py-4 lg:py-6 max-w-[1200px] space-y-6">

        {loading ? (
          <div className="flex items-center gap-2 text-[#6b7280] text-sm pt-10">
            <Loader2 size={14} className="animate-spin" />
            Cargando datos de clientes...
          </div>
        ) : !kpis ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-12 h-12 rounded-2xl bg-black/[0.04] border border-black/[0.08] flex items-center justify-center mb-4">
              <Store size={20} className="text-[#9ca3af]" />
            </div>
            <h2 className="text-sm font-semibold text-[#0f0f12] mb-1">Sin datos de clientes</h2>
            <p className="text-xs text-[#6b7280]">Conectá tu tienda para ver la segmentación RFM en tiempo real.</p>
          </div>
        ) : (
          <>
            {/* KPI row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: "Clientes totales", value: kpis.totalCustomers.toLocaleString("es-AR"), icon: <Users size={14} />, delta: null },
                { label: "Nuevos este mes", value: kpis.newThisMonth.toString(), icon: <UserPlus size={14} />, delta: null },
                { label: "Tasa de recompra", value: `${kpis.returningRate}%`, icon: <Repeat size={14} />, delta: null },
                { label: "LTV promedio", value: `$${kpis.avgLTV.toLocaleString("es-AR")}`, icon: <DollarSign size={14} />, delta: null },
              ].map((m) => (
                <div key={m.label} className="bg-white border border-black/[0.08] rounded-xl p-5">
                  <div className="flex items-start justify-between mb-3">
                    <p className="text-xs text-[#6b7280]">{m.label}</p>
                    <span className="text-[#9ca3af]">{m.icon}</span>
                  </div>
                  <p className="text-2xl font-bold text-[#0f0f12] tabular-nums">{m.value}</p>
                </div>
              ))}
            </div>

            {/* RFM Segments */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-[#0f0f12]">Segmentación RFM</p>
                <p className="text-xs text-[#9ca3af]">{kpis.totalCustomers.toLocaleString("es-AR")} clientes totales</p>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-1 md:grid-cols-3 gap-3">
                {segments.map((seg) => {
                  const meta = SEGMENT_META[seg.id]
                  if (!meta) return null
                  return (
                    <div
                      key={seg.id}
                      onClick={() => setSelectedSegment(selectedSegment === seg.id ? null : seg.id)}
                      className={cn(
                        "bg-white border rounded-xl p-5 cursor-pointer transition-all",
                        selectedSegment === seg.id ? meta.bg : "border-black/[0.08] hover:border-black/[0.12]"
                      )}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className={cn("flex items-center gap-1.5 text-xs font-semibold", meta.color)}>
                          {meta.icon} {meta.label}
                        </div>
                        <span className="text-xs text-[#9ca3af]">{seg.pct}%</span>
                      </div>
                      <p className="text-2xl font-bold text-[#0f0f12] mb-1">{seg.count}</p>
                      <p className="text-[11px] text-[#6b7280] leading-relaxed">{meta.description}</p>

                      {selectedSegment === seg.id && (
                        <div className="mt-4 pt-3 border-t border-black/[0.08] space-y-2">
                          <div className="flex justify-between">
                            <span className="text-[10px] text-[#6b7280]">LTV promedio</span>
                            <span className="text-[10px] font-medium text-[#374151]">${seg.avgLTV.toLocaleString("es-AR")}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[10px] text-[#6b7280]">Compras promedio</span>
                            <span className="text-[10px] font-medium text-[#374151]">{seg.avgOrders}x</span>
                          </div>
                          <div className="mt-2 pt-2 border-t border-black/[0.06]">
                            <p className="text-[10px] text-[#9ca3af] mb-0.5">Acción sugerida</p>
                            <p className={cn("text-[11px] font-medium", meta.color)}>{meta.action}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Cohort table */}
            {cohort && cohort.data.some(r => r.cohortSize > 0) && (
              <div className="bg-white border border-black/[0.08] rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-black/[0.08]">
                  <p className="text-sm font-medium text-[#0f0f12]">Retención por cohorte mensual</p>
                  <p className="text-xs text-[#9ca3af] mt-0.5">% de clientes que volvieron a comprar N meses después</p>
                </div>
                <div className="overflow-x-auto p-5">
                  <table className="w-full text-xs">
                    <thead>
                      <tr>
                        <th className="text-left text-[#9ca3af] pb-3 pr-4 font-medium">Cohorte</th>
                        <th className="text-left text-[#9ca3af] pb-3 pr-4 font-medium">N</th>
                        {cohort.months.map((m, i) => (
                          <th key={m} className="text-center text-[#9ca3af] pb-3 px-2 font-medium">M+{i}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {cohort.data.filter(r => r.cohortSize > 0).map((row) => (
                        <tr key={row.month}>
                          <td className="text-[#374151] pr-4 py-1">{row.month}</td>
                          <td className="text-[#9ca3af] pr-4 py-1 tabular-nums">{row.cohortSize}</td>
                          {row.retention.map((val, i) => (
                            <td key={i} className="px-2 py-1 text-center">
                              <span className={cn("inline-block text-[10px] font-semibold tabular-nums w-10 py-1 rounded", pctColor(val))}>
                                {val !== null ? `${val}%` : "—"}
                              </span>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Stats row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: "Pedidos por cliente", value: kpis.avgOrdersPerCustomer.toString(), sub: "promedio" },
                { label: "Días entre compras", value: kpis.avgDaysBetweenOrders.toString(), sub: "promedio" },
                { label: "En riesgo de churn", value: kpis.churnRisk.toString(), sub: "clientes sin compra en 60-120 días", alert: true },
              ].map((s) => (
                <div key={s.label} className={cn(
                  "bg-white border rounded-xl px-5 py-4",
                  s.alert ? "border-orange-500/20" : "border-black/[0.08]"
                )}>
                  <p className="text-xs text-[#6b7280] mb-1">{s.label}</p>
                  <p className={cn("text-3xl font-bold", s.alert ? "text-orange-400" : "text-[#0f0f12]")}>{s.value}</p>
                  <p className="text-[10px] text-[#9ca3af] mt-0.5">{s.sub}</p>
                </div>
              ))}
            </div>
          </>
        )}

      </div>
    </div>
  )
}
