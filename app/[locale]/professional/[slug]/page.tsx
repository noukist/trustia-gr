// =============================================================
// app/professional/[slug]/page.tsx
// =============================================================
// Public professional profile page (PRD §14–17, §22, §38).
// URL: trustia.gr/professional/[name-slug]
//
// Public — no login required to VIEW.
// Login required for: phone reveal, booking (handled in ActionPanel).
//
// LAYOUT (desktop)
//   [Back + Share row]
//   [Profile header card: avatar | info | badges]
//   ┌───────────────────────────┬──────────────────────┐
//   │ Left column (flex: 1)     │ Right sidebar (300px) │
//   │  - Bio & price            │  ActionPanel (sticky) │
//   │  - Services catalog       │                       │
//   │  - Portfolio gallery      │                       │
//   │  - Reviews                │                       │
//   └───────────────────────────┴──────────────────────┘
//
// LAYOUT (mobile)
//   Single column. ActionPanel renders a fixed bottom bar.
//   Extra bottom padding ensures content is never hidden behind bar.
// =============================================================

import React                  from "react";
import { Link }               from "@/i18n/navigation";  // locale-aware Link
import { notFound }           from "next/navigation";
import type { Metadata }      from "next";
import { ArrowLeft, MapPin, ImageIcon } from "lucide-react";

import { createClient }                        from "@/lib/supabase/server";
import { setRequestLocale, getTranslations }   from "next-intl/server";
import { useTranslations, useLocale }          from "next-intl";
import { CATEGORIES }                          from "@/lib/constants";
import ActionPanel                             from "@/components/professional/ActionPanel";
import ShareButton                             from "@/components/professional/ShareButton";
import ProfileViewTracker                      from "@/components/professional/ProfileViewTracker";
import ReviewActions                           from "@/components/reviews/ReviewActions";

// ── Next.js 16: params is a Promise ──────────────────────────
type PageParams = Promise<{ locale: string; slug: string }>;

// ── DB row types ──────────────────────────────────────────────

interface DbProfessional {
  id:              string;
  slug:            string | null;
  first_name:      string;
  last_name:       string;
  avatar_url:      string | null;
  phone:           string;
  email:           string;
  category_id:     string;
  tier:            string;
  city:            string | null;
  bio:             string | null;
  price_text:      string | null;
  rating:          number;
  review_count:    number;
  rank:            number;
  booking_mode:    "contact" | "date" | "full";
  booking_enabled: boolean;
  vacation_start:  string | null;
  vacation_end:    string | null;
  featured:        boolean;
  created_at:      string;
}

interface DbService {
  id:               string;
  name_el:          string;
  name_en:          string | null;   // optional English name for bilingual display
  duration_minutes: number;
  price:            number;
  sort_order:       number;
}

interface DbPortfolioPhoto {
  id:              string;
  photo_url:       string;
  thumbnail_url:   string | null;
  caption:         string | null;
  is_before_after: boolean;
  after_photo_url: string | null;
  sort_order:      number;
}

interface DbReview {
  id:         string;
  rating:     number;
  text:       string | null;
  type:       "verified" | "invitation" | "user";
  weight:     number;
  created_at: string;
  // Nested join: reviews.customer_id → customers
  customer: {
    display_name: string | null;
    avatar_url:   string | null;
  } | null;
}

// ── Helper functions ──────────────────────────────────────────

/** Convert minutes to a locale-aware duration string */
function formatDuration(minutes: number, locale: string): string {
  if (locale === "en") {
    if (minutes < 60) return `${minutes} min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (m === 0) return h === 1 ? "1 hour" : `${h} hours`;
    return `${h}h ${m}m`;
  }
  if (minutes < 60) return `${minutes} λεπτά`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return h === 1 ? "1 ώρα" : `${h} ώρες`;
  return `${h} ώρ. ${m} λεπτ.`;
}

/** Format a price number — €0 → "Free" (EN) or "Δωρεάν" (EL) */
function formatPrice(price: number, locale: string): string {
  if (price === 0) return locale === "en" ? "Free" : "Δωρεάν";
  return `€${price % 1 === 0 ? price : price.toFixed(2)}`;
}

/** Relative date formatted for the active locale */
function relativeDate(iso: string, locale: string): string {
  const diff   = Date.now() - new Date(iso).getTime();
  const days   = Math.floor(diff / 86_400_000);
  const months = Math.floor(days / 30);
  const years  = Math.floor(months / 12);
  if (locale === "en") {
    if (days  === 0) return "Today";
    if (days  === 1) return "Yesterday";
    if (days  < 30)  return `${days} days ago`;
    if (months < 12) return months === 1 ? "1 month ago" : `${months} months ago`;
    return years === 1 ? "1 year ago" : `${years} years ago`;
  }
  if (days  === 0) return "Σήμερα";
  if (days  === 1) return "Χθες";
  if (days  < 30)  return `${days} μέρες πριν`;
  if (months < 12) return months === 1 ? "1 μήνα πριν" : `${months} μήνες πριν`;
  return years === 1 ? "1 χρόνο πριν" : `${years} χρόνια πριν`;
}

// ── Rating stars ──────────────────────────────────────────────
function Stars({ rating, size = "md" }: { rating: number; size?: "sm" | "md" | "lg" }) {
  const full  = Math.floor(rating);
  const half  = rating - full >= 0.4 ? 1 : 0;
  const empty = 5 - full - half;
  const fontSize = size === "lg" ? "1.25rem" : size === "sm" ? "0.8rem" : "1rem";
  return (
    <span
      style={{ color: "var(--color-accent)", fontSize, letterSpacing: "-1px" }}
      aria-label={`${rating} από 5 αστέρια`}
    >
      {"★".repeat(full)}
      {half ? "½" : ""}
      {"☆".repeat(empty)}
    </span>
  );
}

// ── Initials avatar ───────────────────────────────────────────
/**
 * Fallback avatar that shows the professional's initials when no
 * photo has been uploaded. The background colour is deterministically
 * derived from the name so the same professional always gets the
 * same colour (no flash of a different colour on re-render).
 */
function InitialsAvatar({
  firstName,
  lastName,
  size = 96,
}: {
  firstName: string;
  lastName:  string;
  size?:     number;
}) {
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

  // Pick one of five brand-harmonious colours deterministically
  const palette = [
    "var(--color-primary)",          // teal
    "#1A6F6F",                       // deep teal
    "#D4A039",                       // gold
    "#27AE60",                       // green
    "#8B5CF6",                       // purple
  ];
  const idx = (firstName.charCodeAt(0) + lastName.charCodeAt(0)) % palette.length;

  return (
    <div
      aria-label={`Αρχικά: ${initials}`}
      style={{
        width:           `${size}px`,
        height:          `${size}px`,
        borderRadius:    "50%",
        backgroundColor: palette[idx],
        display:         "flex",
        alignItems:      "center",
        justifyContent:  "center",
        color:           "#fff",
        fontSize:        `${Math.round(size * 0.35)}px`,
        fontWeight:      800,
        flexShrink:      0,
        border:          "3px solid var(--color-border)",
        userSelect:      "none",
        letterSpacing:   "0.02em",
      }}
    >
      {initials}
    </div>
  );
}

// ── Booking mode emojis (locale-agnostic) ────────────────────
// Labels are looked up via t("bookingMode.X") inside the component
const MODE_EMOJI: Record<string, string> = {
  contact: "📞",
  date:    "📅",
  full:    "🗓️",
};

// ── Review type badge ─────────────────────────────────────────
function ReviewTypeBadge({ type }: { type: DbReview["type"] }) {
  const t = useTranslations("profile");
  if (type === "verified") {
    return (
      <span
        style={{
          display:         "inline-flex",
          alignItems:      "center",
          gap:             "0.25rem",
          backgroundColor: "rgba(39,174,96,0.1)",
          color:           "#27AE60",
          border:          "1px solid rgba(39,174,96,0.3)",
          borderRadius:    "6px",
          padding:         "0.15rem 0.5rem",
          fontSize:        "0.7rem",
          fontWeight:      600,
        }}
      >
        {t("verifiedBadge")}
      </span>
    );
  }
  if (type === "invitation") {
    return (
      <span
        style={{
          display:         "inline-flex",
          alignItems:      "center",
          gap:             "0.25rem",
          backgroundColor: "rgba(212,160,57,0.1)",
          color:           "var(--color-accent)",
          border:          "1px solid rgba(212,160,57,0.3)",
          borderRadius:    "6px",
          padding:         "0.15rem 0.5rem",
          fontSize:        "0.7rem",
          fontWeight:      600,
        }}
      >
        {t("invitedBadge")}
      </span>
    );
  }
  return null; // "user" type has no badge (PRD §38)
}

// ── Section wrapper ───────────────────────────────────────────
function Section({
  title,
  children,
}: {
  title:    string;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        backgroundColor: "#fff",
        border:          "1.5px solid var(--color-border)",
        borderRadius:    "14px",
        padding:         "1.5rem",
        marginBottom:    "1.25rem",
      }}
    >
      <h2
        style={{
          fontSize:      "1rem",
          fontWeight:    700,
          color:         "var(--color-text)",
          margin:        "0 0 1.125rem",
          paddingBottom: "0.75rem",
          borderBottom:  "1px solid var(--color-border)",
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

// ── generateMetadata ──────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: PageParams;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const t       = await getTranslations({ locale, namespace: "profile" });
  const supabase = await createClient();

  const { data } = await supabase
    .from("professionals")
    .select("first_name, last_name, category_id, city, rating, review_count")
    .eq("slug", slug)
    .eq("status", "active")
    .single();

  if (!data) {
    // Layout template appends "| Trustia.gr" — no manual suffix here
    return { title: t("metaNotFound") };
  }

  const cat     = CATEGORIES.find((c) => c.id === data.category_id);
  const catName = locale === "en" && cat?.nameEn ? cat.nameEn : cat?.nameEl ?? "";
  const name    = `${data.first_name} ${data.last_name}`;

  return {
    title:       `${name} — ${catName}`,   // layout adds "| Trustia.gr"
    description: t("metaDesc", {
      name,
      catName,
      city:        data.city ?? "",
      rating:      data.rating.toFixed(1),
      reviewCount: data.review_count,
    }),
    openGraph: {
      title:       `${name} — ${catName}`,
      description: t("metaOgDesc"),
      type:        "profile",
    },
  };
}

// =============================================================
// MAIN PAGE
// =============================================================
export default async function ProfessionalProfilePage({
  params,
}: {
  params: PageParams;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const supabase  = await createClient();

  // ── 1. Fetch professional by slug ───────────────────────
  const { data: proRaw, error: proError } = await supabase
    .from("professionals")
    .select(
      "id, slug, first_name, last_name, avatar_url, phone, email, " +
      "category_id, tier, city, bio, price_text, " +
      "rating, review_count, rank, booking_mode, booking_enabled, " +
      "vacation_start, vacation_end, featured, created_at",
    )
    .eq("slug", slug)
    .eq("status", "active")
    .is("deleted_at", null)
    .single();

  if (proError || !proRaw) {
    notFound();
  }

  const pro = proRaw as unknown as DbProfessional;

  // ── 2. Fetch services + portfolio + reviews in parallel ──
  const [servicesResult, portfolioResult, reviewsResult] = await Promise.all([
    // Services catalog (required for "full" booking mode)
    supabase
      .from("professional_services")
      .select("id, name_el, name_en, duration_minutes, price, sort_order")
      .eq("professional_id", pro.id)
      .eq("active", true)
      .is("deleted_at", null)
      .order("sort_order"),

    // Portfolio photos
    supabase
      .from("portfolio_photos")
      .select(
        "id, photo_url, thumbnail_url, caption, is_before_after, after_photo_url, sort_order",
      )
      .eq("professional_id", pro.id)
      .is("deleted_at", null)
      .order("sort_order")
      .limit(20),

    // Reviews with customer display names (FK join via customer_id)
    supabase
      .from("reviews")
      .select(
        "id, rating, text, type, weight, created_at, " +
        "customer:customer_id(display_name, avatar_url)",
      )
      .eq("professional_id", pro.id)
      .eq("status", "active")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const services  = (servicesResult.data  ?? []) as unknown as DbService[];
  const portfolio = (portfolioResult.data ?? []) as unknown as DbPortfolioPhoto[];
  const reviews   = (reviewsResult.data   ?? []) as unknown as DbReview[];

  // ── 3. Auth context for review CTA ──────────────────────
  // Non-blocking — anonymous users can still view the page.
  // We need: customer row, completed booking with this pro, existing review.
  const { data: { user } } = await supabase.auth.getUser();

  let reviewCustomerId:     string | null = null;
  let reviewCompletedBookingId: string | null = null;
  let reviewExisting: { id: string; rating: number; text: string | null; type: string } | null = null;

  if (user) {
    // Step 1: get customer row for this user
    const { data: custRow } = await supabase
      .from("customers")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (custRow) {
      reviewCustomerId = custRow.id;

      // Step 2: parallel — completed booking + existing review
      const [bookingRes, reviewRes] = await Promise.all([
        supabase
          .from("bookings")
          .select("id")
          .eq("professional_id", pro.id)
          .eq("customer_id", custRow.id)
          .eq("status", "completed")
          .limit(1)
          .maybeSingle(),
        supabase
          .from("reviews")
          .select("id, rating, text, type")
          .eq("professional_id", pro.id)
          .eq("customer_id", custRow.id)
          .is("deleted_at", null)
          .maybeSingle(),
      ]);

      reviewCompletedBookingId = bookingRes.data?.id ?? null;
      reviewExisting = reviewRes.data ?? null;
    }
  }

  // ── 4. Derived values ────────────────────────────────────
  const t   = await getTranslations("profile");
  const cat = CATEGORIES.find((c) => c.id === pro.category_id);
  // Locale-aware category name
  const catDispName = locale === "en" && cat?.nameEn ? cat.nameEn : cat?.nameEl ?? "";
  const name        = `${pro.first_name} ${pro.last_name}`;
  // Build modeMeta from translations — not from module-level hardcoded constant
  const bookingLabels: Record<string, string> = {
    contact: t("bookingMode.contact"),
    date:    t("bookingMode.date"),
    full:    t("bookingMode.full"),
  };
  const modeMeta = {
    emoji: MODE_EMOJI[pro.booking_mode] ?? "📞",
    label: bookingLabels[pro.booking_mode] ?? pro.booking_mode,
  };

  // Is professional currently on vacation?
  const today    = new Date();
  const onVacation =
    pro.vacation_start && pro.vacation_end
      ? today >= new Date(pro.vacation_start) && today <= new Date(pro.vacation_end)
      : false;

  // ── 5. Build JSON-LD structured data ────────────────────
  // Schema.org LocalBusiness / Person markup for rich search results.
  // Helps Google show the professional in local search with rating stars.
  const jsonLd = {
    "@context":    "https://schema.org",
    "@type":       "LocalBusiness",
    name:          name,
    description:   pro.bio ?? `${catDispName} ${locale === "en" ? "in" : "στο"} ${pro.city ?? "Greece"}`,
    url:           `https://trustia.gr/${locale === "en" ? "en/" : ""}professional/${pro.slug}`,
    telephone:     pro.phone,
    address: pro.city
      ? {
          "@type":           "PostalAddress",
          addressLocality:   pro.city,
          addressCountry:    "GR",
        }
      : undefined,
    ...(pro.avatar_url ? { image: pro.avatar_url } : {}),
    ...(pro.review_count > 0
      ? {
          aggregateRating: {
            "@type":       "AggregateRating",
            ratingValue:   pro.rating.toFixed(1),
            reviewCount:   pro.review_count,
            bestRating:    "5",
            worstRating:   "1",
          },
        }
      : {}),
    priceRange: pro.price_text ?? undefined,
  };

  // ── 5. Render ────────────────────────────────────────────
  return (
    <div
      style={{
        backgroundColor: "var(--color-bg-light)",
        minHeight:       "100vh",
        // Extra bottom padding on mobile for the fixed action bar (ActionPanel)
        paddingBottom:   "80px",
      }}
    >
      {/* ── JSON-LD structured data ── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* ── Profile view tracker (client-only, renders null) ── */}
      <ProfileViewTracker professionalId={pro.id} />
      {/* ── Topbar: Back + Share ── */}
      <div
        style={{
          backgroundColor: "#fff",
          borderBottom:    "1px solid var(--color-border)",
          padding:         "0.75rem 1.5rem",
        }}
      >
        <div
          style={{
            maxWidth:       "1100px",
            margin:         "0 auto",
            display:        "flex",
            justifyContent: "space-between",
            alignItems:     "center",
          }}
        >
          {/* Back to results */}
          <Link
            href="/services"
            style={{
              display:        "inline-flex",
              alignItems:     "center",
              gap:            "0.375rem",
              color:          "var(--color-text-muted)",
              textDecoration: "none",
              fontSize:       "0.875rem",
              fontWeight:     500,
            }}
          >
            <ArrowLeft size={16} />
            {t("back")}
          </Link>

          {/* Share button (client) */}
          <ShareButton
            proName={name}
            categoryEl={catDispName}
          />
        </div>
      </div>

      {/* ── Page content ── */}
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "1.5rem 1.5rem 0" }}>

        {/* ── Profile header card ── */}
        <div
          style={{
            backgroundColor: "#fff",
            border:          "1.5px solid var(--color-border)",
            borderRadius:    "16px",
            padding:         "1.75rem",
            marginBottom:    "1.25rem",
            display:         "flex",
            gap:             "1.5rem",
            alignItems:      "flex-start",
            flexWrap:        "wrap",
          }}
        >
          {/* Avatar */}
          {pro.avatar_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={pro.avatar_url}
              alt={name}
              style={{
                width:        "96px",
                height:       "96px",
                borderRadius: "50%",
                objectFit:    "cover",
                flexShrink:   0,
                border:       "3px solid var(--color-border)",
              }}
            />
          ) : (
            <InitialsAvatar
              firstName={pro.first_name}
              lastName={pro.last_name}
              size={96}
            />
          )}

          {/* Info block */}
          <div style={{ flex: 1, minWidth: "200px" }}>
            {/* Name */}
            <h1
              style={{
                fontSize:     "clamp(1.25rem, 4vw, 1.75rem)",
                fontWeight:   800,
                color:        "var(--color-text)",
                margin:       "0 0 0.3rem",
              }}
            >
              {name}
              {pro.featured && (
                <span
                  style={{
                    marginLeft:      "0.625rem",
                    backgroundColor: "var(--color-accent)",
                    color:           "#fff",
                    borderRadius:    "6px",
                    padding:         "0.1rem 0.5rem",
                    fontSize:        "0.7rem",
                    fontWeight:      700,
                    verticalAlign:   "middle",
                  }}
                >
                  {t("featuredBadge")}
                </span>
              )}
            </h1>

            {/* Category + city */}
            <p
              style={{
                fontSize:     "1rem",
                color:        "var(--color-text-muted)",
                margin:       "0 0 0.25rem",
              }}
            >
              {cat?.emoji} {catDispName || pro.category_id}
            </p>

            {pro.city && (
              <p
                style={{
                  display:    "flex",
                  alignItems: "center",
                  gap:        "0.25rem",
                  fontSize:   "0.875rem",
                  color:      "var(--color-text-muted)",
                  margin:     "0 0 0.75rem",
                }}
              >
                <MapPin size={13} />
                {pro.city}
              </p>
            )}

            {/* Rating row */}
            <div
              style={{
                display:    "flex",
                alignItems: "center",
                gap:        "0.5rem",
                flexWrap:   "wrap",
                marginBottom: "0.875rem",
              }}
            >
              <Stars rating={pro.rating} size="lg" />
              <span style={{ fontWeight: 700, fontSize: "1.125rem", color: "var(--color-text)" }}>
                {pro.rating.toFixed(1)}
              </span>
              <span style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
                {t("ratingCount", { count: pro.review_count })}
              </span>
            </div>

            {/* Badges */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {/* Booking mode */}
              <span
                style={{
                  display:         "inline-flex",
                  alignItems:      "center",
                  gap:             "0.3rem",
                  backgroundColor: "var(--color-bg-light)",
                  border:          "1px solid var(--color-border)",
                  borderRadius:    "8px",
                  padding:         "0.25rem 0.625rem",
                  fontSize:        "0.8125rem",
                  fontWeight:      500,
                  color:           "var(--color-text)",
                }}
              >
                {modeMeta.emoji} {modeMeta.label}
              </span>

              {/* Available today (contact-mode = always reachable) */}
              {pro.booking_mode === "contact" && !onVacation && (
                <span
                  style={{
                    display:         "inline-flex",
                    alignItems:      "center",
                    gap:             "0.3rem",
                    backgroundColor: "rgba(39,174,96,0.1)",
                    border:          "1px solid rgba(39,174,96,0.3)",
                    borderRadius:    "8px",
                    padding:         "0.25rem 0.625rem",
                    fontSize:        "0.8125rem",
                    fontWeight:      500,
                    color:           "#27AE60",
                  }}
                >
                  {t("availableToday")}
                </span>
              )}

              {/* Vacation notice — shows badge + "Returns DD/MM" when vacation_end is set */}
              {onVacation && (
                <span
                  style={{
                    display:         "inline-flex",
                    alignItems:      "center",
                    gap:             "0.3rem",
                    backgroundColor: "rgba(212,160,57,0.1)",
                    border:          "1px solid rgba(212,160,57,0.3)",
                    borderRadius:    "8px",
                    padding:         "0.25rem 0.625rem",
                    fontSize:        "0.8125rem",
                    fontWeight:      500,
                    color:           "var(--color-accent)",
                  }}
                >
                  {t("onVacationBadge")}
                  {pro.vacation_end && (
                    <>
                      {" · "}
                      {t("onVacationUntil")}{" "}
                      {new Date(pro.vacation_end).toLocaleDateString(
                        locale === "en" ? "en-GB" : "el-GR",
                        { day: "numeric", month: "short" },
                      )}
                    </>
                  )}
                </span>
              )}

              {/* Member since */}
              <span
                style={{
                  fontSize:  "0.775rem",
                  color:     "var(--color-text-muted)",
                  alignSelf: "center",
                }}
              >
                {t("memberSince")}{" "}
                {new Date(pro.created_at).toLocaleDateString(
                  locale === "en" ? "en-US" : "el-GR",
                  { month: "long", year: "numeric" },
                )}
              </span>
            </div>
          </div>
        </div>

        {/* ── Two-column body ── */}
        <div
          style={{
            display:    "flex",
            gap:        "1.25rem",
            alignItems: "flex-start",
          }}
        >
          {/* ── Left column (main content) ── */}
          <div style={{ flex: 1, minWidth: 0 }}>

            {/* Bio & Price */}
            {(pro.bio || pro.price_text) && (
              <Section title={t("about")}>
                {pro.bio && (
                  <p
                    style={{
                      fontSize:   "0.9375rem",
                      lineHeight: 1.7,
                      color:      "var(--color-text)",
                      margin:     pro.price_text ? "0 0 1rem" : 0,
                      whiteSpace: "pre-line",
                    }}
                  >
                    {pro.bio}
                  </p>
                )}
                {pro.price_text && (
                  <div
                    style={{
                      display:         "inline-flex",
                      alignItems:      "center",
                      gap:             "0.375rem",
                      backgroundColor: "var(--color-primary-bg)",
                      border:          "1px solid var(--color-primary)",
                      borderRadius:    "8px",
                      padding:         "0.375rem 0.875rem",
                      fontSize:        "0.9375rem",
                      fontWeight:      700,
                      color:           "var(--color-primary-dark)",
                    }}
                  >
                    💰 {pro.price_text}
                  </div>
                )}
              </Section>
            )}

            {/* Services catalog (PRD §17) */}
            <Section title={t("servicesSection", { count: services.length })}>
              {services.length === 0 ? (
                <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", margin: 0 }}>
                  {t("noServices")}
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
                  {/* Table header */}
                  <div
                    style={{
                      display:       "grid",
                      gridTemplateColumns: "1fr auto auto",
                      gap:           "0.5rem",
                      padding:       "0.5rem 0",
                      borderBottom:  "2px solid var(--color-border)",
                      fontSize:      "0.75rem",
                      fontWeight:    700,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      color:         "var(--color-text-muted)",
                    }}
                  >
                    <span>{t("serviceHeader")}</span>
                    <span style={{ textAlign: "center" }}>{t("durationHeader")}</span>
                    <span style={{ textAlign: "right" }}>{t("priceHeader")}</span>
                  </div>

                  {/* Table rows */}
                  {services.map((svc, idx) => (
                    <div
                      key={svc.id}
                      style={{
                        display:             "grid",
                        gridTemplateColumns: "1fr auto auto",
                        gap:                 "0.5rem",
                        padding:             "0.75rem 0",
                        borderBottom:
                          idx < services.length - 1
                            ? "1px solid var(--color-border)"
                            : "none",
                        alignItems: "center",
                      }}
                    >
                      <span
                        style={{
                          fontSize:  "0.9375rem",
                          color:     "var(--color-text)",
                          fontWeight: 500,
                        }}
                      >
                        {/* Show English name on EN locale if available, else Greek */}
                        {locale === "en" && svc.name_en ? svc.name_en : svc.name_el}
                      </span>
                      <span
                        style={{
                          fontSize:  "0.8125rem",
                          color:     "var(--color-text-muted)",
                          textAlign: "center",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {formatDuration(svc.duration_minutes, locale)}
                      </span>
                      <span
                        style={{
                          fontSize:   "0.9375rem",
                          fontWeight: 700,
                          color:      svc.price === 0 ? "#27AE60" : "var(--color-text)",
                          textAlign:  "right",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {formatPrice(svc.price, locale)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Section>

            {/* Portfolio gallery (PRD §16) */}
            <Section title={t("portfolioSection", { count: portfolio.length })}>
              {portfolio.length === 0 ? (
                <div
                  style={{
                    display:        "flex",
                    flexDirection:  "column",
                    alignItems:     "center",
                    gap:            "0.5rem",
                    padding:        "2rem 0",
                    color:          "var(--color-text-muted)",
                  }}
                >
                  <ImageIcon size={32} style={{ opacity: 0.4 }} />
                  <p style={{ margin: 0, fontSize: "0.875rem" }}>
                    {t("noPortfolio")}
                  </p>
                </div>
              ) : (
                <div
                  style={{
                    display:             "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                    gap:                 "0.625rem",
                  }}
                >
                  {portfolio.map((photo) =>
                    photo.is_before_after && photo.after_photo_url ? (
                      /* Before / after pair */
                      <div
                        key={photo.id}
                        style={{
                          gridColumn:    "span 2",
                          display:       "flex",
                          gap:           "0.25rem",
                          borderRadius:  "10px",
                          overflow:      "hidden",
                          position:      "relative",
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photo.thumbnail_url ?? photo.photo_url}
                          alt={photo.caption ?? t("beforeAfter").split(" / ")[0]}
                          style={{ width: "50%", objectFit: "cover", aspectRatio: "1" }}
                        />
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photo.after_photo_url}
                          alt={t("beforeAfter").split(" / ")[1] ?? "After"}
                          style={{ width: "50%", objectFit: "cover", aspectRatio: "1" }}
                        />
                        <span
                          style={{
                            position:        "absolute",
                            bottom:          "4px",
                            left:            "4px",
                            backgroundColor: "rgba(0,0,0,0.55)",
                            color:           "#fff",
                            borderRadius:    "4px",
                            padding:         "2px 6px",
                            fontSize:        "0.65rem",
                          }}
                        >
                          {t("beforeAfter")}
                        </span>
                      </div>
                    ) : (
                      /* Single photo */
                      <div
                        key={photo.id}
                        style={{
                          borderRadius: "10px",
                          overflow:     "hidden",
                          position:     "relative",
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photo.thumbnail_url ?? photo.photo_url}
                          alt={photo.caption ?? (locale === "en" ? "Photo" : "Φωτογραφία")}
                          style={{
                            width:      "100%",
                            aspectRatio: "1",
                            objectFit:  "cover",
                            display:    "block",
                          }}
                        />
                        {photo.caption && (
                          <span
                            style={{
                              position:        "absolute",
                              bottom:          0,
                              left:            0,
                              right:           0,
                              backgroundColor: "rgba(0,0,0,0.55)",
                              color:           "#fff",
                              padding:         "0.25rem 0.375rem",
                              fontSize:        "0.65rem",
                              textOverflow:    "ellipsis",
                              overflow:        "hidden",
                              whiteSpace:      "nowrap",
                            }}
                          >
                            {photo.caption}
                          </span>
                        )}
                      </div>
                    ),
                  )}
                </div>
              )}
            </Section>

            {/* Reviews section (PRD §38) */}
            <Section title={t("reviewsSection", { count: pro.review_count })}>
              {reviews.length === 0 ? (
                <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
                  <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", margin: "0 0 1rem" }}>
                    {t("noReviews")}
                  </p>
                  <ReviewActions
                    professionalId={pro.id}
                    professionalName={name}
                    professionalSlug={pro.slug ?? slug}
                    customerId={reviewCustomerId}
                    existingReview={reviewExisting}
                    completedBookingId={reviewCompletedBookingId}
                  />
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  {reviews.map((review) => (
                    <article
                      key={review.id}
                      style={{
                        padding:      "1.125rem",
                        borderRadius: "10px",
                        border:       "1px solid var(--color-border)",
                        backgroundColor: "var(--color-bg-light)",
                      }}
                    >
                      {/* Review header: author + date + badge */}
                      <div
                        style={{
                          display:        "flex",
                          justifyContent: "space-between",
                          alignItems:     "flex-start",
                          marginBottom:   "0.625rem",
                          flexWrap:       "wrap",
                          gap:            "0.375rem",
                        }}
                      >
                        <div>
                          <p
                            style={{
                              fontWeight: 600,
                              fontSize:   "0.9375rem",
                              color:      "var(--color-text)",
                              margin:     0,
                            }}
                          >
                            {review.customer?.display_name ?? t("anonymous")}
                          </p>
                          <p
                            style={{
                              fontSize:  "0.775rem",
                              color:     "var(--color-text-muted)",
                              margin:    "0.15rem 0 0",
                            }}
                          >
                            {relativeDate(review.created_at, locale)}
                          </p>
                        </div>
                        <ReviewTypeBadge type={review.type} />
                      </div>

                      {/* Stars */}
                      <div style={{ marginBottom: review.text ? "0.5rem" : 0 }}>
                        <Stars rating={review.rating} size="sm" />
                      </div>

                      {/* Review text */}
                      {review.text && (
                        <p
                          style={{
                            fontSize:   "0.9rem",
                            lineHeight: 1.65,
                            color:      "var(--color-text)",
                            margin:     0,
                          }}
                        >
                          {review.text}
                        </p>
                      )}
                    </article>
                  ))}

                  {/* "Leave / edit review" CTA at the bottom */}
                  <div style={{ textAlign: "center", paddingTop: "0.5rem" }}>
                    <ReviewActions
                      professionalId={pro.id}
                      professionalName={name}
                      professionalSlug={pro.slug ?? slug}
                      customerId={reviewCustomerId}
                      existingReview={reviewExisting}
                      completedBookingId={reviewCompletedBookingId}
                    />
                  </div>
                </div>
              )}
            </Section>

          </div>

          {/* ── Right column: ActionPanel (desktop sticky; mobile = fixed bar) ── */}
          <div
            className="hidden md:block"
            style={{ width: "300px", flexShrink: 0 }}
          >
            <ActionPanel
              professionalId={pro.id}
              phone={pro.phone}
              bookingMode={pro.booking_mode}
              bookingEnabled={pro.booking_enabled}
              proName={name}
            />
          </div>
        </div>

        {/* ── Mobile ActionPanel (fixed bottom bar, hidden on desktop) ── */}
        <div className="md:hidden">
          <ActionPanel
            professionalId={pro.id}
            phone={pro.phone}
            bookingMode={pro.booking_mode}
            bookingEnabled={pro.booking_enabled}
            proName={name}
          />
        </div>

      </div>
    </div>
  );
}