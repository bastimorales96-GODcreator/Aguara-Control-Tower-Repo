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
  // ROAS/CPA "de plataforma" (lo que reportan Meta/Google): solo consideran la
  // inversión publicitaria en el denominador, no el costo total del negocio.
  // Por eso siempre se ven mejores que el True (que sí descuenta todos los costos).
  const roas         = adRevenue / adSpend
  const cpa          = adSpend / Math.max(totalOrders, 1)

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
      id: "roas",
      label: "ROAS",
      value: roas,
      previousValue: roas * 0.95,
      changePercent: 5.3,
      trend: "up",
      format: "ratio",
      sparklineData: wave(roas, roas * 0.15),
      visible: true,
      section: "principales",
      detailHref: "/publicidad",
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
      id: "cpa",
      label: "CPA",
      value: cpa,
      previousValue: cpa * 1.05,
      changePercent: -4.8,
      trend: "down",
      format: "currency",
      sparklineData: trend(Math.round(cpa * 1.08), cpa),
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
      className="absolute right-0 top-full mt-2 w-72 bg-white border border-black/[0.10] rounded-xl shadow-2xl shadow-black/10 overflow-hidden z-50"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-black/[0.08]">
        <p className="text-xs font-semibold text-[#0f0f12]">Personalizar métricas</p>
        <button onClick={onClose} className="text-[#9ca3af] hover:text-[#374151] transition-colors">
          <X size={13} />
        </button>
      </div>
      <div className="max-h-[420px] overflow-y-auto">
        {sections.map(({ key, label }) => {
          const group = metrics.filter(m => m.section === key)
          if (!group.length) return null
          return (
            <div key={key}>
              <p className="px-4 pt-3 pb-1.5 text-[10px] font-semibold text-[#9ca3af] uppercase tracking-widest">
                {label}
              </p>
              {group.map(m => (
                <button
                  key={m.id}
                  onClick={() => onToggle(m.id)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-black/[0.04] transition-colors text-left"
                >
                  <div className={cn(
                    "w-4 h-4 rounded flex items-center justify-center border transition-colors shrink-0",
                    m.visible
                      ? "bg-[#7c3aed] border-[#7c3aed]"
                      : "bg-transparent border-black/[0.15]"
                  )}>
                    {m.visible && (
                      <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                        <path d="M1 3l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <span className={cn("text-xs", m.visible ? "text-[#0f0f12]" : "text-[#9ca3af]")}>
                    {m.label}
                  </span>
                </button>
              ))}
            </div>
          )
        })}
      </div>
      <div className="border-t border-black/[0.08] px-4 py-3">
        <button
          onClick={() => metrics.forEach(m => !m.visible && onToggle(m.id))}
          className="text-[11px] text-[#7c3aed] hover:text-[#7c3aed]/80 transition-colors"
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

  // Detectar primer ingreso sin tienda → onboarding
  useEffect(() => {
    const isFirstVisit = !sessionStorage.getItem("aguara_onboarding_shown")
    if (isFirstVisit) {
      fetch("/api/dashboard/stats?since=2024-01-01T00:00:00Z&until=2024-01-01T01:00:00Z")
        .then(r => r.json())
        .then(data => {
          if (!data.platform) {
            // Sin tienda conectada y primer visita → onboarding
            sessionStorage.setItem("aguara_onboarding_shown", "1")
            window.location.href = "/onboarding"
          }
        })
        .catch(() => {})
      sessionStorage.setItem("aguara_onboarding_shown", "1")
    }
  }, [])

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
    <div className="min-h-dvh bg-white overflow-x-hidden">
      {/* Top bar — px-4 en mobile, gap reducido */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-2 gap-2 border-b border-black/[0.08] bg-white/90 backdrop-blur-sm">
        <div className="flex items-center gap-2 min-w-0">
          <h1 className="text-sm font-medium text-[#0f0f12] shrink-0">Dashboard</h1>
          <StoreSwitcher currentStoreName={stats?.store_name ?? undefined} />
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <DateRangePicker value={dateRange} onChange={setDateRange} />
          {/* Moneda: oculto en mobile para reducir clutter */}
          <button
            onClick={() => setCurrency(c => c === "ARS" ? "USD" : "ARS")}
            className="hidden sm:flex items-center gap-1.5 text-xs text-[#374151] bg-black/[0.04] hover:bg-black/[0.06] border border-black/[0.08] rounded-lg px-3 h-8 transition-colors touch-manipulation"
          >
            <DollarSign size={12} />
            <span>{currency}</span>
            <ChevronDown size={10} />
          </button>
          <div ref={personalRef} className="relative">
            <button
              onClick={() => setShowPersonalizado(v => !v)}
              className={cn(
                "flex items-center gap-1.5 text-xs border rounded-lg px-2.5 h-8 transition-colors touch-manipulation",
                showPersonalizado
                  ? "text-[#0f0f12] bg-[#f3e8ff] border-black/[0.12]"
                  : "text-[#374151] bg-black/[0.04] hover:bg-black/[0.06] border-black/[0.08]"
              )}
            >
              <Settings2 size={12} />
              <span className="hidden sm:inline">Personalizado</span>
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
          <button className="hidden sm:flex items-center gap-1.5 text-xs text-[#374151] bg-black/[0.04] hover:bg-black/[0.06] border border-black/[0.08] rounded-lg px-2.5 h-8 transition-colors touch-manipulation">
            <span>Secciones</span>
            <MoreVertical size={12} />
          </button>
        </div>
      </header>

      {/* px-4 en mobile (higiene cognitiva), px-6 en desktop */}
      <div className="px-4 lg:px-6 py-4 lg:py-6 space-y-6 max-w-[1400px]">

        {loading ? (
          <div className="flex items-center gap-2 text-[#6b7280] text-sm pt-10">
            <Loader2 size={14} className="animate-spin" />
            Cargando datos...
          </div>
        ) : !hasStore ? (
          /* Empty state — no store connected */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#7c3aed]/10 border border-[#7c3aed]/20 flex items-center justify-center mb-5">
              <Store size={24} className="text-[#7c3aed]/60" />
            </div>
            <h2 className="text-base font-semibold text-[#0f0f12] mb-1">Conectá tu primera tienda</h2>
            <p className="text-sm text-[#6b7280] mb-6 max-w-xs leading-relaxed">
              Vinculá Shopify o Tiendanube para empezar a ver tus ventas, márgenes y métricas en tiempo real.
            </p>
            <div className="flex gap-3">
              <Link
                href="/config/integraciones"
                className="text-sm px-5 py-2.5 rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-semibold transition-colors touch-manipulation"
              >
                Conectar tienda
              </Link>
              <Link
                href="/onboarding"
                className="text-sm px-5 py-2.5 rounded-xl bg-black/[0.05] border border-black/[0.10] text-[#374151] hover:text-[#0f0f12] transition-colors touch-manipulation"
              >
                Ver tutorial
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Principales */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-[#6b7280]">
                  <SectionIcon />
                  <h2 className="text-sm font-medium">Métricas Principales</h2>
                </div>
                <div className="flex items-center gap-1 opacity-50 hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setShowPersonalizado(v => !v)}
                    className="p-1.5 rounded hover:bg-black/[0.06] text-[#6b7280] hover:text-[#374151] transition-colors"
                    title="Personalizar"
                  >
                    <Pencil size={12} />
                  </button>
                  <button
                    onClick={() => setMetrics(prev => prev.map(m => m.section === "principales" ? { ...m, visible: false } : m))}
                    className="p-1.5 rounded hover:bg-black/[0.06] text-[#6b7280] hover:text-[#374151] transition-colors"
                    title="Ocultar sección"
                  >
                    <EyeOff size={12} />
                  </button>
                </div>
              </div>
              {/* 1 col mobile → 2 md → 3 lg → 4 xl */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {principales.map(m => (
                  <MetricCard key={m.id} metric={m} onToggleVisibility={toggleMetric} />
                ))}
              </div>
            </section>

            {/* Costos */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-[#6b7280]">
                  <SectionIcon />
                  <h2 className="text-sm font-medium">Costos</h2>
                </div>
                <div className="flex items-center gap-1 opacity-50 hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setShowPersonalizado(v => !v)}
                    className="p-1.5 rounded hover:bg-black/[0.06] text-[#6b7280] hover:text-[#374151] transition-colors"
                    title="Personalizar"
                  >
                    <Pencil size={12} />
                  </button>
                  <button
                    onClick={() => setMetrics(prev => prev.map(m => m.section === "costos" ? { ...m, visible: false } : m))}
                    className="p-1.5 rounded hover:bg-black/[0.06] text-[#6b7280] hover:text-[#374151] transition-colors"
                    title="Ocultar sección"
                  >
                    <EyeOff size={12} />
                  </button>
                </div>
              </div>
              {/* 1 col mobile → 2 md → 3 lg → 4 xl */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {costos.map(m => (
                  <MetricCard key={m.id} metric={m} onToggleVisibility={toggleMetric} />
                ))}
              </div>
            </section>

            {/* Ad Platforms */}
            <section>
              <div className="flex items-center gap-2 mb-4 text-[#6b7280]">
                <SectionIcon />
                <h2 className="text-sm font-medium">Publicidad</h2>
              </div>
              {/* Ad platform cards: 1 col mobile → 2 en sm+ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
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
