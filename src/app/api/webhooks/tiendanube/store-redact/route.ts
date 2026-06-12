/**
 * POST /api/webhooks/tiendanube/store-redact
 *
 * Tiendanube mandatory privacy webhook (LGPD/GDPR).
 * Sent after a merchant uninstalls the app — we must delete the store's data.
 * Payload: { store_id }
 *
 * Docs: https://tiendanube.github.io/api-documentation/resources/webhook#required-webhooks
 */

import { NextRequest, NextResponse } from "next/server"
import { verifyTiendanubeHmac, getServiceClient } from "@/lib/tiendanube-webhook"

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const hmac = req.headers.get("x-linkedstore-hmac-sha256")

  if (!verifyTiendanubeHmac(rawBody, hmac)) {
    return NextResponse.json({ error: "Invalid HMAC" }, { status: 401 })
  }

  let storeId: string | null = null
  try {
    storeId = String(JSON.parse(rawBody)?.store_id ?? "")
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  if (storeId) {
    // Remove the store's connection (token + store metadata) from our DB.
    const supabase = await getServiceClient()
    const { error } = await supabase
      .from("store_connections")
      .delete()
      .eq("platform", "tiendanube")
      .eq("store_id", storeId)
    if (error) console.error("[tn/store-redact] delete failed:", error)
    console.log(`[tn/store-redact] processed store_id=${storeId}`)
  }

  // Must respond 2XX within 3s.
  return NextResponse.json({ received: true })
}
