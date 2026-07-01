/**
 * GET /api/auth/milonga/connect  — SCAFFOLD / MAQUETADO
 *
 * Milonga es el OMS (Order Management System) de Iflow.
 * Esta ruta deja el esqueleto del OAuth listo para completar cuando tengamos
 * la documentación de la API de Iflow/Milonga (auth host, scopes, token endpoint).
 *
 * Env vars (a definir cuando tengamos las credenciales):
 *   MILONGA_APP_ID / MILONGA_CLIENT_ID
 *   MILONGA_CLIENT_SECRET
 *   MILONGA_AUTH_URL        — endpoint de authorize de Iflow
 *   NEXT_PUBLIC_APP_URL     — para armar el redirect_uri
 *
 * TODO (cuando llegue el spec de Iflow):
 *   - Confirmar si es OAuth 2.0 (authorization_code), API key, o token directo.
 *   - Completar la URL de authorize y los scopes.
 *   - Si es OAuth, persistir el state en oauth_states (platform: "milonga").
 */

import { NextResponse } from "next/server"
import { randomBytes } from "crypto"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_APP_URL || "https://aguara-control-tower-repo.vercel.app"))
  }

  const appId = process.env.MILONGA_CLIENT_ID || process.env.MILONGA_APP_ID
  const authUrl = process.env.MILONGA_AUTH_URL
  const appUrl = process.env.NEXT_PUBLIC_APP_URL

  // Aún no configurado: la integración está maqueteada, falta el spec de la API de Iflow.
  if (!appId || !authUrl || !appUrl) {
    return NextResponse.redirect(
      new URL("/config/integraciones?error=milonga_pendiente", process.env.NEXT_PUBLIC_APP_URL || "https://aguara-control-tower-repo.vercel.app")
    )
  }

  const redirectUri = `${appUrl}/api/auth/milonga/callback`
  const state = randomBytes(32).toString("hex")

  const { error } = await supabase
    .from("oauth_states")
    .insert({ state, user_id: user.id, platform: "milonga" })
  if (error) {
    console.error("[milonga/connect] Failed to persist state:", error)
    return NextResponse.json({ error: "Failed to initiate OAuth" }, { status: 500 })
  }

  // TODO: ajustar params según el spec real de Iflow/Milonga.
  const params = new URLSearchParams({
    response_type: "code",
    client_id: appId,
    redirect_uri: redirectUri,
    state,
  })

  return NextResponse.redirect(`${authUrl}?${params.toString()}`)
}
