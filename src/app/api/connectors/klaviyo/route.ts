/**
 * POST /api/connectors/klaviyo
 *
 * Connects a Klaviyo account via Private API Key.
 * 1. Validates the key by calling the Klaviyo Profiles API.
 * 2. Encrypts the key and upserts into connector_accounts.
 *
 * Body: { apiKey: string }
 *
 * Required env var: ENCRYPTION_KEY
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { encryptJSON } from "@/lib/encryption"

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { apiKey } = (await req.json()) as { apiKey?: string }

  if (!apiKey || apiKey.trim().length < 10) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 400 })
  }

  // ── Validate key against Klaviyo API ──────────────────────────────────────────
  const testRes = await fetch("https://a.klaviyo.com/api/accounts/", {
    headers: {
      Authorization: `Klaviyo-API-Key ${apiKey.trim()}`,
      revision:      "2024-02-15",
    },
  })

  if (!testRes.ok) {
    return NextResponse.json(
      { error: "Invalid Klaviyo API key — could not authenticate" },
      { status: 422 }
    )
  }

  const accountData = await testRes.json()
  const accountId   = accountData?.data?.[0]?.id ?? "unknown"
  const accountName = accountData?.data?.[0]?.attributes?.contact_information?.organization_name
    ?? "Klaviyo Account"

  // ── Encrypt & upsert ──────────────────────────────────────────────────────────
  const encryptedCredentials = encryptJSON({ api_key: apiKey.trim() })

  const { error: upsertErr } = await supabase
    .from("connector_accounts")
    .upsert(
      {
        user_id:               user.id,
        platform:              "klaviyo",
        external_account_id:   accountId,
        account_name:          accountName,
        encrypted_credentials: encryptedCredentials,
        status:                "active",
      },
      { onConflict: "user_id,platform,external_account_id" }
    )

  if (upsertErr) {
    console.error("[klaviyo] Upsert failed:", upsertErr)
    return NextResponse.json({ error: "Failed to save connector" }, { status: 500 })
  }

  return NextResponse.json({ success: true, accountName })
}

/**
 * DELETE /api/connectors/klaviyo
 * Disconnects Klaviyo by removing all connector_accounts rows for this user.
 */
export async function DELETE() {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  await supabase
    .from("connector_accounts")
    .delete()
    .eq("user_id", user.id)
    .eq("platform", "klaviyo")

  return NextResponse.json({ success: true })
}
