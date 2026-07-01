import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import type { Order } from "@/types"
import type { SupabaseClient } from "@supabase/supabase-js"

function mapShopifyStatus(financialStatus: string): Order["status"] {
  switch (financialStatus) {
    case "paid": return "paid"
    case "pending": return "pending"
    case "refunded":
    case "partially_refunded": return "refunded"
    case "voided": return "cancelled"
    default: return "pending"
  }
}

function mapTiendanubeStatus(paymentStatus: string): Order["status"] {
  switch (paymentStatus) {
    case "paid": return "paid"
    case "pending": return "pending"
    case "refunded": return "refunded"
    case "voided": return "cancelled"
    default: return "pending"
  }
}

const STORE_PLATFORMS = ["tiendanube", "shopify", "mercadolibre"]

/**
 * Trae las órdenes de UNA tienda conectada, resolviendo por plataforma.
 * Refresca el token de MercadoLibre si está por expirar.
 */
async function fetchStoreOrders(
  supabase: SupabaseClient,
  userId: string,
  store: any,
  since: string,
  until: string
): Promise<Order[]> {
  if (store.platform === "shopify") {
    let url = `https://${store.store_id}/admin/api/2024-01/orders.json?status=any&limit=50`
    if (since) url += `&created_at_min=${since}`
    if (until) url += `&created_at_max=${until}`
    const res = await fetch(url, { headers: { "X-Shopify-Access-Token": store.access_token } })
    if (!res.ok) return []
    const { orders } = await res.json()
    return (orders || []).map((o: any) => ({
      id: o.name?.replace("#", "") || String(o.id),
      origin: "shopify",
      status: mapShopifyStatus(o.financial_status),
      createdAt: o.created_at,
      totalOrder: parseFloat(o.total_price || "0"),
      totalNet: parseFloat(o.subtotal_price || "0"),
    }))
  }

  if (store.platform === "tiendanube") {
    let url = `https://api.tiendanube.com/v1/${store.store_id}/orders?per_page=50&payment_status=paid`
    if (since) url += `&created_at_min=${since}`
    if (until) url += `&created_at_max=${until}`
    const res = await fetch(url, {
      headers: {
        Authorization: `bearer ${store.access_token}`,
        "User-Agent": `Aguara (${process.env.TIENDANUBE_APP_ID}) sebastian@aguara.io`,
      },
    })
    if (!res.ok) return []
    const orders = await res.json()
    return (orders || []).map((o: any) => ({
      id: String(o.number || o.id),
      origin: "tiendanube",
      status: mapTiendanubeStatus(o.payment_status),
      createdAt: o.created_at,
      totalOrder: parseFloat(o.total || "0"),
      totalNet: parseFloat(o.subtotal || "0"),
    }))
  }

  if (store.platform === "mercadolibre") {
    let token = store.access_token
    // Los access tokens de ML expiran a las ~6h — refrescar si hace falta.
    const expired = store.token_expires_at
      ? new Date(store.token_expires_at).getTime() < Date.now() + 60_000
      : false
    if (expired && store.refresh_token) {
      const refreshRes = await fetch("https://api.mercadolibre.com/oauth/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          client_id: process.env.MERCADOLIBRE_APP_ID || "",
          client_secret: process.env.MERCADOLIBRE_CLIENT_SECRET || "",
          refresh_token: store.refresh_token,
        }),
      })
      if (refreshRes.ok) {
        const t = await refreshRes.json()
        token = t.access_token
        await supabase.from("store_connections").update({
          access_token: t.access_token,
          refresh_token: t.refresh_token ?? store.refresh_token,
          token_expires_at: new Date(Date.now() + (t.expires_in ?? 21600) * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        }).eq("user_id", userId).eq("platform", "mercadolibre").eq("store_id", store.store_id)
      }
    }

    let url = `https://api.mercadolibre.com/orders/search?seller=${store.store_id}&order.status=paid&sort=date_desc&limit=50`
    if (since) url += `&order.date_created.from=${since}`
    if (until) url += `&order.date_created.to=${until}`
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    if (!res.ok) return []
    const data = await res.json()
    return (data.results || []).map((o: any) => ({
      id: String(o.id),
      origin: "mercadolibre",
      status: o.status === "paid" ? "paid" : o.status === "cancelled" ? "cancelled" : "pending",
      createdAt: o.date_created,
      totalOrder: parseFloat(o.total_amount || "0"),
      totalNet: parseFloat(o.paid_amount ?? o.total_amount ?? "0"),
    }))
  }

  return []
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: connections } = await supabase
    .from("store_connections")
    .select("*")
    .eq("user_id", user.id)

  const stores = (connections || []).filter(c => STORE_PLATFORMS.includes(c.platform))

  if (stores.length === 0) {
    return NextResponse.json({ orders: [], metrics: null, platform: null, store_name: null })
  }

  const { searchParams } = new URL(request.url)
  const since = searchParams.get("since") || ""
  const until = searchParams.get("until") || ""
  const storeParam = searchParams.get("store") || ""

  // Elegir qué tiendas incluir:
  //  - "all" → vista consolidada (todas las tiendas)
  //  - <store_id> → una tienda específica
  //  - (vacío) → default: consolidada si hay >1 tienda, sino la única
  let targets: any[]
  let consolidated = false
  if (storeParam === "all") {
    targets = stores
    consolidated = true
  } else if (storeParam) {
    const match = stores.find(s => s.store_id === storeParam)
    targets = match ? [match] : [stores[0]]
  } else {
    targets = stores.length > 1 ? stores : [stores[0]]
    consolidated = stores.length > 1
  }

  // Traer órdenes de todas las tiendas objetivo en paralelo.
  const perStore = await Promise.all(
    targets.map(s => fetchStoreOrders(supabase, user.id, s, since, until))
  )
  const rawOrders = perStore.flat()

  // KPIs
  const paidOrders = rawOrders.filter(o => o.status === "paid")
  const allOrders = rawOrders.length
  const totalRevenue = paidOrders.reduce((sum, o) => sum + o.totalOrder, 0)
  const totalNet = paidOrders.reduce((sum, o) => sum + o.totalNet, 0)
  const totalOrders = paidOrders.length
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0
  const grossMargin = totalRevenue > 0 ? (totalNet / totalRevenue) * 100 : 0
  const cvr = allOrders > 0 ? (totalOrders / allOrders) * 100 : 0

  return NextResponse.json({
    orders: rawOrders,
    platform: consolidated ? "all" : targets[0].platform,
    store_name: consolidated ? "Vista consolidada" : targets[0].store_name,
    metrics: {
      totalOrders,
      totalRevenue,
      totalNet,
      avgOrderValue,
      grossMargin,
      cvr,
    },
  })
}
