/**
 * GET /api/auth/meta/connect
 *
 * Initiates the Meta (Facebook) OAuth 2.0 flow.
 * Stores a CSRF state token in Supabase oauth_states and redirects to
 * Meta's authorization URL (opened in a popup by the UI).
 *
 * Required env vars:
 *   META_APP_ID          — from developers.facebook.com
 *   META_APP_SECRET      — same
 *   NEXT_PUBLIC_APP_URL  — e.g. https://aguara.vercel.app
 */

import { NextResponse } from "next/server"
import { randomBytes } from "crypto"
import { createClient } from "@/lib/supabase/server"

const SCOPES = [
  "ads_read",
  "ads_management",
  "business_management",
  "public_profile",
].join(",")

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const appId     = process.env.META_APP_ID
  const appUrl    = process.env.NEXT_PUBLIC_APP_URL

  if (!appId || !appUrl) {
    return NextResponse.json(
      { error: "META_APP_ID or NEXT_PUBLIC_APP_URL not configured" },
      { status: 500 }
    )
  }

  // Generate & persist CSRF state
  const state = randomBytes(32).toString("hex")
  const { error: stateError } = await supabase
    .from("oauth_states")
    .insert({ state, user_id: user.id, platform: "meta_ads" })

  if (stateError) {
    console.error("[meta/connect] Failed to persist state:", stateError)
    return NextResponse.json({ error: "Failed to initiate OAuth" }, { status: 500 })
  }

  const redirectUri = `${appUrl}/api/auth/meta/callback`

  const params = new URLSearchParams({
    client_id:     appId,
    redirect_uri:  redirectUri,
    scope:         SCOPES,
    response_type: "code",
    state,
  })

  return NextResponse.redirect(
    `https://www.facebook.com/v21.0/dialog/oauth?${params.toString()}`
  )
}
