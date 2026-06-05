/**
 * POST /api/connectors/google-analytics
 *
 * Connects a Google Analytics 4 property.
 * Accepts: { propertyId: string, measurementId: string }
 * - propertyId: numeric GA4 property ID (e.g. "123456789")
 * - measurementId: G-XXXXXXXX tracking ID
 *
 * Validates the format and upserts into connector_accounts.
 *
 * DELETE /api/connectors/google-analytics
 * Disconnects by removing the connector_accounts row.
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { encryptJSON } from "@/lib/encryption"

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { propertyId, measurementId } = (await req.json()) as {
    propertyId?: string
    measurementId?: string
  }

  if (!propertyId || !measurementId) {
    return NextResponse.json(
      { error: "Se requieren el Property ID y el Measurement ID (G-XXXXXXXXXX)" },
      { status: 400 }
    )
  }

  // Validate Measurement ID format: G-XXXXXXXXXX
  const measurementPattern = /^G-[A-Z0-9]{6,12}$/i
  if (!measurementPattern.test(measurementId.trim())) {
    return NextResponse.json(
      { error: "El Measurement ID debe tener el formato G-XXXXXXXXXX" },
      { status: 422 }
    )
  }

  // Validate Property ID is numeric
  const cleanPropertyId = propertyId.trim().replace(/^properties\//, "")
  if (!/^\d+$/.test(cleanPropertyId)) {
    return NextResponse.json(
      { error: "El Property ID debe ser numérico (ej: 123456789)" },
      { status: 422 }
    )
  }

  const accountName = `GA4 · ${measurementId.trim().toUpperCase()}`

  const encryptedCredentials = encryptJSON({
    property_id:    cleanPropertyId,
    measurement_id: measurementId.trim().toUpperCase(),
  })

  const { error: upsertErr } = await supabase
    .from("connector_accounts")
    .upsert(
      {
        user_id:               user.id,
        platform:              "google_analytics",
        external_account_id:   cleanPropertyId,
        account_name:          accountName,
        encrypted_credentials: encryptedCredentials,
        status:                "active",
      },
      { onConflict: "user_id,platform,external_account_id" }
    )

  if (upsertErr) {
    console.error("[google-analytics] Upsert failed:", upsertErr)
    return NextResponse.json({ error: "Error al guardar la conexión" }, { status: 500 })
  }

  return NextResponse.json({ success: true, accountName })
}

export async function DELETE() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  await supabase
    .from("connector_accounts")
    .delete()
    .eq("user_id", user.id)
    .eq("platform", "google_analytics")

  return NextResponse.json({ success: true })
}
