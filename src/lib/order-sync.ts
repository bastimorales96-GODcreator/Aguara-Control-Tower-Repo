import type { SupabaseClient } from "@supabase/supabase-js"

/**
 * Order backfill / incremental sync.
 *
 * Paginates orders from the connected platform and upserts normalized rows into
 * the `orders` table. First run backfills up to BACKFILL_MONTHS of history;
 * subsequent runs only fetch orders created since `last_orders_sync_at`.
 * Bounded per call (page caps) to stay within serverless limits — very large
 * stores get progressive coverage across repeated syncs.
 */

const BACKFILL_MONTHS = 24

export interface SyncConnection {
  user_id: string
  platform: string
  store_id: string
  access_token: string
  last_orders_sync_at?: string | null
}

interface OrderRow {
  user_id: string
  platform: string
  store_id: string
  external_order_id: string
  customer_id: string
  customer_name: string
  customer_email: string
  status: string
  total: number
  subtotal: number
  currency: string | null
  source: string | null
  order_created_at: string
}

function shopifyStatus(s: string) {
  return s === "paid" ? "paid" : s === "pending" ? "pending" : (s === "refunded" || s === "partially_refunded") ? "refunded" : s === "voided" ? "cancelled" : "pending"
}
function tnStatus(s: string) {
  return s === "paid" ? "paid" : s === "pending" ? "pending" : s === "refunded" ? "refunded" : s === "voided" ? "cancelled" : "pending"
}

function normalizeShopify(o: any, c: SyncConnection): OrderRow {
  return {
    user_id: c.user_id, platform: "shopify", store_id: c.store_id,
    external_order_id: String(o.id),
    customer_id: String(o.customer?.id || o.email || "guest"),
    customer_name: o.customer ? `${o.customer.first_name ?? ""} ${o.customer.last_name ?? ""}`.trim() || "Invitado" : "Invitado",
    customer_email: o.email ?? "",
    status: shopifyStatus(o.financial_status),
    total: parseFloat(o.total_price ?? "0"),
    subtotal: parseFloat(o.subtotal_price ?? "0"),
    currency: o.currency ?? null,
    source: o.source_name ?? null,
    order_created_at: o.created_at,
  }
}
function normalizeTN(o: any, c: SyncConnection): OrderRow {
  return {
    user_id: c.user_id, platform: "tiendanube", store_id: c.store_id,
    external_order_id: String(o.id),
    customer_id: String(o.customer?.id || o.contact_email || "guest"),
    customer_name: o.customer?.name ?? "Invitado",
    customer_email: o.contact_email ?? o.customer?.email ?? "",
    status: tnStatus(o.payment_status),
    total: parseFloat(o.total ?? "0"),
    subtotal: parseFloat(o.subtotal ?? "0"),
    currency: o.currency ?? null,
    source: null,
    order_created_at: o.created_at,
  }
}
function normalizeML(o: any, c: SyncConnection): OrderRow {
  const b = o.buyer ?? {}
  return {
    user_id: c.user_id, platform: "mercadolibre", store_id: c.store_id,
    external_order_id: String(o.id),
    customer_id: String(b.id || b.nickname || "guest"),
    customer_name: [b.first_name, b.last_name].filter(Boolean).join(" ") || b.nickname || "Comprador ML",
    customer_email: b.email ?? "",
    status: o.status === "paid" ? "paid" : o.status === "cancelled" ? "cancelled" : "pending",
    total: parseFloat(o.total_amount ?? o.paid_amount ?? "0"),
    subtotal: parseFloat(o.paid_amount ?? o.total_amount ?? "0"),
    currency: o.currency_id ?? null,
    source: "mercadolibre",
    order_created_at: o.date_created,
  }
}

export async function syncOrders(supabase: SupabaseClient, conn: SyncConnection): Promise<{ fetched: number; pages: number }> {
  const since = conn.last_orders_sync_at || new Date(Date.now() - BACKFILL_MONTHS * 30 * 86400000).toISOString()
  const rows: OrderRow[] = []
  let pages = 0

  try {
    if (conn.platform === "shopify") {
      let url: string | null = `https://${conn.store_id}/admin/api/2024-01/orders.json?status=any&limit=250&created_at_min=${encodeURIComponent(since)}&fields=id,name,email,customer,total_price,subtotal_price,currency,created_at,financial_status,source_name`
      const maxPages = 20
      while (url && pages < maxPages) {
        const res: Response = await fetch(url, { headers: { "X-Shopify-Access-Token": conn.access_token } })
        if (!res.ok) break
        const data = await res.json()
        for (const o of (data.orders ?? [])) rows.push(normalizeShopify(o, conn))
        pages++
        const link: string = res.headers.get("link") || ""
        const m: RegExpMatchArray | null = link.match(/<([^>]+)>;\s*rel="next"/)
        url = m ? m[1] : null
      }
    } else if (conn.platform === "tiendanube") {
      const maxPages = 25
      for (let page = 1; page <= maxPages; page++) {
        const url = `https://api.tiendanube.com/v1/${conn.store_id}/orders?per_page=200&page=${page}&created_at_min=${encodeURIComponent(since)}`
        const res = await fetch(url, {
          headers: { Authorization: `bearer ${conn.access_token}`, "User-Agent": `Aguara (${process.env.TIENDANUBE_APP_ID}) sebastian@aguara.io` },
        })
        if (!res.ok) break
        const arr = await res.json()
        if (!Array.isArray(arr) || arr.length === 0) break
        for (const o of arr) rows.push(normalizeTN(o, conn))
        pages++
        if (arr.length < 200) break
      }
    } else if (conn.platform === "mercadolibre") {
      const maxOffsets = 40, limit = 50
      for (let i = 0; i < maxOffsets; i++) {
        const url = `https://api.mercadolibre.com/orders/search?seller=${conn.store_id}&sort=date_asc&limit=${limit}&offset=${i * limit}&order.date_created.from=${encodeURIComponent(since)}`
        const res = await fetch(url, { headers: { Authorization: `Bearer ${conn.access_token}` } })
        if (!res.ok) break
        const data = await res.json()
        const results = data.results ?? []
        if (results.length === 0) break
        for (const o of results) rows.push(normalizeML(o, conn))
        pages++
        if (results.length < limit) break
      }
    }
  } catch (e) {
    console.error("[order-sync] fetch error:", e)
  }

  // Upsert in batches (dedup on the unique key).
  for (let i = 0; i < rows.length; i += 500) {
    const batch = rows.slice(i, i + 500)
    const { error } = await supabase
      .from("orders")
      .upsert(batch, { onConflict: "user_id,platform,store_id,external_order_id" })
    if (error) console.error("[order-sync] upsert error:", error.message)
  }

  return { fetched: rows.length, pages }
}
