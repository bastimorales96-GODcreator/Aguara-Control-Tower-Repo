import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const shop = searchParams.get("shop")
  const state = searchParams.get("state")

  if (!code || !shop) {
    return NextResponse.redirect(new URL("/config/integraciones?error=no_code", request.url))
  }

  // Exchange code for access token
  const tokenRes = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.SHOPIFY_CLIENT_ID,
      client_secret: process.env.SHOPIFY_CLIENT_SECRET,
      code,
    }),
  })

  if (!tokenRes.ok) {
    console.error("Shopify token exchange failed:", await tokenRes.text())
    return NextResponse.redirect(new URL("/config/integraciones?error=token_exchange", request.url))
  }

  const { access_token, scope } = await tokenRes.json()

  // Fetch shop info
  const shopRes = await fetch(`https://${shop}/admin/api/2024-01/shop.json`, {
    headers: {
      "X-Shopify-Access-Token": access_token,
      "Content-Type": "application/json",
    },
  })

  let storeName = shop
  let storeUrl = shop
  if (shopRes.ok) {
    const { shop: shopData } = await shopRes.json()
    storeName = shopData.name || shop
    storeUrl = shopData.domain || shop
  }

  // Recover user_id from state (encoded in connect route to survive external redirect)
  const userId = state ? Buffer.from(state, "base64").toString("utf-8") : null
  if (!userId) return NextResponse.redirect(new URL("/login", request.url))

  // Use service role client to bypass RLS for server-side insert
  const { createClient: createServiceClient } = await import("@supabase/supabase-js")
  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await supabase
    .from("store_connections")
    .upsert({
      user_id: userId,
      platform: "shopify",
      store_id: shop,
      store_name: storeName,
      store_url: storeUrl,
      access_token,
      scope,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,platform,store_id" })

  if (error) {
    console.error("Supabase upsert error:", error)
    return NextResponse.redirect(new URL("/config/integraciones?error=db_save", request.url))
  }

  // ── Register Shopify webhooks ───────────────────────────────────────────────
  const webhookTopics = [
    "orders/created",
    "orders/updated",
    "orders/paid",
    "orders/cancelled",
    "app/uninstalled",
  ]
  const webhookBase = process.env.NEXT_PUBLIC_APP_URL || "https://aguara-control-tower-repo.vercel.app"

  await Promise.allSettled(
    webhookTopics.map(topic =>
      fetch(`https://${shop}/admin/api/2024-01/webhooks.json`, {
        method: "POST",
        headers: {
          "X-Shopify-Access-Token": access_token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          webhook: {
            topic,
            address: `${webhookBase}/api/webhooks/shopify`,
            format: "json",
          },
        }),
      }).catch(e => console.warn(`[shopify-webhook] Failed to register ${topic}:`, e))
    )
  )

  return NextResponse.redirect(new URL("/config/integraciones?connected=shopify", request.url))
}
