/**
 * GET /api/cron/sync-orders
 *
 * Vercel Cron entrypoint (ver vercel.json → crons). Corre una vez por día y
 * sincroniza incrementalmente las órdenes de TODAS las tiendas conectadas hacia
 * la tabla `orders`, para que el backfill se mantenga al día sin intervención.
 *
 * Seguridad: si CRON_SECRET está configurado, se exige el header
 * `Authorization: Bearer <CRON_SECRET>` (Vercel Cron lo envía automáticamente
 * cuando la env var existe en el proyecto).
 *
 * Nota: usa el service-role client para leer/escribir órdenes de todos los
 * usuarios (bypassa RLS). Shopify/Tiendanube tienen tokens que no expiran;
 * MercadoLibre expira a las 6h, así que su sync por cron es best-effort hasta
 * que se refresque el token (el dashboard lo refresca al usarse).
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { syncOrders } from "@/lib/order-sync"

export const dynamic = "force-dynamic"
export const maxDuration = 60

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization")
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: connections } = await supabase
    .from("store_connections")
    .select("*")
    .in("platform", ["shopify", "tiendanube", "mercadolibre"])

  const results: Array<Record<string, unknown>> = []
  for (const c of connections ?? []) {
    try {
      const r = await syncOrders(supabase, {
        user_id: c.user_id,
        platform: c.platform,
        store_id: c.store_id,
        access_token: c.access_token,
        last_orders_sync_at: c.orders_backfilled ? c.last_orders_sync_at : null,
      })
      await supabase
        .from("store_connections")
        .update({ last_orders_sync_at: new Date().toISOString(), orders_backfilled: true })
        .eq("user_id", c.user_id)
        .eq("platform", c.platform)
        .eq("store_id", c.store_id)
      results.push({ platform: c.platform, store_id: c.store_id, fetched: r.fetched, pages: r.pages })
    } catch (e: unknown) {
      results.push({ platform: c.platform, store_id: c.store_id, error: e instanceof Error ? e.message : String(e) })
    }
  }

  return NextResponse.json({ ok: true, synced: results.length, results })
}
