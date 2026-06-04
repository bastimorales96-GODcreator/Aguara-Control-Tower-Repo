import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// ─── RFM segmentation ─────────────────────────────────────────────────────────
// Recency: days since last order  (lower = better)
// Frequency: number of orders     (higher = better)
// Monetary: total spent           (higher = better)

interface CustomerStats {
  id: string
  name: string
  email: string
  totalOrders: number
  totalSpent: number
  firstOrderAt: Date
  lastOrderAt: Date
  daysSinceLastOrder: number
}

type RFMSegment = "champions" | "loyal" | "promising" | "at-risk" | "lost" | "new"

function classifyRFM(c: CustomerStats): RFMSegment {
  const { daysSinceLastOrder, totalOrders } = c
  if (daysSinceLastOrder <= 30  && totalOrders >= 5) return "champions"
  if (daysSinceLastOrder <= 60  && totalOrders >= 3) return "loyal"
  if (daysSinceLastOrder <= 120 && totalOrders >= 2) return "promising"  // wait: new check below
  if (daysSinceLastOrder > 60   && daysSinceLastOrder <= 120) return "at-risk"
  if (daysSinceLastOrder > 120) return "lost"
  // first-time buyer in last 30 days
  if (totalOrders === 1 && daysSinceLastOrder <= 30) return "new"
  return "promising"
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
    return NextResponse.json({ customers: [], segments: {}, kpis: null, cohort: null })
  }

  // Fetch up to 250 orders (last ~6 months)
  const since6m = new Date(Date.now() - 180 * 86400000).toISOString()
  let rawOrders: any[] = []

  try {
    if (activeStore.platform === "shopify") {
      const url = `https://${activeStore.store_id}/admin/api/2024-01/orders.json?status=any&limit=250&financial_status=paid&created_at_min=${since6m}&fields=id,email,customer,total_price,created_at,financial_status`
      const res = await fetch(url, { headers: { "X-Shopify-Access-Token": activeStore.access_token } })
      if (res.ok) {
        const data = await res.json()
        rawOrders = data.orders ?? []
      }
    } else {
      const url = `https://api.tiendanube.com/v1/${activeStore.store_id}/orders?per_page=200&payment_status=paid&created_at_min=${since6m}`
      const res = await fetch(url, {
        headers: {
          Authorization: `bearer ${activeStore.access_token}`,
          "User-Agent": `Aguara (${process.env.TIENDANUBE_APP_ID}) sebastian@aguara.io`,
        },
      })
      if (res.ok) rawOrders = await res.json()
    }
  } catch { /* fall through */ }

  if (rawOrders.length === 0) {
    return NextResponse.json({ customers: [], segments: {}, kpis: null, cohort: null })
  }

  // ─── Aggregate per customer ──────────────────────────────────────────────
  const customerMap = new Map<string, CustomerStats>()
  const now = new Date()

  for (const o of rawOrders) {
    let customerId: string
    let customerName: string
    let customerEmail: string
    let orderAmount: number
    let orderDate: Date

    if (activeStore.platform === "shopify") {
      customerId    = String(o.customer?.id || o.email || "guest")
      customerName  = o.customer ? `${o.customer.first_name ?? ""} ${o.customer.last_name ?? ""}`.trim() : "Invitado"
      customerEmail = o.email ?? ""
      orderAmount   = parseFloat(o.total_price ?? "0")
      orderDate     = new Date(o.created_at)
    } else {
      customerId    = String(o.customer?.id || o.contact_email || "guest")
      customerName  = o.customer?.name ?? "Invitado"
      customerEmail = o.contact_email ?? ""
      orderAmount   = parseFloat(o.total ?? "0")
      orderDate     = new Date(o.created_at)
    }

    if (!customerMap.has(customerId)) {
      customerMap.set(customerId, {
        id: customerId,
        name: customerName,
        email: customerEmail,
        totalOrders: 0,
        totalSpent: 0,
        firstOrderAt: orderDate,
        lastOrderAt: orderDate,
        daysSinceLastOrder: 0,
      })
    }

    const c = customerMap.get(customerId)!
    c.totalOrders++
    c.totalSpent += orderAmount
    if (orderDate < c.firstOrderAt) c.firstOrderAt = orderDate
    if (orderDate > c.lastOrderAt)  c.lastOrderAt  = orderDate
  }

  // Compute daysSinceLastOrder
  const customers = Array.from(customerMap.values()).map(c => ({
    ...c,
    daysSinceLastOrder: Math.floor((now.getTime() - c.lastOrderAt.getTime()) / 86400000),
  }))

  // ─── Segment counts ──────────────────────────────────────────────────────
  const segmentMap: Record<RFMSegment, CustomerStats[]> = {
    champions: [], loyal: [], promising: [], "at-risk": [], lost: [], new: [],
  }

  for (const c of customers) {
    const seg = classifyRFM(c)
    segmentMap[seg].push(c)
  }

  const total = customers.length

  const segmentSummary = Object.entries(segmentMap).map(([seg, list]) => ({
    id: seg,
    count: list.length,
    pct: total > 0 ? Math.round((list.length / total) * 1000) / 10 : 0,
    avgLTV: list.length > 0 ? Math.round(list.reduce((s, c) => s + c.totalSpent, 0) / list.length) : 0,
    avgOrders: list.length > 0 ? Math.round((list.reduce((s, c) => s + c.totalOrders, 0) / list.length) * 10) / 10 : 0,
  }))

  // ─── KPIs ────────────────────────────────────────────────────────────────
  const returningCustomers = customers.filter(c => c.totalOrders > 1).length
  const avgLTV = total > 0 ? Math.round(customers.reduce((s, c) => s + c.totalSpent, 0) / total) : 0
  const avgOrders = total > 0 ? Math.round((customers.reduce((s, c) => s + c.totalOrders, 0) / total) * 10) / 10 : 0

  // New this month
  const monthAgo = new Date(now.getTime() - 30 * 86400000)
  const newThisMonth = customers.filter(c => c.firstOrderAt >= monthAgo).length

  // Days between orders (for returning only)
  const returning = customers.filter(c => c.totalOrders > 1)
  let avgDaysBetween = 0
  if (returning.length > 0) {
    const spans = returning.map(c => {
      const spanDays = (c.lastOrderAt.getTime() - c.firstOrderAt.getTime()) / 86400000
      return spanDays / (c.totalOrders - 1)
    })
    avgDaysBetween = Math.round(spans.reduce((a, b) => a + b, 0) / spans.length)
  }

  const churnRisk = segmentMap["at-risk"].length

  // ─── Cohort retention (monthly, last 6 months) ───────────────────────────
  // For each cohort month, what % returned in subsequent months?
  const cohortMonths: string[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    cohortMonths.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`)
  }

  const cohortData = cohortMonths.map((cohortKey, ci) => {
    const [cy, cm] = cohortKey.split("-").map(Number)
    // Customers whose first order was in this cohort month
    const cohortCustomers = customers.filter(c => {
      return c.firstOrderAt.getFullYear() === cy && (c.firstOrderAt.getMonth() + 1) === cm
    })
    if (cohortCustomers.length === 0) return { month: cohortKey, cohortSize: 0, retention: [] }

    const cohortSize = cohortCustomers.length
    const retention: (number | null)[] = cohortMonths.map((targetKey, ti) => {
      if (ti < ci) return null // future for this cohort (shouldn't happen — already past)
      if (ti === ci) return 100
      // Can we see data for this month? Only if it's in the past
      const [ty, tm] = targetKey.split("-").map(Number)
      const targetMonthStart = new Date(ty, tm - 1, 1)
      const targetMonthEnd   = new Date(ty, tm, 0)
      if (targetMonthStart > now) return null

      // How many of this cohort ordered in targetKey month?
      const retained = cohortCustomers.filter(c => {
        return rawOrders.some((o: any) => {
          const oDate = new Date(o.created_at)
          const oCustomerId = activeStore.platform === "shopify"
            ? String(o.customer?.id || o.email || "guest")
            : String(o.customer?.id || o.contact_email || "guest")
          return oCustomerId === c.id && oDate >= targetMonthStart && oDate <= targetMonthEnd
        })
      }).length

      return Math.round((retained / cohortSize) * 100)
    })

    const shortMonth = new Date(cy, cm - 1).toLocaleString("es-AR", { month: "short" })
    return { month: shortMonth, cohortSize, retention }
  })

  return NextResponse.json({
    segments: segmentSummary,
    kpis: {
      totalCustomers: total,
      newThisMonth,
      returningRate: total > 0 ? Math.round((returningCustomers / total) * 1000) / 10 : 0,
      avgLTV,
      avgOrdersPerCustomer: avgOrders,
      avgDaysBetweenOrders: avgDaysBetween,
      churnRisk,
    },
    cohort: {
      months: cohortMonths.map((k, i) => {
        const [y, m] = k.split("-").map(Number)
        return new Date(y, m - 1).toLocaleString("es-AR", { month: "short" })
      }),
      data: cohortData,
    },
  })
}
