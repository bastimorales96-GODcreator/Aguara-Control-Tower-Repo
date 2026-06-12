/**
 * POST /api/webhooks/tiendanube/customers-redact
 *
 * Tiendanube mandatory privacy webhook (LGPD/GDPR).
 * Request to erase a consumer's personal data.
 * Payload: { store_id, customer: { id, email, phone, identification }, orders_to_redact: [...] }
 *
 * Aguara is a metrics dashboard: it does NOT persist individual customer PII
 * (orders are read from the Tiendanube API on demand; we only store the store
 * connection/token). There is therefore no customer record to delete. We verify
 * the signature, log the request for audit, and acknowledge.
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
      `[tn/customers-redact] store_id=${payload?.store_id} customer_id=${payload?.customer?.id} ` +
      `orders=${JSON.stringify(payload?.orders_to_redact ?? [])} — no stored PII to delete`
    )
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  return NextResponse.json({ received: true })
}
