/**
 * POST /api/webhooks/shopify
 *
 * Recibe webhooks de Shopify en tiempo real.
 * Verifica la firma HMAC antes de procesar.
 * Soporta: orders/created, orders/updated, orders/paid, orders/cancelled
 *
 * En Shopify Admin: Settings → Notifications → Webhooks
 * O se registran automáticamente en el OAuth callback.
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import crypto from "crypto"

// ─── HMAC verification ────────────────────────────────────────────────────────
function verifyShopifyHmac(body: string, hmacHeader: string | null): boolean {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET
  if (!secret || !hmacHeader) return false

  const digest = crypto
    .createHmac("sha256", secret)
    .update(body, "utf8")
    .digest("base64")

  return crypto.timingSafeEqual(
    Buffer.from(digest),
    Buffer.from(hmacHeader)
  )
}

// ─── Order mapper ─────────────────────────────────────────────────────────────
function mapShopifyOrder(order: Record<string, unknown>, shopDomain: string) {
  const financialStatus = order.financial_status as string
  const status =
    financialStatus === "paid"      ? "paid"
  : financialStatus === "pending"   ? "pending"
  : financialStatus === "refunded"  ? "refunded"
  : financialStatus === "voided"    ? "cancelled"
  :                                   "pending"

  return {
    shopify_order_id: String(order.id),
    shop_domain:      shopDomain,
    status,
    total_price:      parseFloat(order.total_price as string || "0"),
    subtotal_price:   parseFloat(order.subtotal_price as string || "0"),
    total_tax:        parseFloat(order.total_tax as string || "0"),
    currency:         order.currency as string,
    customer_email:   (order.customer as Record<string, unknown>)?.email as string || null,
    created_at:       order.created_at as string,
    updated_at:       new Date().toISOString(),
    raw_data:         order,
  }
}

// ─── Handler ──────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const topic      = req.headers.get("x-shopify-topic")
  const shopDomain = req.headers.get("x-shopify-shop-domain")
  const hmac       = req.headers.get("x-shopify-hmac-sha256")

  // Read raw body for HMAC verification
  const rawBody = await req.text()

  // Verify authenticity
  if (!verifyShopifyHmac(rawBody, hmac)) {
    console.warn("[shopify-webhook] HMAC verification failed", { topic, shopDomain })
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let payload: Record<string, unknown>
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  console.log(`[shopify-webhook] ${topic} from ${shopDomain}`)

  // Service-role client (no RLS for webhook writes)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Find user_id from store_connections
  const { data: store } = await supabase
    .from("store_connections")
    .select("user_id")
    .eq("platform", "shopify")
    .ilike("store_url", `%${shopDomain?.replace(".myshopify.com", "")}%`)
    .single()

  if (!store) {
    console.warn("[shopify-webhook] Store not found for domain:", shopDomain)
    // Return 200 to prevent Shopify from retrying
    return NextResponse.json({ ok: true })
  }

  // Handle topics
  switch (topic) {
    case "orders/created":
    case "orders/paid":
    case "orders/updated": {
      const orderData = mapShopifyOrder(payload, shopDomain!)
      const { error } = await supabase
        .from("shopify_orders")
        .upsert(
          { ...orderData, user_id: store.user_id },
          { onConflict: "shopify_order_id,shop_domain" }
        )
      if (error) console.error("[shopify-webhook] upsert error:", error)
      break
    }

    case "orders/cancelled": {
      const { error } = await supabase
        .from("shopify_orders")
        .update({ status: "cancelled", updated_at: new Date().toISOString() })
        .eq("shopify_order_id", String(payload.id))
        .eq("shop_domain", shopDomain!)
      if (error) console.error("[shopify-webhook] cancel error:", error)
      break
    }

    case "app/uninstalled": {
      // Store desconectó la app → limpiamos la connection
      await supabase
        .from("store_connections")
        .delete()
        .eq("user_id", store.user_id)
        .eq("platform", "shopify")
      console.log("[shopify-webhook] App uninstalled, connection removed")
      break
    }

    default:
      console.log(`[shopify-webhook] Unhandled topic: ${topic}`)
  }

  return NextResponse.json({ ok: true })
}
