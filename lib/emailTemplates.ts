// =============================================================
// lib/emailTemplates.ts
// =============================================================
// HTML email templates for all transactional emails.
//
// Each template is a plain function that returns an HTML string.
// Inline styles are used throughout for maximum email-client
// compatibility (Gmail, Outlook, Apple Mail, etc.).
//
// Brand colours:
//   Primary teal:  #2A8F8F
//   Accent gold:   #D4A039
//   Text dark:     #1A1A2E
//   Text muted:    #6B7280
//   Border:        #E5E7EB
//   Background:    #F9FAFB
// =============================================================

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://trustia.gr";

// ── Shared wrapper ────────────────────────────────────────────

function wrap(content: string): string {
  return `
<!DOCTYPE html>
<html lang="el">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background-color:#F9FAFB;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <!-- Header / logo -->
          <tr>
            <td style="padding:0 0 24px;">
              <a href="${BASE_URL}" style="text-decoration:none;">
                <span style="font-size:22px;font-weight:800;color:#2A8F8F;letter-spacing:-0.5px;">TRUSTIA<span style="color:#D4A039;">.GR</span></span>
              </a>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#fff;border-radius:16px;border:1.5px solid #E5E7EB;padding:32px 28px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 0 0;text-align:center;font-size:12px;color:#9CA3AF;line-height:1.6;">
              Trustia.gr — Βρες τον ειδικό για κάθε ανάγκη.<br/>
              <a href="${BASE_URL}/privacy" style="color:#9CA3AF;">Πολιτική Απορρήτου</a>
              &nbsp;·&nbsp;
              <a href="${BASE_URL}/terms" style="color:#9CA3AF;">Όροι Χρήσης</a>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ── Button helper ─────────────────────────────────────────────

function btn(href: string, label: string, color = "#2A8F8F"): string {
  return `
<a href="${href}" style="display:inline-block;padding:12px 28px;background:${color};color:#fff;border-radius:10px;font-weight:700;font-size:15px;text-decoration:none;margin:20px 0 4px;">${label}</a>`;
}

// =============================================================
// 1. Booking confirmation → customer
// =============================================================

export interface BookingConfirmationData {
  customerName:   string;
  customerEmail:  string;
  proName:        string;
  proSlug:        string;
  bookingDate?:   string;   // formatted string, e.g. "Τετάρτη 28 Μαΐου 2025"
  bookingTime?:   string;   // e.g. "10:00"
  serviceName?:   string;
  notes?:         string;
}

export function bookingConfirmationEmail(d: BookingConfirmationData): {
  subject: string;
  html:    string;
} {
  const proUrl = `${BASE_URL}/professional/${d.proSlug}`;

  return {
    subject: `Επιβεβαίωση αιτήματος κράτησης — ${d.proName}`,
    html: wrap(`
      <h1 style="font-size:20px;font-weight:800;color:#1A1A2E;margin:0 0 8px;">Το αίτημά σου στάλθηκε! 🎉</h1>
      <p style="font-size:15px;color:#4B5563;margin:0 0 20px;line-height:1.6;">
        Γεια σου <strong>${d.customerName}</strong>! Το αίτημα κράτησης σου στάλθηκε στον/στην
        <strong>${d.proName}</strong>. Θα επικοινωνήσει μαζί σου σύντομα για να επιβεβαιώσει.
      </p>

      <table width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB;border-radius:10px;border:1.5px solid #E5E7EB;padding:16px 20px;margin:0 0 20px;">
        ${d.bookingDate ? `<tr><td style="font-size:13px;color:#6B7280;padding:4px 0;">Ημερομηνία</td><td style="font-size:14px;font-weight:600;color:#1A1A2E;text-align:right;">${d.bookingDate}${d.bookingTime ? " · " + d.bookingTime : ""}</td></tr>` : ""}
        ${d.serviceName ? `<tr><td style="font-size:13px;color:#6B7280;padding:4px 0;">Υπηρεσία</td><td style="font-size:14px;font-weight:600;color:#1A1A2E;text-align:right;">${d.serviceName}</td></tr>` : ""}
        <tr><td style="font-size:13px;color:#6B7280;padding:4px 0;">Επαγγελματίας</td><td style="font-size:14px;font-weight:600;color:#1A1A2E;text-align:right;">${d.proName}</td></tr>
        ${d.notes ? `<tr><td style="font-size:13px;color:#6B7280;padding:4px 0;">Σημείωση</td><td style="font-size:14px;color:#1A1A2E;text-align:right;">${d.notes}</td></tr>` : ""}
      </table>

      ${btn(proUrl, "Δες το προφίλ του/της")}

      <p style="font-size:13px;color:#9CA3AF;margin:16px 0 0;line-height:1.6;">
        Μπορείς να παρακολουθείς την κατάσταση της κράτησής σου από τη σελίδα
        <a href="${BASE_URL}/my-bookings" style="color:#2A8F8F;">Οι Κρατήσεις μου</a>.
      </p>
    `),
  };
}

// =============================================================
// 2. New booking alert → professional
// =============================================================

export interface NewBookingAlertData {
  proEmail:      string;
  proName:       string;
  customerName:  string;
  bookingDate?:  string;
  bookingTime?:  string;
  serviceName?:  string;
  notes?:        string;
}

export function newBookingAlertEmail(d: NewBookingAlertData): {
  subject: string;
  html:    string;
} {
  return {
    subject: `Νέο αίτημα κράτησης από ${d.customerName}`,
    html: wrap(`
      <h1 style="font-size:20px;font-weight:800;color:#1A1A2E;margin:0 0 8px;">Νέο αίτημα κράτησης! 📅</h1>
      <p style="font-size:15px;color:#4B5563;margin:0 0 20px;line-height:1.6;">
        Γεια σου <strong>${d.proName}</strong>! Ο/Η <strong>${d.customerName}</strong>
        έστειλε αίτημα κράτησης. Επικοινώνησε μαζί του/της το συντομότερο.
      </p>

      <table width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB;border-radius:10px;border:1.5px solid #E5E7EB;padding:16px 20px;margin:0 0 20px;">
        <tr><td style="font-size:13px;color:#6B7280;padding:4px 0;">Πελάτης</td><td style="font-size:14px;font-weight:600;color:#1A1A2E;text-align:right;">${d.customerName}</td></tr>
        ${d.bookingDate ? `<tr><td style="font-size:13px;color:#6B7280;padding:4px 0;">Ημερομηνία</td><td style="font-size:14px;font-weight:600;color:#1A1A2E;text-align:right;">${d.bookingDate}${d.bookingTime ? " · " + d.bookingTime : ""}</td></tr>` : ""}
        ${d.serviceName ? `<tr><td style="font-size:13px;color:#6B7280;padding:4px 0;">Υπηρεσία</td><td style="font-size:14px;font-weight:600;color:#1A1A2E;text-align:right;">${d.serviceName}</td></tr>` : ""}
        ${d.notes ? `<tr><td style="font-size:13px;color:#6B7280;padding:4px 0;">Σημείωση πελάτη</td><td style="font-size:14px;color:#1A1A2E;text-align:right;">${d.notes}</td></tr>` : ""}
      </table>

      ${btn(`${BASE_URL}/dashboard?tab=bookings`, "Δες τις κρατήσεις σου")}

      <p style="font-size:13px;color:#9CA3AF;margin:16px 0 0;line-height:1.6;">
        Διαχειρίσου τις κρατήσεις σου από τον
        <a href="${BASE_URL}/dashboard" style="color:#2A8F8F;">Πίνακα Ελέγχου</a>.
      </p>
    `),
  };
}

// =============================================================
// 3. New review notification → professional
// =============================================================

export interface NewReviewNotificationData {
  proEmail:      string;
  proName:       string;
  proSlug:       string;
  customerName:  string;
  rating:        number;
  reviewText?:   string;
  reviewType:    "verified" | "invitation" | "user";
}

export function newReviewNotificationEmail(d: NewReviewNotificationData): {
  subject: string;
  html:    string;
} {
  const stars    = "★".repeat(d.rating) + "☆".repeat(5 - d.rating);
  const typeBadge =
    d.reviewType === "verified"   ? "✓ Επαληθευμένη κριτική" :
    d.reviewType === "invitation" ? "✉ Κριτική πρόσκλησης"   :
                                    "Κριτική χρήστη";

  return {
    subject: `Νέα κριτική ${d.rating}/5 ⭐ από ${d.customerName}`,
    html: wrap(`
      <h1 style="font-size:20px;font-weight:800;color:#1A1A2E;margin:0 0 8px;">Νέα κριτική για σένα! ⭐</h1>
      <p style="font-size:15px;color:#4B5563;margin:0 0 20px;line-height:1.6;">
        Γεια σου <strong>${d.proName}</strong>! Ο/Η <strong>${d.customerName}</strong>
        σου άφησε κριτική.
      </p>

      <div style="background:#FFFBEB;border-radius:12px;border:1.5px solid #FDE68A;padding:20px 24px;margin:0 0 20px;">
        <div style="font-size:24px;letter-spacing:-2px;color:#F59E0B;margin:0 0 8px;">${stars}</div>
        <div style="font-size:13px;font-weight:600;color:#92400E;margin:0 0 ${d.reviewText ? "12px" : "0"};">${typeBadge}</div>
        ${d.reviewText ? `<p style="font-size:15px;color:#1A1A2E;margin:0;line-height:1.7;font-style:italic;">"${d.reviewText}"</p>` : ""}
      </div>

      ${btn(`${BASE_URL}/professional/${d.proSlug}#reviews`, "Δες την κριτική")}

      <p style="font-size:13px;color:#9CA3AF;margin:16px 0 0;line-height:1.6;">
        Οι κριτικές σου επηρεάζουν την κατάταξή σου στα αποτελέσματα αναζήτησης.
      </p>
    `),
  };
}

// =============================================================
// 4. Booking status update → customer
// =============================================================

export interface BookingStatusUpdateData {
  customerEmail: string;
  customerName:  string;
  proName:       string;
  proSlug:       string;
  status:        "confirmed" | "declined" | "completed" | "cancelled";
  bookingDate?:  string;
  message?:      string;
}

const STATUS_LABELS: Record<BookingStatusUpdateData["status"], { emoji: string; title: string; color: string }> = {
  confirmed:  { emoji: "✅", title: "Η κράτησή σου επιβεβαιώθηκε!",  color: "#059669" },
  declined:   { emoji: "❌", title: "Η κράτησή σου δεν έγινε δεκτή.", color: "#DC2626" },
  completed:  { emoji: "🎉", title: "Η υπηρεσία ολοκληρώθηκε!",       color: "#2A8F8F" },
  cancelled:  { emoji: "↩️", title: "Η κράτησή σου ακυρώθηκε.",       color: "#6B7280" },
};

export function bookingStatusUpdateEmail(d: BookingStatusUpdateData): {
  subject: string;
  html:    string;
} {
  const meta = STATUS_LABELS[d.status];

  return {
    subject: `${meta.emoji} ${meta.title} — ${d.proName}`,
    html: wrap(`
      <h1 style="font-size:20px;font-weight:800;color:${meta.color};margin:0 0 8px;">${meta.emoji} ${meta.title}</h1>
      <p style="font-size:15px;color:#4B5563;margin:0 0 20px;line-height:1.6;">
        Γεια σου <strong>${d.customerName}</strong>!
        ${d.status === "confirmed"  ? `Ο/Η <strong>${d.proName}</strong> επιβεβαίωσε το ραντεβού σας.` : ""}
        ${d.status === "declined"   ? `Ο/Η <strong>${d.proName}</strong> δεν μπόρεσε να δεχτεί το αίτημά σου αυτή τη φορά.` : ""}
        ${d.status === "completed"  ? `Η υπηρεσία από τον/την <strong>${d.proName}</strong> ολοκληρώθηκε. Ευχαριστούμε!` : ""}
        ${d.status === "cancelled"  ? `Η κράτησή σου με τον/την <strong>${d.proName}</strong> ακυρώθηκε.` : ""}
      </p>

      ${d.bookingDate ? `
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB;border-radius:10px;border:1.5px solid #E5E7EB;padding:16px 20px;margin:0 0 20px;">
        <tr><td style="font-size:13px;color:#6B7280;padding:4px 0;">Ημερομηνία</td><td style="font-size:14px;font-weight:600;color:#1A1A2E;text-align:right;">${d.bookingDate}</td></tr>
        <tr><td style="font-size:13px;color:#6B7280;padding:4px 0;">Επαγγελματίας</td><td style="font-size:14px;font-weight:600;color:#1A1A2E;text-align:right;">${d.proName}</td></tr>
      </table>` : ""}

      ${d.message ? `<p style="font-size:14px;color:#4B5563;background:#F9FAFB;border-left:3px solid ${meta.color};padding:12px 16px;border-radius:0 8px 8px 0;margin:0 0 20px;font-style:italic;">${d.message}</p>` : ""}

      ${d.status === "completed"
        ? btn(`${BASE_URL}/professional/${d.proSlug}#reviews`, "Άφησε κριτική", "#2A8F8F")
        : d.status === "declined"
          ? btn(`${BASE_URL}/services`, "Βρες άλλον επαγγελματία", "#2A8F8F")
          : btn(`${BASE_URL}/my-bookings`, "Δες τις κρατήσεις μου")
      }
    `),
  };
}
