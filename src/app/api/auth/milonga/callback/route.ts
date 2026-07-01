/**
 * GET /api/auth/milonga/callback  — SCAFFOLD / MAQUETADO
 *
 * Callback del OAuth de Milonga (OMS de Iflow). Estructura lista para completar
 * cuando tengamos el spec de la API: validación de state, intercambio de code
 * por token y guardado en store_connections (platform "milonga").
 *
 * TODO (cuando llegue el spec de Iflow):
 *   - Completar el token endpoint y el formato de la respuesta.
 *   - Mapear el identificador de la cuenta/almacén (store_id) y el nombre.
 *   - Definir si Milonga es un canal de venta (store_connections) o una fuente
 *     de fulfillment/OMS aparte (podría requerir su propia tabla/lógica).
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const state = searchParams.get("state")

  if (!code || !state) {
    return NextResponse.redirect(new URL("/config/integraciones?error=no_code", request.url))
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL("/login", request.url))

  // Validar state
  const { data: stateRow, error: stateErr } = await supabase
    .from("oauth_states")
    .select("expires_at")
    .eq("state", state)
    .eq("user_id", user.id)
    .eq("platform", "milonga")
    .single()
  if (stateErr || !stateRow) {
    return NextResponse.redirect(new URL("/config/integraciones?error=invalid_state", request.url))
  }
  await supabase.from("oauth_states").delete().eq("state", state)

  // TODO: intercambiar `code` por token contra el endpoint de Iflow/Milonga.
  //   const tokenRes = await fetch(process.env.MILONGA_TOKEN_URL!, { ... })
  //   const { access_token, refresh_token, account_id } = await tokenRes.json()
  //   await supabase.from("store_connections").upsert({ ... platform: "milonga" ... })

  // Mientras no tengamos el spec, marcamos la integración como pendiente.
  return NextResponse.redirect(new URL("/config/integraciones?error=milonga_pendiente", request.url))
}
