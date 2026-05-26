// =============================================================
// app/api/email/route.ts
// =============================================================
// Internal API route for sending transactional emails.
//
// POST /api/email
// Body (JSON):
//   {
//     type:    "booking_confirmation" | "new_booking_alert" |
//              "new_review_notification" | "booking_status_update",
//     payload: { ...template-specific fields }
//   }
//
// SECURITY
//   Requests MUST include the INTERNAL_API_SECRET header matching
//   the INTERNAL_API_SECRET env var. This prevents public callers
//   from abusing the email endpoint.
//
//   Called from:
//     • Server Actions (bookings, status updates)
//     • The route itself is NOT exposed to the client.
//
// IDEMPOTENCY
//   Email delivery is best-effort. Failures are logged but do not
//   block the main flow (booking still saves even if email fails).
// =============================================================

import { NextRequest, NextResponse } from "next/server";
import { sendEmail }                 from "@/lib/email";
import {
  bookingConfirmationEmail,
  newBookingAlertEmail,
  newReviewNotificationEmail,
  bookingStatusUpdateEmail,
  type BookingConfirmationData,
  type NewBookingAlertData,
  type NewReviewNotificationData,
  type BookingStatusUpdateData,
} from "@/lib/emailTemplates";

// ── Types ─────────────────────────────────────────────────────

type EmailRequest =
  | { type: "booking_confirmation";   payload: BookingConfirmationData }
  | { type: "new_booking_alert";      payload: NewBookingAlertData }
  | { type: "new_review_notification"; payload: NewReviewNotificationData }
  | { type: "booking_status_update";  payload: BookingStatusUpdateData };

// ── POST handler ──────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // ── Auth check ────────────────────────────────────────────
  const secret = req.headers.get("x-internal-secret");
  if (!process.env.INTERNAL_API_SECRET || secret !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Parse body ────────────────────────────────────────────
  let body: EmailRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { type, payload } = body;

  // ── Build + send ──────────────────────────────────────────
  try {
    let to:      string;
    let subject: string;
    let html:    string;

    switch (type) {
      case "booking_confirmation": {
        const d = payload as BookingConfirmationData;
        to = d.customerEmail;
        ({ subject, html } = bookingConfirmationEmail(d));
        break;
      }

      case "new_booking_alert": {
        const d = payload as NewBookingAlertData;
        to = d.proEmail;
        ({ subject, html } = newBookingAlertEmail(d));
        break;
      }

      case "new_review_notification": {
        const d = payload as NewReviewNotificationData;
        to = d.proEmail;
        ({ subject, html } = newReviewNotificationEmail(d));
        break;
      }

      case "booking_status_update": {
        const d = payload as BookingStatusUpdateData;
        to = d.customerEmail;
        ({ subject, html } = bookingStatusUpdateEmail(d));
        break;
      }

      default:
        return NextResponse.json({ error: "Unknown email type" }, { status: 400 });
    }

    const ok = await sendEmail({ to, subject, html });
    return NextResponse.json({ ok });

  } catch (err) {
    console.error("[api/email]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
