/**
 * GET /api/auth/mercadolibre/connect
 *
 * Inicia el OAuth 2.0 de MercadoLibre (con PKCE).
 * Guarda el state + code_verifier en oauth_states y redirige al authorize de ML.
 *
 * Env vars requeridas:
 *   MERCADOLIBRE_APP_ID        — App ID (Client ID) de developers.mercadolibre.com
 *   MERCADOLIBRE_CLIENT_SECRET — Client Secret
 *   NEXT_PUBLIC_APP_URL        — base de la app (para armar el redirect_uri)
 *   MERCADOLIBRE_AUTH_HOST      — opcional, default auth.mercadolibre.com.ar (usar .com.br, etc. según país)
 */

import { NextResponse } from "next/server"
import { randomBytes, createHash } from "crypto"
import { createClient } from "@/lib/supabase/server"

function base64url(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_APP_URL || "https://aguara-control-tower-repo.vercel.app"))
  }

  const appId = process.env.MERCADOLIBRE_APP_ID
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (!appId || !appUrl) {
    return NextResponse.json(
      { error: "MERCADOLIBRE_APP_ID or NEXT_PUBLIC_APP_URL not configured" },
      { status: 500 }
    )
  }

  const redirectUri = `${appUrl}/api/auth/mercadolibre/callback`
  const state = randomBytes(32).toString("hex")
  const codeVerifier = base64url(randomBytes(48))
  const codeChallenge = base64url(createHash("sha256").update(codeVerifier).digest())

  const { error } = await supabase
    .from("oauth_states")
    .insert({ state, user_id: user.id, platform: "mercadolibre", code_verifier: codeVerifier })

  if (error) {
    console.error("[mercadolibre/connect] Failed to persist state:", error)
    return NextResponse.json({ error: "Failed to initiate OAuth" }, { status: 500 })
  }

  const authHost = process.env.MERCADOLIBRE_AUTH_HOST || "auth.mercadolibre.com.ar"
  const params = new URLSearchParams({
    response_type: "code",
    client_id: appId,
    redirect_uri: redirectUri,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  })

  return NextResponse.redirect(`https://${authHost}/authorization?${params.toString()}`)
}
