/**
 * GET /api/auth/google-ads/connect
 *
 * Initiates the Google Ads OAuth 2.0 flow.
 * Persists CSRF state in Supabase oauth_states and redirects to Google's
 * authorization URL (opened in a popup by the UI).
 *
 * Required env vars:
 *   GOOGLE_ADS_CLIENT_ID      — from Google Cloud Console → OAuth 2.0 credentials
 *   GOOGLE_ADS_CLIENT_SECRET  — same
 *   NEXT_PUBLIC_APP_URL
 *
 * Google Cloud setup checklist:
 *   1. Create a project at https://console.cloud.google.com
 *   2. Enable the "Google Ads API"
 *   3. Create OAuth 2.0 credentials (Web application)
 *   4. Add {APP_URL}/api/auth/google-ads/callback to Authorized redirect URIs
 *   5. Apply for a Google Ads API developer token at:
 *      https://developers.google.com/google-ads/api/docs/first-call/dev-token
 */

import { NextResponse } from "next/server"
import { randomBytes } from "crypto"
import { createClient } from "@/lib/supabase/server"

const SCOPES = [
  "https://www.googleapis.com/auth/adwords",
].join(" ")

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const clientId = process.env.GOOGLE_ADS_CLIENT_ID
  const appUrl   = process.env.NEXT_PUBLIC_APP_URL

  if (!clientId || !appUrl) {
    return NextResponse.json(
      { error: "GOOGLE_ADS_CLIENT_ID or NEXT_PUBLIC_APP_URL not configured" },
      { status: 500 }
    )
  }

  const state = randomBytes(32).toString("hex")
  const { error: stateError } = await supabase
    .from("oauth_states")
    .insert({ state, user_id: user.id, platform: "google_ads" })

  if (stateError) {
    console.error("[google-ads/connect] Failed to persist state:", stateError)
    return NextResponse.json({ error: "Failed to initiate OAuth" }, { status: 500 })
  }

  const redirectUri = `${appUrl}/api/auth/google-ads/callback`

  const params = new URLSearchParams({
    client_id:             clientId,
    redirect_uri:          redirectUri,
    response_type:         "code",
    scope:                 SCOPES,
    access_type:           "offline",  // request refresh_token
    prompt:                "consent",  // always show consent to get refresh_token
    state,
  })

  return NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  )
}
