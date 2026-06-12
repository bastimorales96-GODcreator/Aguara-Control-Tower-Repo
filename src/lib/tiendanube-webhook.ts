import crypto from "crypto"

/**
 * Verifies a Tiendanube/Nuvemshop webhook signature.
 *
 * Tiendanube signs each webhook with the app's client secret and sends the
 * digest in the `x-linkedstore-hmac-sha256` header. Unlike Shopify (base64),
 * Tiendanube uses a HEX-encoded HMAC-SHA256 of the raw request body
 * (matches PHP's `hash_hmac('sha256', $data, $secret)` default output).
 *
 * Docs: https://tiendanube.github.io/api-documentation/resources/webhook#verifying-a-webhook
 */
export function verifyTiendanubeHmac(rawBody: string, hmacHeader: string | null): boolean {
  const secret = process.env.TIENDANUBE_CLIENT_SECRET
  if (!secret || !hmacHeader) return false

  const digest = crypto
    .createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("hex")

  const a = Buffer.from(digest)
  const b = Buffer.from(hmacHeader)
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}

/** Service-role Supabase client for webhook handlers (no user session). */
export async function getServiceClient() {
  const { createClient } = await import("@supabase/supabase-js")
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
