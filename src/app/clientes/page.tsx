"use client"

import { useState, useEffect } from "react"
import { Users, TrendingUp, TrendingDown, Repeat, Star, AlertTriangle, UserPlus, DollarSign, Loader2, Store, Activity, Heart, Clock, Download, Copy, X, Zap, Layers, RefreshCw } from "lucide-react"
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

interface ActionCustomer {
  id: string
  name: string
  email: string
  ltv: number
  orders: number
  daysSinceLastOrder: number
  healthScore: number
  predictedNextAt: string | null
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
    overdue?: number
    healthScore?: number
  } | null
  cohort: {
    months: string[]
    data: { month: string; cohortSize: number; retention: (number | null)[] }[]
  } | null
  revenueCohort?: {
    months: string[]
    data: { month: string; cohortSize: number; cumRevenue: (number | null)[] }[]
  } | null
  health?: {
    avgScore: number
    distribution: { excelente: number; bien: number; regular: number; pobre: number }
    overdue: number
  } | null
  pulse?: { active: number; atRisk: number; dormant: number; lost: number } | null
  concentration?: {
    top1: { count: number; revenuePct: number }
    top10: { count: number; revenuePct: number }
    top20: { count: number; revenuePct: number }
  } | null
  timeToSecond?: {
    medianDays: number | null
    repeaters: number
    distribution: { label: string; count: number }[]
  } | null
  ltvCac?: { spend: number; newCustomers: number; cac: number; avgLTV: number; ratio: number | null } | null
  actionLists?: Record<string, ActionCustomer[]> | null
  nextBestAction?: Record<string, string> | null
  backfilled?: boolean
  windowDays?: number | null
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
  const [actionSegment, setActionSegment] = useState<string | null>(null)
  const [copied, setCopied]             = useState(false)
  const [syncing, setSyncing]           = useState(false)

  const load = () => {
    setLoading(true)
    fetch("/api/clientes")
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  async function runSync() {
    setSyncing(true)
    try { await fetch("/api/sync/orders", { method: "POST" }) } catch { /* ignore */ }
    setSyncing(false)
    load()
  }

  const kpis   = data?.kpis   ?? null
  const cohort = data?.cohort ?? null
  const segments = data?.segments ?? []
  const health = data?.health ?? null
  const pulse = data?.pulse ?? null
  const concentration = data?.concentration ?? null
  const timeToSecond = data?.timeToSecond ?? null
  const revenueCohort = data?.revenueCohort ?? null
  const ltvCac = data?.ltvCac ?? null
  const actionLists = data?.actionLists ?? null
  const nextBestAction = data?.nextBestAction ?? null

  const activeList = actionSegment && actionLists ? (actionLists[actionSegment] ?? []) : []

  function exportCSV(list: ActionCustomer[], name: string) {
    const header = "nombre,email,ltv,pedidos,dias_sin_comprar,health,proxima_compra_estimada"
    const rows = list.map(c => [c.name, c.email, c.ltv, c.orders, c.daysSinceLastOrder, c.healthScore, c.predictedNextAt ?? ""].map(v => `"${String(v).replace(/"/g, '""')}"`).join(","))
    const csv = [header, ...rows].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob)
    a.download = `clientes-${name}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }
  function copyEmails(list: ActionCustomer[]) {
    const emails = list.map(c => c.email).filter(Boolean).join(", ")
    navigator.clipboard?.writeText(emails)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const ACTION_LABELS: Record<string, string> = {
    champions: "Champions", "at-risk": "En riesgo", lost: "Perdidos", new: "Nuevos", overdue: "Atrasados (fuera de cadencia)",
  }

  return (
    <div className="min-h-dvh overflow-x-hidden bg-white">
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 border-b border-black/[0.08] bg-white/90 backdrop-blur-sm">
        <span className="text-sm font-medium text-[#0f0f12]">Clientes</span>
        <div className="flex items-center gap-2">
          <button
            onClick={runSync}
            disabled={syncing}
            className="text-xs px-3 h-9 rounded-lg bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-medium flex items-center gap-1.5 disabled:opacity-60 transition-colors"
          >
            {syncing ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
            {syncing ? "Sincronizando…" : "Sincronizar"}
          </button>
          <DateRangePicker value={dateRange} onChange={setDateRange} />
        </div>
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
            {data?.backfilled === false && (
              <div className="rounded-xl border border-[#7c3aed]/20 bg-[#7c3aed]/[0.04] px-4 py-3 text-xs text-[#6b7280] flex items-center gap-2">
                <AlertTriangle size={14} className="text-[#7c3aed] shrink-0" />
                <span>Mostrando una ventana en vivo de 6 meses. Sincronizá para analizar tu historial completo — cohorts y LTV más precisos.</span>
                <button onClick={runSync} disabled={syncing} className="ml-auto text-[#7c3aed] font-medium whitespace-nowrap disabled:opacity-60">
                  {syncing ? "Sincronizando…" : "Sincronizar ahora"}
                </button>
              </div>
            )}

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

            {/* Salud de la base */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {pulse && (
                <div className="bg-white border border-black/[0.08] rounded-xl p-5">
                  <div className="flex items-center gap-1.5 mb-4 text-xs font-semibold text-[#7c3aed]"><Activity size={14} /> Pulso de la base</div>
                  <div className="space-y-2">
                    {[
                      { label: "Activos", sub: "≤60d", val: pulse.active, color: "bg-emerald-500" },
                      { label: "En riesgo", sub: "60-120d", val: pulse.atRisk, color: "bg-yellow-500" },
                      { label: "Dormidos", sub: "120-180d", val: pulse.dormant, color: "bg-orange-500" },
                      { label: "Perdidos", sub: ">180d", val: pulse.lost, color: "bg-red-500" },
                    ].map((p) => {
                      const t = pulse.active + pulse.atRisk + pulse.dormant + pulse.lost || 1
                      return (
                        <div key={p.label}>
                          <div className="flex justify-between text-[11px] mb-0.5"><span className="text-[#374151]">{p.label} <span className="text-[#9ca3af]">{p.sub}</span></span><span className="tabular-nums text-[#0f0f12] font-medium">{p.val}</span></div>
                          <div className="h-1.5 rounded-full bg-black/[0.05] overflow-hidden"><div className={cn("h-full rounded-full", p.color)} style={{ width: `${(p.val / t) * 100}%` }} /></div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
              {health && (
                <div className="bg-white border border-black/[0.08] rounded-xl p-5">
                  <div className="flex items-center gap-1.5 mb-4 text-xs font-semibold text-[#7c3aed]"><Heart size={14} /> Salud de clientes</div>
                  <div className="flex items-end gap-2 mb-4"><span className="text-3xl font-bold text-[#0f0f12] tabular-nums">{health.avgScore}</span><span className="text-xs text-[#9ca3af] mb-1">/100 score promedio</span></div>
                  <div className="space-y-1.5">
                    {[
                      { k: "Excelente", v: health.distribution.excelente, c: "bg-emerald-500" },
                      { k: "Bien", v: health.distribution.bien, c: "bg-[#7c3aed]" },
                      { k: "Regular", v: health.distribution.regular, c: "bg-yellow-500" },
                      { k: "Pobre", v: health.distribution.pobre, c: "bg-red-500" },
                    ].map((h) => {
                      const t = health.distribution.excelente + health.distribution.bien + health.distribution.regular + health.distribution.pobre || 1
                      return (
                        <div key={h.k} className="flex items-center gap-2">
                          <span className="text-[11px] text-[#6b7280] w-16">{h.k}</span>
                          <div className="flex-1 h-1.5 rounded-full bg-black/[0.05] overflow-hidden"><div className={cn("h-full", h.c)} style={{ width: `${(h.v / t) * 100}%` }} /></div>
                          <span className="text-[11px] tabular-nums text-[#374151] w-8 text-right">{h.v}</span>
                        </div>
                      )
                    })}
                  </div>
                  {health.overdue > 0 && <p className="text-[11px] text-orange-500 mt-3 flex items-center gap-1"><Clock size={12} /> {health.overdue} clientes atrasados vs su cadencia</p>}
                </div>
              )}
              <div className="bg-white border border-black/[0.08] rounded-xl p-5">
                <div className="flex items-center gap-1.5 mb-4 text-xs font-semibold text-[#7c3aed]"><TrendingUp size={14} /> LTV : CAC</div>
                {ltvCac && ltvCac.ratio ? (
                  <>
                    <div className="flex items-end gap-1 mb-3"><span className="text-3xl font-bold text-[#0f0f12] tabular-nums">{ltvCac.ratio}x</span></div>
                    <div className="space-y-1 text-[11px]">
                      <div className="flex justify-between"><span className="text-[#6b7280]">CAC</span><span className="text-[#374151] tabular-nums">${ltvCac.cac.toLocaleString("es-AR")}</span></div>
                      <div className="flex justify-between"><span className="text-[#6b7280]">LTV prom.</span><span className="text-[#374151] tabular-nums">${ltvCac.avgLTV.toLocaleString("es-AR")}</span></div>
                      <div className="flex justify-between"><span className="text-[#6b7280]">Nuevos (6m)</span><span className="text-[#374151] tabular-nums">{ltvCac.newCustomers}</span></div>
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-[#9ca3af] leading-relaxed">Conectá Meta Ads y Google Ads para cruzar tu inversión con clientes nuevos y ver LTV:CAC y payback reales.</p>
                )}
              </div>
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

            {/* Revenue cohort */}
            {revenueCohort && revenueCohort.data.some(r => r.cohortSize > 0) && (
              <div className="bg-white border border-black/[0.08] rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-black/[0.08]">
                  <p className="text-sm font-medium text-[#0f0f12]">LTV acumulado por cohorte</p>
                  <p className="text-xs text-[#9ca3af] mt-0.5">Ingreso promedio por cliente acumulado, N meses después de la 1ª compra</p>
                </div>
                <div className="overflow-x-auto p-5">
                  <table className="w-full text-xs">
                    <thead><tr>
                      <th className="text-left text-[#9ca3af] pb-3 pr-4 font-medium">Cohorte</th>
                      <th className="text-left text-[#9ca3af] pb-3 pr-4 font-medium">N</th>
                      {revenueCohort.months.map((m, i) => <th key={m} className="text-center text-[#9ca3af] pb-3 px-2 font-medium">M+{i}</th>)}
                    </tr></thead>
                    <tbody>
                      {revenueCohort.data.filter(r => r.cohortSize > 0).map((row) => (
                        <tr key={row.month}>
                          <td className="text-[#374151] pr-4 py-1">{row.month}</td>
                          <td className="text-[#9ca3af] pr-4 py-1 tabular-nums">{row.cohortSize}</td>
                          {row.cumRevenue.map((v, i) => <td key={i} className="px-2 py-1 text-center tabular-nums text-[#374151]">{v !== null ? `$${(v / 1000).toFixed(0)}k` : "—"}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Time to 2nd + concentration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {timeToSecond && (
                <div className="bg-white border border-black/[0.08] rounded-xl p-5">
                  <div className="flex items-center gap-1.5 mb-3 text-xs font-semibold text-[#7c3aed]"><Clock size={14} /> Tiempo a la 2ª compra</div>
                  <div className="flex items-end gap-2 mb-4"><span className="text-3xl font-bold text-[#0f0f12] tabular-nums">{timeToSecond.medianDays ?? "—"}</span><span className="text-xs text-[#9ca3af] mb-1">días (mediana) · {timeToSecond.repeaters} recompradores</span></div>
                  <div className="space-y-1.5">
                    {timeToSecond.distribution.map((b) => {
                      const max = Math.max(...timeToSecond.distribution.map(x => x.count), 1)
                      return (
                        <div key={b.label} className="flex items-center gap-2">
                          <span className="text-[11px] text-[#6b7280] w-20">{b.label}</span>
                          <div className="flex-1 h-1.5 rounded-full bg-black/[0.05] overflow-hidden"><div className="h-full bg-[#7c3aed]" style={{ width: `${(b.count / max) * 100}%` }} /></div>
                          <span className="text-[11px] tabular-nums text-[#374151] w-8 text-right">{b.count}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
              {concentration && (
                <div className="bg-white border border-black/[0.08] rounded-xl p-5">
                  <div className="flex items-center gap-1.5 mb-3 text-xs font-semibold text-[#7c3aed]"><Layers size={14} /> Concentración de ingresos</div>
                  <p className="text-[11px] text-[#9ca3af] mb-4">Qué parte de la facturación depende de tus mejores clientes.</p>
                  <div className="space-y-3">
                    {[{ k: "Top 1%", d: concentration.top1 }, { k: "Top 10%", d: concentration.top10 }, { k: "Top 20%", d: concentration.top20 }].map((row) => (
                      <div key={row.k}>
                        <div className="flex justify-between text-[11px] mb-0.5"><span className="text-[#374151]">{row.k} <span className="text-[#9ca3af]">({row.d.count} clientes)</span></span><span className="tabular-nums font-semibold text-[#0f0f12]">{row.d.revenuePct}%</span></div>
                        <div className="h-1.5 rounded-full bg-black/[0.05] overflow-hidden"><div className="h-full bg-[#7c3aed]" style={{ width: `${row.d.revenuePct}%` }} /></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Acciones para retener/recuperar */}
            {actionLists && (
              <div>
                <div className="mb-3">
                  <p className="text-sm font-medium text-[#0f0f12]">Acciones para retener y recuperar</p>
                  <p className="text-xs text-[#9ca3af] mt-0.5">Segmentos accionables — exportá o copiá los emails para tu campaña (Klaviyo, Perfit, Meta).</p>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                  {["champions", "at-risk", "overdue", "new", "lost"].map((seg) => {
                    const list = actionLists[seg] ?? []
                    return (
                      <button key={seg} onClick={() => setActionSegment(seg)} className="bg-white border border-black/[0.08] rounded-xl p-4 text-left hover:border-[#7c3aed]/40 transition-colors">
                        <p className="text-[11px] text-[#6b7280] mb-1">{ACTION_LABELS[seg]}</p>
                        <p className="text-2xl font-bold text-[#0f0f12] tabular-nums">{list.length}</p>
                        <p className="text-[10px] text-[#7c3aed] mt-1 flex items-center gap-1"><Zap size={11} /> Ver / exportar</p>
                      </button>
                    )
                  })}
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

      {/* Action list modal */}
      {actionSegment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={() => setActionSegment(null)}>
          <div className="bg-white rounded-2xl border border-black/[0.08] shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-black/[0.08]">
              <div>
                <p className="text-sm font-semibold text-[#0f0f12]">{ACTION_LABELS[actionSegment]} · {activeList.length}</p>
                {nextBestAction?.[actionSegment] && <p className="text-[11px] text-[#6b7280] mt-0.5 max-w-md">{nextBestAction[actionSegment]}</p>}
              </div>
              <button onClick={() => setActionSegment(null)} className="w-8 h-8 flex items-center justify-center rounded-lg text-[#9ca3af] hover:bg-black/[0.05] shrink-0"><X size={16} /></button>
            </div>
            <div className="flex items-center gap-2 px-5 py-3 border-b border-black/[0.08]">
              <button onClick={() => exportCSV(activeList, actionSegment)} className="text-xs px-3 h-8 rounded-lg bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-medium flex items-center gap-1.5"><Download size={13} /> Exportar CSV</button>
              <button onClick={() => copyEmails(activeList)} className="text-xs px-3 h-8 rounded-lg bg-black/[0.04] border border-black/[0.08] text-[#374151] hover:bg-black/[0.06] flex items-center gap-1.5"><Copy size={13} /> {copied ? "¡Copiado!" : "Copiar emails"}</button>
            </div>
            <div className="overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-white"><tr className="text-[#9ca3af]">
                  <th className="text-left font-medium px-5 py-2">Cliente</th>
                  <th className="text-right font-medium px-2 py-2">LTV</th>
                  <th className="text-right font-medium px-2 py-2">Pedidos</th>
                  <th className="text-right font-medium px-2 py-2">Días</th>
                  <th className="text-right font-medium px-5 py-2">Health</th>
                </tr></thead>
                <tbody>
                  {activeList.map((c) => (
                    <tr key={c.id} className="border-t border-black/[0.05]">
                      <td className="px-5 py-2"><p className="text-[#0f0f12] font-medium truncate max-w-[220px]">{c.name || "—"}</p><p className="text-[10px] text-[#9ca3af] truncate max-w-[220px]">{c.email || "sin email"}</p></td>
                      <td className="text-right px-2 tabular-nums text-[#374151]">${c.ltv.toLocaleString("es-AR")}</td>
                      <td className="text-right px-2 tabular-nums text-[#374151]">{c.orders}</td>
                      <td className="text-right px-2 tabular-nums text-[#374151]">{c.daysSinceLastOrder}</td>
                      <td className="text-right px-5 tabular-nums font-semibold text-[#7c3aed]">{c.healthScore}</td>
                    </tr>
                  ))}
                  {activeList.length === 0 && <tr><td colSpan={5} className="px-5 py-8 text-center text-[#9ca3af]">Sin clientes en este segmento.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
