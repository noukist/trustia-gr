// =============================================================
// components/services/SortSelect.tsx
// =============================================================
// Thin client component that renders the sort <select> for the
// /services results page and updates the `sort` URL param on change.
// =============================================================

"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

export default function SortSelect({ hasLocation }: { hasLocation: boolean }) {
  const t           = useTranslations("services");
  const router      = useRouter();
  const pathname    = usePathname();
  const searchParams = useSearchParams();

  // Translated sort options — built after t() is available
  const SORT_OPTIONS = [
    { value: "reviews", label: `${t("sortReviews")} ${t("sortDefault")}` },
    { value: "rating",  label: t("sortRating") },
    { value: "price",   label: t("sortPrice") },
    { value: "nearest", label: t("sortNearest") },
  ] as const;

  const current = searchParams.get("sort") ?? "reviews";

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", e.target.value);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  // Inline chevron SVG — same as globals.css .ui-field-select
  const CHEVRON = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
      <label
        htmlFor="sort-select"
        style={{
          fontSize:   "0.8125rem",
          fontWeight: 500,
          color:      "var(--color-text-muted)",
          whiteSpace: "nowrap",
        }}
      >
        {t("sortLabel")}:
      </label>

      <select
        id="sort-select"
        value={current}
        onChange={handleChange}
        style={{
          padding:             "0.375rem 2rem 0.375rem 0.75rem",
          border:              "1.5px solid var(--color-border)",
          borderRadius:        "8px",
          fontSize:            "0.875rem",
          color:               "var(--color-text)",
          backgroundColor:     "#fff",
          cursor:              "pointer",
          outline:             "none",
          appearance:          "none",
          WebkitAppearance:    "none",
          backgroundImage:     CHEVRON,
          backgroundRepeat:    "no-repeat",
          backgroundPosition:  "right 0.5rem center",
        }}
      >
        {SORT_OPTIONS.map((opt) => (
          <option
            key={opt.value}
            value={opt.value}
            // "Nearest" is disabled if no location coordinates are available
            disabled={opt.value === "nearest" && !hasLocation}
          >
            {opt.label}
            {opt.value === "nearest" && !hasLocation ? ` ${t("sortNeedsLocation")}` : ""}
          </option>
        ))}
      </select>
    </div>
  );
}
