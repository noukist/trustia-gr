// =============================================================
// components/dashboard/ReviewsTab.tsx
// =============================================================
// Server Component — shows a professional's received reviews.
//
// DATA
//   Fetches from reviews table filtered by professional_id.
//   RLS: reviews_read_active policy allows SELECT where
//   deleted_at IS NULL AND status = 'active'.
//
// LAYOUT
//   - Summary card: weighted avg rating + count by type
//   - Review cards: stars, text, type badge, date
//   - Sorted: newest first
//
// REVIEW TYPES (from PRD Section 37)
//   verified   (weight 2.0) — from a completed booking — green badge
//   invitation (weight 1.0) — via the professional's invite link — amber badge
//   user       (weight 0.5) — standard anonymous — grey badge
// =============================================================

import { createClient }              from "@/lib/supabase/server";
import { getLocale, getTranslations } from "next-intl/server";
import InviteLinksManager             from "@/components/dashboard/InviteLinksManager";

// ── DB row type ───────────────────────────────────────────────

interface DbReview {
  id:         string;
  rating:     number;
  text:       string | null;
  type:       "verified" | "invitation" | "user";
  weight:     number;
  created_at: string;
}

// ── Type color map (labels come from i18n) ────────────────────

const REVIEW_TYPE_STYLE: Record<
  string,
  { icon: string; bg: string; color: string }
> = {
  verified:   { icon: "✓", bg: "#D1FAE5", color: "#059669" },
  invitation: { icon: "✉", bg: "#FEF3C7", color: "#D97706" },
  user:       { icon: "★", bg: "#F3F4F6", color: "#6B7280" },
};

// ── Star renderer ─────────────────────────────────────────────

function Stars({
  rating,
  size = "1rem",
  ariaLabel,
}: {
  rating:    number;
  size?:     string;
  ariaLabel: string;
}) {
  const full  = Math.min(5, Math.max(0, Math.round(rating)));
  const empty = 5 - full;
  return (
    <span
      style={{
        color:         "var(--color-accent)",
        fontSize:       size,
        letterSpacing:  "-1px",
        lineHeight:     1,
      }}
      aria-label={ariaLabel}
    >
      {"★".repeat(full)}{"☆".repeat(empty)}
    </span>
  );
}

// ── Component ─────────────────────────────────────────────────

export default async function ReviewsTab({
  professionalId,
  proSlug,
}: {
  professionalId: string;
  proSlug:        string | null;
}) {
  const locale   = await getLocale();
  const t        = await getTranslations({ locale, namespace: "dashboard.reviews" });
  const supabase = await createClient();

  // Date locale for Intl.DateTimeFormat
  const dateLocale = locale === "el" ? "el-GR" : "en-GB";

  const { data, error } = await supabase
    .from("reviews")
    .select("id, rating, text, type, weight, created_at")
    .eq("professional_id", professionalId)
    .is("deleted_at", null)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("[ReviewsTab] fetch error:", error.message);
  }

  const rows = (data ?? []) as DbReview[];

  // ── Empty state ───────────────────────────────────────────

  if (rows.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {/* Invite links manager always visible so pros can generate links
            even before they have any reviews */}
        <InviteLinksManager professionalId={professionalId} proSlug={proSlug} />

        <div
          style={{
            backgroundColor: "#ffffff",
            border:          "1.5px solid var(--color-border)",
            borderRadius:    "14px",
            padding:         "1.5rem",
          }}
        >
          <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
            <p style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>⭐</p>
            <h2
              style={{
                fontSize:     "1.125rem",
                fontWeight:   700,
                color:        "var(--color-text)",
                marginBottom: "0.5rem",
              }}
            >
              {t("empty")}
            </h2>
            <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", margin: 0 }}>
              {t("emptyHint")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Summary stats ─────────────────────────────────────────

  // Weighted average: Σ(rating × weight) / Σ(weight)
  const totalWeight    = rows.reduce((s, r) => s + r.weight, 0);
  const weightedSum    = rows.reduce((s, r) => s + r.rating * r.weight, 0);
  const weightedAvg    = totalWeight > 0 ? weightedSum / totalWeight : 0;

  // Simple average for display
  const simpleAvg      = rows.reduce((s, r) => s + r.rating, 0) / rows.length;

  const countVerified   = rows.filter((r) => r.type === "verified").length;
  const countInvitation = rows.filter((r) => r.type === "invitation").length;
  const countUser       = rows.filter((r) => r.type === "user").length;

  // ── Render ────────────────────────────────────────────────

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

      {/* ── Invite links manager ── */}
      <InviteLinksManager professionalId={professionalId} proSlug={proSlug} />

      {/* ── Summary card ── */}
      <div
        style={{
          backgroundColor: "#ffffff",
          border:          "1.5px solid var(--color-border)",
          borderRadius:    "14px",
          padding:         "1.25rem 1.5rem",
          display:         "flex",
          flexWrap:        "wrap",
          alignItems:      "center",
          gap:             "2rem",
        }}
      >
        {/* Overall rating */}
        <div style={{ textAlign: "center" }}>
          <p
            style={{
              fontSize:   "2.75rem",
              fontWeight: 800,
              color:      "var(--color-text)",
              margin:     "0 0 0.125rem",
              lineHeight: 1,
            }}
          >
            {simpleAvg.toFixed(1)}
          </p>
          <Stars
            rating={Math.round(simpleAvg)}
            size="1.1rem"
            ariaLabel={t("starsAriaLabel", { rating: simpleAvg.toFixed(1) })}
          />
          <p
            style={{
              fontSize: "0.775rem",
              color:    "var(--color-text-muted)",
              margin:   "0.375rem 0 0",
            }}
          >
            {t("count", { count: rows.length })}
          </p>
        </div>

        {/* Breakdown by type */}
        <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
          {countVerified > 0 && (
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: "1.5rem", fontWeight: 800, color: "#059669", margin: "0 0 0.2rem", lineHeight: 1 }}>
                {countVerified}
              </p>
              <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", margin: 0 }}>
                {t("countVerifiedLabel")}
              </p>
            </div>
          )}
          {countInvitation > 0 && (
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: "1.5rem", fontWeight: 800, color: "#D97706", margin: "0 0 0.2rem", lineHeight: 1 }}>
                {countInvitation}
              </p>
              <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", margin: 0 }}>
                {t("countInvitationLabel")}
              </p>
            </div>
          )}
          {countUser > 0 && (
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: "1.5rem", fontWeight: 800, color: "#6B7280", margin: "0 0 0.2rem", lineHeight: 1 }}>
                {countUser}
              </p>
              <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", margin: 0 }}>
                {t("countUserLabel")}
              </p>
            </div>
          )}
        </div>

        {/* Weighted score note (trust-based scoring) */}
        {rows.length > 1 && (
          <div
            style={{
              marginLeft:      "auto",
              textAlign:       "right",
              fontSize:        "0.775rem",
              color:           "var(--color-text-muted)",
              lineHeight:      1.5,
            }}
          >
            <p style={{ margin: "0 0 0.125rem", fontWeight: 700, color: "var(--color-text)" }}>
              {t("weightedScore")}
            </p>
            <p style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "var(--color-primary)" }}>
              {weightedAvg.toFixed(1)}
            </p>
          </div>
        )}
      </div>

      {/* ── Review cards ── */}
      {rows.map((review) => {
        const typeStyle = REVIEW_TYPE_STYLE[review.type] ?? REVIEW_TYPE_STYLE.user;
        // Translated label for the type badge
        const typeLabel =
          review.type === "verified"   ? t("typeVerified")   :
          review.type === "invitation" ? t("typeInvitation") :
          t("typeUser");

        return (
          <div
            key={review.id}
            style={{
              backgroundColor: "#ffffff",
              border:          "1.5px solid var(--color-border)",
              borderRadius:    "14px",
              padding:         "1.25rem",
              display:         "flex",
              flexDirection:   "column",
              gap:             "0.75rem",
            }}
          >
            {/* Stars + meta row */}
            <div
              style={{
                display:        "flex",
                justifyContent: "space-between",
                alignItems:     "center",
                flexWrap:       "wrap",
                gap:            "0.5rem",
              }}
            >
              <Stars
                rating={review.rating}
                ariaLabel={t("starsAriaLabel", { rating: review.rating })}
              />

              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                {/* Type badge */}
                <span
                  style={{
                    display:         "inline-flex",
                    alignItems:      "center",
                    gap:             "0.25rem",
                    fontSize:        "0.75rem",
                    fontWeight:      700,
                    color:           typeStyle.color,
                    backgroundColor: typeStyle.bg,
                    padding:         "0.2rem 0.625rem",
                    borderRadius:    "99px",
                    whiteSpace:      "nowrap",
                  }}
                >
                  {typeStyle.icon} {typeLabel}
                </span>

                {/* Date */}
                <span style={{ fontSize: "0.775rem", color: "var(--color-text-muted)" }}>
                  {new Date(review.created_at).toLocaleDateString(dateLocale)}
                </span>
              </div>
            </div>

            {/* Review text */}
            {review.text ? (
              <p
                style={{
                  fontSize:   "0.9rem",
                  color:      "var(--color-text)",
                  margin:     0,
                  lineHeight: 1.65,
                }}
              >
                {review.text}
              </p>
            ) : (
              /* Rating-only review (no text) */
              <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", margin: 0, fontStyle: "italic" }}>
                {t("noText")}
              </p>
            )}
          </div>
        );
      })}

    </div>
  );
}
