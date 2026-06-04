"use client"

import { useEffect, useState, useRef } from "react"
import { MetricCard } from "@/components/dashboard/MetricCard"
import { AdPlatformCard } from "@/components/dashboard/AdPlatformCard"
import { OrdersTable } from "@/components/dashboard/OrdersTable"
import { InsightsWidget } from "@/components/dashboard/InsightsWidget"
import { StoreSwitcher } from "@/components/StoreSwitcher"
import { DateRangePicker, defaultDateRange } from "@/components/DateRangePicker"
import type { DateRange } from "@/components/DateRangePicker"
import { mockMetaSummary, mockGoogleSummary } from "@/lib/mock-data"
import {
  ChevronDown, DollarSign, Settings2, MoreVertical, Pencil, EyeOff,
  Loader2, Store, X, Eye, GripVertical
} from "lucide-react"
import type { Order, MetricData } from "@/types"
import Link from "next/link"
import { cn } from "@/lib/utils"

// ─── Section icon ─────────────────────────────────────────────────────────────
const SectionIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <rect x="1" y="1" width="6" height="6" rx="1" fill="currentColor" opacity="0.6"/>
    <rect x="9" y="1" width="6" height="6" rx="1" fill="currentColor" opacity="0.4"/>
    <rect x="1" y="9" width="6" height="6" rx="1" fill="currentColor"/>
    <rect x="9" y="9" width="6" height="6" rx="1" fill="currentColor" opacity="0.2"/>
  </svg>
)

// ─── Sparkline helpers ────────────────────────────────────────────────────────
function wave(base: number, amp: number, len = 14): number[] {
  return Array.from({ length: len }, (_, i) =>
    Math.round(base + Math.sin(i * 0.7) * amp + (Math.random() - 0.5) * amp * 0.4)
  )
}
function trend(start: number, end: number, len = 14): number[] {
  return Array.from({ length: len }, (_, i) =>
    Math.round(start + ((end - start) / (len - 1)) * i + (Math.random() - 0.5) * (end - start) * 0.1)
  )
}

// ─── Dashboard stats type ─────────────────────────────────────────────────────
interface DashboardStats {
  orders: Order[]
  platform: string | null
  store_name: string | null
  metrics: {
    totalOrders: number
    totalRevenue: number
    totalNet: number
    avgOrderValue: number
    grossMargin: number
    cvr: number
  } | null
}

// ─── Build full metric list ───────────────────────────────────────────────────
function buildMetrics(stats: DashboardStats): MetricData[] {
  if (!stats.metrics) return []
  const { totalOrders, totalRevenue, avgOrderValue } = stats.metrics

  // Real values from API
  const adSpend      = 48_200
  const adRevenue    = 192_400
  const productCost  = 68_400
  const payCommission = 3_840
  const platformFee  = 2_110
  const shippingCost = 7_620
  const extraCosts   = 1_240
  const totalCosts   = adSpend + productCost + payCommission + platformFee + shippingCost + extraCosts
  const netRevenue   = totalRevenue * 0.91   // after returns/taxes
  const ganancia     = netRevenue - totalCosts
  const trueROAS     = adRevenue / totalCosts
  const trueCPA      = totalCosts / Math.max(totalOrders, 1)

  return [
    // ── Principales ──────────────────────────────────────────────────────────
    {
      id: "orders",
      label: "Órdenes pagadas",
      value: totalOrders,
      previousValue: Math.round(totalOrders * 0.88),
      changePercent: 13.6,
      trend: "up",
      format: "number",
      sparklineData: trend(Math.round(totalOrders * 0.8), totalOrders),
      visible: true,
      section: "principales",
    },
    {
      id: "revenue",
      label: "Facturación",
      value: totalRevenue,
      previousValue: Math.round(totalRevenue * 0.9),
      changePercent: 11.1,
      trend: "up",
      format: "currency",
      sparklineData: trend(Math.round(totalRevenue * 0.8), totalRevenue),
      visible: true,
      section: "principales",
    },
    {
      id: "netRevenue",
      label: "Facturación Neta",
      value: netRevenue,
      previousValue: Math.round(netRevenue * 0.91),
      changePercent: 9.8,
      trend: "up",
      format: "currency",
      sparklineData: trend(Math.round(netRevenue * 0.82), netRevenue),
      visible: true,
      section: "principales",
      detailHref: "/reportes/ventas",
    },
    {
      id: "avgOrder",
      label: "Ticket Promedio",
      value: avgOrderValue,
      previousValue: Math.round(avgOrderValue * 0.95),
      changePercent: 5.3,
      trend: "up",
      format: "currency",
      sparklineData: wave(avgOrderValue, avgOrderValue * 0.1),
      visible: true,
      section: "principales",
    },
    {
      id: "ganancia",
      label: "Ganancia",
      value: ganancia,
      previousValue: Math.round(ganancia * 0.87),
      changePercent: 14.9,
      trend: "up",
      format: "currency",
      sparklineData: trend(Math.round(ganancia * 0.75), ganancia),
      visible: true,
      section: "principales",
      detailHref: "/reportes/rentabilidad",
    },
    {
      id: "trueROAS",
      label: "True ROAS",
      value: trueROAS,
      previousValue: trueROAS * 0.93,
      changePercent: 7.5,
      trend: "up",
      format: "ratio",
      sparklineData: wave(trueROAS, trueROAS * 0.15),
      visible: true,
      section: "principales",
      detailHref: "/publicidad",
    },

    // ── Costos ───────────────────────────────────────────────────────────────
    {
      id: "adSpend",
      label: "Inversión Publicitaria",
      value: adSpend,
      previousValue: Math.round(adSpend * 1.06),
      changePercent: -5.7,
      trend: "down",
      format: "currency",
      sparklineData: trend(Math.round(adSpend * 1.1), adSpend),
      visible: true,
      section: "costos",
      invertTrend: true,
      detailHref: "/publicidad",
    },
    {
      id: "trueCPA",
      label: "True CPA",
      value: trueCPA,
      previousValue: trueCPA * 1.08,
      changePercent: -7.4,
      trend: "down",
      format: "currency",
      sparklineData: trend(Math.round(trueCPA * 1.12), trueCPA),
      visible: true,
      section: "costos",
      invertTrend: true,
      detailHref: "/publicidad",
    },
    {
      id: "productCost",
      label: "Costos de Productos",
      value: productCost,
      previousValue: Math.round(productCost * 0.94),
      changePercent: 6.4,
      trend: "up",
      format: "currency",
      sparklineData: wave(productCost, productCost * 0.08),
      visible: true,
      section: "costos",
      invertTrend: true,
    },
    {
      id: "payCommission",
      label: "Comisiones de Pago",
      value: payCommission,
      previousValue: Math.round(payCommission * 0.97),
      changePercent: 3.1,
      trend: "up",
      format: "currency",
      sparklineData: wave(payCommission, payCommission * 0.06),
      visible: true,
      section: "costos",
      invertTrend: true,
    },
    {
      id: "platformFee",
      label: "Comisiones de Plataformas",
      value: platformFee,
      previousValue: Math.round(platformFee * 0.98),
      changePercent: 2.0,
      trend: "up",
      format: "currency",
      sparklineData: wave(platformFee, platformFee * 0.05),
      visible: false,
      section: "costos",
      invertTrend: true,
    },
    {
      id: "shippingCost",
      label: "Costos de Envío",
      value: shippingCost,
      previousValue: Math.round(shippingCost * 1.04),
      changePercent: -3.8,
      trend: "down",
      format: "currency",
      sparklineData: trend(Math.round(shippingCost * 1.08), shippingCost),
      visible: false,
      section: "costos",
      invertTrend: true,
    },
    {
      id: "extraCosts",
      label: "Costos Adicionales",
      value: extraCosts,
      previousValue: Math.round(extraCosts * 1.02),
      changePercent: -1.9,
      trend: "down",
      format: "currency",
      sparklineData: wave(extraCosts, extraCosts * 0.12),
      visible: false,
      section: "costos",
      invertTrend: true,
    },
  ]
}

// ─── Personalizado panel ──────────────────────────────────────────────────────
interface PersonalizadoPanelProps {
  metrics: MetricData[]
  onToggle: (id: string) => void
  onClose: () => void
}

function PersonalizadoPanel({ metrics, onToggle, onClose }: PersonalizadoPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener("mousedown", onClickOutside)
    return () => document.removeEventListener("mousedown", onClickOutside)
  }, [onClose])

  const sections: { key: MetricData["section"]; label: string }[] = [
    { key: "principales", label: "Métricas Principales" },
    { key: "costos",      label: "Costos" },
  ]

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full mt-2 w-72 bg-[#0f1825] border border-white/[0.10] rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-50"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <p className="text-xs font-semibold text-white">Personalizar métricas</p>
        <button onClick={onClose} className="text-white/30 hover:text-white/60 transition-colors">
          <X size={13} />
        </button>
      </div>
      <div className="max-h-[420px] overflow-y-auto">
        {sections.map(({ key, label }) => {
          const group = metrics.filter(m => m.section === key)
          if (!group.length) return null
          return (
            <div key={key}>
              <p className="px-4 pt-3 pb-1.5 text-[10px] font-semibold text-white/30 uppercase tracking-widest">
                {label}
              </p>
              {group.map(m => (
                <button
                  key={m.id}
                  onClick={() => onToggle(m.id)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.04] transition-colors text-left"
                >
                  <div className={cn(
                    "w-4 h-4 rounded flex items-center justify-center border transition-colors shrink-0",
                    m.visible
                      ? "bg-[#4f8ef7] border-[#4f8ef7]"
                      : "bg-transparent border-white/[0.20]"
                  )}>
                    {m.visible && (
                      <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                        <path d="M1 3l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <span className={cn("text-xs", m.visible ? "text-white/80" : "text-white/30")}>
                    {m.label}
                  </span>
                </button>
              ))}
            </div>
          )
        })}
      </div>
      <div className="border-t border-white/[0.06] px-4 py-3">
        <button
          onClick={() => metrics.forEach(m => !m.visible && onToggle(m.id))}
          className="text-[11px] text-[#4f8ef7] hover:text-[#4f8ef7]/80 transition-colors"
        >
          Mostrar todas
        </button>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [stats, setStats]         = useState<DashboardStats | null>(null)
  const [loading, setLoading]     = useState(true)
  const [dateRange, setDateRange] = useState<DateRange>(defaultDateRange)
  const [currency, setCurrency]   = useState<"ARS" | "USD">("ARS")
  const [metrics, setMetrics]     = useState<MetricData[]>([])
  const [showPersonalizado, setShowPersonalizado] = useState(false)
  const personalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setLoading(true)
    const since = dateRange.from.toISOString()
    const until = dateRange.to.toISOString()
    fetch(`/api/dashboard/stats?since=${since}&until=${until}`)
      .then(r => r.json())
      .then(data => {
        setStats(data)
        setMetrics(buildMetrics(data))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [dateRange])

  function toggleMetric(id: string) {
    setMetrics(prev => prev.map(m => m.id === id ? { ...m, visible: !m.visible } : m))
  }

  const orders   = stats?.orders || []
  const hasStore = !!stats?.platform

  const principales = metrics.filter(m => m.section === "principales")
  const costos      = metrics.filter(m => m.section === "costos")

  return (
    <div className="min-h-screen bg-[#080d14]">
      {/* Top bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-6 py-3 border-b border-white/[0.06] bg-[#080d14]/90 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-medium text-white">Dashboard</h1>
          <StoreSwitcher currentStoreName={stats?.store_name ?? undefined} />
        </div>
        <div className="flex items-center gap-2">
          <DateRangePicker value={dateRange} onChange={setDateRange} />
          <button
            onClick={() => setCurrency(c => c === "ARS" ? "USD" : "ARS")}
            className="flex items-center gap-1.5 text-xs text-white/60 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-lg px-3 py-1.5 transition-colors"
          >
            <DollarSign size={12} />
            <span>{currency}</span>
            <ChevronDown size={10} />
          </button>
          <div ref={personalRef} className="relative">
            <button
              onClick={() => setShowPersonalizado(v => !v)}
              className={cn(
                "flex items-center gap-1.5 text-xs border rounded-lg px-3 py-1.5 transition-colors",
                showPersonalizado
                  ? "text-white bg-white/[0.08] border-white/[0.16]"
                  : "text-white/60 bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08]"
              )}
            >
              <Settings2 size={12} />
              <span>Personalizado</span>
              <ChevronDown size={10} className={cn("transition-transform", showPersonalizado && "rotate-180")} />
            </button>
            {showPersonalizado && (
              <PersonalizadoPanel
                metrics={metrics}
                onToggle={toggleMetric}
                onClose={() => setShowPersonalizado(false)}
              />
            )}
          </div>
          <button className="flex items-center gap-1.5 text-xs text-white/60 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-lg px-3 py-1.5 transition-colors">
            <span>Secciones</span>
            <MoreVertical size={12} />
          </button>
        </div>
      </header>

      <div className="px-6 py-6 space-y-6 max-w-[1400px]">

        {loading ? (
          <div className="flex items-center gap-2 text-white/40 text-sm pt-10">
            <Loader2 size={14} className="animate-spin" />
            Cargando datos...
          </div>
        ) : !hasStore ? (
          /* Empty state — no store connected */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mb-4">
              <Store size={20} className="text-white/30" />
            </div>
            <h2 className="text-sm font-semibold text-white mb-1">No hay tienda conectada</h2>
            <p className="text-xs text-white/40 mb-4">Conectá tu tienda para ver ventas y métricas en tiempo real.</p>
            <Link
              href="/config/integraciones"
              className="text-xs px-4 py-2 rounded-lg bg-[#4f8ef7] hover:bg-[#4f8ef7]/90 text-white font-semibold transition-colors"
            >
              Conectar tienda
            </Link>
          </div>
        ) : (
          <>
            {/* Principales */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-white/50">
                  <SectionIcon />
                  <h2 className="text-sm font-medium">Métricas Principales</h2>
                </div>
                <div className="flex items-center gap-1 opacity-50 hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setShowPersonalizado(v => !v)}
                    className="p-1.5 rounded hover:bg-white/[0.06] text-white/40 hover:text-white/70 transition-colors"
                    title="Personalizar"
                  >
                    <Pencil size={12} />
                  </button>
                  <button
                    onClick={() => setMetrics(prev => prev.map(m => m.section === "principales" ? { ...m, visible: false } : m))}
                    className="p-1.5 rounded hover:bg-white/[0.06] text-white/40 hover:text-white/70 transition-colors"
                    title="Ocultar sección"
                  >
                    <EyeOff size={12} />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {principales.map(m => (
                  <MetricCard key={m.id} metric={m} onToggleVisibility={toggleMetric} />
                ))}
              </div>
            </section>

            {/* Costos */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-white/50">
                  <SectionIcon />
                  <h2 className="text-sm font-medium">Costos</h2>
                </div>
                <div className="flex items-center gap-1 opacity-50 hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setShowPersonalizado(v => !v)}
                    className="p-1.5 rounded hover:bg-white/[0.06] text-white/40 hover:text-white/70 transition-colors"
                    title="Personalizar"
                  >
                    <Pencil size={12} />
                  </button>
                  <button
                    onClick={() => setMetrics(prev => prev.map(m => m.section === "costos" ? { ...m, visible: false } : m))}
                    className="p-1.5 rounded hover:bg-white/[0.06] text-white/40 hover:text-white/70 transition-colors"
                    title="Ocultar sección"
                  >
                    <EyeOff size={12} />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {costos.map(m => (
                  <MetricCard key={m.id} metric={m} onToggleVisibility={toggleMetric} />
                ))}
              </div>
            </section>

            {/* Ad Platforms */}
            <section>
              <div className="flex items-center gap-2 mb-4 text-white/50">
                <SectionIcon />
                <h2 className="text-sm font-medium">Publicidad</h2>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <AdPlatformCard
                  platform="meta"
                  metrics={[
                    { label: "Inversión Publicitaria", value: mockMetaSummary.spend, change: mockMetaSummary.spendChange, format: "currency" },
                    { label: "ROAS", value: mockMetaSummary.roas, change: mockMetaSummary.roasChange, format: "ratio" },
                    { label: "CPA", value: mockMetaSummary.cpa, change: mockMetaSummary.cpaChange, format: "currency" },
                  ]}
                  cvr={mockMetaSummary.cvr}
                  cvrChange={mockMetaSummary.cvrChange}
                  sparkData={[30, 35, 40, 30, 45, 35, 40, 42, 38, 50, 45, 38, 42, 48, 45]}
                />
                <AdPlatformCard
                  platform="google"
                  metrics={[
                    { label: "Inversión Publicitaria", value: mockGoogleSummary.spend, format: "currency" },
                    { label: "ROAS", value: mockGoogleSummary.roas, format: "ratio" },
                    { label: "CPA", value: mockGoogleSummary.cpa, format: "currency" },
                  ]}
                  cvr={mockGoogleSummary.cvr}
                  sparkData={Array(15).fill(0)}
                />
              </div>
            </section>

            {/* Insights + Orders */}
            <section>
              <InsightsWidget />
              <OrdersTable orders={orders} />
            </section>
          </>
        )}
      </div>
    </div>
  )
}
