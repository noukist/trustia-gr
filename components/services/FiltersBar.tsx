// =============================================================
// components/services/FiltersBar.tsx
// =============================================================
// Client-side filter sidebar for the /services search page.
//
// BEHAVIOUR
//   Each filter control updates a URL search param via router.push()
//   which triggers Next.js to re-render the server page with fresh
//   Supabase data — no client-side fetch needed.
//
// LAYOUT
//   Desktop (md+): sticky left sidebar, 260 px wide
//   Mobile:        collapsed by default; a "Φίλτρα" toggle button
//                  reveals an overlay panel above the results.
//
// PROPS
//   hasLocation — true when lat/lng are present in URL params;
//                 when false the "Απόσταση" filter is hidden.
// =============================================================

"use client";

import React, { useState } from "react";
import { useRouter, usePathname } from "@/i18n/navigation";
import { useSearchParams }        from "next/navigation";
import { useTranslations } from "next-intl";
import { SlidersHorizontal, X, RotateCcw, Search, MapPin } from "lucide-react";
import LocationAutocomplete, { type LocationResult } from "@/components/ui/LocationAutocomplete";

// ── Types ──────────────────────────────────────────────────────
interface FiltersBarProps {
  /** Whether the user provided a geo-coded location (enables distance filter) */
  hasLocation: boolean;
  /** Current service-name search query from URL (?q=…) */
  serviceQ?:   string;
}

// ── Component ──────────────────────────────────────────────────
export default function FiltersBar({ hasLocation, serviceQ = "" }: FiltersBarProps) {
  const t           = useTranslations("services");
  const router      = useRouter();
  const pathname    = usePathname();
  const searchParams = useSearchParams();

  // ── Filter options (translated) ────────────────────────────
  const RATING_OPTIONS = [
    { value: "",    label: t("filterAll") },
    { value: "3",   label: "3★ +" },
    { value: "4",   label: "4★ +" },
    { value: "4.5", label: "4.5★ +" },
  ] as const;

  const MODE_OPTIONS = [
    { value: "",        label: t("filterAll") },
    { value: "contact", label: `📞 ${t("modeContact")}` },
    { value: "date",    label: `📅 ${t("modeDate")}` },
    { value: "full",    label: `🗓️ ${t("modeFull")}` },
  ] as const;

  const DISTANCE_OPTIONS = [
    { value: "",    label: t("filterAnyDistance") },
    { value: "5",   label: "≤ 5 km" },
    { value: "10",  label: "≤ 10 km" },
    { value: "30",  label: "≤ 30 km" },
    { value: "60",  label: "≤ 60 km" },
    { value: "120", label: "≤ 120 km" },
  ] as const;

  // Mobile panel open/close state
  const [mobileOpen, setMobileOpen] = useState(false);
  // Local search input — initialised from the URL prop so it's in sync
  const [searchDraft, setSearchDraft] = useState(serviceQ);

  // ── Read current values from URL ───────────────────────────
  const currentRating   = searchParams.get("rating")    ?? "";
  const currentMode     = searchParams.get("mode")      ?? "";
  const currentReviews  = searchParams.get("reviews")   ?? "";
  const currentDistance = searchParams.get("distance")  ?? "";
  const currentAvail    = searchParams.get("available") ?? "";
  // Location context (set here or from homepage hero search)
  const currentLocation = searchParams.get("location")  ?? "";

  // Count active filters (for badge on mobile button)
  // Include serviceQ so the badge reflects an active text search too
  // Note: location is NOT counted here since resetFilters() preserves it
  const activeCount = [
    currentRating,
    currentMode,
    currentReviews === "1" ? "1" : "",
    currentDistance,
    currentAvail === "1" ? "1" : "",
    serviceQ,
  ].filter(Boolean).length;

  // ── Update a single URL param ──────────────────────────────
  function setFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    // Reset to page 1 whenever a filter changes
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  // ── Set location from the autocomplete (also enables distance filter) ──
  function setLocation(result: LocationResult) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("location", result.displayName);
    params.set("placeId",  result.placeId);
    params.set("lat",      String(result.lat));
    params.set("lng",      String(result.lng));
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  // ── Clear location (also removes distance + nearest sort) ──
  function clearLocation() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("location");
    params.delete("placeId");
    params.delete("lat");
    params.delete("lng");
    // These filters depend on coordinates — remove them too
    params.delete("distance");
    if (params.get("sort") === "nearest") params.delete("sort");
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  // ── Reset all filters (keep category/location params) ─────
  function resetFilters() {
    const params = new URLSearchParams();
    // Preserve the search context params
    for (const key of ["category", "placeId", "location", "lat", "lng"]) {
      const v = searchParams.get(key);
      if (v) params.set(key, v);
    }
    setSearchDraft("");
    router.push(`${pathname}?${params.toString()}`);
    setMobileOpen(false);
  }

  // ── Submit the service-name search ────────────────────────
  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (searchDraft.trim()) {
      params.set("q", searchDraft.trim());
    } else {
      params.delete("q");
    }
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  // ── Rendered filter controls (shared by sidebar + mobile panel)
  const filterContent = (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

      {/* ── Location ── */}
      {/* Shows the active location with a clear button, or the autocomplete
          input if no location is set. Setting a location unlocks the distance
          filter and "sort by nearest" option. */}
      <div>
        <p
          style={{
            fontSize:      "0.75rem",
            fontWeight:    700,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color:         "var(--color-text-muted)",
            margin:        "0 0 0.625rem",
          }}
        >
          {t("filterLocation")}
        </p>

        {currentLocation ? (
          /* Active location chip with clear button */
          <div
            style={{
              display:         "flex",
              alignItems:      "center",
              gap:             "0.375rem",
              padding:         "0.4rem 0.625rem",
              backgroundColor: "var(--color-primary-bg)",
              border:          "1.5px solid var(--color-primary)",
              borderRadius:    "8px",
              fontSize:        "0.8125rem",
              color:           "var(--color-primary-dark, #1A6F6F)",
              fontWeight:      500,
            }}
          >
            <MapPin size={12} style={{ flexShrink: 0, color: "var(--color-primary)" }} />
            <span
              style={{
                flex:         1,
                overflow:     "hidden",
                textOverflow: "ellipsis",
                whiteSpace:   "nowrap",
                minWidth:     0,
              }}
            >
              {currentLocation}
            </span>
            <button
              type="button"
              aria-label={t("filterLocationClear")}
              onClick={clearLocation}
              style={{
                background:  "none",
                border:      "none",
                cursor:      "pointer",
                padding:     0,
                flexShrink:  0,
                display:     "flex",
                color:       "var(--color-text-muted)",
              }}
            >
              <X size={13} />
            </button>
          </div>
        ) : (
          /* Location autocomplete input */
          <LocationAutocomplete
            onSelect={setLocation}
            placeholder={t("filterLocationPlaceholder")}
          />
        )}
      </div>

      {/* ── Service name search ── */}
      <form onSubmit={submitSearch} style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
        <p
          style={{
            fontSize:      "0.75rem",
            fontWeight:    700,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color:         "var(--color-text-muted)",
            margin:        0,
          }}
        >
          {t("searchLabel")}
        </p>
        <div style={{ position: "relative" }}>
          <Search
            size={14}
            style={{
              position:     "absolute",
              left:         "0.625rem",
              top:          "50%",
              transform:    "translateY(-50%)",
              color:        "var(--color-text-muted)",
              pointerEvents:"none",
            }}
          />
          <input
            type="search"
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchLabel")}
            style={{
              width:        "100%",
              padding:      "0.5rem 2rem 0.5rem 1.75rem",
              border:       "1.5px solid var(--color-border)",
              borderRadius: "8px",
              fontSize:     "0.8375rem",
              fontFamily:   "inherit",
              outline:      "none",
              boxSizing:    "border-box",
              color:        "var(--color-text)",
            }}
          />
          {searchDraft && (
            <button
              type="button"
              onClick={() => { setSearchDraft(""); setFilter("q", ""); }}
              style={{
                position:  "absolute",
                right:     "0.5rem",
                top:       "50%",
                transform: "translateY(-50%)",
                background:"none",
                border:    "none",
                cursor:    "pointer",
                padding:   0,
                color:     "var(--color-text-muted)",
                display:   "flex",
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </form>

      {/* ── Rating ── */}
      <FilterGroup label={t("filterRating")}>
        {RATING_OPTIONS.map((opt) => (
          <RadioChip
            key={opt.value}
            label={opt.label}
            selected={currentRating === opt.value}
            onClick={() => setFilter("rating", opt.value)}
          />
        ))}
      </FilterGroup>

      {/* ── Booking mode ── */}
      <FilterGroup label={t("filterMode")}>
        {MODE_OPTIONS.map((opt) => (
          <RadioChip
            key={opt.value}
            label={opt.label}
            selected={currentMode === opt.value}
            onClick={() => setFilter("mode", opt.value)}
          />
        ))}
      </FilterGroup>

      {/* ── Reviews ── */}
      <FilterGroup label={t("filterReviewsGroup")}>
        <RadioChip
          label={t("filterAll")}
          selected={currentReviews !== "1"}
          onClick={() => setFilter("reviews", "")}
        />
        <RadioChip
          label={t("filterWithReviews")}
          selected={currentReviews === "1"}
          onClick={() => setFilter("reviews", "1")}
        />
      </FilterGroup>

      {/* ── Distance (only when lat/lng are known) ── */}
      {hasLocation && (
        <FilterGroup label={t("filterDistance")}>
          {DISTANCE_OPTIONS.map((opt) => (
            <RadioChip
              key={opt.value}
              label={opt.label}
              selected={currentDistance === opt.value}
              onClick={() => setFilter("distance", opt.value)}
            />
          ))}
        </FilterGroup>
      )}

      {/* ── Available today ── */}
      <FilterGroup label={t("filterAvailability")}>
        <label
          style={{
            display:    "flex",
            alignItems: "center",
            gap:        "0.625rem",
            cursor:     "pointer",
            fontSize:   "0.875rem",
            color:      "var(--color-text)",
          }}
        >
          {/* Toggle switch */}
          <span
            role="switch"
            aria-checked={currentAvail === "1"}
            onClick={() =>
              setFilter("available", currentAvail === "1" ? "" : "1")
            }
            style={{
              display:         "inline-block",
              width:           "40px",
              height:          "22px",
              borderRadius:    "999px",
              backgroundColor: currentAvail === "1"
                ? "var(--color-primary)"
                : "var(--color-border)",
              position:        "relative",
              cursor:          "pointer",
              transition:      "background-color 0.2s",
              flexShrink:      0,
            }}
          >
            <span
              style={{
                position:        "absolute",
                top:             "3px",
                left:            currentAvail === "1" ? "21px" : "3px",
                width:           "16px",
                height:          "16px",
                borderRadius:    "50%",
                backgroundColor: "#fff",
                transition:      "left 0.2s",
                boxShadow:       "0 1px 3px rgba(0,0,0,0.2)",
              }}
            />
          </span>
          {t("filterAvailable")}
        </label>
      </FilterGroup>

      {/* ── Reset ── */}
      {activeCount > 0 && (
        <button
          type="button"
          onClick={resetFilters}
          style={{
            display:        "flex",
            alignItems:     "center",
            gap:            "0.375rem",
            background:     "none",
            border:         "none",
            cursor:         "pointer",
            color:          "var(--color-text-muted)",
            fontSize:       "0.8125rem",
            padding:        0,
            textDecoration: "underline",
          }}
        >
          <RotateCcw size={13} />
          {t("filterReset")}
        </button>
      )}
    </div>
  );

  return (
    <>
      {/* ── Mobile: toggle button ─────────────────────────── */}
      <div className="md:hidden" style={{ marginBottom: "1rem" }}>
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          style={{
            display:         "inline-flex",
            alignItems:      "center",
            gap:             "0.5rem",
            padding:         "0.5rem 1rem",
            border:          "1.5px solid var(--color-border)",
            borderRadius:    "8px",
            backgroundColor: "#fff",
            cursor:          "pointer",
            fontSize:        "0.875rem",
            fontWeight:      600,
            color:           "var(--color-text)",
          }}
        >
          <SlidersHorizontal size={16} />
          {t("filtersTitle")}
          {activeCount > 0 && (
            <span
              style={{
                backgroundColor: "var(--color-primary)",
                color:           "#fff",
                borderRadius:    "999px",
                padding:         "0 6px",
                fontSize:        "0.7rem",
                fontWeight:      700,
              }}
            >
              {activeCount}
            </span>
          )}
        </button>
      </div>

      {/* ── Mobile: filter panel (slide-down) ────────────── */}
      {mobileOpen && (
        <div
          className="md:hidden"
          style={{
            backgroundColor: "#fff",
            border:          "1.5px solid var(--color-border)",
            borderRadius:    "12px",
            padding:         "1.25rem",
            marginBottom:    "1.25rem",
            position:        "relative",
          }}
        >
          {/* Close button */}
          <button
            type="button"
            aria-label={t("filterClose")}
            onClick={() => setMobileOpen(false)}
            style={{
              position:        "absolute",
              top:             "0.75rem",
              right:           "0.75rem",
              background:      "none",
              border:          "none",
              cursor:          "pointer",
              color:           "var(--color-text-muted)",
              display:         "flex",
            }}
          >
            <X size={18} />
          </button>

          <p
            style={{
              fontWeight:   700,
              marginBottom: "1rem",
              fontSize:     "0.9375rem",
              color:        "var(--color-text)",
            }}
          >
            {t("filtersTitle")}
          </p>
          {filterContent}
        </div>
      )}

      {/* ── Desktop: sticky sidebar ───────────────────────── */}
      <aside
        className="hidden md:block"
        style={{
          width:       "240px",
          flexShrink:  0,
          position:    "sticky",
          top:         "80px",   // below the navbar (64px) + breathing room
          alignSelf:   "flex-start",
        }}
      >
        {/* Sidebar header */}
        <div
          style={{
            display:        "flex",
            justifyContent: "space-between",
            alignItems:     "center",
            marginBottom:   "1.25rem",
          }}
        >
          <p
            style={{
              fontWeight: 700,
              fontSize:   "0.9375rem",
              color:      "var(--color-text)",
              margin:     0,
            }}
          >
            {t("filtersTitle")}
            {activeCount > 0 && (
              <span
                style={{
                  marginLeft:      "0.5rem",
                  backgroundColor: "var(--color-primary)",
                  color:           "#fff",
                  borderRadius:    "999px",
                  padding:         "0 6px",
                  fontSize:        "0.7rem",
                  fontWeight:      700,
                }}
              >
                {activeCount}
              </span>
            )}
          </p>
          {activeCount > 0 && (
            <button
              type="button"
              onClick={resetFilters}
              style={{
                background:     "none",
                border:         "none",
                cursor:         "pointer",
                color:          "var(--color-text-muted)",
                fontSize:       "0.775rem",
                textDecoration: "underline",
                padding:        0,
              }}
            >
              {t("filterResetShort")}
            </button>
          )}
        </div>
        {filterContent}
      </aside>
    </>
  );
}

// ── Sub-components ────────────────────────────────────────────

/** Label + content group */
function FilterGroup({
  label,
  children,
}: {
  label:    string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p
        style={{
          fontSize:      "0.75rem",
          fontWeight:    700,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          color:         "var(--color-text-muted)",
          margin:        "0 0 0.625rem",
        }}
      >
        {label}
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
        {children}
      </div>
    </div>
  );
}

/** Pill-style radio button */
function RadioChip({
  label,
  selected,
  onClick,
}: {
  label:    string;
  selected: boolean;
  onClick:  () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding:         "0.3rem 0.75rem",
        borderRadius:    "999px",
        border:          `1.5px solid ${selected ? "var(--color-primary)" : "var(--color-border)"}`,
        backgroundColor: selected ? "var(--color-primary)" : "#fff",
        color:           selected ? "#fff" : "var(--color-text)",
        fontSize:        "0.8125rem",
        fontWeight:      selected ? 600 : 400,
        cursor:          "pointer",
        transition:      "background-color 0.15s, border-color 0.15s, color 0.15s",
        whiteSpace:      "nowrap",
      }}
    >
      {label}
    </button>
  );
}
