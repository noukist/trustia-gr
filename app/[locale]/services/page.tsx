// =============================================================
// app/services/page.tsx
// =============================================================
// Public search / browse page for Trustia.gr.
// Server Component — data is fetched from Supabase on every request
// so results are always fresh and pages are SSR-indexed by Google.
//
// URL shape:
//   /services                                    → browse all categories
//   /services?category=plumber                   → category filter
//   /services?category=plumber&location=Θεσσαλονίκη
//            &placeId=ChIJ…&lat=40.6&lng=22.9    → geo-filtered
//
// Filters (from URL params, applied here):
//   rating=3|4|4.5   minRating filter (gte)
//   mode=contact|date|full  booking mode filter
//   reviews=1         only professionals with ≥ 1 review
//   distance=5|10|30|60|120  radius in km (requires lat/lng)
//   available=1       "available today" (simplified: contact-mode always available)
//   sort=reviews|rating|price|nearest
//
// Architecture:
//   - This file is the Server Component (reads searchParams, fetches DB)
//   - FiltersBar (client) + SortSelect (client) update URL params
//   - URL change re-renders this Server Component with fresh data
//   - Professional cards are rendered server-side (good for SEO)
// =============================================================

import React from "react";
import { Link }  from "@/i18n/navigation";     // locale-aware Link (auto-prepends /en/ etc.)
import type { Metadata } from "next";
import { UserCircle2, Star, MapPin, Phone, Calendar, CalendarDays } from "lucide-react";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { useTranslations, useLocale } from "next-intl"; // useLocale for cat name locale-switch

import { createClient }  from "@/lib/supabase/server";
import { CATEGORIES }    from "@/lib/constants";
import FiltersBar        from "@/components/services/FiltersBar";
import SortSelect        from "@/components/services/SortSelect";
import Button            from "@/components/ui/Button";
import EmailCaptureForm  from "@/components/services/EmailCaptureForm";

// ── Types ──────────────────────────────────────────────────────

/** Columns we SELECT from the professionals table */
interface DbProfessional {
  id:           string;
  slug:         string | null;
  first_name:   string;
  last_name:    string;
  avatar_url:   string | null;
  category_id:  string;
  tier:         string;
  city:         string | null;
  lat:          number | null;
  lng:          number | null;
  rating:       number;
  review_count: number;
  price_text:   string | null;
  booking_mode: "contact" | "date" | "full";
  booking_enabled: boolean;
  vacation_start: string | null;
  vacation_end:   string | null;
}

interface ProfessionalWithDistance extends DbProfessional {
  /** Haversine distance in km; null when lat/lng is missing */
  distanceKm: number | null;
  /** First numeric price extracted from price_text (for sorting) */
  parsedPrice: number | null;
}

// ── Next.js 16: searchParams is a Promise ─────────────────────
type PageSearchParams = Promise<Record<string, string | string[] | undefined>>;
type PageParams       = Promise<{ locale: string }>;

// ── Metadata (dynamic, SEO-friendly) ─────────────────────────
export async function generateMetadata({
  params,
  searchParams,
}: {
  params:       PageParams;        // Note: was PageSearchParams — fixed to correct type
  searchParams: PageSearchParams;
}): Promise<Metadata> {
  const { locale } = await params;
  const p           = await searchParams;
  const str         = (k: string) => (Array.isArray(p[k]) ? p[k][0] : p[k]) ?? "";
  const catId       = str("category");
  const location    = str("location");
  const cat         = CATEGORIES.find((c) => c.id === catId);

  // Pick locale-appropriate category name
  const catName = locale === "en" && cat?.nameEn ? cat.nameEn : cat?.nameEl;

  // Load translations for the correct locale
  // Note: layout template appends "| Trustia.gr" — do NOT add it manually here
  const t = await getTranslations({ locale, namespace: "services" });

  if (cat && location) {
    return {
      title:       t("catInLocation", { catName: catName!, location }),
      description: t("metaDescCatLocation", { catName: catName!, location }),
    };
  }
  if (cat) {
    return {
      title:       catName!,
      description: t("metaDescCat", { catName: catName! }),
    };
  }
  return {
    title:       t("title"),
    description: t("metaDesc"),
  };
}

// ── Haversine distance formula ────────────────────────────────
/**
 * Returns the great-circle distance between two WGS-84 points in km.
 * Used to filter / sort professionals by proximity (PRD §74).
 */
function haversineKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R    = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Extract the first number from a free-text price string (e.g. "Από €30/ώρα" → 30) */
function parsePrice(text: string | null): number | null {
  if (!text) return null;
  const match = text.match(/\d+(\.\d+)?/);
  return match ? parseFloat(match[0]) : null;
}

// ── Star display ──────────────────────────────────────────────
/** Renders a rating as filled / empty Unicode stars */
function Stars({ rating }: { rating: number }) {
  const full  = Math.floor(rating);
  const half  = rating - full >= 0.4 ? 1 : 0;
  const empty = 5 - full - half;
  return (
    <span
      style={{ color: "var(--color-accent)", fontSize: "0.875rem", letterSpacing: "-1px" }}
      aria-label={`Βαθμολογία ${rating} από 5`}
    >
      {"★".repeat(full)}
      {half ? "½" : ""}
      {"☆".repeat(empty)}
    </span>
  );
}

// ── Booking mode badge ────────────────────────────────────────
// Labels are resolved at render time via useTranslations so they
// switch language automatically. The emoji and color are locale-agnostic.
const MODE_EMOJI: Record<string, { emoji: string; color: string }> = {
  contact: { emoji: "📞", color: "#6B7280" },
  date:    { emoji: "📅", color: "#2A8F8F" },
  full:    { emoji: "🗓️", color: "#27AE60" },
};

// ── Professional card ─────────────────────────────────────────
function ProfessionalCard({ pro }: { pro: ProfessionalWithDistance }) {
  const t        = useTranslations("services");
  const locale   = useLocale();
  const name     = `${pro.first_name} ${pro.last_name}`;
  const cat      = CATEGORIES.find((c) => c.id === pro.category_id);
  // Show English category name when available and locale is EN
  const catName  = locale === "en" && cat?.nameEn ? cat.nameEn : cat?.nameEl;
  const modeEmoji = MODE_EMOJI[pro.booking_mode] ?? MODE_EMOJI.contact;

  // Booking mode translated label
  const modeLabel: Record<string, string> = {
    contact: t("modeContact"),
    date:    t("modeDate"),
    full:    t("modeFull"),
  };
  const modeMeta = { ...modeEmoji, label: modeLabel[pro.booking_mode] ?? pro.booking_mode };
  const href     = pro.slug ? `/professional/${pro.slug}` : "#";

  return (
    <Link
      href={href}
      style={{
        display:         "flex",
        flexDirection:   "column",
        gap:             "0",
        backgroundColor: "#fff",
        border:          "1.5px solid var(--color-border)",
        borderRadius:    "14px",
        overflow:        "hidden",
        textDecoration:  "none",
        color:           "inherit",
        transition:      "box-shadow 0.15s, border-color 0.15s",
      }}
      // CSS hover handled via globals (no onMouseEnter — server component-safe)
    >
      {/* ── Top accent strip ── */}
      <div
        style={{
          height:          "4px",
          backgroundColor: "var(--color-primary)",
        }}
      />

      <div style={{ padding: "1.125rem" }}>
        {/* ── Avatar + name row ── */}
        <div
          style={{
            display:    "flex",
            alignItems: "flex-start",
            gap:        "0.875rem",
            marginBottom: "0.875rem",
          }}
        >
          {/* Avatar */}
          {pro.avatar_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={pro.avatar_url}
              alt={name}
              style={{
                width:        "56px",
                height:       "56px",
                borderRadius: "50%",
                objectFit:    "cover",
                flexShrink:   0,
                border:       "2px solid var(--color-border)",
              }}
            />
          ) : (
            <div
              style={{
                width:           "56px",
                height:          "56px",
                borderRadius:    "50%",
                backgroundColor: "var(--color-primary-bg)",
                display:         "flex",
                alignItems:      "center",
                justifyContent:  "center",
                flexShrink:      0,
                border:          "2px solid var(--color-border)",
              }}
            >
              <UserCircle2 size={32} style={{ color: "var(--color-primary)" }} />
            </div>
          )}

          {/* Name + category + city */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                margin:       0,
                fontWeight:   700,
                fontSize:     "1rem",
                color:        "var(--color-text)",
                whiteSpace:   "nowrap",
                overflow:     "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {name}
            </p>
            {cat && (
              <p
                style={{
                  margin:   "0.2rem 0 0",
                  fontSize: "0.8125rem",
                  color:    "var(--color-text-muted)",
                }}
              >
                {cat.emoji} {catName}
              </p>
            )}
            {pro.city && (
              <p
                style={{
                  display:    "flex",
                  alignItems: "center",
                  gap:        "0.2rem",
                  margin:     "0.2rem 0 0",
                  fontSize:   "0.775rem",
                  color:      "var(--color-text-muted)",
                }}
              >
                <MapPin size={11} />
                {pro.city}
                {pro.distanceKm !== null && (
                  <span
                    style={{
                      marginLeft:      "0.25rem",
                      backgroundColor: "var(--color-primary-bg)",
                      color:           "var(--color-primary-dark)",
                      borderRadius:    "999px",
                      padding:         "0 6px",
                      fontSize:        "0.7rem",
                      fontWeight:      600,
                    }}
                  >
                    {pro.distanceKm < 1
                      ? "<1 km"
                      : `${Math.round(pro.distanceKm)} km`}
                  </span>
                )}
              </p>
            )}
          </div>
        </div>

        {/* ── Rating row ── */}
        <div
          style={{
            display:        "flex",
            alignItems:     "center",
            gap:            "0.4rem",
            marginBottom:   "0.875rem",
          }}
        >
          <Stars rating={pro.rating} />
          <span
            style={{
              fontSize:   "0.8125rem",
              fontWeight: 600,
              color:      "var(--color-text)",
            }}
          >
            {pro.rating.toFixed(1)}
          </span>
          <span style={{ fontSize: "0.775rem", color: "var(--color-text-muted)" }}>
            ({pro.review_count} {t("reviews")})
          </span>
        </div>

        {/* ── Badges row ── */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
          {/* Booking mode badge */}
          <span
            style={{
              display:         "inline-flex",
              alignItems:      "center",
              gap:             "0.25rem",
              backgroundColor: "var(--color-bg-light)",
              border:          "1px solid var(--color-border)",
              borderRadius:    "6px",
              padding:         "0.2rem 0.5rem",
              fontSize:        "0.75rem",
              color:           modeMeta.color,
              fontWeight:      500,
            }}
          >
            {modeMeta.emoji} {modeMeta.label}
          </span>

          {/* Price badge */}
          {pro.price_text && (
            <span
              style={{
                display:         "inline-flex",
                alignItems:      "center",
                backgroundColor: "var(--color-bg-light)",
                border:          "1px solid var(--color-border)",
                borderRadius:    "6px",
                padding:         "0.2rem 0.5rem",
                fontSize:        "0.75rem",
                color:           "var(--color-text)",
                fontWeight:      500,
              }}
            >
              {pro.price_text}
            </span>
          )}

          {/* Available today badge (simplified: contact-mode = always available) */}
          {pro.booking_mode === "contact" && (
            <span
              style={{
                display:         "inline-flex",
                alignItems:      "center",
                gap:             "0.25rem",
                backgroundColor: "rgba(39,174,96,0.1)",
                border:          "1px solid rgba(39,174,96,0.3)",
                borderRadius:    "6px",
                padding:         "0.2rem 0.5rem",
                fontSize:        "0.75rem",
                color:           "#27AE60",
                fontWeight:      500,
              }}
            >
              {t("availableToday")}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

// ── Zero Results state ────────────────────────────────────────
function ZeroResults({
  categoryName,
  categoryId,
  location,
  nearbyPros,
}: {
  categoryName: string;
  categoryId:   string;
  location:     string;
  nearbyPros:   ProfessionalWithDistance[];
}) {
  const t = useTranslations("services");
  return (
    <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
      {/* Primary message */}
      <p style={{ fontSize: "2rem", marginBottom: "1rem" }}>🔍</p>
      <h2
        style={{
          fontSize:     "1.25rem",
          fontWeight:   700,
          color:        "var(--color-text)",
          marginBottom: "0.5rem",
        }}
      >
        {t("noResults")} {categoryName}
        {location ? ` ${t("noResultsIn")} ${location}` : ""}
      </h2>
      <p
        style={{
          fontSize:     "0.9375rem",
          color:        "var(--color-text-muted)",
          maxWidth:     "460px",
          margin:       "0 auto 2rem",
          lineHeight:   1.6,
        }}
      >
        {t("noResultsSub")}
      </p>

      {/* Nearby pros (proximity fallback — PRD §9) */}
      {nearbyPros.length > 0 && (
        <div style={{ marginBottom: "2rem", textAlign: "left" }}>
          <p
            style={{
              fontSize:     "0.875rem",
              fontWeight:   600,
              color:        "var(--color-text-muted)",
              marginBottom: "1rem",
              textAlign:    "center",
            }}
          >
            {t("nearbySub")}
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "0.875rem" }}>
            {nearbyPros.slice(0, 6).map((pro) => (
              <ProfessionalCard key={pro.id} pro={pro} />
            ))}
          </div>
        </div>
      )}

      {/* Email capture (PRD §9) — extracted to a Client Component
          so the parent Server Component doesn't have event handlers */}
      <div
        style={{
          backgroundColor: "var(--color-primary-bg)",
          border:          "1.5px solid var(--color-primary)",
          borderRadius:    "14px",
          padding:         "1.5rem",
          maxWidth:        "480px",
          margin:          "0 auto 1.5rem",
          textAlign:       "left",
        }}
      >
        <p
          style={{
            fontWeight:   700,
            fontSize:     "0.9375rem",
            color:        "var(--color-text)",
            marginBottom: "0.5rem",
          }}
        >
          {t("notifyTitle")}
        </p>
        <p
          style={{
            fontSize:     "0.8125rem",
            color:        "var(--color-text-muted)",
            marginBottom: "0.875rem",
          }}
        >
          {t("notifySub")} {categoryName}
          {location ? ` ${t("noResultsIn")} ${location}` : ""}.
        </p>
        <EmailCaptureForm categoryName={categoryName} categoryId={categoryId} location={location} />
      </div>

      {/* Pro recruitment CTA */}
      <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
        {t("proRecruit")} {categoryName}?{" "}
        <Link
          href="/register/professional"
          style={{ color: "var(--color-primary)", fontWeight: 600 }}
        >
          {t("proRecruitLink")}
        </Link>
      </p>
    </div>
  );
}

// ── Browse Mode (no search params) ───────────────────────────
function BrowseMode() {
  // Display categories grouped by tier with links to /services?category=X
  const t      = useTranslations("services");
  const locale = useLocale();

  const light       = CATEGORIES.filter((c) => c.tier === "light");
  const trades      = CATEGORIES.filter((c) => c.tier === "trades");
  const specialists = CATEGORIES.filter((c) => c.tier === "specialists");

  // Tier labels built after t() is ready — not at module scope
  const tiers = [
    { label: t("browseTierLight"),       cats: light },
    { label: t("browseTierTrades"),      cats: trades },
    { label: t("browseTierSpecialists"), cats: specialists },
  ];

  return (
    <div style={{ maxWidth: "960px", margin: "0 auto", padding: "2rem 1.5rem" }}>
      <h1
        style={{
          fontSize:     "clamp(1.5rem, 4vw, 2rem)",
          fontWeight:   800,
          color:        "var(--color-text)",
          marginBottom: "0.5rem",
        }}
      >
        {t("allServices")}
      </h1>
      <p
        style={{
          fontSize:     "1rem",
          color:        "var(--color-text-muted)",
          marginBottom: "2.5rem",
        }}
      >
        {t("allServicesSub")}
      </p>

      {tiers.map(({ label, cats }) => (
        <section key={label} style={{ marginBottom: "2.5rem" }}>
          <h2
            style={{
              fontSize:      "0.8rem",
              fontWeight:    700,
              textTransform: "uppercase",
              letterSpacing: "0.07em",
              color:         "var(--color-text-muted)",
              marginBottom:  "1rem",
            }}
          >
            {label}
          </h2>

          <div
            style={{
              display:             "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
              gap:                 "0.625rem",
            }}
          >
            {cats.map((cat) => {
              // Locale-aware name: use English name when available and locale is EN
              const catName = locale === "en" && cat.nameEn ? cat.nameEn : cat.nameEl;
              return (
                <Link
                  key={cat.id}
                  href={`/services?category=${cat.id}`}
                  style={{
                    display:         "flex",
                    flexDirection:   "column",
                    alignItems:      "center",
                    gap:             "0.375rem",
                    padding:         "1rem 0.75rem",
                    backgroundColor: "#fff",
                    border:          "1.5px solid var(--color-border)",
                    borderRadius:    "12px",
                    textDecoration:  "none",
                    color:           "var(--color-text)",
                    fontSize:        "0.85rem",
                    fontWeight:      500,
                    textAlign:       "center",
                    transition:      "border-color 0.15s, box-shadow 0.15s",
                  }}
                >
                  <span style={{ fontSize: "1.5rem" }}>{cat.emoji}</span>
                  {catName}
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

// =============================================================
// MAIN PAGE (Server Component)
// =============================================================
export default async function ServicesPage({
  params,
  searchParams,
}: {
  params: PageParams;
  searchParams: PageSearchParams;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Translations for the page-level strings (sub-components call their own t()).
  // Must use getTranslations (awaitable) inside an async Server Component —
  // useTranslations is only valid in sync components (next-intl v4 rule).
  const t = await getTranslations("services");

  // ── 1. Parse URL params ──────────────────────────────────
  const p = await searchParams;

  /** Helper: read a single string from potentially-array params */
  function str(key: string): string {
    const v = p[key];
    return (Array.isArray(v) ? v[0] : v) ?? "";
  }

  const categoryId  = str("category");
  const location    = str("location");
  const latRaw      = str("lat");
  const lngRaw      = str("lng");
  const minRating   = str("rating");
  const modeFilter  = str("mode");
  const reviewsOnly = str("reviews") === "1";
  const maxDistRaw  = str("distance");
  const availToday  = str("available") === "1";
  const sortBy      = str("sort") || "reviews";
  /** Free-text service name search (matches name_el OR name_en) */
  const serviceQ    = str("q").trim();

  const userLat     = latRaw ? parseFloat(latRaw) : null;
  const userLng     = lngRaw ? parseFloat(lngRaw) : null;
  const hasLocation = userLat !== null && userLng !== null;

  // ── 2. No params → show browse mode ─────────────────────
  if (!categoryId && !location && !serviceQ) {
    return <BrowseMode />;
  }

  // ── 3. Fetch professionals from Supabase ─────────────────
  const supabase = await createClient();

  // When a service-name query is present, first find the professional_ids
  // that have a matching service (name_el ILIKE %q% OR name_en ILIKE %q%).
  // We do two separate .ilike() calls and union the IDs in JS because
  // PostgREST doesn't support OR across different columns in a single call.
  let serviceMatchIds: string[] | null = null;
  if (serviceQ) {
    const [elResult, enResult] = await Promise.all([
      supabase
        .from("professional_services")
        .select("professional_id")
        .ilike("name_el", `%${serviceQ}%`)
        .eq("active", true),
      supabase
        .from("professional_services")
        .select("professional_id")
        .ilike("name_en", `%${serviceQ}%`)
        .eq("active", true),
    ]);

    const ids = new Set<string>();
    for (const row of elResult.data ?? []) ids.add(row.professional_id);
    for (const row of enResult.data ?? []) ids.add(row.professional_id);
    serviceMatchIds = [...ids];
  }

  let query = supabase
    .from("professionals")
    .select(
      "id, slug, first_name, last_name, avatar_url, category_id, tier, city, lat, lng, " +
      "rating, review_count, price_text, booking_mode, booking_enabled, " +
      "vacation_start, vacation_end",
    )
    .eq("status",           "active")
    .eq("profile_complete", true)
    .is("deleted_at",       null);

  // ── DB-level filters (before TypeScript post-processing) ──
  if (categoryId) {
    query = query.eq("category_id", categoryId);
  }

  // When a service text search was performed, limit to matching professionals.
  // An empty array means no professionals have that service name — return nothing.
  if (serviceMatchIds !== null) {
    if (serviceMatchIds.length === 0) {
      query = query.in("id", ["00000000-0000-0000-0000-000000000000"]); // guaranteed empty
    } else {
      query = query.in("id", serviceMatchIds);
    }
  }

  if (minRating) {
    query = query.gte("rating", parseFloat(minRating));
  }

  if (modeFilter) {
    // "full" booking mode is labeled "Online" in the UI
    query = query.eq("booking_mode", modeFilter);
  }

  if (reviewsOnly) {
    query = query.gt("review_count", 0);
  }

  // Default sort at DB level (nearest / price are handled in JS)
  if (sortBy === "rating") {
    query = query.order("rating",       { ascending: false });
  } else {
    // Default: most reviewed first
    query = query.order("review_count", { ascending: false });
  }

  // Limit to prevent over-fetching; distance filter trims further in JS
  query = query.limit(100);

  const { data: rawData, error } = await query;

  if (error) {
    console.error("[ServicesPage] Supabase error:", error.message);
  }

  // ── 4. TypeScript post-processing ────────────────────────
  const today = new Date();

  // Cast because Supabase can't infer row shape from a complex string select
  const typedData = (rawData ?? []) as unknown as DbProfessional[];

  let results: ProfessionalWithDistance[] = typedData
    .filter((pro) => {
      // Skip professionals currently on vacation
      if (pro.vacation_start && pro.vacation_end) {
        const vs = new Date(pro.vacation_start);
        const ve = new Date(pro.vacation_end);
        if (today >= vs && today <= ve) return false;
      }
      return true;
    })
    .map((pro) => ({
      ...pro,
      distanceKm:
        hasLocation && pro.lat !== null && pro.lng !== null
          ? haversineKm(userLat!, userLng!, pro.lat, pro.lng)
          : null,
      parsedPrice: parsePrice(pro.price_text),
    }));

  // ── Distance filter (JS level — DB has no PostGIS) ────────
  if (hasLocation && maxDistRaw) {
    const maxKm = parseFloat(maxDistRaw);
    results = results.filter(
      (p) => p.distanceKm === null || p.distanceKm <= maxKm,
    );
  }

  // ── Available today filter (simplified) ──────────────────
  // Contact-only professionals are always reachable → treat as "available".
  // Full-calendar availability would require checking availability_slots (Phase 2).
  if (availToday) {
    results = results.filter(
      (p) => p.booking_mode === "contact" || p.booking_enabled,
    );
  }

  // ── JS sorts ─────────────────────────────────────────────
  if (sortBy === "price") {
    results.sort(
      (a, b) => (a.parsedPrice ?? Infinity) - (b.parsedPrice ?? Infinity),
    );
  } else if (sortBy === "nearest" && hasLocation) {
    results.sort(
      (a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity),
    );
  }

  // ── 5. Nearby professionals for zero-results state ───────
  // When the main results are empty, fetch professionals in the same
  // category from anywhere in Greece and sort by distance (PRD §9).
  let nearbyPros: ProfessionalWithDistance[] = [];

  if (results.length === 0 && categoryId && hasLocation) {
    const { data: nearby } = await supabase
      .from("professionals")
      .select(
        "id, slug, first_name, last_name, avatar_url, category_id, tier, city, lat, lng, " +
        "rating, review_count, price_text, booking_mode, booking_enabled, " +
        "vacation_start, vacation_end",
      )
      .eq("status",           "active")
      .eq("profile_complete", true)
      .is("deleted_at",       null)
      .eq("category_id",      categoryId)
      .order("review_count",  { ascending: false })
      .limit(12);

    nearbyPros = ((nearby ?? []) as unknown as DbProfessional[])
      .map((pro) => ({
        ...pro,
        distanceKm:
          pro.lat !== null && pro.lng !== null
            ? haversineKm(userLat!, userLng!, pro.lat, pro.lng)
            : null,
        parsedPrice: parsePrice(pro.price_text),
      }))
      .filter((p) => p.distanceKm === null || p.distanceKm <= 200)
      .sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
  }

  // ── 6. Derive display strings ─────────────────────────────
  const cat       = CATEGORIES.find((c) => c.id === categoryId);
  // Locale-aware category name (English name when available in EN locale)
  const catNameEl = cat?.nameEl ?? t("professionals");
  const catDispName = locale === "en" && cat?.nameEn ? cat.nameEn : catNameEl;
  const pageTitle = location
    ? t("catInLocation", { catName: catDispName, location })
    : categoryId
      ? catDispName
      : t("searchResults");

  // ── 7. Render ─────────────────────────────────────────────
  return (
    <div
      style={{
        backgroundColor: "var(--color-bg-light)",
        minHeight:       "100vh",
      }}
    >
      {/* ── Page header ── */}
      <div
        style={{
          backgroundColor: "#fff",
          borderBottom:    "1px solid var(--color-border)",
          padding:         "1.25rem 1.5rem",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          {/* Breadcrumb — uses t() keys already present in the services namespace */}
          <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", margin: "0 0 0.375rem" }}>
            <Link href="/" style={{ color: "inherit", textDecoration: "none" }}>{t("breadcrumbHome")}</Link>
            {" / "}
            <Link href="/services" style={{ color: "inherit", textDecoration: "none" }}>{t("breadcrumbServices")}</Link>
            {cat && (
              <>
                {" / "}
                <span style={{ color: "var(--color-text)" }}>{catDispName}</span>
              </>
            )}
          </p>

          <h1
            style={{
              fontSize:   "clamp(1.25rem, 3.5vw, 1.75rem)",
              fontWeight: 800,
              color:      "var(--color-text)",
              margin:     0,
            }}
          >
            {cat && <span style={{ marginRight: "0.4rem" }}>{cat.emoji}</span>}
            {pageTitle}
          </h1>

          {results.length > 0 && (
            <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", margin: "0.25rem 0 0" }}>
              {results.length} {t("professionals")}
              {location && ` ${t("near")} ${location}`}
            </p>
          )}
        </div>
      </div>

      {/* ── Two-column layout ── */}
      <div
        style={{
          maxWidth: "1200px",
          margin:   "0 auto",
          padding:  "1.5rem 1.5rem 3rem",
          display:  "flex",
          gap:      "2rem",
          alignItems: "flex-start",
        }}
      >
        {/* ── Left: Filter sidebar (client) ── */}
        <FiltersBar hasLocation={hasLocation} serviceQ={serviceQ} />

        {/* ── Right: Results ── */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {results.length > 0 ? (
            <>
              {/* Sort bar */}
              <div
                style={{
                  display:        "flex",
                  justifyContent: "space-between",
                  alignItems:     "center",
                  marginBottom:   "1.25rem",
                  flexWrap:       "wrap",
                  gap:            "0.5rem",
                }}
              >
                <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", margin: 0 }}>
                  {results.length} {t("results")}
                </p>
                <SortSelect hasLocation={hasLocation} />
              </div>

              {/* Professional cards grid */}
              <div
                style={{
                  display:             "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                  gap:                 "1rem",
                }}
              >
                {results.map((pro) => (
                  <ProfessionalCard key={pro.id} pro={pro} />
                ))}
              </div>
            </>
          ) : (
            /* Zero results — pass locale-aware name */
            <ZeroResults
              categoryName={catDispName}
              categoryId={categoryId}
              location={location}
              nearbyPros={nearbyPros}
            />
          )}
        </div>
      </div>
    </div>
  );
}
