// =============================================================
// app/actions/emailActions.ts
// =============================================================
// Next.js Server Actions for transactional email delivery.
//
// WHY SERVER ACTIONS?
//   Booking forms are Client Components — they can call Server
//   Actions directly. The action runs on the server, so it can
//   safely access Supabase (with the user's session) and call
//   the email helper without exposing sensitive data to the
//   browser.
//
// ACTIONS
//   sendBookingEmails(bookingId) — fires confirmation to customer
//     + new-booking alert to professional after a booking is created
//
//   sendReviewNotificationEmail(reviewId) — fires review alert to
//     professional after a review is written
//
// All actions are non-throwing — email failure never blocks the
// client-side success state.
// =============================================================

"use server";

import { createClient }                  from "@/lib/supabase/server";
import {
  sendBookingConfirmation,
  sendNewBookingAlert,
  sendNewReviewNotification,
}                                         from "@/lib/sendTransactionalEmail";

// ── Booking emails ─────────────────────────────────────────────
// Called from DateBookingForm and FullCalendarBookingForm after
// a successful INSERT into the bookings table.

export async function sendBookingEmails(bookingId: string): Promise<void> {
  try {
    const supabase = await createClient();

    // Fetch booking with joined customer and professional data
    const { data: booking, error } = await supabase
      .from("bookings")
      .select(
        "id, booking_date, booking_time, booking_mode, description, " +
        "customer:customer_id(display_name, email), " +
        "professional:professional_id(first_name, last_name, email, slug)",
      )
      .eq("id", bookingId)
      .maybeSingle();

    if (error || !booking) {
      console.error("[emailActions] booking fetch error:", error?.message);
      return;
    }

    const customer = booking.customer as {
      display_name: string | null;
      email:        string | null;
    } | null;

    const pro = booking.professional as {
      first_name: string;
      last_name:  string;
      email:      string;
      slug:       string | null;
    } | null;

    if (!customer?.email || !pro) return;

    const proName      = `${pro.first_name} ${pro.last_name}`;
    const customerName = customer.display_name ?? customer.email;

    // Format booking date for display
    const bookingDate = booking.booking_date
      ? new Date(booking.booking_date).toLocaleDateString("el-GR", {
          weekday: "long",
          day:     "numeric",
          month:   "long",
          year:    "numeric",
        })
      : undefined;

    // ── 1. Confirmation to customer ──────────────────────────
    await sendBookingConfirmation({
      customerName,
      customerEmail: customer.email,
      proName,
      proSlug:       pro.slug ?? "",
      bookingDate,
      bookingTime:   booking.booking_time ?? undefined,
      notes:         booking.description ?? undefined,
    });

    // ── 2. Alert to professional ─────────────────────────────
    await sendNewBookingAlert({
      proEmail:    pro.email,
      proName,
      customerName,
      bookingDate,
      bookingTime: booking.booking_time ?? undefined,
      notes:       booking.description ?? undefined,
    });

  } catch (err) {
    // Non-fatal: log but do not surface to client
    console.error("[emailActions] sendBookingEmails error:", err);
  }
}

// ── Review notification email ─────────────────────────────────
// Called from WriteReviewModal (via a server action wrapper) after
// a successful INSERT into the reviews table.

export async function sendReviewNotification(reviewId: string): Promise<void> {
  try {
    const supabase = await createClient();

    // Fetch review with customer name + professional details
    const { data: review, error } = await supabase
      .from("reviews")
      .select(
        "id, rating, text, type, " +
        "customer:customer_id(display_name), " +
        "professional:professional_id(first_name, last_name, email, slug)",
      )
      .eq("id", reviewId)
      .maybeSingle();

    if (error || !review) {
      console.error("[emailActions] review fetch error:", error?.message);
      return;
    }

    const pro = review.professional as {
      first_name: string;
      last_name:  string;
      email:      string;
      slug:       string | null;
    } | null;

    const customer = review.customer as {
      display_name: string | null;
    } | null;

    if (!pro?.email) return;

    await sendNewReviewNotification({
      proEmail:     pro.email,
      proName:      `${pro.first_name} ${pro.last_name}`,
      proSlug:      pro.slug ?? "",
      customerName: customer?.display_name ?? "Ανώνυμος",
      rating:       review.rating,
      reviewText:   review.text ?? undefined,
      reviewType:   review.type as "verified" | "invitation" | "user",
    });

  } catch (err) {
    console.error("[emailActions] sendReviewNotification error:", err);
  }
}
