"use client"

import { useEffect, useState } from "react"
import {
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle2,
  DollarSign, Loader2, Info, ChevronDown, BarChart2,
} from "lucide-react"
import { DateRangePicker, defaultDateRange } from "@/components/DateRangePicker"
import type { DateRange } from "@/components/DateRangePicker"
import { cn } from "@/lib/utils"

// ─── Types ──────────────────────────────────────────────────────────────────

interface FinancialData {
  revenue: number
  cogs: number            // costo de mercadería vendida (estimado desde productos)
  adSpend: number         // inversión publicitaria
  fixedCosts: number      // gastos operativos fijos del mes
  shipping: number        // costos de envío
  platformFees: number    // comisiones plataforma (estimado 3%)
  paymentFees: number     // costo procesamiento pago (estimado 2%)
  orders: number
  currency: string
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function fmt(n: number, decimals = 0) {
  return n.toLocaleString("es-AR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

function fmtCurrency(n: number) {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(1)}k`
  return `$${fmt(n, 0)}`
}

function pct(num: number, den: number) {
  if (den === 0) return 0
  return (num / den) * 100
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function KpiTile({
  label, value, sub, trend, good, tooltip,
}: {
  label: string
  value: string
  sub?: string
  trend?: "up" | "down" | "neutral"
  good?: boolean
  tooltip?: string
}) {
  const trendColor =
    trend === "neutral" ? "text-white/40"
    : good === undefined ? "text-white/40"
    : good ? "text-emerald-400" : "text-red-400"

  return (
    <div className="bg-[#0f1825] border border-white/[0.07] rounded-xl px-5 py-4 flex flex-col gap-1 group relative">
      <div className="flex items-center gap-1.5">
        <p className="text-[11px] text-white/40 font-medium">{label}</p>
        {tooltip && (
          <div className="relative">
            <Info size={10} className="text-white/20 cursor-help" />
            <div className="absolute left-4 top-0 z-20 hidden group-hover:block w-52 bg-[#1a2540] border border-white/[0.10] rounded-lg px-3 py-2 text-[11px] text-white/60 leading-relaxed shadow-xl">
              {tooltip}
            </div>
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
      {sub && (
        <p className={cn("text-xs font-medium flex items-center gap-1", trendColor)}>
          {trend === "up" && <TrendingUp size={11} />}
          {trend === "down" && <TrendingDown size={11} />}
          {sub}
        </p>
      )}
    </div>
  )
}

function HealthBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium",
      ok
        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
        : "bg-red-500/10 border-red-500/20 text-red-400"
    )}>
      {ok ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
      {label}
    </div>
  )
}

function PnLRow({
  label, value, sub, indent = false, bold = false, positive, separator = false,
}: {
  label: string
  value: number
  sub?: string
  indent?: boolean
  bold?: boolean
  positive?: boolean
  separator?: boolean
}) {
  const isNegative = value < 0
  const colorClass =
    positive === undefined ? "text-white/80"
    : (positive ? "text-emerald-400" : (isNegative ? "text-red-400" : "text-emerald-400"))

  return (
    <div className={cn(
      "flex items-center justify-between py-2.5 px-5",
      separator && "border-t border-white/[0.08] mt-1",
      indent && "pl-10"
    )}>
      <div>
        <p className={cn("text-sm", bold ? "font-semibold text-white" : "text-white/60", indent && "text-xs")}>{label}</p>
        {sub && <p className="text-[10px] text-white/30 mt-0.5">{sub}</p>}
      </div>
      <p className={cn("text-sm font-semibold tabular-nums", bold ? "text-base" : "", colorClass)}>
        {isNegative ? "−" : ""}{fmtCurrency(Math.abs(value))}
      </p>
    </div>
  )
}

function CostBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pctVal = pct(value, total)
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-white/60">{label}</span>
        <span className="text-white/40 tabular-nums">{fmtCurrency(value)} <span className="text-white/25">({pctVal.toFixed(1)}%)</span></span>
      </div>
      <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${Math.min(pctVal, 100)}%` }} />
      </div>
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function FinancieroPage() {
  const [dateRange, setDateRange] = useState<DateRange>(defaultDateRange)
  const [currency, setCurrency] = useState<"ARS" | "USD">("ARS")
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<FinancialData | null>(null)
  const [expenses, setExpenses] = useState<number>(0)

  useEffect(() => {
    loadData()
  }, [dateRange])

  async function loadData() {
    setLoading(true)
    try {
      const since = dateRange.from.toISOString()
      const until = dateRange.to.toISOString()

      // Load orders/revenue from dashboard stats
      const [statsRes, expensesRes] = await Promise.all([
        fetch(`/api/dashboard/stats?since=${since}&until=${until}`),
        fetch("/api/expenses"),
      ])

      const statsData = await statsRes.json()
      const expData = await expensesRes.json()

      const revenue = statsData.metrics?.totalRevenue ?? 0
      const orders = statsData.metrics?.totalOrders ?? 0

      // Expense totals (monthly fixed costs from config)
      const monthlyExpenses: number = (expData.expenses || []).reduce((sum: number, e: any) => {
        if (e.frequency === "mensual") return sum + (e.amount || 0)
        if (e.frequency === "anual") return sum + (e.amount || 0) / 12
        return sum // unico: not included in recurrent
      }, 0)
      setExpenses(monthlyExpenses)

      // Estimates for line items we don't have exact data for yet
      const estimatedCOGS = revenue * 0.45       // 45% of revenue as cost of goods (typical e-commerce)
      const platformFees = revenue * 0.03        // 3% platform commission
      const paymentFees = revenue * 0.02         // 2% payment processing
      const shipping = orders * 950              // $950 ARS average shipping per order
      const adSpend = 411.07 * (currency === "ARS" ? 1247.5 : 1) // mock meta spend

      setData({
        revenue,
        cogs: estimatedCOGS,
        adSpend,
        fixedCosts: monthlyExpenses,
        shipping,
        platformFees,
        paymentFees,
        orders,
        currency,
      })
    } catch (e) {
      // keep old data
    } finally {
      setLoading(false)
    }
  }

  // Derived calculations
  const d = data
  const grossProfit = d ? d.revenue - d.cogs : 0
  const grossMarginPct = pct(grossProfit, d?.revenue ?? 1)

  const operatingCosts = d ? d.adSpend + d.fixedCosts + d.shipping + d.platformFees + d.paymentFees : 0
  const ebitda = grossProfit - (d?.adSpend ?? 0) - (d?.fixedCosts ?? 0)
  const netProfit = d ? grossProfit - operatingCosts : 0
  const netMarginPct = pct(netProfit, d?.revenue ?? 1)
  const ebitdaMarginPct = pct(ebitda, d?.revenue ?? 1)
  const cac = d && d.orders > 0 ? d.adSpend / d.orders : 0 // Customer Acquisition Cost
  const ltv = d && d.orders > 0 ? (d.revenue / d.orders) * 2.8 : 0 // LTV estimado (2.8x AOV según industria)
  const ltvCacRatio = cac > 0 ? ltv / cac : 0
  const breakEvenRevenue = d ? (d.fixedCosts + d.adSpend) / Math.max(grossMarginPct / 100, 0.01) : 0
  const burnRate = d ? d.fixedCosts + d.adSpend : 0 // costos recurrentes mensuales
  const roiMarketing = d && d.adSpend > 0 ? pct(grossProfit - d.adSpend, d.adSpend) : 0

  // Health checks
  const healthChecks = [
    { ok: grossMarginPct >= 40, label: `Margen bruto ${grossMarginPct.toFixed(1)}% (mín. 40%)` },
    { ok: netMarginPct >= 10, label: `Margen neto ${netMarginPct.toFixed(1)}% (mín. 10%)` },
    { ok: ltvCacRatio >= 3, label: `LTV/CAC ${ltvCacRatio.toFixed(1)}x (mín. 3x)` },
    { ok: ebitdaMarginPct >= 15, label: `EBITDA ${ebitdaMarginPct.toFixed(1)}% (mín. 15%)` },
  ]

  return (
    <div className="min-h-dvh overflow-x-hidden bg-[#080d14]">
      {/* Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-[#080d14]/90 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-medium text-white">Contable / Financiero</h1>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#4f8ef7]/15 text-[#4f8ef7] border border-[#4f8ef7]/20">
            P&L · Márgenes · Salud
          </span>
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
        </div>
      </header>

      {loading ? (
        <div className="flex items-center gap-2 text-white/40 text-sm px-6 pt-12">
          <Loader2 size={14} className="animate-spin" /> Calculando...
        </div>
      ) : (
        <div className="px-4 lg:px-6 py-4 lg:py-6 max-w-[1200px] space-y-6">

          {/* ── Banner si hay gastos pero $0 en ventas ── */}
          {d && d.revenue === 0 && (d.adSpend > 0 || d.fixedCosts > 0) && (
            <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
              <span className="text-amber-400 text-sm shrink-0 mt-0.5">⚠️</span>
              <div>
                <p className="text-sm font-semibold text-amber-300">Sin ventas en el período seleccionado</p>
                <p className="text-xs text-white/50 mt-0.5">
                  Los costos registrados (pauta, gastos fijos) están incluidos, pero no hay facturación real.
                  <a href="/config/integraciones" className="text-[#4f8ef7] hover:underline ml-1">Conectá tu tienda</a> para ver el reporte completo.
                </p>
              </div>
            </div>
          )}

          {/* ── Salud financiera (semáforo rápido) ── */}
          <section>
            <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-3">Salud del Negocio</p>
            <div className="flex flex-wrap gap-2">
              {healthChecks.map(h => <HealthBadge key={h.label} ok={h.ok} label={h.label} />)}
            </div>
          </section>

          {/* ── KPIs principales ── */}
          <section>
            <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-3">Resultados del Período</p>
            <div className="grid grid-cols-4 gap-3">
              <KpiTile
                label="Facturación Bruta"
                value={fmtCurrency(d?.revenue ?? 0)}
                tooltip="Total facturado a clientes en el período seleccionado."
              />
              <KpiTile
                label="Ganancia Bruta"
                value={fmtCurrency(grossProfit)}
                sub={`${grossMarginPct.toFixed(1)}% margen bruto`}
                trend={grossProfit >= 0 ? "up" : "down"}
                good={grossMarginPct >= 40}
                tooltip="Facturación menos costo de mercadería vendida (COGS)."
              />
              <KpiTile
                label="EBITDA"
                value={fmtCurrency(ebitda)}
                sub={`${ebitdaMarginPct.toFixed(1)}% sobre facturación`}
                trend={ebitda >= 0 ? "up" : "down"}
                good={ebitdaMarginPct >= 15}
                tooltip="Earnings before interest, taxes, depreciation and amortization. Ganancia bruta menos pauta y costos fijos."
              />
              <KpiTile
                label="Ganancia Neta"
                value={fmtCurrency(netProfit)}
                sub={`${netMarginPct.toFixed(1)}% margen neto`}
                trend={netProfit >= 0 ? "up" : "down"}
                good={netMarginPct >= 10}
                tooltip="Ganancia después de deducir todos los costos operativos."
              />
            </div>
          </section>

          {/* ── Grid: P&L + Estructura de costos ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

            {/* P&L detallado */}
            <section className="bg-[#0f1825] border border-white/[0.07] rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-white/[0.06]">
                <h2 className="text-sm font-semibold text-white">Estado de Resultados</h2>
                <p className="text-[11px] text-white/30 mt-0.5">Período seleccionado — estimaciones donde se indica</p>
              </div>
              <div className="divide-y divide-white/[0.04]">
                <PnLRow label="Facturación Bruta" value={d?.revenue ?? 0} bold />
                <PnLRow
                  label="(−) Costo de Mercadería (COGS)"
                  value={-(d?.cogs ?? 0)}
                  sub="Estimado al 45% de facturación"
                  indent
                />
                <PnLRow
                  label="Ganancia Bruta"
                  value={grossProfit}
                  bold
                  separator
                  positive
                />
                <PnLRow
                  label="(−) Inversión Publicitaria"
                  value={-(d?.adSpend ?? 0)}
                  sub="Meta Ads (datos reales)"
                  indent
                />
                <PnLRow
                  label="(−) Costos Operativos Fijos"
                  value={-(d?.fixedCosts ?? 0)}
                  sub="Gastos configurados en sistema"
                  indent
                />
                <PnLRow
                  label="EBITDA"
                  value={ebitda}
                  bold
                  separator
                  positive
                />
                <PnLRow
                  label="(−) Costos de Envío"
                  value={-(d?.shipping ?? 0)}
                  sub="Estimado $950 ARS / orden"
                  indent
                />
                <PnLRow
                  label="(−) Comisiones de Plataforma"
                  value={-(d?.platformFees ?? 0)}
                  sub="Estimado 3% facturación"
                  indent
                />
                <PnLRow
                  label="(−) Procesamiento de Pago"
                  value={-(d?.paymentFees ?? 0)}
                  sub="Estimado 2% facturación"
                  indent
                />
                <PnLRow
                  label="Ganancia Neta"
                  value={netProfit}
                  bold
                  separator
                  positive
                />
              </div>
            </section>

            {/* Estructura de costos + métricas extra */}
            <div className="space-y-4">

              {/* Estructura de costos */}
              <section className="bg-[#0f1825] border border-white/[0.07] rounded-xl p-5">
                <h2 className="text-sm font-semibold text-white mb-1">Estructura de Costos</h2>
                <p className="text-[11px] text-white/30 mb-4">Distribución sobre facturación bruta</p>
                <div className="space-y-3">
                  <CostBar label="COGS (mercadería)" value={d?.cogs ?? 0} total={d?.revenue ?? 1} color="bg-[#4f8ef7]" />
                  <CostBar label="Pauta publicitaria" value={d?.adSpend ?? 0} total={d?.revenue ?? 1} color="bg-purple-500" />
                  <CostBar label="Costos fijos" value={d?.fixedCosts ?? 0} total={d?.revenue ?? 1} color="bg-orange-500" />
                  <CostBar label="Envíos" value={d?.shipping ?? 0} total={d?.revenue ?? 1} color="bg-yellow-500" />
                  <CostBar label="Comisiones" value={(d?.platformFees ?? 0) + (d?.paymentFees ?? 0)} total={d?.revenue ?? 1} color="bg-pink-500" />
                  <div className="pt-2 mt-2 border-t border-white/[0.06] flex justify-between text-xs">
                    <span className="text-white/40">Total costos</span>
                    <span className="text-white/70 font-medium">{fmtCurrency(operatingCosts + (d?.cogs ?? 0))}</span>
                  </div>
                </div>
              </section>

              {/* KPIs avanzados */}
              <section className="bg-[#0f1825] border border-white/[0.07] rounded-xl p-5">
                <h2 className="text-sm font-semibold text-white mb-4">KPIs de Rentabilidad</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-white/[0.03] rounded-lg px-3 py-3">
                    <p className="text-[10px] text-white/30 mb-1">CAC (costo adquisición cliente)</p>
                    <p className="text-lg font-bold text-white">{fmtCurrency(cac)}</p>
                    <p className="text-[10px] text-white/30 mt-0.5">pauta ÷ órdenes</p>
                  </div>
                  <div className={cn("rounded-lg px-3 py-3", ltvCacRatio >= 3 ? "bg-emerald-500/10" : "bg-red-500/10")}>
                    <p className="text-[10px] text-white/30 mb-1">LTV / CAC</p>
                    <p className={cn("text-lg font-bold", ltvCacRatio >= 3 ? "text-emerald-400" : "text-red-400")}>
                      {ltvCacRatio.toFixed(1)}x
                    </p>
                    <p className="text-[10px] text-white/30 mt-0.5">referencia: &gt;3x saludable</p>
                  </div>
                  <div className="bg-white/[0.03] rounded-lg px-3 py-3">
                    <p className="text-[10px] text-white/30 mb-1">ROI de Marketing</p>
                    <p className={cn("text-lg font-bold", roiMarketing >= 0 ? "text-emerald-400" : "text-red-400")}>
                      {roiMarketing >= 0 ? "+" : ""}{roiMarketing.toFixed(1)}%
                    </p>
                    <p className="text-[10px] text-white/30 mt-0.5">(bruto − pauta) ÷ pauta</p>
                  </div>
                  <div className="bg-white/[0.03] rounded-lg px-3 py-3">
                    <p className="text-[10px] text-white/30 mb-1">Burn Rate Mensual</p>
                    <p className="text-lg font-bold text-white">{fmtCurrency(burnRate)}</p>
                    <p className="text-[10px] text-white/30 mt-0.5">costos fijos + pauta</p>
                  </div>
                </div>
              </section>
            </div>
          </div>

          {/* ── Punto de equilibrio ── */}
          <section className="bg-[#0f1825] border border-white/[0.07] rounded-xl p-5">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-sm font-semibold text-white mb-1">Punto de Equilibrio (Break-Even)</h2>
                <p className="text-[11px] text-white/40 leading-relaxed max-w-lg">
                  Con un margen bruto de <span className="text-white/70">{grossMarginPct.toFixed(1)}%</span> y costos fijos de{" "}
                  <span className="text-white/70">{fmtCurrency(d?.fixedCosts ?? 0 + (d?.adSpend ?? 0))}</span> mensuales,
                  necesitás facturar al menos:
                </p>
              </div>
              <div className="text-right shrink-0 ml-6">
                <p className="text-3xl font-bold text-[#4f8ef7]">{fmtCurrency(breakEvenRevenue)}</p>
                <p className="text-xs text-white/30 mt-0.5">para no perder dinero</p>
              </div>
            </div>
            {/* Visual progress */}
            {d && d.revenue > 0 && (
              <div className="mt-4">
                <div className="flex justify-between text-[10px] text-white/30 mb-1.5">
                  <span>$0</span>
                  <span className={cn(
                    "font-semibold",
                    d.revenue >= breakEvenRevenue ? "text-emerald-400" : "text-red-400"
                  )}>
                    {d.revenue >= breakEvenRevenue
                      ? `✓ Por encima del break-even en ${fmtCurrency(d.revenue - breakEvenRevenue)}`
                      : `✗ Faltan ${fmtCurrency(breakEvenRevenue - d.revenue)} para el break-even`}
                  </span>
                  <span>{fmtCurrency(breakEvenRevenue * 1.5)}</span>
                </div>
                <div className="relative h-2 bg-white/[0.06] rounded-full overflow-hidden">
                  {/* Break-even marker */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-white/20 z-10"
                    style={{ left: `${(pct(breakEvenRevenue, breakEvenRevenue * 1.5))}%` }}
                  />
                  {/* Revenue fill */}
                  <div
                    className={cn("h-full rounded-full transition-all", d.revenue >= breakEvenRevenue ? "bg-emerald-500" : "bg-red-500")}
                    style={{ width: `${Math.min(pct(d.revenue, breakEvenRevenue * 1.5), 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-white/20 mt-1">
                  <span>Facturación actual: <span className="text-white/50 font-medium">{fmtCurrency(d.revenue)}</span></span>
                  <span>Break-even: <span className="text-white/50 font-medium">{fmtCurrency(breakEvenRevenue)}</span></span>
                </div>
              </div>
            )}
          </section>

          {/* ── Notas metodológicas ── */}
          <section className="bg-[#0f1825] border border-yellow-500/20 rounded-xl p-4">
            <div className="flex gap-3">
              <AlertTriangle size={14} className="text-yellow-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-yellow-400 mb-1">Datos estimados</p>
                <p className="text-xs text-white/40 leading-relaxed">
                  COGS estimado al 45% de facturación. Envíos a $950 ARS/orden. Comisiones de plataforma al 3% y procesamiento al 2%.
                  Para mayor precisión, configurá tus costos reales en{" "}
                  <a href="/config/productos" className="text-[#4f8ef7] hover:underline">Maestro de Productos</a>{" "}
                  y{" "}
                  <a href="/config/costos" className="text-[#4f8ef7] hover:underline">Gastos Operativos</a>.
                </p>
              </div>
            </div>
          </section>

        </div>
      )}
    </div>
  )
}
