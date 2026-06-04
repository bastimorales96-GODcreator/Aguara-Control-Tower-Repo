/**
 * GET /api/auth/meta/callback
 *
 * Handles the OAuth callback from Meta.
 * 1. Validates CSRF state from Supabase oauth_states.
 * 2. Exchanges code for a long-lived access token.
 * 3. Fetches the list of Ad Accounts the token has access to.
 * 4. Stores the encrypted token + account list in oauth_discoveries.
 * 5. Closes the popup via postMessage so the parent window can show
 *    an account-selection modal.
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { encryptJSON } from "@/lib/encryption"

const APP_URL   = process.env.NEXT_PUBLIC_APP_URL!
const APP_ID    = process.env.META_APP_ID!
const APP_SECRET = process.env.META_APP_SECRET!

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code  = searchParams.get("code")
  const state = searchParams.get("state")
  const error = searchParams.get("error")

  // Return a self-closing popup page that sends a postMessage to the opener
  const closeWithMessage = (payload: Record<string, unknown>) =>
    new NextResponse(
      `<!DOCTYPE html><html><body><script>
        window.opener?.postMessage(${JSON.stringify({ source: "aguara_oauth", ...payload })}, "${APP_URL}");
        window.close();
      </script></body></html>`,
      { headers: { "Content-Type": "text/html" } }
    )

  if (error) {
    return closeWithMessage({ success: false, error })
  }

  if (!code || !state) {
    return closeWithMessage({ success: false, error: "missing_params" })
  }

  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return closeWithMessage({ success: false, error: "unauthenticated" })
  }

  // ── Validate CSRF state ──────────────────────────────────────────────────────
  const { data: stateRow, error: stateErr } = await supabase
    .from("oauth_states")
    .select("state, expires_at")
    .eq("state", state)
    .eq("user_id", user.id)
    .eq("platform", "meta_ads")
    .single()

  if (stateErr || !stateRow) {
    return closeWithMessage({ success: false, error: "invalid_state" })
  }

  if (new Date(stateRow.expires_at) < new Date()) {
    return closeWithMessage({ success: false, error: "state_expired" })
  }

  // Clean up used state
  await supabase.from("oauth_states").delete().eq("state", state)

  // ── Exchange code → short-lived token ────────────────────────────────────────
  const redirectUri = `${APP_URL}/api/auth/meta/callback`
  const tokenRes = await fetch(
    `https://graph.facebook.com/v21.0/oauth/access_token?` +
    new URLSearchParams({
      client_id:     APP_ID,
      client_secret: APP_SECRET,
      redirect_uri:  redirectUri,
      code,
    })
  )

  if (!tokenRes.ok) {
    const errBody = await tokenRes.text()
    console.error("[meta/callback] Token exchange failed:", errBody)
    return closeWithMessage({ success: false, error: "token_exchange_failed" })
  }

  const { access_token: shortToken } = await tokenRes.json()

  // ── Exchange for long-lived token (60-day) ────────────────────────────────────
  const longRes = await fetch(
    `https://graph.facebook.com/v21.0/oauth/access_token?` +
    new URLSearchParams({
      grant_type:        "fb_exchange_token",
      client_id:         APP_ID,
      client_secret:     APP_SECRET,
      fb_exchange_token: shortToken,
    })
  )

  const { access_token: longToken, expires_in } = await longRes.json()

  const tokenSet = {
    access_token: longToken,
    expires_at: Date.now() + (expires_in ?? 5_184_000) * 1000,
  }

  // ── Fetch available Ad Accounts ───────────────────────────────────────────────
  const accountsRes = await fetch(
    `https://graph.facebook.com/v21.0/me/adaccounts?` +
    new URLSearchParams({
      fields:       "id,name,currency,account_status",
      access_token: longToken,
      limit:        "50",
    })
  )

  const accountsData = await accountsRes.json()
  const accounts: Array<{ id: string; name: string; currency: string; status: number }> =
    (accountsData.data ?? []).map((a: Record<string, unknown>) => ({
      id:       String(a.id).replace("act_", ""),
      name:     a.name,
      currency: a.currency,
      status:   a.account_status,
    }))

  // ── Store discovery in Supabase ───────────────────────────────────────────────
  const encryptedToken = encryptJSON(tokenSet)

  const { data: discovery, error: discErr } = await supabase
    .from("oauth_discoveries")
    .insert({
      user_id:         user.id,
      platform:        "meta_ads",
      accounts:        accounts,
      encrypted_token: encryptedToken,
    })
    .select("id")
    .single()

  if (discErr || !discovery) {
    console.error("[meta/callback] Failed to store discovery:", discErr)
    return closeWithMessage({ success: false, error: "discovery_store_failed" })
  }

  // ── Tell the popup opener to show account selection ───────────────────────────
  return closeWithMessage({
    success:      true,
    platform:     "meta_ads",
    discoveryId:  discovery.id,
    accountCount: accounts.length,
  })
}
