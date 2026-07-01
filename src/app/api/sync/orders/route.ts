/**
 * POST /api/sync/orders
 *
 * Sincroniza las órdenes de la tienda activa hacia la tabla `orders` (backfill
 * en la 1ª corrida, incremental después). Se puede llamar desde el botón
 * "Sincronizar" o automáticamente cuando los datos están viejos.
 */

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { syncOrders } from "@/lib/order-sync"

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: connections } = await supabase
    .from("store_connections")
    .select("*")
    .eq("user_id", user.id)

  const store = connections?.find(c => ["shopify", "tiendanube", "mercadolibre"].includes(c.platform))
  if (!store) return NextResponse.json({ error: "No store connected" }, { status: 404 })

  const result = await syncOrders(supabase, {
    user_id: user.id,
    platform: store.platform,
    store_id: store.store_id,
    access_token: store.access_token,
    last_orders_sync_at: store.orders_backfilled ? store.last_orders_sync_at : null,
  })

  await supabase
    .from("store_connections")
    .update({ last_orders_sync_at: new Date().toISOString(), orders_backfilled: true })
    .eq("user_id", user.id)
    .eq("platform", store.platform)
    .eq("store_id", store.store_id)

  return NextResponse.json({ ok: true, platform: store.platform, ...result })
}
