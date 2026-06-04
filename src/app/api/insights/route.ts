import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export type InsightSeverity = "critical" | "warning" | "positive" | "info"

export interface Insight {
  id: string
  title: string
  detail: string
  severity: InsightSeverity
  metric?: string
  actionLabel?: string
  actionHref?: string
}

// ─── Thresholds ──────────────────────────────────────────────────────────────
const T = {
  revenueDropWarning:  -0.15,  // -15% revenue week-over-week → warning
  revenueDropCritical: -0.30,  // -30% → critical
  ordersDropWarning:   -0.20,
  ordersDropCritical:  -0.40,
  aovDropWarning:      -0.10,
  cancelRateWarning:    0.12,  // >12% cancel rate
  cancelRateCritical:   0.25,
  silentHours:           6,    // no orders for N hours in business hours
}

function pct(val: number): string {
  const sign = val > 0 ? "+" : ""
  return `${sign}${(val * 100).toFixed(1)}%`
}

function fmtCurrency(v: number): string {
  return `$${Math.round(v).toLocaleString("es-AR")}`
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: connections } = await supabase
    .from("store_connections")
    .select("*")
    .eq("user_id", user.id)

  const activeStore = connections?.find(c => ["shopify", "tiendanube"].includes(c.platform))
  if (!activeStore) {
    return NextResponse.json({ insights: [] })
  }

  // Fetch last 14 days + prior 14 days to compute WoW comparisons
  const now    = new Date()
  const d7ago  = new Date(now.getTime() - 7  * 86400000)
  const d14ago = new Date(now.getTime() - 14 * 86400000)

  async function fetchOrders(since: Date, until: Date) {
    let url = ""
    let headers: Record<string, string> = {}

    if (activeStore.platform === "shopify") {
      url = `https://${activeStore.store_id}/admin/api/2024-01/orders.json?status=any&limit=250&created_at_min=${since.toISOString()}&created_at_max=${until.toISOString()}`
      headers = { "X-Shopify-Access-Token": activeStore.access_token }
    } else {
      url = `https://api.tiendanube.com/v1/${activeStore.store_id}/orders?per_page=200&created_at_min=${since.toISOString()}&created_at_max=${until.toISOString()}`
      headers = {
        Authorization: `bearer ${activeStore.access_token}`,
        "User-Agent": `Aguara (${process.env.TIENDANUBE_APP_ID}) sebastian@aguara.io`,
      }
    }

    try {
      const res = await fetch(url, { headers })
      if (!res.ok) return []
      const data = await res.json()
      return activeStore.platform === "shopify" ? (data.orders ?? []) : (data ?? [])
    } catch {
      return []
    }
  }

  const [currentOrders, prevOrders] = await Promise.all([
    fetchOrders(d7ago, now),
    fetchOrders(d14ago, d7ago),
  ])

  // ─── Aggregate helpers ────────────────────────────────────────────────────
  function agg(orders: any[]) {
    const paid = orders.filter(o =>
      activeStore.platform === "shopify"
        ? o.financial_status === "paid"
        : o.payment_status === "paid"
    )
    const cancelled = orders.filter(o =>
      activeStore.platform === "shopify"
        ? ["voided", "refunded"].includes(o.financial_status)
        : ["refunded", "voided"].includes(o.payment_status)
    )
    const revenue = paid.reduce((s: number, o: any) =>
      s + parseFloat(activeStore.platform === "shopify" ? o.total_price : o.total), 0)
    return {
      total: orders.length,
      paid: paid.length,
      cancelled: cancelled.length,
      revenue,
      aov: paid.length > 0 ? revenue / paid.length : 0,
      cancelRate: orders.length > 0 ? cancelled.length / orders.length : 0,
    }
  }

  const curr = agg(currentOrders)
  const prev = agg(prevOrders)

  const insights: Insight[] = []
  let id = 0

  // ─── Revenue trend ───────────────────────────────────────────────────────
  if (prev.revenue > 0) {
    const delta = (curr.revenue - prev.revenue) / prev.revenue
    if (delta <= T.revenueDropCritical) {
      insights.push({
        id: String(id++), severity: "critical",
        title: "Caída severa en facturación",
        detail: `La facturación de esta semana bajó ${pct(delta)} vs la semana anterior.`,
        metric: fmtCurrency(curr.revenue),
        actionLabel: "Ver ventas", actionHref: "/reportes/financiero",
      })
    } else if (delta <= T.revenueDropWarning) {
      insights.push({
        id: String(id++), severity: "warning",
        title: "Facturación por debajo de la semana pasada",
        detail: `Caída del ${pct(delta)} semana a semana. Revisá campañas activas.`,
        metric: fmtCurrency(curr.revenue),
        actionLabel: "Ver publicidad", actionHref: "/publicidad",
      })
    } else if (delta >= 0.20) {
      insights.push({
        id: String(id++), severity: "positive",
        title: "¡Semana récord en facturación!",
        detail: `La facturación subió ${pct(delta)} vs la semana anterior.`,
        metric: fmtCurrency(curr.revenue),
      })
    }
  }

  // ─── Orders trend ────────────────────────────────────────────────────────
  if (prev.paid > 0) {
    const delta = (curr.paid - prev.paid) / prev.paid
    if (delta <= T.ordersDropCritical) {
      insights.push({
        id: String(id++), severity: "critical",
        title: "Volumen de órdenes muy bajo",
        detail: `${curr.paid} órdenes pagadas esta semana vs ${prev.paid} la semana pasada (${pct(delta)}).`,
        metric: `${curr.paid} órdenes`,
        actionLabel: "Ver snapshot", actionHref: "/reportes/snapshot",
      })
    } else if (delta <= T.ordersDropWarning) {
      insights.push({
        id: String(id++), severity: "warning",
        title: "Menos órdenes que la semana pasada",
        detail: `${pct(delta)} de variación. Puede indicar problemas de tráfico o conversión.`,
        metric: `${curr.paid} órdenes`,
      })
    }
  }

  // ─── AOV trend ───────────────────────────────────────────────────────────
  if (prev.aov > 0) {
    const delta = (curr.aov - prev.aov) / prev.aov
    if (delta <= T.aovDropWarning) {
      insights.push({
        id: String(id++), severity: "warning",
        title: "Ticket promedio cayendo",
        detail: `El AOV bajó de ${fmtCurrency(prev.aov)} a ${fmtCurrency(curr.aov)} (${pct(delta)}).`,
        metric: fmtCurrency(curr.aov),
      })
    } else if (delta >= 0.15) {
      insights.push({
        id: String(id++), severity: "positive",
        title: "Ticket promedio en alza",
        detail: `AOV subió de ${fmtCurrency(prev.aov)} a ${fmtCurrency(curr.aov)} (${pct(delta)}).`,
        metric: fmtCurrency(curr.aov),
      })
    }
  }

  // ─── Cancel rate ─────────────────────────────────────────────────────────
  if (curr.cancelRate >= T.cancelRateCritical) {
    insights.push({
      id: String(id++), severity: "critical",
      title: "Tasa de cancelación crítica",
      detail: `${(curr.cancelRate * 100).toFixed(1)}% de las órdenes fueron canceladas/reembolsadas esta semana.`,
      metric: `${curr.cancelled} canceladas`,
      actionLabel: "Ver órdenes", actionHref: "/",
    })
  } else if (curr.cancelRate >= T.cancelRateWarning) {
    insights.push({
      id: String(id++), severity: "warning",
      title: "Tasa de cancelación elevada",
      detail: `${(curr.cancelRate * 100).toFixed(1)}% de cancelaciones. Revisá métodos de pago y stock.`,
      metric: `${curr.cancelled} canceladas`,
    })
  }

  // ─── 24h silence check ───────────────────────────────────────────────────
  const last24h = currentOrders.filter((o: any) => {
    const created = new Date(o.created_at)
    return (now.getTime() - created.getTime()) < 86400000
  })
  if (last24h.length === 0 && curr.paid > 0) {
    insights.push({
      id: String(id++), severity: "warning",
      title: "Sin órdenes en las últimas 24 horas",
      detail: "No se registraron órdenes nuevas hoy. Verificá que las integraciones estén activas.",
      actionLabel: "Ver integraciones", actionHref: "/config/integraciones",
    })
  }

  // ─── Fallback — all good ─────────────────────────────────────────────────
  if (insights.length === 0 && curr.paid > 0) {
    insights.push({
      id: String(id++), severity: "positive",
      title: "Todo en orden",
      detail: `${curr.paid} órdenes pagadas esta semana, sin anomalías detectadas.`,
      metric: fmtCurrency(curr.revenue),
    })
  }

  return NextResponse.json({ insights })
}
