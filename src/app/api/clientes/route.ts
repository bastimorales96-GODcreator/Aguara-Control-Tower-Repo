import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// ─── RFM segmentation ─────────────────────────────────────────────────────────
// Recency: days since last order  (lower = better)
// Frequency: number of orders     (higher = better)
// Monetary: total spent           (higher = better)

interface OrderEvent { date: Date; amount: number }

interface CustomerStats {
  id: string
  name: string
  email: string
  totalOrders: number
  totalSpent: number
  firstOrderAt: Date
  lastOrderAt: Date
  daysSinceLastOrder: number
  orders: OrderEvent[]
  // computed later
  cadenceDays: number      // avg days between orders (0 if single order)
  predictedNextAt: Date | null
  overdue: boolean
  healthScore: number      // 0-100
}

type RFMSegment = "champions" | "loyal" | "promising" | "at-risk" | "lost" | "new"

function classifyRFM(c: CustomerStats): RFMSegment {
  const { daysSinceLastOrder, totalOrders } = c
  if (totalOrders === 1 && daysSinceLastOrder <= 30) return "new"
  if (daysSinceLastOrder <= 30  && totalOrders >= 5) return "champions"
  if (daysSinceLastOrder <= 60  && totalOrders >= 3) return "loyal"
  if (daysSinceLastOrder <= 120 && totalOrders >= 2) return "promising"
  if (daysSinceLastOrder > 120) return "lost"
  if (daysSinceLastOrder > 60) return "at-risk"
  return "promising"
}

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}
function shortMonth(y: number, m: number) {
  return new Date(y, m - 1).toLocaleString("es-AR", { month: "short" })
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: connections } = await supabase
    .from("store_connections")
    .select("*")
    .eq("user_id", user.id)

  const activeStore = connections?.find(c => ["shopify", "tiendanube", "mercadolibre"].includes(c.platform))
  const empty = { segments: [], kpis: null, cohort: null, revenueCohort: null, health: null, pulse: null, concentration: null, timeToSecond: null, ltvCac: null, actionLists: null, nextBestAction: null }
  if (!activeStore) return NextResponse.json(empty)

  // Fetch orders (last ~6 months). NOTE: capped window — full history requires backfill.
  const since6m = new Date(Date.now() - 180 * 86400000).toISOString()
  let rawOrders: any[] = []

  try {
    if (activeStore.platform === "shopify") {
      const url = `https://${activeStore.store_id}/admin/api/2024-01/orders.json?status=any&limit=250&financial_status=paid&created_at_min=${since6m}&fields=id,email,customer,total_price,created_at,financial_status,source_name`
      const res = await fetch(url, { headers: { "X-Shopify-Access-Token": activeStore.access_token } })
      if (res.ok) rawOrders = (await res.json()).orders ?? []
    } else if (activeStore.platform === "tiendanube") {
      const url = `https://api.tiendanube.com/v1/${activeStore.store_id}/orders?per_page=200&payment_status=paid&created_at_min=${since6m}`
      const res = await fetch(url, {
        headers: {
          Authorization: `bearer ${activeStore.access_token}`,
          "User-Agent": `Aguara (${process.env.TIENDANUBE_APP_ID}) sebastian@aguara.io`,
        },
      })
      if (res.ok) rawOrders = await res.json()
    } else if (activeStore.platform === "mercadolibre") {
      const url = `https://api.mercadolibre.com/orders/search?seller=${activeStore.store_id}&order.status=paid&sort=date_desc&limit=50&order.date_created.from=${since6m}`
      const res = await fetch(url, { headers: { Authorization: `Bearer ${activeStore.access_token}` } })
      if (res.ok) rawOrders = (await res.json()).results ?? []
    }
  } catch { /* fall through */ }

  if (rawOrders.length === 0) return NextResponse.json(empty)

  // ─── Normalize + aggregate per customer ──────────────────────────────────
  const now = new Date()
  const customerMap = new Map<string, CustomerStats>()

  function parseOrder(o: any): { id: string; name: string; email: string; amount: number; date: Date } {
    if (activeStore!.platform === "shopify") {
      return {
        id: String(o.customer?.id || o.email || "guest"),
        name: o.customer ? `${o.customer.first_name ?? ""} ${o.customer.last_name ?? ""}`.trim() || "Invitado" : "Invitado",
        email: o.email ?? "",
        amount: parseFloat(o.total_price ?? "0"),
        date: new Date(o.created_at),
      }
    } else if (activeStore!.platform === "tiendanube") {
      return {
        id: String(o.customer?.id || o.contact_email || "guest"),
        name: o.customer?.name ?? "Invitado",
        email: o.contact_email ?? o.customer?.email ?? "",
        amount: parseFloat(o.total ?? "0"),
        date: new Date(o.created_at),
      }
    } else {
      const buyer = o.buyer ?? {}
      return {
        id: String(buyer.id || buyer.nickname || "guest"),
        name: [buyer.first_name, buyer.last_name].filter(Boolean).join(" ") || buyer.nickname || "Comprador ML",
        email: buyer.email ?? "",
        amount: parseFloat(o.total_amount ?? o.paid_amount ?? "0"),
        date: new Date(o.date_created),
      }
    }
  }

  for (const o of rawOrders) {
    const p = parseOrder(o)
    if (!customerMap.has(p.id)) {
      customerMap.set(p.id, {
        id: p.id, name: p.name, email: p.email,
        totalOrders: 0, totalSpent: 0,
        firstOrderAt: p.date, lastOrderAt: p.date, daysSinceLastOrder: 0,
        orders: [], cadenceDays: 0, predictedNextAt: null, overdue: false, healthScore: 0,
      })
    }
    const c = customerMap.get(p.id)!
    c.totalOrders++
    c.totalSpent += p.amount
    c.orders.push({ date: p.date, amount: p.amount })
    if (p.date < c.firstOrderAt) c.firstOrderAt = p.date
    if (p.date > c.lastOrderAt) c.lastOrderAt = p.date
  }

  const customers = Array.from(customerMap.values())
  const total = customers.length

  // Per-customer derived metrics
  const avgLTVpre = total > 0 ? customers.reduce((s, c) => s + c.totalSpent, 0) / total : 1
  for (const c of customers) {
    c.orders.sort((a, b) => a.date.getTime() - b.date.getTime())
    c.daysSinceLastOrder = Math.floor((now.getTime() - c.lastOrderAt.getTime()) / 86400000)
    if (c.totalOrders >= 2) {
      const spanDays = (c.lastOrderAt.getTime() - c.firstOrderAt.getTime()) / 86400000
      c.cadenceDays = Math.round(spanDays / (c.totalOrders - 1))
      c.predictedNextAt = new Date(c.lastOrderAt.getTime() + c.cadenceDays * 86400000)
      c.overdue = c.cadenceDays > 0 && c.daysSinceLastOrder > c.cadenceDays * 1.5
    }
    // Health score 0-100: recency 40% + frequency 30% + monetary 30%
    const recency = Math.max(0, 100 - (c.daysSinceLastOrder / 180) * 100)
    const frequency = Math.min(100, (c.totalOrders / 6) * 100)
    const monetary = Math.min(100, (c.totalSpent / (avgLTVpre * 2)) * 100)
    c.healthScore = Math.round(recency * 0.4 + frequency * 0.3 + monetary * 0.3)
  }

  // ─── Segments ─────────────────────────────────────────────────────────────
  const segmentMap: Record<RFMSegment, CustomerStats[]> = { champions: [], loyal: [], promising: [], "at-risk": [], lost: [], new: [] }
  for (const c of customers) segmentMap[classifyRFM(c)].push(c)

  const segmentSummary = Object.entries(segmentMap).map(([seg, list]) => ({
    id: seg,
    count: list.length,
    pct: total > 0 ? Math.round((list.length / total) * 1000) / 10 : 0,
    avgLTV: list.length > 0 ? Math.round(list.reduce((s, c) => s + c.totalSpent, 0) / list.length) : 0,
    avgOrders: list.length > 0 ? Math.round((list.reduce((s, c) => s + c.totalOrders, 0) / list.length) * 10) / 10 : 0,
  }))

  // ─── KPIs ─────────────────────────────────────────────────────────────────
  const returningCustomers = customers.filter(c => c.totalOrders > 1).length
  const avgLTV = Math.round(avgLTVpre)
  const avgOrders = total > 0 ? Math.round((customers.reduce((s, c) => s + c.totalOrders, 0) / total) * 10) / 10 : 0
  const monthAgo = new Date(now.getTime() - 30 * 86400000)
  const newThisMonth = customers.filter(c => c.firstOrderAt >= monthAgo).length
  const returning = customers.filter(c => c.totalOrders > 1)
  const avgDaysBetween = returning.length > 0
    ? Math.round(returning.map(c => c.cadenceDays).reduce((a, b) => a + b, 0) / returning.length) : 0
  const overdueCount = customers.filter(c => c.overdue).length

  // ─── Base pulse ─────────────────────────────────────────────────────────────
  const pulse = {
    active: customers.filter(c => c.daysSinceLastOrder <= 60).length,
    atRisk: customers.filter(c => c.daysSinceLastOrder > 60 && c.daysSinceLastOrder <= 120).length,
    dormant: customers.filter(c => c.daysSinceLastOrder > 120 && c.daysSinceLastOrder <= 180).length,
    lost: customers.filter(c => c.daysSinceLastOrder > 180).length,
  }

  // ─── Health distribution ──────────────────────────────────────────────────
  const health = {
    avgScore: total > 0 ? Math.round(customers.reduce((s, c) => s + c.healthScore, 0) / total) : 0,
    distribution: {
      excelente: customers.filter(c => c.healthScore >= 75).length,
      bien: customers.filter(c => c.healthScore >= 50 && c.healthScore < 75).length,
      regular: customers.filter(c => c.healthScore >= 30 && c.healthScore < 50).length,
      pobre: customers.filter(c => c.healthScore < 30).length,
    },
    overdue: overdueCount,
  }

  // ─── Concentration (Pareto) ─────────────────────────────────────────────────
  const totalRevenue = customers.reduce((s, c) => s + c.totalSpent, 0)
  const sortedBySpend = [...customers].sort((a, b) => b.totalSpent - a.totalSpent)
  function topShare(fraction: number) {
    const n = Math.max(1, Math.ceil(total * fraction))
    const rev = sortedBySpend.slice(0, n).reduce((s, c) => s + c.totalSpent, 0)
    return { count: n, revenuePct: totalRevenue > 0 ? Math.round((rev / totalRevenue) * 1000) / 10 : 0 }
  }
  const concentration = { top1: topShare(0.01), top10: topShare(0.10), top20: topShare(0.20) }

  // ─── Time to 2nd purchase ────────────────────────────────────────────────
  const secondGaps: number[] = customers
    .filter(c => c.orders.length >= 2)
    .map(c => Math.round((c.orders[1].date.getTime() - c.orders[0].date.getTime()) / 86400000))
  secondGaps.sort((a, b) => a - b)
  const medianSecond = secondGaps.length > 0 ? secondGaps[Math.floor(secondGaps.length / 2)] : null
  const buckets = [
    { label: "0-7 días", min: 0, max: 7 },
    { label: "8-30 días", min: 8, max: 30 },
    { label: "31-60 días", min: 31, max: 60 },
    { label: "61-90 días", min: 61, max: 90 },
    { label: "90+ días", min: 91, max: Infinity },
  ]
  const timeToSecond = {
    medianDays: medianSecond,
    repeaters: secondGaps.length,
    distribution: buckets.map(b => ({ label: b.label, count: secondGaps.filter(g => g >= b.min && g <= b.max).length })),
  }

  // ─── Cohorts (retention % + cumulative revenue per customer) ──────────────
  const cohortMonths: string[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    cohortMonths.push(monthKey(d))
  }

  const cohortRetention = cohortMonths.map((cohortKey, ci) => {
    const [cy, cm] = cohortKey.split("-").map(Number)
    const cohortCustomers = customers.filter(c => c.firstOrderAt.getFullYear() === cy && (c.firstOrderAt.getMonth() + 1) === cm)
    const cohortSize = cohortCustomers.length
    if (cohortSize === 0) return { month: shortMonth(cy, cm), cohortSize: 0, retention: [] as (number | null)[] }

    const retention: (number | null)[] = cohortMonths.map((targetKey, ti) => {
      if (ti < ci) return null
      if (ti === ci) return 100
      const [ty, tm] = targetKey.split("-").map(Number)
      const mStart = new Date(ty, tm - 1, 1)
      const mEnd = new Date(ty, tm, 0, 23, 59, 59)
      if (mStart > now) return null
      const retained = cohortCustomers.filter(c => c.orders.some(o => o.date >= mStart && o.date <= mEnd)).length
      return Math.round((retained / cohortSize) * 100)
    })
    return { month: shortMonth(cy, cm), cohortSize, retention }
  })

  // Cumulative avg revenue per customer, by month offset
  const revenueCohortData = cohortMonths.map((cohortKey, ci) => {
    const [cy, cm] = cohortKey.split("-").map(Number)
    const cohortCustomers = customers.filter(c => c.firstOrderAt.getFullYear() === cy && (c.firstOrderAt.getMonth() + 1) === cm)
    const cohortSize = cohortCustomers.length
    if (cohortSize === 0) return { month: shortMonth(cy, cm), cohortSize: 0, cumRevenue: [] as (number | null)[] }

    let cumulative = 0
    const cumRevenue: (number | null)[] = cohortMonths.map((targetKey, ti) => {
      if (ti < ci) return null
      const [ty, tm] = targetKey.split("-").map(Number)
      const mStart = new Date(ty, tm - 1, 1)
      const mEnd = new Date(ty, tm, 0, 23, 59, 59)
      if (mStart > now) return null
      let monthRev = 0
      for (const c of cohortCustomers) for (const o of c.orders) if (o.date >= mStart && o.date <= mEnd) monthRev += o.amount
      cumulative += monthRev
      return Math.round(cumulative / cohortSize)
    })
    return { month: shortMonth(cy, cm), cohortSize, cumRevenue }
  })

  const cohortLabels = cohortMonths.map(k => { const [y, m] = k.split("-").map(Number); return shortMonth(y, m) })

  // ─── LTV:CAC (blended) — requires connected ad spend ──────────────────────
  let ltvCac: any = null
  try {
    const { data: adRows } = await supabase
      .from("ad_metrics")
      .select("spend, date")
      .eq("user_id", user.id)
      .gte("date", since6m.slice(0, 10))
    const totalSpend = (adRows ?? []).reduce((s: number, r: any) => s + Number(r.spend ?? 0), 0)
    const newInWindow = customers.filter(c => c.firstOrderAt >= new Date(since6m)).length
    if (totalSpend > 0 && newInWindow > 0) {
      const cac = Math.round(totalSpend / newInWindow)
      ltvCac = { spend: Math.round(totalSpend), newCustomers: newInWindow, cac, avgLTV, ratio: cac > 0 ? Math.round((avgLTV / cac) * 100) / 100 : null }
    }
  } catch { /* ad_metrics may not exist yet */ }

  // ─── Actionable lists (top N per segment, with email for export) ──────────
  function listOf(list: CustomerStats[], sortKey: (c: CustomerStats) => number) {
    return [...list].sort((a, b) => sortKey(b) - sortKey(a)).slice(0, 100).map(c => ({
      id: c.id, name: c.name, email: c.email,
      ltv: Math.round(c.totalSpent), orders: c.totalOrders,
      daysSinceLastOrder: c.daysSinceLastOrder, healthScore: c.healthScore,
      predictedNextAt: c.predictedNextAt ? c.predictedNextAt.toISOString().slice(0, 10) : null,
    }))
  }
  const actionLists = {
    champions: listOf(segmentMap.champions, c => c.totalSpent),
    "at-risk": listOf(segmentMap["at-risk"], c => c.totalSpent),
    lost: listOf(segmentMap.lost, c => c.totalSpent),
    new: listOf(segmentMap.new, c => c.totalSpent),
    overdue: listOf(customers.filter(c => c.overdue), c => c.totalSpent),
  }

  const nextBestAction: Record<string, string> = {
    champions: "Programa VIP + pedido de reseña/referido. Ofrecé early-access a lanzamientos.",
    loyal: "Cross-sell de productos complementarios y subí frecuencia con bundles.",
    promising: "Empujá la 2da/3ra compra con un incentivo por tiempo limitado.",
    "at-risk": "Campaña winback: recordatorio + oferta blanda (envío gratis / % dto).",
    lost: "Reactivación agresiva o excluir de pauta para no gastar CAC en ellos.",
    new: "Onboarding + nudge a la 2da compra dentro de la ventana de cadencia.",
    overdue: "Contacto proactivo: se pasaron de su ritmo de recompra habitual.",
  }

  return NextResponse.json({
    segments: segmentSummary,
    kpis: {
      totalCustomers: total,
      newThisMonth,
      returningRate: total > 0 ? Math.round((returningCustomers / total) * 1000) / 10 : 0,
      avgLTV,
      avgOrdersPerCustomer: avgOrders,
      avgDaysBetweenOrders: avgDaysBetween,
      churnRisk: segmentMap["at-risk"].length,
      overdue: overdueCount,
      healthScore: health.avgScore,
    },
    cohort: { months: cohortLabels, data: cohortRetention },
    revenueCohort: { months: cohortLabels, data: revenueCohortData },
    health,
    pulse,
    concentration,
    timeToSecond,
    ltvCac,
    actionLists,
    nextBestAction,
    windowDays: 180,
  })
}
