// =============================================================
// components/home/HeroSection.tsx
// =============================================================
// Full-width hero section for the Trustia.gr homepage.
//
// "use client" because:
//   - Controlled form inputs (category, location state)
//   - useRouter for programmatic navigation on search submit
//   - useTranslations (next-intl client hook)
//
// Visual design:
//   - Deep-teal → brand-teal diagonal gradient background
//   - Two decorative semi-transparent circles (no external images)
//   - Centered content block: badge → headline → subtitle → search
//   - Search form: white elevated card with grouped category <select>
//     and LocationAutocomplete (Google Places) input
//     → /services?category=X&placeId=Y&location=Z&lat=N&lng=M
//   - Trust strip below the form
// =============================================================

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Search } from "lucide-react";
import { CATEGORIES } from "@/lib/constants";
import Button from "@/components/ui/Button";
import LocationAutocomplete, {
  type LocationResult,
} from "@/components/ui/LocationAutocomplete";

// Pre-split by tier so JSX stays clean
const CAT_LIGHT       = CATEGORIES.filter((c) => c.tier === "light");
const CAT_TRADES      = CATEGORIES.filter((c) => c.tier === "trades");
const CAT_SPECIALISTS = CATEGORIES.filter((c) => c.tier === "specialists");

// Inline chevron SVG used as the <select> arrow (pure CSS, no img)
const CHEVRON_BG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`;

export default function HeroSection() {
  const t      = useTranslations("home");
  const locale = useLocale();
  const router = useRouter();

  const [category, setCategory]               = useState<string>("");
  const [selectedLocation, setSelectedLocation] = useState<LocationResult | null>(null);

  /**
   * Push to /services with all chosen filters.
   * When a Google Places location is selected we send:
   *   placeId      → for precise DB/radius matching (PRD §74)
   *   location     → human-readable display name for the search bar
   *   lat / lng    → for future map view and distance sorting
   */
  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (selectedLocation) {
      params.set("placeId",  selectedLocation.placeId);
      params.set("location", selectedLocation.displayName);
      params.set("lat",      String(selectedLocation.lat));
      params.set("lng",      String(selectedLocation.lng));
    }
    router.push(`/services?${params.toString()}`);
  }

  // Category name: use English translation if available and locale is EN
  function catName(c: { nameEl: string; nameEn?: string }) {
    return locale === "en" && c.nameEn ? c.nameEn : c.nameEl;
  }

  return (
    <section
      style={{
        position: "relative",
        overflow: "hidden",
        background: "linear-gradient(135deg, #0C5252 0%, #1A7070 45%, #2A8F8F 100%)",
        padding: "5rem 1.5rem 6rem",
      }}
    >
      {/* ── Decorative circles (CSS only, aria-hidden) ── */}
      <span aria-hidden="true" style={{ position: "absolute", top: "-100px", right: "-100px", width: "480px", height: "480px", borderRadius: "50%", background: "rgba(255,255,255,0.045)", pointerEvents: "none" }} />
      <span aria-hidden="true" style={{ position: "absolute", bottom: "-140px", left: "-80px", width: "400px", height: "400px", borderRadius: "50%", background: "rgba(255,255,255,0.03)", pointerEvents: "none" }} />

      {/* ── Main content ── */}
      <div style={{ maxWidth: "780px", margin: "0 auto", textAlign: "center", position: "relative", zIndex: 1 }}>

        {/* Founding-member badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            backgroundColor: "rgba(255,255,255,0.12)",
            border: "1px solid rgba(255,255,255,0.22)",
            borderRadius: "99px",
            padding: "0.35rem 1rem",
            marginBottom: "1.5rem",
            fontSize: "0.8125rem",
            fontWeight: 600,
            color: "rgba(255,255,255,0.92)",
            letterSpacing: "0.01em",
          }}
        >
          {locale === "en"
            ? "🎉 3 months FREE for new professionals"
            : "🎉 3 μήνες ΔΩΡΕΑΝ για νέους επαγγελματίες"}
        </div>

        {/* H1 — main value proposition */}
        <h1
          style={{
            color: "#ffffff",
            fontSize: "clamp(2rem, 5.5vw, 3.75rem)",
            fontWeight: 800,
            letterSpacing: "-0.035em",
            lineHeight: 1.1,
            margin: "0 0 1rem",
          }}
        >
          {t("heroTagline")}
        </h1>

        {/* Subtitle */}
        <p
          style={{
            color: "rgba(255,255,255,0.78)",
            fontSize: "clamp(1rem, 2.5vw, 1.175rem)",
            lineHeight: 1.65,
            margin: "0 0 2.5rem",
          }}
        >
          {locale === "en"
            ? "51 service categories\u00a0•\u00a00% commission for professionals"
            : "51 κατηγορίες υπηρεσιών\u00a0•\u00a00% προμήθεια για επαγγελματίες"}
        </p>

        {/* ── Search form ── */}
        <form
          onSubmit={handleSearch}
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.625rem",
            alignItems: "stretch",
            background: "#ffffff",
            borderRadius: "16px",
            padding: "0.625rem",
            boxShadow: "0 8px 48px rgba(0,0,0,0.22)",
          }}
        >
          {/* Category <select> — grouped by tier */}
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-label={locale === "en" ? "Select category" : "Επιλογή κατηγορίας"}
            style={{
              flex: "2 1 200px",
              border: "1.5px solid var(--color-border)",
              borderRadius: "10px",
              padding: "0.75rem 2.25rem 0.75rem 1rem",
              fontSize: "0.9375rem",
              color: category ? "var(--color-text)" : "var(--color-text-muted)",
              backgroundColor: "#fff",
              cursor: "pointer",
              outline: "none",
              appearance: "none",
              WebkitAppearance: "none",
              backgroundImage: CHEVRON_BG,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 0.75rem center",
            }}
          >
            <option value="">
              {locale === "en" ? "All categories" : "Όλες οι κατηγορίες"}
            </option>

            <optgroup label={locale === "en" ? "Cleaning & Light" : "Καθαρισμός & Ελαφριές"}>
              {CAT_LIGHT.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.emoji} {catName(c)}
                </option>
              ))}
            </optgroup>

            <optgroup label={locale === "en" ? "Trades & Beauty" : "Τεχνικά & Ομορφιά"}>
              {CAT_TRADES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.emoji} {catName(c)}
                </option>
              ))}
            </optgroup>

            <optgroup label={locale === "en" ? "Specialists" : "Ειδικοί"}>
              {CAT_SPECIALISTS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.emoji} {catName(c)}
                </option>
              ))}
            </optgroup>
          </select>

          {/* Vertical divider — visible only on md+ */}
          <span
            aria-hidden="true"
            className="hidden md:block"
            style={{
              width: "1px",
              alignSelf: "stretch",
              margin: "0.25rem 0",
              backgroundColor: "var(--color-border)",
            }}
          />

          {/* Location autocomplete — Google Places-powered, Greece-restricted */}
          <LocationAutocomplete
            placeholder={locale === "en" ? "e.g. Thessaloniki" : "π.χ. Θεσσαλονίκη"}
            onSelect={setSelectedLocation}
          />

          {/* Submit button */}
          <Button
            type="submit"
            variant="primary"
            size="md"
            icon={Search}
            style={{ flex: "0 0 auto" }}
          >
            {t("heroSearch")}
          </Button>
        </form>

        {/* ── Trust strip ── */}
        <ul
          aria-label={locale === "en" ? "Benefits" : "Πλεονεκτήματα"}
          style={{
            display: "flex",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: "1.25rem 2rem",
            listStyle: "none",
            padding: 0,
            margin: "1.75rem 0 0",
          }}
        >
          {(locale === "en"
            ? ["✓ Free for customers", "✓ 51 categories", "✓ Trusted reviews"]
            : ["✓ Δωρεάν για πελάτες", "✓ 51 κατηγορίες", "✓ Αξιόπιστες κριτικές"]
          ).map((item) => (
            <li
              key={item}
              style={{
                color: "rgba(255,255,255,0.85)",
                fontSize: "0.875rem",
                fontWeight: 500,
              }}
            >
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
