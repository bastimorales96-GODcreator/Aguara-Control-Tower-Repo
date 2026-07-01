/**
 * GET /api/auth/mercadolibre/callback
 *
 * Recibe el ?code de MercadoLibre, valida el state, intercambia el code por
 * tokens (con el code_verifier PKCE) y guarda la conexión en store_connections.
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const oauthError = searchParams.get("error")

  if (oauthError) {
    return NextResponse.redirect(new URL(`/config/integraciones?error=${oauthError}`, request.url))
  }
  if (!code || !state) {
    return NextResponse.redirect(new URL("/config/integraciones?error=no_code", request.url))
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL("/login", request.url))

  // Validar state + recuperar code_verifier (PKCE)
  const { data: stateRow, error: stateErr } = await supabase
    .from("oauth_states")
    .select("code_verifier, expires_at")
    .eq("state", state)
    .eq("user_id", user.id)
    .eq("platform", "mercadolibre")
    .single()

  if (stateErr || !stateRow) {
    return NextResponse.redirect(new URL("/config/integraciones?error=invalid_state", request.url))
  }
  if (stateRow.expires_at && new Date(stateRow.expires_at) < new Date()) {
    await supabase.from("oauth_states").delete().eq("state", state)
    return NextResponse.redirect(new URL("/config/integraciones?error=state_expired", request.url))
  }
  await supabase.from("oauth_states").delete().eq("state", state)

  // Intercambiar code por tokens
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/mercadolibre/callback`
  const tokenRes = await fetch("https://api.mercadolibre.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: process.env.MERCADOLIBRE_APP_ID!,
      client_secret: process.env.MERCADOLIBRE_CLIENT_SECRET!,
      code,
      redirect_uri: redirectUri,
      code_verifier: stateRow.code_verifier ?? "",
    }),
  })

  if (!tokenRes.ok) {
    console.error("[mercadolibre/callback] Token exchange failed:", await tokenRes.text())
    return NextResponse.redirect(new URL("/config/integraciones?error=token_exchange", request.url))
  }

  const { access_token, refresh_token, user_id: sellerId, expires_in } = await tokenRes.json()

  // Datos del vendedor (nombre de la "tienda")
  let storeName = `MercadoLibre ${sellerId}`
  let storeUrl = ""
  const meRes = await fetch(`https://api.mercadolibre.com/users/${sellerId}`, {
    headers: { Authorization: `Bearer ${access_token}` },
  })
  if (meRes.ok) {
    const u = await meRes.json()
    storeName = u.nickname || storeName
    storeUrl = u.permalink || ""
  }

  const tokenExpiresAt = new Date(Date.now() + (expires_in ?? 21600) * 1000).toISOString()

  const { error } = await supabase
    .from("store_connections")
    .upsert(
      {
        user_id: user.id,
        platform: "mercadolibre",
        store_id: String(sellerId),
        store_name: storeName,
        store_url: storeUrl,
        access_token,
        refresh_token,
        token_expires_at: tokenExpiresAt,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,platform,store_id" }
    )

  if (error) {
    console.error("[mercadolibre/callback] Supabase upsert error:", error)
    return NextResponse.redirect(new URL("/config/integraciones?error=db_save", request.url))
  }

  return NextResponse.redirect(new URL("/config/integraciones?connected=mercadolibre", request.url))
}
