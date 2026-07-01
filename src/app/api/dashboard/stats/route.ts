import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import type { Order } from "@/types"

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

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Get the user's active store connection
  const { data: connections } = await supabase
    .from("store_connections")
    .select("*")
    .eq("user_id", user.id)

  const storeplatforms = ["tiendanube", "shopify", "mercadolibre"]
  const activeStore = connections?.find(c => storeplatforms.includes(c.platform))

  if (!activeStore) {
    return NextResponse.json({ orders: [], metrics: null, platform: null, store_name: null })
  }

  const { searchParams } = new URL(request.url)
  const since = searchParams.get("since") || ""
  const until = searchParams.get("until") || ""

  let rawOrders: Order[] = []
  let storeName = activeStore.store_name

  if (activeStore.platform === "shopify") {
    let url = `https://${activeStore.store_id}/admin/api/2024-01/orders.json?status=any&limit=50`
    if (since) url += `&created_at_min=${since}`
    if (until) url += `&created_at_max=${until}`

    const res = await fetch(url, {
      headers: { "X-Shopify-Access-Token": activeStore.access_token },
    })

    if (res.ok) {
      const { orders } = await res.json()
      rawOrders = (orders || []).map((o: any) => ({
        id: o.name?.replace("#", "") || String(o.id),
        origin: "shopify",
        status: mapShopifyStatus(o.financial_status),
        createdAt: o.created_at,
        totalOrder: parseFloat(o.total_price || "0"),
        totalNet: parseFloat(o.subtotal_price || "0"),
      }))
    }
  } else if (activeStore.platform === "tiendanube") {
    let url = `https://api.tiendanube.com/v1/${activeStore.store_id}/orders?per_page=50&payment_status=paid`
    if (since) url += `&created_at_min=${since}`
    if (until) url += `&created_at_max=${until}`

    const res = await fetch(url, {
      headers: {
        Authorization: `bearer ${activeStore.access_token}`,
        "User-Agent": `Aguara (${process.env.TIENDANUBE_APP_ID}) sebastian@aguara.io`,
      },
    })

    if (res.ok) {
      const orders = await res.json()
      rawOrders = (orders || []).map((o: any) => ({
        id: String(o.number || o.id),
        origin: "tiendanube",
        status: mapTiendanubeStatus(o.payment_status),
        createdAt: o.created_at,
        totalOrder: parseFloat(o.total || "0"),
        totalNet: parseFloat(o.subtotal || "0"),
      }))
    }
  } else if (activeStore.platform === "mercadolibre") {
    let token = activeStore.access_token

    // MercadoLibre access tokens expire in ~6h — refresh if needed.
    const expired = activeStore.token_expires_at
      ? new Date(activeStore.token_expires_at).getTime() < Date.now() + 60_000
      : false
    if (expired && activeStore.refresh_token) {
      const refreshRes = await fetch("https://api.mercadolibre.com/oauth/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          client_id: process.env.MERCADOLIBRE_APP_ID || "",
          client_secret: process.env.MERCADOLIBRE_CLIENT_SECRET || "",
          refresh_token: activeStore.refresh_token,
        }),
      })
      if (refreshRes.ok) {
        const t = await refreshRes.json()
        token = t.access_token
        await supabase.from("store_connections").update({
          access_token: t.access_token,
          refresh_token: t.refresh_token ?? activeStore.refresh_token,
          token_expires_at: new Date(Date.now() + (t.expires_in ?? 21600) * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        }).eq("user_id", user.id).eq("platform", "mercadolibre").eq("store_id", activeStore.store_id)
      }
    }

    let url = `https://api.mercadolibre.com/orders/search?seller=${activeStore.store_id}&order.status=paid&sort=date_desc&limit=50`
    if (since) url += `&order.date_created.from=${since}`
    if (until) url += `&order.date_created.to=${until}`

    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    if (res.ok) {
      const data = await res.json()
      rawOrders = (data.results || []).map((o: any) => ({
        id: String(o.id),
        origin: "mercadolibre",
        status: o.status === "paid" ? "paid" : o.status === "cancelled" ? "cancelled" : "pending",
        createdAt: o.date_created,
        totalOrder: parseFloat(o.total_amount || "0"),
        totalNet: parseFloat(o.paid_amount ?? o.total_amount ?? "0"),
      }))
    }
  }

  // Calculate KPIs
  const paidOrders = rawOrders.filter(o => o.status === "paid")
  const allOrders = rawOrders.length
  const totalRevenue = paidOrders.reduce((sum, o) => sum + o.totalOrder, 0)
  const totalNet = paidOrders.reduce((sum, o) => sum + o.totalNet, 0)
  const totalOrders = paidOrders.length
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0
  const grossMargin = totalRevenue > 0 ? (totalNet / totalRevenue) * 100 : 0
  // CVR = paid orders / total sessions (we only have orders, so paid/all as proxy)
  const cvr = allOrders > 0 ? (totalOrders / allOrders) * 100 : 0

  return NextResponse.json({
    orders: rawOrders,
    platform: activeStore.platform,
    store_name: storeName,
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
