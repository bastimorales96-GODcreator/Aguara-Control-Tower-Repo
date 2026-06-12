/**
 * POST /api/webhooks/tiendanube/data-request
 *
 * Tiendanube mandatory privacy webhook (LGPD/GDPR).
 * Request for a consumer's stored personal data — the app is responsible for
 * sending the information directly to the merchant.
 * Payload: { store_id, customer: {...}, orders_requested, checkouts_requested,
 *            drafts_orders_requested, data_request: { id } }
 *
 * Aguara does NOT persist individual customer PII (orders are read from the
 * Tiendanube API on demand; we only store the store connection/token), so there
 * is no stored consumer data to report. We verify the signature, log the request
 * for audit, and acknowledge.
 *
 * Docs: https://tiendanube.github.io/api-documentation/resources/webhook#required-webhooks
 */

import { NextRequest, NextResponse } from "next/server"
import { verifyTiendanubeHmac } from "@/lib/tiendanube-webhook"

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const hmac = req.headers.get("x-linkedstore-hmac-sha256")

  if (!verifyTiendanubeHmac(rawBody, hmac)) {
    return NextResponse.json({ error: "Invalid HMAC" }, { status: 401 })
  }

  try {
    const payload = JSON.parse(rawBody)
    console.log(
      `[tn/data-request] store_id=${payload?.store_id} customer_id=${payload?.customer?.id} ` +
      `data_request_id=${payload?.data_request?.id} — no stored PII to report`
    )
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  return NextResponse.json({ received: true })
}
