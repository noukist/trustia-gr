// =============================================================
// components/dashboard/BookingsTab.tsx
// =============================================================
// Server Component — shows a professional's bookings list.
//
// DATA
//   Fetches from bookings table filtered by professional_id.
//   RLS: bookings_professional_read policy allows this.
//
// ORDERING
//   pending → confirmed → completed/declined/cancelled/no_show
//   Within each group: newest first.
//
// ACTIONS (Server Actions — work without JavaScript)
//   pending   → Confirm | Decline
//   confirmed → Complete | Cancel
//   Others    → read-only
// =============================================================

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ── Server Action ─────────────────────────────────────────────
// Updates booking status. Called by plain <form action> buttons.
async function updateBookingStatus(formData: FormData) {
  "use server";

  const bookingId = formData.get("bookingId") as string;
  const newStatus = formData.get("status")    as string;

  if (!bookingId || !newStatus) return;

  const supabase = await createClient();

  const update: Record<string, string | null> = {
    status:     newStatus,
    updated_at: new Date().toISOString(),
  };

  // Stamp lifecycle timestamps where appropriate
  if (newStatus === "confirmed") update.confirmed_at = new Date().toISOString();
  if (newStatus === "completed") update.completed_at = new Date().toISOString();

  await supabase
    .from("bookings")
    .update(update)
    .eq("id", bookingId);

  // Revalidate the dashboard for both locales so the list refreshes
  revalidatePath("/el/dashboard");
  revalidatePath("/en/dashboard");
}

// ── DB row type ───────────────────────────────────────────────

interface DbBooking {
  id:             string;
  booking_date:   string;
  start_time:     string | null;
  booking_mode:   string;
  status:         string;
  description:    string | null;
  customer_name:  string | null;
  customer_phone: string | null;
  customer_email: string | null;
  total_price:    number | null;
  created_at:     string;
}

// ── Status badge map ──────────────────────────────────────────

const STATUS: Record<string, { label: string; bg: string; color: string }> = {
  pending:   { label: "Εκκρεμεί",      bg: "#FEF3C7", color: "#D97706" },
  confirmed: { label: "Επιβεβαιωμένη", bg: "#D1FAE5", color: "#059669" },
  completed: { label: "Ολοκληρώθηκε",  bg: "#EDE9FE", color: "#7C3AED" },
  declined:  { label: "Απορρίφθηκε",   bg: "#FEE2E2", color: "#DC2626" },
  cancelled: { label: "Ακυρώθηκε",     bg: "#F3F4F6", color: "#6B7280" },
  no_show:   { label: "Απουσία",        bg: "#FFF7ED", color: "#EA580C" },
};

// ── Shared button styles ──────────────────────────────────────

const btnPrimary: React.CSSProperties = {
  padding:         "0.5rem 1.25rem",
  backgroundColor: "var(--color-primary)",
  color:           "#ffffff",
  border:          "none",
  borderRadius:    "8px",
  fontSize:        "0.875rem",
  fontWeight:      700,
  fontFamily:      "inherit",
  cursor:          "pointer",
  whiteSpace:      "nowrap",
};

const btnSuccess: React.CSSProperties = {
  ...btnPrimary,
  backgroundColor: "#059669",
};

const btnDanger: React.CSSProperties = {
  ...btnPrimary,
  backgroundColor: "#ffffff",
  color:           "#DC2626",
  border:          "1.5px solid #DC2626",
};

const btnMuted: React.CSSProperties = {
  ...btnPrimary,
  backgroundColor: "#ffffff",
  color:           "var(--color-text-muted)",
  border:          "1.5px solid var(--color-border)",
};

// ── Component ─────────────────────────────────────────────────

export default async function BookingsTab({
  professionalId,
}: {
  professionalId: string;
}) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("bookings")
    .select(
      "id, booking_date, start_time, booking_mode, status, " +
      "description, customer_name, customer_phone, customer_email, " +
      "total_price, created_at",
    )
    .eq("professional_id", professionalId)
    .order("booking_date", { ascending: false })
    .limit(50);

  if (error) {
    console.error("[BookingsTab] fetch error:", error.message);
  }

  const rows = (data ?? []) as DbBooking[];

  // Sort: pending → confirmed → all others (newest booking_date first within each group)
  const pending   = rows.filter((b) => b.status === "pending");
  const confirmed = rows.filter((b) => b.status === "confirmed");
  const others    = rows.filter((b) => !["pending", "confirmed"].includes(b.status));
  const ordered   = [...pending, ...confirmed, ...others];

  // ── Empty state ───────────────────────────────────────────

  if (ordered.length === 0) {
    return (
      <div
        style={{
          backgroundColor: "#ffffff",
          border:          "1.5px solid var(--color-border)",
          borderRadius:    "14px",
          padding:         "1.5rem",
        }}
      >
        <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
          <p style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>📅</p>
          <h2
            style={{
              fontSize:     "1.125rem",
              fontWeight:   700,
              color:        "var(--color-text)",
              marginBottom: "0.5rem",
            }}
          >
            Δεν υπάρχουν κρατήσεις ακόμα
          </h2>
          <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", margin: 0 }}>
            Οι κρατήσεις των πελατών σας θα εμφανιστούν εδώ μόλις σας βρουν.
          </p>
        </div>
      </div>
    );
  }

  // ── List ──────────────────────────────────────────────────

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

      {/* ── Header row ── */}
      <div
        style={{
          display:        "flex",
          justifyContent: "space-between",
          alignItems:     "center",
          flexWrap:       "wrap",
          gap:            "0.5rem",
        }}
      >
        <h2
          style={{
            fontWeight: 700,
            fontSize:   "1rem",
            color:      "var(--color-text)",
            margin:     0,
          }}
        >
          Κρατήσεις{" "}
          <span style={{ color: "var(--color-text-muted)", fontWeight: 400 }}>
            ({ordered.length})
          </span>
        </h2>

        {/* Pending count badge — draws attention */}
        {pending.length > 0 && (
          <span
            style={{
              display:         "inline-flex",
              padding:         "0.25rem 0.75rem",
              backgroundColor: "#FEF3C7",
              color:           "#D97706",
              borderRadius:    "99px",
              fontSize:        "0.8rem",
              fontWeight:      700,
            }}
          >
            {pending.length} εκκρεμείς
          </span>
        )}
      </div>

      {/* ── Booking cards ── */}
      {ordered.map((booking) => {
        const badge       = STATUS[booking.status] ?? STATUS.pending;
        const isPending   = booking.status === "pending";
        const isConfirmed = booking.status === "confirmed";

        // Format the booking date in Greek
        const dateLabel = new Date(booking.booking_date).toLocaleDateString("el-GR", {
          weekday: "long",
          day:     "numeric",
          month:   "long",
          year:    "numeric",
        });
        // Append start time if present (strip seconds from HH:MM:SS)
        const timeLabel = booking.start_time ? ` — ${booking.start_time.slice(0, 5)}` : "";

        return (
          <div
            key={booking.id}
            style={{
              backgroundColor: "#ffffff",
              border:          isPending
                ? "1.5px solid #FCD34D"   // amber highlight for pending
                : "1.5px solid var(--color-border)",
              borderRadius:    "14px",
              padding:         "1.25rem",
              display:         "flex",
              flexDirection:   "column",
              gap:             "0.875rem",
            }}
          >
            {/* Date + status */}
            <div
              style={{
                display:        "flex",
                justifyContent: "space-between",
                alignItems:     "flex-start",
                flexWrap:       "wrap",
                gap:            "0.5rem",
              }}
            >
              <div>
                <p
                  style={{
                    fontWeight: 700,
                    color:      "var(--color-text)",
                    margin:     "0 0 0.25rem",
                    fontSize:   "0.975rem",
                    lineHeight: 1.3,
                  }}
                >
                  {dateLabel}{timeLabel}
                </p>
                <p style={{ fontSize: "0.775rem", color: "var(--color-text-muted)", margin: 0 }}>
                  Υποβλήθηκε {new Date(booking.created_at).toLocaleDateString("el-GR")}
                </p>
              </div>

              {/* Status badge */}
              <span
                style={{
                  display:         "inline-flex",
                  padding:         "0.25rem 0.75rem",
                  backgroundColor: badge.bg,
                  color:           badge.color,
                  borderRadius:    "99px",
                  fontSize:        "0.8rem",
                  fontWeight:      700,
                  whiteSpace:      "nowrap",
                }}
              >
                {badge.label}
              </span>
            </div>

            {/* Customer contact (if provided in the booking) */}
            {(booking.customer_name || booking.customer_phone || booking.customer_email) && (
              <div
                style={{
                  display:    "flex",
                  flexWrap:   "wrap",
                  gap:        "1rem",
                  fontSize:   "0.875rem",
                  color:      "var(--color-text)",
                }}
              >
                {booking.customer_name && (
                  <span>👤 {booking.customer_name}</span>
                )}
                {booking.customer_phone && (
                  <a
                    href={`tel:${booking.customer_phone}`}
                    style={{ color: "var(--color-primary)", textDecoration: "none", fontWeight: 600 }}
                  >
                    📞 {booking.customer_phone}
                  </a>
                )}
                {booking.customer_email && (
                  <a
                    href={`mailto:${booking.customer_email}`}
                    style={{ color: "var(--color-primary)", textDecoration: "none" }}
                  >
                    ✉ {booking.customer_email}
                  </a>
                )}
              </div>
            )}

            {/* Description / notes from the customer */}
            {booking.description && (
              <p
                style={{
                  fontSize:        "0.875rem",
                  color:           "var(--color-text-muted)",
                  margin:          0,
                  lineHeight:      1.6,
                  backgroundColor: "var(--color-bg-light)",
                  padding:         "0.625rem 0.875rem",
                  borderRadius:    "8px",
                  borderLeft:      "3px solid var(--color-border)",
                }}
              >
                {booking.description}
              </p>
            )}

            {/* Total price (for full-calendar bookings with service catalog) */}
            {booking.total_price !== null && booking.total_price > 0 && (
              <p
                style={{
                  fontSize:   "0.875rem",
                  fontWeight: 700,
                  color:      "var(--color-text)",
                  margin:     0,
                }}
              >
                Σύνολο: €{booking.total_price.toFixed(2)}
              </p>
            )}

            {/* ── Actions: pending → Confirm | Decline ── */}
            {isPending && (
              <div
                style={{
                  display:     "flex",
                  gap:         "0.75rem",
                  flexWrap:    "wrap",
                  paddingTop:  "0.625rem",
                  borderTop:   "1px solid var(--color-border)",
                }}
              >
                <form action={updateBookingStatus}>
                  <input type="hidden" name="bookingId" value={booking.id} />
                  <input type="hidden" name="status"    value="confirmed" />
                  <button type="submit" style={btnPrimary}>
                    ✓ Επιβεβαίωση
                  </button>
                </form>
                <form action={updateBookingStatus}>
                  <input type="hidden" name="bookingId" value={booking.id} />
                  <input type="hidden" name="status"    value="declined" />
                  <button type="submit" style={btnDanger}>
                    ✕ Άρνηση
                  </button>
                </form>
              </div>
            )}

            {/* ── Actions: confirmed → Complete | Cancel ── */}
            {isConfirmed && (
              <div
                style={{
                  display:    "flex",
                  gap:        "0.75rem",
                  flexWrap:   "wrap",
                  paddingTop: "0.625rem",
                  borderTop:  "1px solid var(--color-border)",
                }}
              >
                <form action={updateBookingStatus}>
                  <input type="hidden" name="bookingId" value={booking.id} />
                  <input type="hidden" name="status"    value="completed" />
                  <button type="submit" style={btnSuccess}>
                    ✓ Ολοκλήρωση
                  </button>
                </form>
                <form action={updateBookingStatus}>
                  <input type="hidden" name="bookingId" value={booking.id} />
                  <input type="hidden" name="status"    value="cancelled" />
                  <button type="submit" style={btnMuted}>
                    Ακύρωση
                  </button>
                </form>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
