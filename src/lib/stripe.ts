import Stripe from "stripe"

export const QA_MODE = process.env.QA_BYPASS === "true"

// In QA mode, Stripe is never called — use a placeholder key to satisfy the SDK
const stripeKey = process.env.STRIPE_SECRET_KEY ?? (QA_MODE ? "sk_test_placeholder" : "")

if (!QA_MODE && !stripeKey) {
  throw new Error("Missing STRIPE_SECRET_KEY")
}

export const stripe = new Stripe(stripeKey, {
  apiVersion: "2026-05-27.dahlia",
})

// Price IDs — set these in your Stripe dashboard and copy here.
// Use test price IDs (price_test_...) for QA, live IDs for production.
export const STRIPE_PRICES: Record<string, Record<number, string>> = {
  // starter: { 1: "price_starter_step1", 2: "price_starter_step2", ... }
  // Fill these after creating prices in Stripe dashboard.
  // For now we default to a single placeholder used in test mode.
  starter: {},
  growth:  {},
  pro:     {},
}
