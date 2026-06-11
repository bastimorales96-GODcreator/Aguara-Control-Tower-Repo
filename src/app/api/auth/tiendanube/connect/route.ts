import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_SUPABASE_URL!))
  }

  const appId = process.env.TIENDANUBE_APP_ID!

  // Tiendanube's authorize endpoint does NOT accept a redirect_uri / scope query
  // param. Passing redirect_uri makes the install screen fail with
  // "Error al cargar los datos" (the cirrus /scopes call returns 400).
  // Tiendanube uses the redirect URL + scopes configured in the Partner Portal
  // app settings ("URL para redirigir después de la instalación" must point to
  // /api/auth/tiendanube/callback). So the authorize URL must be bare.
  const authUrl = `https://www.tiendanube.com/apps/${appId}/authorize`

  return NextResponse.redirect(authUrl)
}
