// =============================================================
// lib/stripe.ts
// =============================================================
// Singleton Stripe server client.
//
// REQUIRED ENV VARS (add to .env.local):
//   STRIPE_SECRET_KEY             — from Stripe Dashboard → Developers → API keys
//   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY — same section (starts with pk_)
//   STRIPE_WEBHOOK_SECRET         — from `stripe listen` or Dashboard → Webhooks
// =============================================================

import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set. Add it to .env.local.");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  // Pin the API version so upgrades don't break webhooks silently
  apiVersion: "2026-05-27.dahlia",
  typescript:  true,
});

export default stripe;
