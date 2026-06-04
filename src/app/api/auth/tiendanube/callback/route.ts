import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")

  if (!code) {
    return NextResponse.redirect(new URL("/config/integraciones?error=no_code", request.url))
  }

  // Exchange code for access token
  const tokenRes = await fetch(`https://www.tiendanube.com/apps/authorize/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.TIENDANUBE_APP_ID,
      client_secret: process.env.TIENDANUBE_CLIENT_SECRET,
      grant_type: "authorization_code",
      code,
    }),
  })

  if (!tokenRes.ok) {
    console.error("Token exchange failed:", await tokenRes.text())
    return NextResponse.redirect(new URL("/config/integraciones?error=token_exchange", request.url))
  }

  const tokenData = await tokenRes.json()
  // Tiendanube returns: { access_token, token_type, scope, user_id }
  const { access_token, scope, user_id: storeId } = tokenData

  // Fetch store info
  const storeRes = await fetch(`https://api.tiendanube.com/v1/${storeId}/store`, {
    headers: {
      Authorization: `bearer ${access_token}`,
      "User-Agent": `Aguara (${process.env.TIENDANUBE_APP_ID}) sebastian@aguara.io`,
    },
  })

  let storeName = `Tienda ${storeId}`
  let storeUrl = ""
  if (storeRes.ok) {
    const storeData = await storeRes.json()
    storeName = storeData.name?.es || storeData.name?.["es-AR"] || Object.values(storeData.name || {})[0] as string || storeName
    storeUrl = storeData.main_domain || ""
  }

  // Save to Supabase
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  const { error } = await supabase
    .from("store_connections")
    .upsert({
      user_id: user.id,
      platform: "tiendanube",
      store_id: String(storeId),
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

  return NextResponse.redirect(new URL("/config/integraciones?connected=tiendanube", request.url))
}
