// =============================================================
// app/[locale]/[category]/[area]/page.tsx
// =============================================================
// SEO landing pages: one page per category × area combination.
//
// URL examples:
//   /house-cleaning/kalamaria   → Καθαρισμός Σπιτιού – Καλαμαριά
//   /plumber/kentro             → Υδραυλικός – Κέντρο
//   /en/electrician/glyfada     → Electrician – Glyfada
//
// These pages are:
//   • Statically generated at build via generateStaticParams
//   • Indexed by Google (they appear in sitemap.ts)
//   • Rich with Schema.org LocalBusiness structured data
//   • Mobile-first, matching the rest of the site's design
//
// Content:
//   1. Breadcrumbs
//   2. Hero H1 + description
//   3. Professionals grid (filtered by category + region)
//   4. Related areas section
//   5. CTA to register as professional
//   6. Schema.org JSON-LD
// =============================================================

import React                            from "react";
import { notFound }                     from "next/navigation";
import type { Metadata }                from "next";
import { MapPin, Star, UserCircle2, ArrowRight } from "lucide-react";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { useTranslations, useLocale }   from "next-intl";
import { Link }                         from "@/i18n/navigation";

import { createClient }                 from "@/lib/supabase/server";
import { CATEGORIES, REGIONS, getAllAreas } from "@/lib/constants";
import type { Category, Region }        from "@/lib/constants";
import Button                           from "@/components/ui/Button";

// ── Next.js 16: params are a Promise ─────────────────────────
type PageParams = Promise<{ locale: string; category: string; area: string }>;

// ── DB row shape ───────────────────────────────────────────────
interface DbProfessional {
  id:              string;
  slug:            string | null;
  first_name:      string;
  last_name:       string;
  avatar_url:      string | null;
  category_id:     string;
  city:            string | null;
  rating:          number;
  review_count:    number;
  price_text:      string | null;
  booking_mode:    "contact" | "date" | "full";
  booking_enabled: boolean;
}

// ── Helpers ────────────────────────────────────────────────────

/**
 * Find an area record by its URL segment ID.
 * Returns { area, municipality, region } or null if not found.
 */
function findAreaById(areaId: string) {
  for (const region of REGIONS) {
    for (const municipality of region.municipalities) {
      for (const area of municipality.areas) {
        if (area.id === areaId) {
          return { area, municipality, region };
        }
      }
    }
  }
  return null;
}

/**
 * All area IDs within the same region as `areaId`, excluding itself.
 * Used for the "Related areas" section.
 */
function getSiblingAreas(areaId: string) {
  for (const region of REGIONS) {
    for (const municipality of region.municipalities) {
      for (const area of municipality.areas) {
        if (area.id === areaId) {
          // Return all areas in the same region
          return region.municipalities
            .flatMap((m) => m.areas)
            .filter((a) => a.id !== areaId);
        }
      }
    }
  }
  return [];
}

// ── Star display ──────────────────────────────────────────────
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

// ── Professional card (same style as /services) ───────────────
function ProfessionalCard({ pro }: { pro: DbProfessional }) {
  const locale  = useLocale();
  const cat     = CATEGORIES.find((c) => c.id === pro.category_id);
  const catName = locale === "en" && cat?.nameEn ? cat.nameEn : cat?.nameEl;
  const href    = pro.slug ? `/professional/${pro.slug}` : "#";

  const MODE_EMOJI: Record<string, { emoji: string; color: string; label: string }> = {
    contact: { emoji: "📞", color: "#6B7280", label: "Τηλέφωνο" },
    date:    { emoji: "📅", color: "#2A8F8F", label: "Ραντεβού" },
    full:    { emoji: "🗓️", color: "#27AE60", label: "Online κράτηση" },
  };
  const modeMeta = MODE_EMOJI[pro.booking_mode] ?? MODE_EMOJI.contact;

  return (
    <Link
      href={href}
      style={{
        display:         "flex",
        flexDirection:   "column",
        backgroundColor: "#fff",
        border:          "1.5px solid var(--color-border)",
        borderRadius:    "14px",
        overflow:        "hidden",
        textDecoration:  "none",
        color:           "inherit",
        transition:      "box-shadow 0.15s, border-color 0.15s",
      }}
    >
      {/* Top accent strip */}
      <div style={{ height: "4px", backgroundColor: "var(--color-primary)" }} />

      <div style={{ padding: "1.125rem" }}>
        {/* Avatar + name row */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: "0.875rem", marginBottom: "0.875rem" }}>
          {pro.avatar_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={pro.avatar_url}
              alt={`${pro.first_name} ${pro.last_name}`}
              style={{ width: "56px", height: "56px", borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "2px solid var(--color-border)" }}
            />
          ) : (
            <div
              style={{
                width: "56px", height: "56px", borderRadius: "50%",
                backgroundColor: "var(--color-primary-bg)", display: "flex",
                alignItems: "center", justifyContent: "center", flexShrink: 0,
                border: "2px solid var(--color-border)",
              }}
            >
              <UserCircle2 size={32} style={{ color: "var(--color-primary)" }} />
            </div>
          )}

          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: "1rem", color: "var(--color-text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {pro.first_name} {pro.last_name}
            </p>
            {catName && (
              <p style={{ margin: "0.2rem 0 0", fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
                {cat?.emoji} {catName}
              </p>
            )}
            {pro.city && (
              <p style={{ display: "flex", alignItems: "center", gap: "0.2rem", margin: "0.2rem 0 0", fontSize: "0.775rem", color: "var(--color-text-muted)" }}>
                <MapPin size={11} />
                {pro.city}
              </p>
            )}
          </div>
        </div>

        {/* Rating row */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.875rem" }}>
          <Stars rating={pro.rating} />
          <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-text)" }}>
            {pro.rating.toFixed(1)}
          </span>
          <span style={{ fontSize: "0.775rem", color: "var(--color-text-muted)" }}>
            ({pro.review_count} κριτικές)
          </span>
        </div>

        {/* Badges */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
          <span
            style={{
              display: "inline-flex", alignItems: "center", gap: "0.25rem",
              backgroundColor: "var(--color-bg-light)", border: "1px solid var(--color-border)",
              borderRadius: "6px", padding: "0.2rem 0.5rem", fontSize: "0.75rem",
              color: modeMeta.color, fontWeight: 500,
            }}
          >
            {modeMeta.emoji} {modeMeta.label}
          </span>
          {pro.price_text && (
            <span
              style={{
                display: "inline-flex", alignItems: "center",
                backgroundColor: "var(--color-bg-light)", border: "1px solid var(--color-border)",
                borderRadius: "6px", padding: "0.2rem 0.5rem", fontSize: "0.75rem",
                color: "var(--color-text)", fontWeight: 500,
              }}
            >
              {pro.price_text}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

// ── Metadata ───────────────────────────────────────────────────
export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
  const { locale, category: categoryId, area: areaId } = await params;

  const cat    = CATEGORIES.find((c) => c.id === categoryId);
  const found  = findAreaById(areaId);
  if (!cat || !found) return {};

  const catName  = locale === "en" && cat.nameEn ? cat.nameEn : cat.nameEl;
  const areaName = found.area.name;
  const city     = found.region.name;

  // NOTE: layout.tsx template appends "| Trustia.gr" automatically.
  // Do NOT add it manually here or it will appear twice.
  const title       = `${catName} – ${areaName}`;
  const description = locale === "en"
    ? `Find trusted ${catName.toLowerCase()} professionals near ${areaName}, ${city}. Verified reviews, no commission. Book online on Trustia.gr.`
    : `Βρες αξιόπιστους επαγγελματίες ${catName.toLowerCase()} κοντά στη ${areaName}. Επαληθευμένες κριτικές, μηδέν προμήθεια. Κλείσε ραντεβού στο Trustia.gr.`;

  return {
    title,
    description,
    openGraph: {
      title:       `${title} | Trustia.gr`,  // OG needs the full title with site name
      description,
      type:        "website",
      locale:      locale === "en" ? "en_US" : "el_GR",
    },
    alternates: {
      canonical: `https://trustia.gr/${categoryId}/${areaId}`,
      languages: {
        "el": `https://trustia.gr/${categoryId}/${areaId}`,
        "en": `https://trustia.gr/en/${categoryId}/${areaId}`,
      },
    },
  };
}

// ── Static params — pre-render all category × area combos ─────
export async function generateStaticParams() {
  const allAreas     = getAllAreas();
  const locales      = ["el", "en"];
  const params: { locale: string; category: string; area: string }[] = [];

  for (const locale of locales) {
    for (const cat of CATEGORIES) {
      for (const area of allAreas) {
        params.push({ locale, category: cat.id, area: area.id });
      }
    }
  }

  return params;
}

// ── Page component ─────────────────────────────────────────────
export default async function SeoLandingPage({ params }: { params: PageParams }) {
  const { locale, category: categoryId, area: areaId } = await params;

  // Enable static rendering for this locale
  setRequestLocale(locale);

  // Validate both slugs exist in our constants
  const cat   = CATEGORIES.find((c) => c.id === categoryId);
  const found = findAreaById(areaId);
  if (!cat || !found) notFound();

  const { area, municipality, region } = found;
  const isEn       = locale === "en";
  const catName     = isEn && cat.nameEn ? cat.nameEn : cat.nameEl;
  const areaName    = area.name;
  const regionName  = region.name;
  const muniName    = municipality.name.replace("Δήμος ", "");

  // ── DB: fetch professionals for this category + region ──────
  const supabase = await createClient();

  // First try: professionals in this specific area's city
  // Second try (fallback): any active professionals in this category
  let professionals: DbProfessional[] = [];
  let searchScope = "area"; // track which scope we used (for messaging)

  {
    const { data: exact } = await supabase
      .from("professionals")
      .select("id, slug, first_name, last_name, avatar_url, category_id, city, rating, review_count, price_text, booking_mode, booking_enabled")
      .eq("category_id", categoryId)
      .eq("status", "active")
      .eq("profile_complete", true)
      .ilike("city", `%${regionName}%`)
      .order("rating", { ascending: false })
      .order("review_count", { ascending: false })
      .limit(24);

    professionals = (exact ?? []) as DbProfessional[];
  }

  // Fallback: if zero results in region, show all active professionals in this category
  if (professionals.length === 0) {
    searchScope = "national";
    const { data: national } = await supabase
      .from("professionals")
      .select("id, slug, first_name, last_name, avatar_url, category_id, city, rating, review_count, price_text, booking_mode, booking_enabled")
      .eq("category_id", categoryId)
      .eq("status", "active")
      .eq("profile_complete", true)
      .order("rating", { ascending: false })
      .limit(24);
    professionals = (national ?? []) as DbProfessional[];
  }

  // ── Sibling areas (for "Other areas" section) ─────────────
  const siblingAreas = getSiblingAreas(areaId).slice(0, 8);

  // ── Related categories (same tier) ─────────────────────────
  const relatedCats = CATEGORIES
    .filter((c) => c.tier === cat.tier && c.id !== cat.id)
    .slice(0, 6);

  // ── Schema.org JSON-LD ────────────────────────────────────
  // ItemList of LocalBusiness entries, one per professional
  const schemaJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": `${catName} – ${areaName}`,
    "description": isEn
      ? `Trusted ${catName.toLowerCase()} professionals in ${areaName}, ${regionName}`
      : `Αξιόπιστοι επαγγελματίες ${catName.toLowerCase()} στη ${areaName}`,
    "url": `https://trustia.gr/${isEn ? "en/" : ""}${categoryId}/${areaId}`,
    "numberOfItems": professionals.length,
    "itemListElement": professionals.slice(0, 10).map((pro, idx) => ({
      "@type": "ListItem",
      "position": idx + 1,
      "item": {
        "@type": "LocalBusiness",
        "name": `${pro.first_name} ${pro.last_name}`,
        "url": pro.slug ? `https://trustia.gr/professional/${pro.slug}` : "https://trustia.gr",
        "address": {
          "@type": "PostalAddress",
          "addressLocality": pro.city ?? regionName,
          "addressCountry": "GR",
        },
        ...(pro.rating > 0 && {
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": pro.rating.toFixed(1),
            "reviewCount": pro.review_count,
            "bestRating": "5",
            "worstRating": "1",
          },
        }),
      },
    })),
  };

  // ── Breadcrumb JSON-LD ─────────────────────────────────────
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": isEn ? "Home" : "Αρχική",       "item": `https://trustia.gr${isEn ? "/en" : ""}` },
      { "@type": "ListItem", "position": 2, "name": isEn ? "Services" : "Υπηρεσίες", "item": `https://trustia.gr${isEn ? "/en" : ""}/services` },
      { "@type": "ListItem", "position": 3, "name": catName,                          "item": `https://trustia.gr${isEn ? "/en" : ""}/services?category=${categoryId}` },
      { "@type": "ListItem", "position": 4, "name": areaName,                         "item": `https://trustia.gr${isEn ? "/en" : ""}/${categoryId}/${areaId}` },
    ],
  };

  return (
    <>
      {/* ── Schema.org structured data ───────────────────── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <div
        style={{
          maxWidth:     "1200px",
          margin:       "0 auto",
          padding:      "1.5rem 1rem 4rem",
        }}
      >
        {/* ── Breadcrumbs ──────────────────────────────────── */}
        <nav
          aria-label="Breadcrumb"
          style={{
            display:      "flex",
            alignItems:   "center",
            gap:          "0.375rem",
            fontSize:     "0.8125rem",
            color:        "var(--color-text-muted)",
            marginBottom: "1.5rem",
            flexWrap:     "wrap",
          }}
        >
          <Link href="/" style={{ color: "var(--color-primary)", textDecoration: "none" }}>
            {isEn ? "Home" : "Αρχική"}
          </Link>
          <span>›</span>
          <Link href="/services" style={{ color: "var(--color-primary)", textDecoration: "none" }}>
            {isEn ? "Services" : "Υπηρεσίες"}
          </Link>
          <span>›</span>
          <Link
            href={`/services?category=${categoryId}`}
            style={{ color: "var(--color-primary)", textDecoration: "none" }}
          >
            {catName}
          </Link>
          <span>›</span>
          <span style={{ color: "var(--color-text)" }}>{areaName}</span>
        </nav>

        {/* ── Hero section ────────────────────────────────── */}
        <div style={{ marginBottom: "2rem" }}>
          {/* Category badge */}
          <div style={{ marginBottom: "0.75rem" }}>
            <span
              style={{
                display:         "inline-flex",
                alignItems:      "center",
                gap:             "0.375rem",
                backgroundColor: "var(--color-primary-bg)",
                color:           "var(--color-primary-dark)",
                border:          "1px solid var(--color-primary)",
                borderRadius:    "999px",
                padding:         "0.2rem 0.875rem",
                fontSize:        "0.8125rem",
                fontWeight:      600,
              }}
            >
              {cat.emoji} {catName}
            </span>
          </div>

          {/* H1 — main ranking signal */}
          <h1
            style={{
              fontSize:     "clamp(1.625rem, 4vw, 2.25rem)",
              fontWeight:   800,
              color:        "var(--color-text)",
              lineHeight:   1.25,
              marginBottom: "0.625rem",
            }}
          >
            {catName}
            {" "}
            <span style={{ color: "var(--color-primary)" }}>
              {isEn ? "in" : "–"} {areaName}
            </span>
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontSize:     "1rem",
              color:        "var(--color-text-muted)",
              lineHeight:   1.6,
              maxWidth:     "640px",
              marginBottom: "0.5rem",
            }}
          >
            {isEn
              ? `Find trusted ${catName.toLowerCase()} professionals near ${areaName}, ${regionName}. Verified reviews, transparent prices. Book directly — zero commission.`
              : `Βρες αξιόπιστους επαγγελματίες για ${catName.toLowerCase()} στη ${areaName}, ${regionName}. Επαληθευμένες κριτικές, διαφανείς τιμές. Κλείσε ραντεβού απευθείας — μηδέν προμήθεια.`
            }
          </p>

          {/* Result count */}
          <p
            style={{
              fontSize:  "0.875rem",
              color:     "var(--color-text-muted)",
              fontStyle: "italic",
            }}
          >
            {professionals.length > 0
              ? isEn
                ? `${professionals.length} professional${professionals.length !== 1 ? "s" : ""} found${searchScope === "national" ? " (national)" : ""}`
                : `${professionals.length} επαγγελματίες βρέθηκαν${searchScope === "national" ? " (πανελλαδικά)" : ""}`
              : isEn
                ? "No professionals registered yet in this area."
                : "Δεν υπάρχουν εγγεγραμμένοι επαγγελματίες ακόμα."
            }
          </p>
        </div>

        {/* ── Professionals grid ───────────────────────────── */}
        {professionals.length > 0 ? (
          <div
            style={{
              display:             "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap:                 "1rem",
              marginBottom:        "3rem",
            }}
          >
            {professionals.map((pro) => (
              <ProfessionalCard key={pro.id} pro={pro} />
            ))}
          </div>
        ) : (
          // Zero-results state with pro recruitment CTA
          <div
            style={{
              textAlign:    "center",
              padding:      "3rem 1rem",
              marginBottom: "3rem",
            }}
          >
            <p style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>🔍</p>
            <h2
              style={{
                fontSize:     "1.25rem",
                fontWeight:   700,
                color:        "var(--color-text)",
                marginBottom: "0.5rem",
              }}
            >
              {isEn
                ? `No ${catName} professionals in ${areaName} yet`
                : `Δεν υπάρχουν επαγγελματίες ${catName.toLowerCase()} στη ${areaName} ακόμα`
              }
            </h2>
            <p
              style={{
                fontSize:   "0.9375rem",
                color:      "var(--color-text-muted)",
                maxWidth:   "460px",
                margin:     "0 auto 2rem",
                lineHeight: 1.6,
              }}
            >
              {isEn
                ? "Be the first professional to offer this service in this area."
                : "Γίνε ο πρώτος επαγγελματίας που προσφέρει αυτή την υπηρεσία στην περιοχή."
              }
            </p>
            <Link href="/register/professional">
              <Button variant="primary">
                {isEn ? "Register as Professional" : "Εγγραφή ως Επαγγελματίας"}
              </Button>
            </Link>
          </div>
        )}

        {/* ── Two-column info + CTA section ───────────────── */}
        <div
          style={{
            display:             "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap:                 "1.5rem",
            marginBottom:        "3rem",
          }}
        >
          {/* Why Trustia */}
          <div
            style={{
              backgroundColor: "var(--color-bg-light)",
              border:          "1px solid var(--color-border)",
              borderRadius:    "14px",
              padding:         "1.5rem",
            }}
          >
            <h2
              style={{
                fontSize:     "1.0625rem",
                fontWeight:   700,
                color:        "var(--color-text)",
                marginBottom: "0.875rem",
              }}
            >
              {isEn ? `Why book ${catName.toLowerCase()} on Trustia?` : `Γιατί να βρεις ${catName.toLowerCase()} στο Trustia;`}
            </h2>
            <ul
              style={{
                margin:     0,
                padding:    0,
                listStyle:  "none",
                display:    "flex",
                flexDirection: "column",
                gap:        "0.625rem",
              }}
            >
              {[
                isEn ? "✓ Verified professional profiles" : "✓ Επαληθευμένα προφίλ επαγγελματιών",
                isEn ? "✓ Transparent pricing — no hidden fees" : "✓ Διαφανείς τιμές — χωρίς κρυφές χρεώσεις",
                isEn ? "✓ Real customer reviews" : "✓ Πραγματικές κριτικές πελατών",
                isEn ? "✓ Direct contact — no middleman" : "✓ Απευθείας επικοινωνία — χωρίς ενδιάμεσους",
                isEn ? "✓ Online booking or phone call" : "✓ Online κράτηση ή τηλεφωνική επικοινωνία",
              ].map((point, i) => (
                <li
                  key={i}
                  style={{
                    fontSize: "0.875rem",
                    color:    "var(--color-text)",
                    lineHeight: 1.5,
                  }}
                >
                  {point}
                </li>
              ))}
            </ul>
          </div>

          {/* Pro recruitment CTA */}
          <div
            style={{
              background:   "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)",
              borderRadius: "14px",
              padding:      "1.5rem",
              color:        "#fff",
            }}
          >
            <h2
              style={{
                fontSize:     "1.0625rem",
                fontWeight:   700,
                marginBottom: "0.625rem",
              }}
            >
              {isEn
                ? `Are you a ${catName.toLowerCase()} professional?`
                : `Είσαι επαγγελματίας ${catName.toLowerCase()};`
              }
            </h2>
            <p
              style={{
                fontSize:     "0.875rem",
                opacity:      0.9,
                lineHeight:   1.6,
                marginBottom: "1.25rem",
              }}
            >
              {isEn
                ? `Join Trustia.gr and get new clients in ${areaName}. Flat monthly fee — zero commission.`
                : `Εγγράψου στο Trustia.gr και απόκτησε νέους πελάτες στη ${areaName}. Σταθερή μηνιαία συνδρομή — μηδέν προμήθεια.`
              }
            </p>
            <Link href="/register/professional" style={{ textDecoration: "none" }}>
              <span
                style={{
                  display:         "inline-flex",
                  alignItems:      "center",
                  gap:             "0.375rem",
                  backgroundColor: "#fff",
                  color:           "var(--color-primary-dark)",
                  borderRadius:    "8px",
                  padding:         "0.625rem 1.25rem",
                  fontWeight:      700,
                  fontSize:        "0.9rem",
                  cursor:          "pointer",
                }}
              >
                {isEn ? "Get Started Free" : "Ξεκίνα Δωρεάν"}
                <ArrowRight size={16} />
              </span>
            </Link>
          </div>
        </div>

        {/* ── Related categories ───────────────────────────── */}
        {relatedCats.length > 0 && (
          <div style={{ marginBottom: "3rem" }}>
            <h2
              style={{
                fontSize:     "1.125rem",
                fontWeight:   700,
                color:        "var(--color-text)",
                marginBottom: "1rem",
              }}
            >
              {isEn ? "Related services" : "Σχετικές υπηρεσίες"}
            </h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {relatedCats.map((rc) => {
                const rcName = isEn && rc.nameEn ? rc.nameEn : rc.nameEl;
                return (
                  <Link
                    key={rc.id}
                    href={`/${rc.id}/${areaId}`}
                    style={{
                      display:         "inline-flex",
                      alignItems:      "center",
                      gap:             "0.3rem",
                      backgroundColor: "var(--color-bg-light)",
                      border:          "1px solid var(--color-border)",
                      borderRadius:    "8px",
                      padding:         "0.4rem 0.875rem",
                      fontSize:        "0.8125rem",
                      color:           "var(--color-text)",
                      textDecoration:  "none",
                      fontWeight:      500,
                      transition:      "border-color 0.15s",
                    }}
                  >
                    {rc.emoji} {rcName}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Other areas (same category, sibling areas) ──── */}
        {siblingAreas.length > 0 && (
          <div style={{ marginBottom: "3rem" }}>
            <h2
              style={{
                fontSize:     "1.125rem",
                fontWeight:   700,
                color:        "var(--color-text)",
                marginBottom: "0.5rem",
              }}
            >
              {isEn
                ? `${catName} in other areas of ${regionName}`
                : `${catName} σε άλλες περιοχές ${regionName === "Θεσσαλονίκη" ? "Θεσσαλονίκης" : regionName}`
              }
            </h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {siblingAreas.map((sa) => (
                <Link
                  key={sa.id}
                  href={`/${categoryId}/${sa.id}`}
                  style={{
                    display:         "inline-flex",
                    alignItems:      "center",
                    gap:             "0.25rem",
                    backgroundColor: "var(--color-bg-light)",
                    border:          "1px solid var(--color-border)",
                    borderRadius:    "8px",
                    padding:         "0.4rem 0.875rem",
                    fontSize:        "0.8125rem",
                    color:           "var(--color-text)",
                    textDecoration:  "none",
                    fontWeight:      500,
                  }}
                >
                  <MapPin size={12} />
                  {sa.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── Bottom internal linking — all areas ──────────── */}
        <div
          style={{
            borderTop:    "1px solid var(--color-border)",
            paddingTop:   "2rem",
          }}
        >
          <p
            style={{
              fontSize:     "0.8125rem",
              color:        "var(--color-text-muted)",
              lineHeight:   1.6,
            }}
          >
            {isEn
              ? `Trustia.gr connects customers with trusted ${catName.toLowerCase()} professionals across Greece. Find verified professionals with real reviews in ${areaName} and nearby areas.`
              : `Το Trustia.gr συνδέει πελάτες με αξιόπιστους επαγγελματίες ${catName.toLowerCase()} σε όλη την Ελλάδα. Βρες επαληθευμένους επαγγελματίες με πραγματικές κριτικές στη ${areaName} και τις γύρω περιοχές.`
            }
          </p>
        </div>
      </div>
    </>
  );
}
