// =============================================================
// app/[locale]/my-bookings/page.tsx
// =============================================================
// Customer "My Bookings" page — shows all bookings the logged-in
// user has submitted as a customer, across all professionals.
//
// AUTH FLOW
//   No session        → redirect to login
//   No customer row   → empty state (user has never booked)
//   Has customer row  → list bookings, newest first
//
// STATUS ORDER
//   pending → confirmed → completed / declined / cancelled / no_show
//
// RLS
//   bookings_customer_read: customer_id IN (
//     SELECT id FROM customers WHERE user_id = auth.uid()
//   )
// =============================================================

import type { Metadata }      from "next";
import { redirect }            from "next/navigation";
import { revalidatePath }      from "next/cache";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { CalendarDays }        from "lucide-react";
import { Link }                from "@/i18n/navigation";
import { createClient }        from "@/lib/supabase/server";
import { CATEGORIES }          from "@/lib/constants";
import CancelBookingButton     from "./CancelBookingButton";
import ReviewButton            from "./ReviewButton";

// ── Next.js 16: params are a Promise ─────────────────────────
type PageParams = Promise<{ locale: string }>;

// ── Server Action: cancel a pending booking ───────────────────
async function cancelBooking(formData: FormData) {
  "use server";
  const bookingId = formData.get("bookingId") as string;
  if (!bookingId) return;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // Resolve customer row so we only cancel our own bookings (defence-in-depth on top of RLS)
  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!customer) return;

  await supabase
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("id", bookingId)
    .eq("customer_id", customer.id)
    .eq("status", "pending"); // only cancel pending bookings

  revalidatePath("/my-bookings");
  revalidatePath("/el/my-bookings");
  revalidatePath("/en/my-bookings");
}

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "myBookings" });
  return { title: t("pageTitle") };
}

// ── DB row types ──────────────────────────────────────────────

interface DbBooking {
  id:              string;
  professional_id: string;
  booking_date:    string;
  booking_mode:    string;
  status:          string;
  description:     string | null;
  // Full-calendar mode extras
  start_time:   string | null;
  end_time:     string | null;
  total_price:  number | null;
  services:     Array<{ name: string; duration: number; price: number }> | null;
  created_at:   string;
  professionals: {
    first_name:  string;
    last_name:   string;
    slug:        string | null;
    category_id: string;
    avatar_url:  string | null;
  } | null;
}

// ── Status display ────────────────────────────────────────────

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  pending:   { bg: "#FEF3C7", color: "#D97706" },
  confirmed: { bg: "#D1FAE5", color: "#059669" },
  completed: { bg: "#EDE9FE", color: "#7C3AED" },
  declined:  { bg: "#FEE2E2", color: "#DC2626" },
  cancelled: { bg: "#F3F4F6", color: "#6B7280" },
  no_show:   { bg: "#FFF7ED", color: "#EA580C" },
};

// =============================================================
export default async function MyBookingsPage({ params }: { params: PageParams }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t          = await getTranslations({ locale, namespace: "myBookings" });
  const tStatuses  = await getTranslations({ locale, namespace: "dashboard.bookings" });
  const supabase   = await createClient();
  const dateLocale = locale === "el" ? "el-GR" : "en-GB";

  // ── Auth ───────────────────────────────────────────────────
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login`);

  // ── Resolve customer row ───────────────────────────────────
  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  // ── Fetch bookings (empty array if no customer row yet) ────
  const rows: DbBooking[] = [];

  if (customer) {
    const { data, error } = await supabase
      .from("bookings")
      .select(
        "id, professional_id, booking_date, booking_mode, status, description, " +
        "start_time, end_time, total_price, services, created_at, " +
        "professionals(first_name, last_name, slug, category_id, avatar_url)",
      )
      .eq("customer_id", customer.id)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("[my-bookings] fetch error:", error.message);
    } else if (data) {
      rows.push(...(data as unknown as DbBooking[]));
    }
  }

  // Sort: pending → confirmed → others (Supabase already sorts by created_at desc)
  const pending   = rows.filter((b) => b.status === "pending");
  const confirmed = rows.filter((b) => b.status === "confirmed");
  const others    = rows.filter((b) => !["pending","confirmed"].includes(b.status));
  const ordered   = [...pending, ...confirmed, ...others];

  // ── Status label map ───────────────────────────────────────
  const statusLabel: Record<string, string> = {
    pending:   tStatuses("statusPending"),
    confirmed: tStatuses("statusConfirmed"),
    completed: tStatuses("statusCompleted"),
    declined:  tStatuses("statusDeclined"),
    cancelled: tStatuses("statusCancelled"),
    no_show:   tStatuses("statusNoShow"),
  };

  // ── Render ─────────────────────────────────────────────────
  return (
    <div
      style={{
        maxWidth:        "720px",
        margin:          "0 auto",
        padding:         "2rem 1rem 4rem",
      }}
    >
      {/* ── Page header ── */}
      <div style={{ marginBottom: "1.75rem" }}>
        <h1
          style={{
            fontSize:   "clamp(1.25rem, 3vw, 1.625rem)",
            fontWeight: 800,
            color:      "var(--color-text)",
            margin:     "0 0 0.375rem",
          }}
        >
          {t("title")}
        </h1>
        <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", margin: 0 }}>
          {t("subtitle")}
        </p>
      </div>

      {/* ── Empty state ── */}
      {ordered.length === 0 ? (
        <div
          style={{
            backgroundColor: "#fff",
            border:          "1.5px solid var(--color-border)",
            borderRadius:    "16px",
            padding:         "3rem 2rem",
            textAlign:       "center",
          }}
        >
          <CalendarDays
            size={44}
            style={{ color: "var(--color-primary)", opacity: 0.4, marginBottom: "1rem" }}
          />
          <h2
            style={{
              fontSize:     "1.0625rem",
              fontWeight:   700,
              color:        "var(--color-text)",
              margin:       "0 0 0.5rem",
            }}
          >
            {t("empty")}
          </h2>
          <p
            style={{
              fontSize:  "0.875rem",
              color:     "var(--color-text-muted)",
              margin:    "0 0 1.5rem",
              lineHeight: 1.6,
            }}
          >
            {t("emptyHint")}
          </p>
          <Link
            href="/services"
            style={{
              display:         "inline-flex",
              alignItems:      "center",
              gap:             "0.5rem",
              padding:         "0.625rem 1.5rem",
              backgroundColor: "var(--color-primary)",
              color:           "#fff",
              borderRadius:    "10px",
              fontWeight:      700,
              fontSize:        "0.9375rem",
              textDecoration:  "none",
            }}
          >
            {t("browseBtn")}
          </Link>
        </div>
      ) : (
        /* ── Booking list ── */
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

          {/* Pending count badge */}
          {pending.length > 0 && (
            <p
              style={{
                fontSize:        "0.8125rem",
                fontWeight:      700,
                color:           "#D97706",
                backgroundColor: "#FEF3C7",
                display:         "inline-flex",
                padding:         "0.25rem 0.875rem",
                borderRadius:    "99px",
                alignSelf:       "flex-start",
              }}
            >
              {tStatuses("pendingBadge", { count: pending.length })}
            </p>
          )}

          {ordered.map((booking) => {
            const pro    = booking.professionals;
            const cat    = pro ? CATEGORIES.find((c) => c.id === pro.category_id) : null;
            const style  = STATUS_STYLE[booking.status] ?? STATUS_STYLE.pending;
            const label  = statusLabel[booking.status]  ?? booking.status;
            const isPending = booking.status === "pending";

            const dateLabel = new Date(booking.booking_date).toLocaleDateString(dateLocale, {
              weekday: "long",
              day:     "numeric",
              month:   "long",
              year:    "numeric",
            });

            return (
              <div
                key={booking.id}
                style={{
                  backgroundColor: "#fff",
                  border:          isPending
                    ? "1.5px solid #FCD34D"
                    : "1.5px solid var(--color-border)",
                  borderRadius:    "14px",
                  padding:         "1.25rem",
                  display:         "flex",
                  flexDirection:   "column",
                  gap:             "0.75rem",
                }}
              >
                {/* ── Top row: professional name + status badge ── */}
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
                    {/* Professional link */}
                    {pro ? (
                      pro.slug ? (
                        <Link
                          href={`/professional/${pro.slug}`}
                          style={{
                            fontWeight:     700,
                            fontSize:       "0.975rem",
                            color:          "var(--color-primary)",
                            textDecoration: "none",
                          }}
                        >
                          {pro.first_name} {pro.last_name}
                        </Link>
                      ) : (
                        <span
                          style={{
                            fontWeight: 700,
                            fontSize:   "0.975rem",
                            color:      "var(--color-text)",
                          }}
                        >
                          {pro.first_name} {pro.last_name}
                        </span>
                      )
                    ) : (
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize:   "0.975rem",
                          color:      "var(--color-text-muted)",
                        }}
                      >
                        {t("unknownPro")}
                      </span>
                    )}
                    {/* Category */}
                    {cat && (
                      <p
                        style={{
                          fontSize: "0.8rem",
                          color:    "var(--color-text-muted)",
                          margin:   "0.125rem 0 0",
                        }}
                      >
                        {cat.emoji} {locale === "en" ? cat.nameEn : cat.nameEl}
                      </p>
                    )}
                  </div>

                  {/* Status badge */}
                  <span
                    style={{
                      display:         "inline-flex",
                      padding:         "0.25rem 0.75rem",
                      backgroundColor: style.bg,
                      color:           style.color,
                      borderRadius:    "99px",
                      fontSize:        "0.8rem",
                      fontWeight:      700,
                      whiteSpace:      "nowrap",
                    }}
                  >
                    {label}
                  </span>
                </div>

                {/* ── Date ── */}
                <p
                  style={{
                    fontSize:  "0.875rem",
                    color:     "var(--color-text)",
                    margin:    0,
                    fontWeight: 600,
                  }}
                >
                  📅 {dateLabel}
                </p>

                {/* ── Time slot (full-calendar mode only) ── */}
                {booking.booking_mode === "full" && booking.start_time && booking.end_time && (
                  <p
                    style={{
                      fontSize:  "0.875rem",
                      color:     "var(--color-text)",
                      margin:    0,
                      fontWeight: 600,
                    }}
                  >
                    ⏰ {booking.start_time.slice(0, 5)} – {booking.end_time.slice(0, 5)}
                  </p>
                )}

                {/* ── Services list (full-calendar mode only) ── */}
                {booking.booking_mode === "full" && booking.services && booking.services.length > 0 && (
                  <div
                    style={{
                      backgroundColor: "var(--color-bg-light)",
                      borderRadius:    "8px",
                      padding:         "0.5rem 0.75rem",
                      borderLeft:      "3px solid var(--color-primary)",
                    }}
                  >
                    {booking.services.map((svc, i) => (
                      <p
                        key={i}
                        style={{
                          fontSize: "0.8rem",
                          color:    "var(--color-text)",
                          margin:   i === 0 ? 0 : "0.2rem 0 0",
                        }}
                      >
                        • {svc.name} — {svc.duration} λεπτά
                        {svc.price > 0 && ` · €${Number(svc.price).toFixed(2)}`}
                      </p>
                    ))}
                    {booking.total_price != null && (
                      <p
                        style={{
                          fontSize:   "0.85rem",
                          fontWeight: 700,
                          color:      "var(--color-primary)",
                          margin:     "0.4rem 0 0",
                        }}
                      >
                        Σύνολο: €{Number(booking.total_price).toFixed(2)}
                      </p>
                    )}
                  </div>
                )}

                {/* ── Customer note / description ── */}
                {booking.description && (
                  <p
                    style={{
                      fontSize:        "0.875rem",
                      color:           "var(--color-text-muted)",
                      margin:          0,
                      lineHeight:      1.6,
                      backgroundColor: "var(--color-bg-light)",
                      padding:         "0.5rem 0.75rem",
                      borderRadius:    "8px",
                      borderLeft:      "3px solid var(--color-border)",
                    }}
                  >
                    {booking.description}
                  </p>
                )}

                {/* ── Submitted on + action buttons ── */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
                  <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", margin: 0 }}>
                    {tStatuses("submittedOn")}{" "}
                    {new Date(booking.created_at).toLocaleDateString(dateLocale)}
                  </p>

                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    {/* Cancel — only for pending bookings */}
                    {isPending && (
                      <CancelBookingButton
                        bookingId={booking.id}
                        action={cancelBooking}
                        label={t("cancelBtn")}
                        confirmMsg={t("cancelConfirm")}
                      />
                    )}

                    {/* Review — only for completed bookings where we have a pro */}
                    {booking.status === "completed" && pro && customer && (
                      <ReviewButton
                        bookingId={booking.id}
                        professionalId={booking.professional_id}
                        professionalName={`${pro.first_name} ${pro.last_name}`}
                        customerId={customer.id}
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
