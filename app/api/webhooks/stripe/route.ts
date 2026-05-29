// =============================================================
// app/api/webhooks/stripe/route.ts
// =============================================================
// Stripe webhook handler.
//
// EVENTS HANDLED
//   checkout.session.completed
//     → payment successful → mark subscription as verified,
//       stamp payment_verified_at, store payment_intent_id
//
//   checkout.session.expired   (optional)
//     → session expired before payment → leave as pending
//       (nothing to do; user can start a new checkout from dashboard)
//
// SECURITY
//   Every request is verified against STRIPE_WEBHOOK_SECRET.
//   Unverified requests are rejected with 400.
//
// IDEMPOTENCY
//   Stripe may deliver the same event more than once.
//   The upsert is safe: verifying an already-verified row is a no-op.
//
// SETUP (Stripe Dashboard → Developers → Webhooks)
//   URL:    https://trustia.gr/api/webhooks/stripe
//   Events: checkout.session.completed
//
// LOCAL DEV
//   stripe login
//   stripe listen --forward-to localhost:3000/api/webhooks/stripe
//   Copy the printed webhook signing secret to STRIPE_WEBHOOK_SECRET in .env.local
// =============================================================

import { NextRequest, NextResponse } from "next/server";
import Stripe                        from "stripe";
import stripe                        from "@/lib/stripe";
import { createServiceClient }       from "@/lib/supabase/service";

// Next.js App Router: disable body parsing so we can read the raw bytes
// that Stripe's signature verification requires.
export const config = { api: { bodyParser: false } };

export async function POST(req: NextRequest) {
  // ── Read raw body ───────────────────────────────────────────
  const body      = await req.text();
  const signature = req.headers.get("stripe-signature") ?? "";
  const secret    = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret) {
    console.error("[webhook] STRIPE_WEBHOOK_SECRET not set");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  // ── Verify signature ────────────────────────────────────────
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch (err) {
    console.error("[webhook] signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // ── Route events ────────────────────────────────────────────
  switch (event.type) {

    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;

      // Bail if payment wasn't actually collected
      if (session.payment_status !== "paid") {
        console.log("[webhook] session not paid, skipping:", session.id);
        break;
      }

      const subscriptionId = session.metadata?.subscription_id;
      const professionalId = session.metadata?.professional_id;

      if (!subscriptionId || !professionalId) {
        console.error("[webhook] missing metadata on session:", session.id);
        // Return 200 so Stripe doesn't retry — this is a data issue, not a transient one
        break;
      }

      // Use the service client (bypasses RLS) so the webhook can always
      // update the subscription regardless of auth session.
      const supabase = createServiceClient();

      const { error } = await supabase
        .from("subscriptions")
        .update({
          payment_status:      "verified",
          payment_method:      "stripe",
          payment_verified_at: new Date().toISOString(),
          stripe_payment_intent_id:
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : (session.payment_intent?.id ?? null),
        })
        .eq("id",              subscriptionId)
        .eq("professional_id", professionalId);

      if (error) {
        console.error("[webhook] DB update failed:", error.message);
        // Return 500 so Stripe retries the event
        return NextResponse.json({ error: "DB update failed" }, { status: 500 });
      }

      console.log(`[webhook] subscription ${subscriptionId} marked as verified`);
      break;
    }

    case "checkout.session.expired": {
      // Session timed out. The subscription stays 'pending'.
      // The professional can retry from the dashboard.
      const session = event.data.object as Stripe.Checkout.Session;
      console.log("[webhook] checkout session expired:", session.id);
      break;
    }

    default:
      // Ignore all other events
      break;
  }

  // Always return 200 so Stripe knows we received the event
  return NextResponse.json({ received: true });
}
