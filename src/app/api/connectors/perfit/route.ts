/**
 * POST /api/connectors/perfit
 *
 * Connects a Perfit (email marketing) account via API Key.
 * 1. Validates the key by calling the Perfit Contacts API.
 * 2. Encrypts the key and upserts into connector_accounts.
 *
 * Body: { apiKey: string }
 *
 * Perfit API docs: https://api.myperfit.com/docs
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

  if (!apiKey || apiKey.trim().length < 6) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 400 })
  }

  // ── Validate key against Perfit API ───────────────────────────────────────────
  // Perfit uses Basic auth: Authorization: Bearer <apiKey>
  const testRes = await fetch("https://api.myperfit.com/v2/account", {
    headers: {
      Authorization: `Bearer ${apiKey.trim()}`,
      "Content-Type": "application/json",
    },
  })

  if (!testRes.ok) {
    return NextResponse.json(
      { error: "Invalid Perfit API key — could not authenticate" },
      { status: 422 }
    )
  }

  const accountData = await testRes.json()
  const accountId   = String(accountData?.id ?? accountData?.account_id ?? "unknown")
  const accountName = accountData?.name ?? accountData?.company ?? "Perfit Account"

  // ── Encrypt & upsert ──────────────────────────────────────────────────────────
  const encryptedCredentials = encryptJSON({ api_key: apiKey.trim() })

  const { error: upsertErr } = await supabase
    .from("connector_accounts")
    .upsert(
      {
        user_id:               user.id,
        platform:              "perfit",
        external_account_id:   accountId,
        account_name:          accountName,
        encrypted_credentials: encryptedCredentials,
        status:                "active",
      },
      { onConflict: "user_id,platform,external_account_id" }
    )

  if (upsertErr) {
    console.error("[perfit] Upsert failed:", upsertErr)
    return NextResponse.json({ error: "Failed to save connector" }, { status: 500 })
  }

  return NextResponse.json({ success: true, accountName })
}

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
    .eq("platform", "perfit")

  return NextResponse.json({ success: true })
}
