/**
 * DELETE /api/connectors/store
 *
 * Disconnects a store by deleting its row from store_connections.
 * Body: { platform: "shopify" | "tiendanube" | "mercadolibre" }
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const STORE_PLATFORMS = ["shopify", "tiendanube", "mercadolibre"]

/**
 * GET /api/connectors/store
 * Lista las tiendas conectadas del usuario (para el selector de tienda),
 * con el conteo de órdenes de hoy tomado de la tabla `orders`.
 */
export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: connections } = await supabase
    .from("store_connections")
    .select("platform, store_id, store_name, store_url")
    .eq("user_id", user.id)

  const stores = (connections || []).filter(c => STORE_PLATFORMS.includes(c.platform))

  // Órdenes de hoy por tienda (desde la tabla `orders` ya sincronizada).
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  const { data: todayOrders } = await supabase
    .from("orders")
    .select("platform, store_id")
    .eq("user_id", user.id)
    .gte("order_created_at", startOfToday.toISOString())

  const counts: Record<string, number> = {}
  for (const o of todayOrders || []) {
    const k = `${o.platform}:${o.store_id}`
    counts[k] = (counts[k] || 0) + 1
  }

  return NextResponse.json({
    stores: stores.map(s => ({
      store_id: s.store_id,
      name: s.store_name || s.store_id,
      platform: s.platform,
      url: s.store_url || "",
      ordersToday: counts[`${s.platform}:${s.store_id}`] || 0,
    })),
  })
}

// DELETE ?platform=shopify — kept for clarity; DELETE via query param avoids body issues
export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Accept platform from query param (reliable) or body (fallback)
  const url = new URL(req.url)
  let platform = url.searchParams.get("platform")

  if (!platform) {
    try {
      const body = await req.json()
      platform = body.platform ?? null
    } catch {
      // body missing or not JSON
    }
  }

  if (!platform) {
    return NextResponse.json({ error: "Missing platform" }, { status: 400 })
  }

  console.log("[store/disconnect] user:", user.id, "platform:", platform)

  const { error, count } = await supabase
    .from("store_connections")
    .delete()
    .eq("user_id", user.id)
    .eq("platform", platform)
    .select()

  if (error) {
    console.error("[store/disconnect] Supabase error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  console.log("[store/disconnect] deleted rows:", count)
  return NextResponse.json({ success: true, deleted: count })
}
