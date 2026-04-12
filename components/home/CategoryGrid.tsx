// =============================================================
// CategoryGrid.tsx — Popular categories shown on the homepage
// =============================================================
// This grid shows the 12 most popular service categories
// as clickable tiles. When a visitor clicks one, they'll be
// taken to the search results filtered by that category.
//
// Design follows the "grayscale to color" pattern recommended
// by Gemini — emojis are desaturated by default and pop into
// full color on hover. This creates a clean, professional look
// that feels interactive without being distracting.
//
// We show 12 categories in a responsive grid:
// - Mobile: 3 columns (fits thumbs easily)
// - Tablet: 4 columns
// - Desktop: 6 columns
// =============================================================

"use client";

import { CATEGORIES, POPULAR_CATEGORY_IDS } from "@/lib/constants";

// -------------------------------------------------------------
// Props — language for translations
// -------------------------------------------------------------
interface CategoryGridProps {
  lang: "el" | "en";
}

export default function CategoryGrid({ lang }: CategoryGridProps) {
  // Helper: translate between Greek and English
  const t = (el: string, en: string) => (lang === "el" ? el : en);

  // ─── GET POPULAR CATEGORIES ───
  // Filter the full 48-category list to only the 12 popular ones
  // We defined POPULAR_CATEGORY_IDS in constants.ts
  // The .filter().map() chain:
  // 1. Loop through popular IDs
  // 2. Find the matching category object for each ID
  // 3. Remove any that weren't found (shouldn't happen, but safe)
  const popularCategories = POPULAR_CATEGORY_IDS
    .map((id) => CATEGORIES.find((cat) => cat.id === id))
    .filter((cat) => cat !== undefined);

  return (
    <section className="max-w-5xl mx-auto px-6 py-12">
      {/* ─── SECTION HEADING ─── */}
      <h2
        className="text-2xl font-bold text-center mb-8"
        style={{ color: "var(--color-primary)" }}
      >
        {t("Δημοφιλείς Κατηγορίες", "Popular Categories")}
      </h2>

      {/* ─── CATEGORY GRID ─── */}
      {/* Responsive: 3 cols mobile → 4 cols tablet → 6 cols desktop */}
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {popularCategories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => {
              // TODO: Navigate to /services?category={cat.id}
              console.log("Navigate to category:", cat.id);
            }}
            className="
              flex flex-col items-center justify-center
              p-4 md:p-6
              bg-white border border-gray-100
              rounded-2xl shadow-sm
              hover:shadow-md hover:border-blue-200
              transition-all
              group
            "
          >
            {/* ── Icon Container ── */}
            {/* Gray background by default, light blue on hover */}
            {/* The emoji inside uses the grayscale trick: */}
            {/* - Default: grayscale (desaturated, professional look) */}
            {/* - Hover: full color (pops, feels interactive) */}
            <div
              className="
                w-12 h-12 md:w-16 md:h-16
                mb-3 flex items-center justify-center
                bg-gray-50 rounded-xl
                group-hover:bg-blue-50
                transition-colors
              "
            >
              <span
                className="
                  text-2xl md:text-3xl
                  grayscale group-hover:grayscale-0
                  transition-all duration-300
                "
              >
                {cat.emoji}
              </span>
            </div>

            {/* ── Category Name ── */}
            {/* Small text, bold, dark. Shows Greek or English */}
            <span className="text-xs md:text-sm font-semibold text-slate-800 text-center leading-tight">
              {lang === "el" ? cat.nameEl : cat.nameEn}
            </span>
          </button>
        ))}
      </div>

      {/* ─── "VIEW ALL" LINK ─── */}
      {/* Links to the full services page with all 48 categories */}
      <div className="text-center mt-6">
        <button
          onClick={() => {
            // TODO: Navigate to /services
            console.log("Navigate to all services");
          }}
          className="
            text-sm font-medium
            text-[var(--color-primary)]
            hover:text-[var(--color-primary-light)]
            transition-colors
          "
        >
          {t("Δες όλες τις κατηγορίες →", "View all categories →")}
        </button>
      </div>
    </section>
  );
}