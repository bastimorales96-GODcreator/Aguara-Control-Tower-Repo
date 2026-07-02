"use client"

import { useState } from "react"
import { TrendingUp, TrendingDown, Minus, ShoppingCart, DollarSign, Package, Target, ArrowRight, RefreshCw, Wallet, Truck, Clock, RotateCcw, AlertTriangle, Boxes } from "lucide-react"
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

// ─── Rentabilidad & logística ──────────────────────────────────────────────────
const OPS = {
  netProfit: 969_029,              // ganancia post margen = revenue × margen − ad spend − costos
  netProfitYesterday: 780_400,
  netProfitLastWeek: 1_020_500,
  deliveryDays: 3.2,               // tiempo de entrega promedio (menos es mejor)
  deliveryDaysYesterday: 3.5,
  deliveryDaysLastWeek: 3.0,
  otif: 92.4,                      // On-Time In-Full: entregas a tiempo y completas
  otifYesterday: 90.1,
  otifLastWeek: 94.0,
  returnsRate: 4.1,                // % de devoluciones (menos es mejor)
  returnsYesterday: 4.8,
  returnsLastWeek: 3.6,
}

// Productos en quiebre / stock crítico.
const STOCK_ALERTS: { product: string; sku: string; stock: number; status: "quiebre" | "critico" | "bajo" }[] = [
  { product: "Buzo Oversized Negro", sku: "BZ-NEG-M", stock: 0, status: "quiebre" },
  { product: "Remera Oversized Blanca", sku: "RM-BLA-L", stock: 6, status: "critico" },
  { product: "Pantalón Cargo Beige", sku: "PC-BEI-32", stock: 11, status: "bajo" },
]

// Días de cobertura de stock de los best sellers (onHand / venta diaria).
const BESTSELLERS_STOCK = [
  { product: "Remera Oversized Blanca", onHand: 108, dailySales: 18 },
  { product: "Buzo Oversized Negro", onHand: 0, dailySales: 14 },
  { product: "Gorra Trucker Lila", onHand: 320, dailySales: 12 },
  { product: "Campera Puffer Violeta", onHand: 240, dailySales: 9 },
  { product: "Pantalón Cargo Beige", onHand: 11, dailySales: 5 },
]

const STATUS_CFG: Record<string, { label: string; badge: string }> = {
  quiebre: { label: "Sin stock", badge: "bg-red-500/10 text-red-500" },
  critico: { label: "Crítico", badge: "bg-orange-500/10 text-orange-500" },
  bajo:    { label: "Bajo", badge: "bg-yellow-500/10 text-yellow-600" },
}

function stockCover(days: number) {
  if (days <= 0)  return { bar: "bg-red-500", text: "text-red-500" }
  if (days < 7)   return { bar: "bg-orange-500", text: "text-orange-500" }
  if (days < 14)  return { bar: "bg-yellow-500", text: "text-yellow-600" }
  return { bar: "bg-emerald-500", text: "text-emerald-500" }
}

const HOURLY = [
  { hour: "00", orders: 1 }, { hour: "02", orders: 0 }, { hour: "04", orders: 0 },
  { hour: "06", orders: 2 }, { hour: "08", orders: 4 }, { hour: "10", orders: 9 },
  { hour: "12", orders: 11 }, { hour: "14", orders: 8 }, { hour: "16", orders: 6 },
  { hour: "18", orders: 4 }, { hour: "20", orders: 2 }, { hour: "22", orders: 0 },
]

const CHANNEL_BREAKDOWN = [
  { name: "Meta Ads", revenue: 1_847_000, orders: 22, color: "#7c3aed" },
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

function DeltaBadge({ value, invert = false }: { value: number; invert?: boolean }) {
  if (value === 0) return <span className="flex items-center gap-0.5 text-[10px] text-[#9ca3af]"><Minus size={9} />0%</span>
  const up = value > 0
  const good = invert ? value < 0 : value > 0   // en métricas "menos es mejor" (entrega, devoluciones) bajar es bueno
  return (
    <span className={cn("flex items-center gap-0.5 text-[10px] font-semibold", good ? "text-emerald-400" : "text-red-400")}>
      {up ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
      {up ? "+" : ""}{value}%
    </span>
  )
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, unit = "", vsYesterday, vsLastWeek, icon, invert = false }: {
  label: string; value: string; unit?: string; vsYesterday: number; vsLastWeek: number; icon: React.ReactNode; invert?: boolean
}) {
  return (
    <div className="bg-white border border-black/[0.08] rounded-xl p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs text-[#6b7280]">{label}</p>
        <span className="text-[#9ca3af]">{icon}</span>
      </div>
      <p className="text-2xl font-bold text-[#0f0f12] tabular-nums mb-3">{unit}{value}</p>
      <div className="flex items-center gap-4">
        <div>
          <p className="text-[10px] text-[#9ca3af] mb-0.5">vs ayer</p>
          <DeltaBadge value={vsYesterday} invert={invert} />
        </div>
        <div>
          <p className="text-[10px] text-[#9ca3af] mb-0.5">vs sem. pasada</p>
          <DeltaBadge value={vsLastWeek} invert={invert} />
        </div>
      </div>
    </div>
  )
}

// ─── Hourly sparkbar ──────────────────────────────────────────────────────────
function HourlyChart() {
  const max = Math.max(...HOURLY.map(h => h.orders))
  return (
    <div className="bg-white border border-black/[0.08] rounded-xl p-5">
      <p className="text-xs font-medium text-[#0f0f12] mb-1">Órdenes por hora (hoy)</p>
      <p className="text-xs text-[#9ca3af] mb-5">Distribución de {TODAY.orders} órdenes en el día</p>
      <div className="flex items-end gap-1.5 h-16">
        {HOURLY.map((h) => (
          <div key={h.hour} className="flex-1 flex flex-col items-center gap-1">
            <div
              className="w-full rounded-sm bg-[#7c3aed]/70 transition-all"
              style={{ height: max > 0 ? `${(h.orders / max) * 100}%` : "4px", minHeight: h.orders > 0 ? "4px" : "2px", opacity: h.orders > 0 ? 1 : 0.15 }}
            />
            <span className="text-[8px] text-[#9ca3af]">{h.hour}h</span>
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
    <div className="min-h-dvh overflow-x-hidden bg-white">
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 border-b border-black/[0.08] bg-white/90 backdrop-blur-sm">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-[#6b7280]">Reportes</span>
          <span className="text-[#9ca3af]">/</span>
          <span className="text-[#0f0f12] font-medium">Daily Snapshot</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#9ca3af]">{TODAY.date}</span>
          <button className="p-1.5 rounded-lg hover:bg-black/[0.05] text-[#9ca3af] hover:text-[#374151] transition-colors">
            <RefreshCw size={13} className={refreshed ? "animate-spin" : ""} />
          </button>
        </div>
      </header>

      <div className="px-4 lg:px-6 py-4 lg:py-6 max-w-[1200px] space-y-6">

        {/* Health banner */}
        <div className={cn("flex items-center justify-between px-5 py-3.5 rounded-xl border", healthConfig.bg)}>
          <div className="flex items-center gap-3">
            <span className={cn("text-lg font-bold", healthConfig.color)}>
              {overallHealth === "healthy" ? "✓" : overallHealth === "warning" ? "⚠" : "✗"}
            </span>
            <div>
              <p className={cn("text-sm font-semibold", healthConfig.color)}>{healthConfig.label}</p>
              <p className="text-xs text-[#6b7280]">Margen {TODAY.margin}% · ROAS {TODAY.roas}x · {TODAY.orders} órdenes hoy</p>
            </div>
          </div>
          <Link href="/alertas" className="flex items-center gap-1 text-xs text-[#6b7280] hover:text-[#374151] transition-colors">
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

        {/* Rentabilidad & logística */}
        <div>
          <h2 className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider mb-3">Rentabilidad & Logística</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              label="Ganancia post margen" value={fmt(OPS.netProfit)} unit="$"
              vsYesterday={pct(OPS.netProfit, OPS.netProfitYesterday)}
              vsLastWeek={pct(OPS.netProfit, OPS.netProfitLastWeek)}
              icon={<Wallet size={15} />}
            />
            <KpiCard
              label="Tiempo de entrega" value={`${OPS.deliveryDays} d`}
              vsYesterday={pct(OPS.deliveryDays, OPS.deliveryDaysYesterday)}
              vsLastWeek={pct(OPS.deliveryDays, OPS.deliveryDaysLastWeek)}
              icon={<Truck size={15} />} invert
            />
            <KpiCard
              label="Entregas OTIF" value={`${OPS.otif}%`}
              vsYesterday={pct(OPS.otif, OPS.otifYesterday)}
              vsLastWeek={pct(OPS.otif, OPS.otifLastWeek)}
              icon={<Clock size={15} />}
            />
            <KpiCard
              label="Devoluciones" value={`${OPS.returnsRate}%`}
              vsYesterday={pct(OPS.returnsRate, OPS.returnsYesterday)}
              vsLastWeek={pct(OPS.returnsRate, OPS.returnsLastWeek)}
              icon={<RotateCcw size={15} />} invert
            />
          </div>
        </div>

        {/* Mid row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="col-span-2">
            <HourlyChart />
          </div>

          {/* Top channel */}
          <div className="bg-white border border-black/[0.08] rounded-xl p-5 flex flex-col gap-4">
            <p className="text-xs font-medium text-[#0f0f12]">Breakdown por canal</p>
            <div className="space-y-3 flex-1">
              {CHANNEL_BREAKDOWN.map((ch) => {
                const pctOfTotal = Math.round((ch.revenue / TODAY.revenue) * 100)
                return (
                  <div key={ch.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-[#374151]">{ch.name}</span>
                      <span className="text-xs font-medium text-[#374151]">{pctOfTotal}%</span>
                    </div>
                    <div className="h-1.5 bg-black/[0.05] rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pctOfTotal}%`, backgroundColor: ch.color }} />
                    </div>
                    <p className="text-[10px] text-[#9ca3af] mt-0.5">${fmt(ch.revenue)} · {ch.orders} órdenes</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Top product */}
          <div className="bg-white border border-black/[0.08] rounded-xl p-5">
            <p className="text-xs text-[#6b7280] mb-1">Producto top del día</p>
            <p className="text-sm font-semibold text-[#0f0f12] mb-1">{TODAY.topProduct}</p>
            <p className="text-xs text-[#6b7280]">{TODAY.topProductUnits} unidades vendidas</p>
            <Link href="/productos?preview=true" className="mt-4 inline-flex items-center gap-1 text-xs text-[#7c3aed] hover:underline">
              Ver todos <ArrowRight size={10} />
            </Link>
          </div>

          {/* Clientes */}
          <div className="bg-white border border-black/[0.08] rounded-xl p-5">
            <p className="text-xs text-[#6b7280] mb-3">Clientes hoy</p>
            <div className="flex items-end gap-4">
              <div>
                <p className="text-2xl font-bold text-[#0f0f12]">{TODAY.newCustomers}</p>
                <p className="text-[10px] text-[#6b7280]">nuevos</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-[#6b7280]">{TODAY.returningCustomers}</p>
                <p className="text-[10px] text-[#6b7280]">recurrentes</p>
              </div>
            </div>
            <div className="mt-3 h-1.5 bg-black/[0.05] rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-[#7c3aed]" style={{ width: `${Math.round((TODAY.newCustomers / TODAY.orders) * 100)}%` }} />
            </div>
            <p className="text-[10px] text-[#9ca3af] mt-1">{Math.round((TODAY.newCustomers / TODAY.orders) * 100)}% clientes nuevos</p>
          </div>

          {/* Ads summary */}
          <div className="bg-white border border-black/[0.08] rounded-xl p-5">
            <p className="text-xs text-[#6b7280] mb-3">Performance de ads</p>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-[#6b7280]">Inversión</span>
                <span className="text-xs font-medium text-[#0f0f12]">${fmt(TODAY.adSpend)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-[#6b7280]">ROAS</span>
                <span className={cn("text-xs font-bold", TODAY.roas >= 4 ? "text-emerald-400" : "text-yellow-400")}>{TODAY.roas}x</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-[#6b7280]">CVR</span>
                <span className="text-xs font-medium text-[#0f0f12]">{TODAY.conversionRate}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Inventario */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Quiebre de stock */}
          <div className="bg-white border border-black/[0.08] rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-[#0f0f12] flex items-center gap-1.5">
                <AlertTriangle size={13} className="text-red-400" /> Quiebre de stock
              </p>
              <Link href="/inventario" className="text-[10px] text-[#7c3aed] hover:underline">Ver inventario</Link>
            </div>
            {STOCK_ALERTS.length === 0 ? (
              <p className="text-xs text-[#9ca3af] py-4 text-center">Sin quiebres — todo el catálogo con stock 👌</p>
            ) : (
              <div className="space-y-1">
                {STOCK_ALERTS.map((s) => {
                  const cfg = STATUS_CFG[s.status]
                  return (
                    <div key={s.sku} className="flex items-center justify-between py-2 border-b border-black/[0.04] last:border-0">
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-[#0f0f12] truncate">{s.product}</p>
                        <p className="text-[10px] text-[#9ca3af]">{s.sku}</p>
                      </div>
                      <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0", cfg.badge)}>
                        {s.stock === 0 ? cfg.label : `${cfg.label} · ${s.stock} u.`}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Días de stock — best sellers */}
          <div className="bg-white border border-black/[0.08] rounded-xl p-5">
            <p className="text-xs font-medium text-[#0f0f12] flex items-center gap-1.5 mb-3">
              <Boxes size={13} className="text-[#7c3aed]" /> Días de stock — Best sellers
            </p>
            <div className="space-y-3">
              {BESTSELLERS_STOCK.map((b) => {
                const days = b.dailySales > 0 ? b.onHand / b.dailySales : Infinity
                const c = stockCover(days)
                const barPct = Math.min((days / 30) * 100, 100)
                return (
                  <div key={b.product}>
                    <div className="flex items-center justify-between mb-1 gap-2">
                      <span className="text-xs text-[#374151] truncate">{b.product}</span>
                      <span className={cn("text-xs font-semibold shrink-0", c.text)}>
                        {days === 0 ? "Quiebre" : `${days.toFixed(days < 10 ? 1 : 0)} días`}
                      </span>
                    </div>
                    <div className="h-1.5 bg-black/[0.05] rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full", c.bar)} style={{ width: `${barPct}%` }} />
                    </div>
                    <p className="text-[10px] text-[#9ca3af] mt-0.5">{b.onHand} u. · vende {b.dailySales}/día</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* New customers delta */}
        <div className="bg-white border border-black/[0.08] rounded-xl px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package size={16} className="text-[#9ca3af]" />
            <div>
              <p className="text-sm font-medium text-[#0f0f12]">Nuevos clientes vs ayer</p>
              <p className="text-xs text-[#6b7280]">Hoy: {TODAY.newCustomers} · Ayer: {YESTERDAY.newCustomers}</p>
            </div>
          </div>
          <DeltaBadge value={pct(TODAY.newCustomers, YESTERDAY.newCustomers)} />
        </div>

      </div>
    </div>
  )
}
