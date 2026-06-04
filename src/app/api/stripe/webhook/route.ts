import { NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { createClient } from "@supabase/supabase-js"
import type Stripe from "stripe"

// Use service role client — webhooks run outside user session
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig  = request.headers.get("stripe-signature") ?? ""

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session
      const userId  = session.metadata?.user_id
      const plan    = session.metadata?.plan ?? "starter"
      if (userId) {
        await supabase.from("subscriptions").upsert({
          user_id: userId,
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: session.subscription as string,
          plan,
          status: "active",
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" })
      }
      break
    }

    case "customer.subscription.updated": {
      const sub    = event.data.object as Stripe.Subscription
      const userId = sub.metadata?.user_id
      if (userId) {
        await supabase.from("subscriptions")
          .update({
            status: sub.status,
            plan: sub.metadata?.plan ?? "starter",
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", sub.id)
      }
      break
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription
      await supabase.from("subscriptions")
        .update({ status: "cancelled", updated_at: new Date().toISOString() })
        .eq("stripe_subscription_id", sub.id)
      break
    }
  }

  return NextResponse.json({ received: true })
}
