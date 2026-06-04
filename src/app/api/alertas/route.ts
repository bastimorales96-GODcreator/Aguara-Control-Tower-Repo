import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export type AlertSeverity = "critical" | "warning" | "info"
export type AlertCategory = "stock" | "ads" | "financiero" | "conversion"

export interface Alert {
  id: string
  title: string
  detail: string
  severity: AlertSeverity
  category: AlertCategory
  metric?: string
  actionLabel?: string
  actionHref?: string
  createdAt: string
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
  if (!activeStore) return NextResponse.json({ alerts: [] })

  const now   = new Date()
  const d7ago = new Date(now.getTime() - 7 * 86400000)
  const d14ago = new Date(now.getTime() - 14 * 86400000)

  // Fetch orders for current + prior week
  async function fetchOrders(since: Date, until: Date) {
    try {
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
      const res = await fetch(url, { headers })
      if (!res.ok) return []
      const data = await res.json()
      return activeStore.platform === "shopify" ? (data.orders ?? []) : (data ?? [])
    } catch { return [] }
  }

  // Fetch products (for stock alerts)
  async function fetchProducts() {
    try {
      if (activeStore.platform === "shopify") {
        const res = await fetch(
          `https://${activeStore.store_id}/admin/api/2024-01/products.json?limit=100&fields=id,title,variants`,
          { headers: { "X-Shopify-Access-Token": activeStore.access_token } }
        )
        if (!res.ok) return []
        const { products } = await res.json()
        return products ?? []
      }
      // Tiendanube
      const res = await fetch(
        `https://api.tiendanube.com/v1/${activeStore.store_id}/products?per_page=100`,
        {
          headers: {
            Authorization: `bearer ${activeStore.access_token}`,
            "User-Agent": `Aguara (${process.env.TIENDANUBE_APP_ID}) sebastian@aguara.io`,
          }
        }
      )
      return res.ok ? await res.json() : []
    } catch { return [] }
  }

  const [currentOrders, prevOrders, products] = await Promise.all([
    fetchOrders(d7ago, now),
    fetchOrders(d14ago, d7ago),
    fetchProducts(),
  ])

  const alerts: Alert[] = []
  let id = 0
  const ts = now.toISOString()

  // ─── Helper ───────────────────────────────────────────────────────────────
  function aggOrders(orders: any[]) {
    const paid = orders.filter((o: any) =>
      activeStore.platform === "shopify"
        ? o.financial_status === "paid"
        : o.payment_status === "paid"
    )
    const revenue = paid.reduce((s: number, o: any) =>
      s + parseFloat(activeStore.platform === "shopify" ? o.total_price : o.total), 0)
    const cancelled = orders.filter((o: any) =>
      activeStore.platform === "shopify"
        ? ["voided", "refunded"].includes(o.financial_status)
        : ["refunded", "voided"].includes(o.payment_status)
    ).length
    return { paid: paid.length, revenue, cancelled, cancelRate: orders.length > 0 ? cancelled / orders.length : 0 }
  }

  const curr = aggOrders(currentOrders)
  const prev = aggOrders(prevOrders)

  // ─── Stock alerts (Shopify only — Tiendanube requires extra call) ─────────
  if (activeStore.platform === "shopify") {
    const outOfStock: string[] = []
    const lowStock:   string[] = []

    for (const product of products) {
      for (const variant of (product.variants ?? [])) {
        if (variant.inventory_management === "shopify") {
          const qty = variant.inventory_quantity ?? 0
          const name = product.variants.length > 1
            ? `${product.title} — ${variant.title}`
            : product.title
          if (qty <= 0) outOfStock.push(name)
          else if (qty <= 5) lowStock.push(name)
        }
      }
    }

    if (outOfStock.length > 0) {
      alerts.push({
        id: String(id++), severity: "critical", category: "stock",
        title: `${outOfStock.length} producto${outOfStock.length > 1 ? "s" : ""} sin stock`,
        detail: outOfStock.slice(0, 3).join(", ") + (outOfStock.length > 3 ? ` y ${outOfStock.length - 3} más.` : "."),
        metric: `${outOfStock.length} SKUs`,
        actionLabel: "Ver inventario", actionHref: "/inventario",
        createdAt: ts,
      })
    }

    if (lowStock.length > 0 && lowStock.length <= 10) {
      alerts.push({
        id: String(id++), severity: "warning", category: "stock",
        title: `Stock bajo en ${lowStock.length} producto${lowStock.length > 1 ? "s" : ""}`,
        detail: lowStock.slice(0, 3).join(", ") + (lowStock.length > 3 ? ` y ${lowStock.length - 3} más (≤5 unidades).` : " (≤5 unidades)."),
        metric: `${lowStock.length} SKUs`,
        actionLabel: "Ver inventario", actionHref: "/inventario",
        createdAt: ts,
      })
    }
  }

  // ─── Financial alerts ────────────────────────────────────────────────────
  if (prev.revenue > 0) {
    const delta = (curr.revenue - prev.revenue) / prev.revenue
    if (delta <= -0.30) {
      alerts.push({
        id: String(id++), severity: "critical", category: "financiero",
        title: "Caída crítica en facturación",
        detail: `La facturación bajó ${Math.abs(delta * 100).toFixed(0)}% esta semana vs la anterior.`,
        metric: `$${Math.round(curr.revenue).toLocaleString("es-AR")}`,
        actionLabel: "Ver reporte", actionHref: "/reportes/financiero",
        createdAt: ts,
      })
    } else if (delta <= -0.15) {
      alerts.push({
        id: String(id++), severity: "warning", category: "financiero",
        title: "Facturación por debajo de la semana pasada",
        detail: `Caída del ${Math.abs(delta * 100).toFixed(0)}% semana a semana.`,
        metric: `$${Math.round(curr.revenue).toLocaleString("es-AR")}`,
        actionLabel: "Ver reporte", actionHref: "/reportes/financiero",
        createdAt: ts,
      })
    }
  }

  if (curr.cancelRate >= 0.20) {
    alerts.push({
      id: String(id++), severity: "critical", category: "conversion",
      title: "Alta tasa de cancelaciones/reembolsos",
      detail: `${(curr.cancelRate * 100).toFixed(1)}% de órdenes canceladas o reembolsadas esta semana.`,
      metric: `${curr.cancelled} canceladas`,
      actionLabel: "Ver órdenes", actionHref: "/",
      createdAt: ts,
    })
  } else if (curr.cancelRate >= 0.10) {
    alerts.push({
      id: String(id++), severity: "warning", category: "conversion",
      title: "Tasa de cancelaciones elevada",
      detail: `${(curr.cancelRate * 100).toFixed(1)}% de cancelaciones en los últimos 7 días.`,
      metric: `${curr.cancelled} canceladas`,
      createdAt: ts,
    })
  }

  // ─── Conversion / silence ────────────────────────────────────────────────
  const last24h = currentOrders.filter((o: any) => {
    return (now.getTime() - new Date(o.created_at).getTime()) < 86400000
  })
  if (last24h.length === 0 && curr.paid > 0) {
    alerts.push({
      id: String(id++), severity: "warning", category: "conversion",
      title: "Sin órdenes en las últimas 24 horas",
      detail: "No se registraron órdenes nuevas. Verificá que las integraciones y el checkout estén activos.",
      actionLabel: "Ver integraciones", actionHref: "/config/integraciones",
      createdAt: ts,
    })
  }

  // ─── Info — good week ────────────────────────────────────────────────────
  if (alerts.filter(a => a.severity !== "info").length === 0 && curr.paid > 0) {
    alerts.push({
      id: String(id++), severity: "info", category: "financiero",
      title: "Semana sin anomalías detectadas",
      detail: `${curr.paid} órdenes pagadas, sin alertas de stock ni caídas significativas.`,
      createdAt: ts,
    })
  }

  return NextResponse.json({ alerts })
}
