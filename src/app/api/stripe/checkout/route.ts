import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { stripe, QA_MODE } from "@/lib/stripe"

export async function POST(request: NextRequest) {
  // QA bypass — return a fake session so the front-end can skip payment
  if (QA_MODE) {
    return NextResponse.json({ url: "/?qa_subscribed=true" })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { priceId, plan, step } = await request.json()

  if (!priceId) {
    return NextResponse.json({ error: "Missing priceId" }, { status: 400 })
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/?subscribed=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?cancelled=true`,
    client_reference_id: user.id,
    metadata: { user_id: user.id, plan, step: String(step) },
    subscription_data: {
      metadata: { user_id: user.id, plan },
    },
  })

  return NextResponse.json({ url: session.url })
}
