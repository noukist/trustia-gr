// =============================================================
// lib/sendTransactionalEmail.ts
// =============================================================
// Server-side helper for sending transactional emails from
// Next.js Server Actions and Server Components.
//
// Instead of going through the HTTP API route (which requires
// INTERNAL_API_SECRET overhead), this calls lib/email.ts and
// lib/emailTemplates.ts directly — both are server-only modules.
//
// Usage:
//   await sendBookingConfirmation({ customerEmail, ... });
//   await sendNewBookingAlert({ proEmail, ... });
//   await sendNewReviewNotification({ proEmail, ... });
//   await sendBookingStatusUpdate({ customerEmail, ... });
//
// All functions are non-throwing — email failure never blocks
// the main server action.
// =============================================================

import { sendEmail } from "@/lib/email";
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

// ── Booking confirmation → customer ───────────────────────────

export async function sendBookingConfirmation(data: BookingConfirmationData) {
  const { subject, html } = bookingConfirmationEmail(data);
  return sendEmail({ to: data.customerEmail, subject, html });
}

// ── New booking alert → professional ─────────────────────────

export async function sendNewBookingAlert(data: NewBookingAlertData) {
  const { subject, html } = newBookingAlertEmail(data);
  return sendEmail({ to: data.proEmail, subject, html });
}

// ── New review notification → professional ────────────────────

export async function sendNewReviewNotification(data: NewReviewNotificationData) {
  const { subject, html } = newReviewNotificationEmail(data);
  return sendEmail({ to: data.proEmail, subject, html });
}

// ── Booking status update → customer ─────────────────────────

export async function sendBookingStatusUpdate(data: BookingStatusUpdateData) {
  const { subject, html } = bookingStatusUpdateEmail(data);
  return sendEmail({ to: data.customerEmail, subject, html });
}
