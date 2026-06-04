import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL("/login", request.url))

  const { searchParams } = new URL(request.url)
  const shop = searchParams.get("shop")

  if (!shop) {
    // No shop provided — redirect to integraciones with error
    return NextResponse.redirect(new URL("/config/integraciones?error=no_shop", request.url))
  }

  // Normalize shop domain
  const shopDomain = shop.includes(".myshopify.com") ? shop : `${shop}.myshopify.com`

  const clientId = process.env.SHOPIFY_CLIENT_ID!
  const redirectUri = encodeURIComponent(process.env.SHOPIFY_REDIRECT_URI!)
  const scopes = process.env.SHOPIFY_SCOPES!
  const state = Buffer.from(user.id).toString("base64")

  const authUrl = `https://${shopDomain}/admin/oauth/authorize?client_id=${clientId}&scope=${scopes}&redirect_uri=${redirectUri}&state=${state}`

  return NextResponse.redirect(authUrl)
}
