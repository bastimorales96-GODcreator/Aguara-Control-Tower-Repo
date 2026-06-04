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
