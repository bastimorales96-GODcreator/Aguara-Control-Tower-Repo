"use client"

import { useState } from "react"
import { TrendingUp, TrendingDown, Minus, ShoppingCart, DollarSign, Package, Target, ArrowRight, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

// ─── Mock data ────────────────────────────────────────────────────────────────
const TODAY = {
  date: new Date().toLocaleDateString("es-AR", { weekday: "long", year: "numeric", month: "long", day: "numeric" }),
  orders: 47,
  revenue: 3_124_500,
  avgOrder: 66_479,
  margin: 44.2,
  newCustomers: 31,
  returningCustomers: 16,
  topChannel: "Meta Ads",
  topChannelRevenue: 1_847_000,
  topProduct: "Remera Oversized Blanca",
  topProductUnits: 18,
  conversionRate: 2.8,
  adSpend: 412_000,
  roas: 4.48,
}

const YESTERDAY = { orders: 39, revenue: 2_580_000, avgOrder: 66_154, margin: 42.8, newCustomers: 25 }
const LAST_WEEK = { orders: 52, revenue: 3_410_000, avgOrder: 65_577, margin: 45.1, newCustomers: 38 }

const HOURLY = [
  { hour: "00", orders: 1 }, { hour: "02", orders: 0 }, { hour: "04", orders: 0 },
  { hour: "06", orders: 2 }, { hour: "08", orders: 4 }, { hour: "10", orders: 9 },
  { hour: "12", orders: 11 }, { hour: "14", orders: 8 }, { hour: "16", orders: 6 },
  { hour: "18", orders: 4 }, { hour: "20", orders: 2 }, { hour: "22", orders: 0 },
]

const CHANNEL_BREAKDOWN = [
  { name: "Meta Ads", revenue: 1_847_000, orders: 22, color: "#4f8ef7" },
  { name: "Google Ads", revenue: 748_000, orders: 9, color: "#a3e635" },
  { name: "Orgánico", revenue: 529_500, orders: 16, color: "#f59e0b" },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────
function pct(current: number, prev: number) {
  return Math.round(((current - prev) / prev) * 100)
}

function fmt(n: number) {
  return n.toLocaleString("es-AR")
}

function DeltaBadge({ value }: { value: number }) {
  if (value === 0) return <span className="flex items-center gap-0.5 text-[10px] text-white/30"><Minus size={9} />0%</span>
  const positive = value > 0
  return (
    <span className={cn("flex items-center gap-0.5 text-[10px] font-semibold", positive ? "text-emerald-400" : "text-red-400")}>
      {positive ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
      {positive ? "+" : ""}{value}%
    </span>
  )
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, unit = "", vsYesterday, vsLastWeek, icon }: {
  label: string; value: string; unit?: string; vsYesterday: number; vsLastWeek: number; icon: React.ReactNode
}) {
  return (
    <div className="bg-[#0f1825] border border-white/[0.07] rounded-xl p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs text-white/40">{label}</p>
        <span className="text-white/20">{icon}</span>
      </div>
      <p className="text-2xl font-bold text-white tabular-nums mb-3">{unit}{value}</p>
      <div className="flex items-center gap-4">
        <div>
          <p className="text-[10px] text-white/30 mb-0.5">vs ayer</p>
          <DeltaBadge value={vsYesterday} />
        </div>
        <div>
          <p className="text-[10px] text-white/30 mb-0.5">vs sem. pasada</p>
          <DeltaBadge value={vsLastWeek} />
        </div>
      </div>
    </div>
  )
}

// ─── Hourly sparkbar ──────────────────────────────────────────────────────────
function HourlyChart() {
  const max = Math.max(...HOURLY.map(h => h.orders))
  return (
    <div className="bg-[#0f1825] border border-white/[0.07] rounded-xl p-5">
      <p className="text-xs font-medium text-white mb-1">Órdenes por hora (hoy)</p>
      <p className="text-xs text-white/30 mb-5">Distribución de {TODAY.orders} órdenes en el día</p>
      <div className="flex items-end gap-1.5 h-16">
        {HOURLY.map((h) => (
          <div key={h.hour} className="flex-1 flex flex-col items-center gap-1">
            <div
              className="w-full rounded-sm bg-[#4f8ef7]/70 transition-all"
              style={{ height: max > 0 ? `${(h.orders / max) * 100}%` : "4px", minHeight: h.orders > 0 ? "4px" : "2px", opacity: h.orders > 0 ? 1 : 0.15 }}
            />
            <span className="text-[8px] text-white/20">{h.hour}h</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function SnapshotPage() {
  const [refreshed] = useState(false)

  const overallHealth = TODAY.margin > 44 && TODAY.roas > 4 ? "healthy" : TODAY.margin > 40 ? "warning" : "critical"
  const healthConfig = {
    healthy: { label: "Negocio saludable", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
    warning: { label: "Atención requerida", color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20" },
    critical: { label: "Acción urgente", color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
  }[overallHealth]

  return (
    <div className="min-h-screen bg-[#080d14]">
      <header className="sticky top-0 z-40 flex items-center justify-between px-6 py-3 border-b border-white/[0.06] bg-[#080d14]/90 backdrop-blur-sm">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-white/40">Reportes</span>
          <span className="text-white/20">/</span>
          <span className="text-white font-medium">Daily Snapshot</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/30">{TODAY.date}</span>
          <button className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/30 hover:text-white/60 transition-colors">
            <RefreshCw size={13} className={refreshed ? "animate-spin" : ""} />
          </button>
        </div>
      </header>

      <div className="px-6 py-6 max-w-[1200px] space-y-6">

        {/* Health banner */}
        <div className={cn("flex items-center justify-between px-5 py-3.5 rounded-xl border", healthConfig.bg)}>
          <div className="flex items-center gap-3">
            <span className={cn("text-lg font-bold", healthConfig.color)}>
              {overallHealth === "healthy" ? "✓" : overallHealth === "warning" ? "⚠" : "✗"}
            </span>
            <div>
              <p className={cn("text-sm font-semibold", healthConfig.color)}>{healthConfig.label}</p>
              <p className="text-xs text-white/40">Margen {TODAY.margin}% · ROAS {TODAY.roas}x · {TODAY.orders} órdenes hoy</p>
            </div>
          </div>
          <Link href="/alertas" className="flex items-center gap-1 text-xs text-white/40 hover:text-white/70 transition-colors">
            Ver alertas <ArrowRight size={11} />
          </Link>
        </div>

        {/* KPI grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Órdenes" value={fmt(TODAY.orders)}
            vsYesterday={pct(TODAY.orders, YESTERDAY.orders)}
            vsLastWeek={pct(TODAY.orders, LAST_WEEK.orders)}
            icon={<ShoppingCart size={15} />}
          />
          <KpiCard
            label="Revenue" value={fmt(TODAY.revenue)} unit="$"
            vsYesterday={pct(TODAY.revenue, YESTERDAY.revenue)}
            vsLastWeek={pct(TODAY.revenue, LAST_WEEK.revenue)}
            icon={<DollarSign size={15} />}
          />
          <KpiCard
            label="Ticket Promedio" value={fmt(TODAY.avgOrder)} unit="$"
            vsYesterday={pct(TODAY.avgOrder, YESTERDAY.avgOrder)}
            vsLastWeek={pct(TODAY.avgOrder, LAST_WEEK.avgOrder)}
            icon={<Target size={15} />}
          />
          <KpiCard
            label="Margen Bruto" value={`${TODAY.margin}%`}
            vsYesterday={pct(TODAY.margin, YESTERDAY.margin)}
            vsLastWeek={pct(TODAY.margin, LAST_WEEK.margin)}
            icon={<TrendingUp size={15} />}
          />
        </div>

        {/* Mid row */}
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <HourlyChart />
          </div>

          {/* Top channel */}
          <div className="bg-[#0f1825] border border-white/[0.07] rounded-xl p-5 flex flex-col gap-4">
            <p className="text-xs font-medium text-white">Breakdown por canal</p>
            <div className="space-y-3 flex-1">
              {CHANNEL_BREAKDOWN.map((ch) => {
                const pctOfTotal = Math.round((ch.revenue / TODAY.revenue) * 100)
                return (
                  <div key={ch.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-white/70">{ch.name}</span>
                      <span className="text-xs font-medium text-white/60">{pctOfTotal}%</span>
                    </div>
                    <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pctOfTotal}%`, backgroundColor: ch.color }} />
                    </div>
                    <p className="text-[10px] text-white/30 mt-0.5">${fmt(ch.revenue)} · {ch.orders} órdenes</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-3 gap-4">
          {/* Top product */}
          <div className="bg-[#0f1825] border border-white/[0.07] rounded-xl p-5">
            <p className="text-xs text-white/40 mb-1">Producto top del día</p>
            <p className="text-sm font-semibold text-white mb-1">{TODAY.topProduct}</p>
            <p className="text-xs text-white/40">{TODAY.topProductUnits} unidades vendidas</p>
            <Link href="/productos?preview=true" className="mt-4 inline-flex items-center gap-1 text-xs text-[#4f8ef7] hover:underline">
              Ver todos <ArrowRight size={10} />
            </Link>
          </div>

          {/* Clientes */}
          <div className="bg-[#0f1825] border border-white/[0.07] rounded-xl p-5">
            <p className="text-xs text-white/40 mb-3">Clientes hoy</p>
            <div className="flex items-end gap-4">
              <div>
                <p className="text-2xl font-bold text-white">{TODAY.newCustomers}</p>
                <p className="text-[10px] text-white/40">nuevos</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white/50">{TODAY.returningCustomers}</p>
                <p className="text-[10px] text-white/40">recurrentes</p>
              </div>
            </div>
            <div className="mt-3 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-[#4f8ef7]" style={{ width: `${Math.round((TODAY.newCustomers / TODAY.orders) * 100)}%` }} />
            </div>
            <p className="text-[10px] text-white/30 mt-1">{Math.round((TODAY.newCustomers / TODAY.orders) * 100)}% clientes nuevos</p>
          </div>

          {/* Ads summary */}
          <div className="bg-[#0f1825] border border-white/[0.07] rounded-xl p-5">
            <p className="text-xs text-white/40 mb-3">Performance de ads</p>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-white/50">Inversión</span>
                <span className="text-xs font-medium text-white">${fmt(TODAY.adSpend)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-white/50">ROAS</span>
                <span className={cn("text-xs font-bold", TODAY.roas >= 4 ? "text-emerald-400" : "text-yellow-400")}>{TODAY.roas}x</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-white/50">CVR</span>
                <span className="text-xs font-medium text-white">{TODAY.conversionRate}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* New customers delta */}
        <div className="bg-[#0f1825] border border-white/[0.07] rounded-xl px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package size={16} className="text-white/30" />
            <div>
              <p className="text-sm font-medium text-white">Nuevos clientes vs ayer</p>
              <p className="text-xs text-white/40">Hoy: {TODAY.newCustomers} · Ayer: {YESTERDAY.newCustomers}</p>
            </div>
          </div>
          <DeltaBadge value={pct(TODAY.newCustomers, YESTERDAY.newCustomers)} />
        </div>

      </div>
    </div>
  )
}
