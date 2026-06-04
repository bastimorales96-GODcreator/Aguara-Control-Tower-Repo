/**
 * GET /api/auth/google-ads/callback
 *
 * Handles the OAuth callback from Google.
 * 1. Validates CSRF state.
 * 2. Exchanges code → access_token + refresh_token.
 * 3. Lists accessible Google Ads customer accounts via the REST API.
 * 4. Stores encrypted token + account list in oauth_discoveries.
 * 5. Sends postMessage to popup opener for account selection.
 *
 * Required env vars:
 *   GOOGLE_ADS_CLIENT_ID
 *   GOOGLE_ADS_CLIENT_SECRET
 *   GOOGLE_ADS_DEVELOPER_TOKEN  — from Google Ads API Center
 *   NEXT_PUBLIC_APP_URL
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { encryptJSON } from "@/lib/encryption"

const APP_URL    = process.env.NEXT_PUBLIC_APP_URL!
const CLIENT_ID  = process.env.GOOGLE_ADS_CLIENT_ID!
const CLIENT_SECRET = process.env.GOOGLE_ADS_CLIENT_SECRET!
const DEV_TOKEN  = process.env.GOOGLE_ADS_DEVELOPER_TOKEN!

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code  = searchParams.get("code")
  const state = searchParams.get("state")
  const error = searchParams.get("error")

  const closeWithMessage = (payload: Record<string, unknown>) =>
    new NextResponse(
      `<!DOCTYPE html><html><body><script>
        window.opener?.postMessage(${JSON.stringify({ source: "aguara_oauth", ...payload })}, "${APP_URL}");
        window.close();
      </script></body></html>`,
      { headers: { "Content-Type": "text/html" } }
    )

  if (error) return closeWithMessage({ success: false, error })
  if (!code || !state) return closeWithMessage({ success: false, error: "missing_params" })

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
    .eq("platform", "google_ads")
    .single()

  if (stateErr || !stateRow) {
    return closeWithMessage({ success: false, error: "invalid_state" })
  }

  if (new Date(stateRow.expires_at) < new Date()) {
    return closeWithMessage({ success: false, error: "state_expired" })
  }

  await supabase.from("oauth_states").delete().eq("state", state)

  // ── Exchange code → tokens ────────────────────────────────────────────────────
  const redirectUri = `${APP_URL}/api/auth/google-ads/callback`

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method:  "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id:     CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri:  redirectUri,
      grant_type:    "authorization_code",
    }),
  })

  if (!tokenRes.ok) {
    const errBody = await tokenRes.text()
    console.error("[google-ads/callback] Token exchange failed:", errBody)
    return closeWithMessage({ success: false, error: "token_exchange_failed" })
  }

  const tokenData = await tokenRes.json()
  const tokenSet = {
    access_token:  tokenData.access_token,
    refresh_token: tokenData.refresh_token,
    expires_at:    Date.now() + (tokenData.expires_in ?? 3600) * 1000,
  }

  // ── List accessible Google Ads customer accounts ──────────────────────────────
  const customersRes = await fetch(
    "https://googleads.googleapis.com/v17/customers:listAccessibleCustomers",
    {
      headers: {
        Authorization:          `Bearer ${tokenSet.access_token}`,
        "developer-token":      DEV_TOKEN,
        "Content-Type":         "application/json",
      },
    }
  )

  interface CustomerInfo {
    id: string
    name: string
    currency: string
    isMcc: boolean
  }

  let accounts: CustomerInfo[] = []

  if (customersRes.ok) {
    const customersData = await customersRes.json()
    const resourceNames: string[] = customersData.resourceNames ?? []

    // Fetch details for each customer account
    const details = await Promise.allSettled(
      resourceNames.map(async (resourceName) => {
        const customerId = resourceName.replace("customers/", "")
        const detailRes = await fetch(
          `https://googleads.googleapis.com/v17/${resourceName}?` +
          new URLSearchParams({ "fieldMask": "id,descriptiveName,currencyCode,manager" }),
          {
            headers: {
              Authorization:     `Bearer ${tokenSet.access_token}`,
              "developer-token": DEV_TOKEN,
              "login-customer-id": customerId,
            },
          }
        )
        if (!detailRes.ok) return null
        const d = await detailRes.json()
        return {
          id:       String(d.id ?? customerId),
          name:     d.descriptiveName ?? `Account ${customerId}`,
          currency: d.currencyCode ?? "USD",
          isMcc:    d.manager ?? false,
        } as CustomerInfo
      })
    )

    accounts = details
      .filter((r): r is PromiseFulfilledResult<CustomerInfo> =>
        r.status === "fulfilled" && r.value !== null
      )
      .map((r) => r.value)
      // Filter out MCC (manager) accounts — show leaf accounts only
      .filter((a) => !a.isMcc)
  }

  // ── Store discovery ────────────────────────────────────────────────────────────
  const encryptedToken = encryptJSON(tokenSet)

  const { data: discovery, error: discErr } = await supabase
    .from("oauth_discoveries")
    .insert({
      user_id:         user.id,
      platform:        "google_ads",
      accounts,
      encrypted_token: encryptedToken,
    })
    .select("id")
    .single()

  if (discErr || !discovery) {
    console.error("[google-ads/callback] Failed to store discovery:", discErr)
    return closeWithMessage({ success: false, error: "discovery_store_failed" })
  }

  return closeWithMessage({
    success:      true,
    platform:     "google_ads",
    discoveryId:  discovery.id,
    accountCount: accounts.length,
  })
}
