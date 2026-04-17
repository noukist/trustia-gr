// =============================================================
// BrandStatement.tsx — Who we are and what we stand for
// =============================================================
// This section sits just below the hero search bar.
// It tells the visitor in 3 seconds:
// - What Trustia.gr believes in
// - Why it exists
// - What makes it different
//
// This is NOT a sales pitch. It's a values statement.
// It builds trust before the visitor even searches.
// The mission and vision come directly from our business plan
// (Option C that we selected together).
// =============================================================

"use client";

import { BRAND } from "@/lib/constants";

// -------------------------------------------------------------
// Props — language for translations
// -------------------------------------------------------------
interface BrandStatementProps {
  lang: "el" | "en";
}

export default function BrandStatement({ lang }: BrandStatementProps) {
  const t = (el: string, en: string) => (lang === "el" ? el : en);

  return (
    <section className="max-w-4xl mx-auto px-6 py-10">
      {/* ─── CONTAINER ─── */}
      {/* Centered card with left navy border for emphasis */}
      <div
        className="
          border-l-4 pl-6 py-2
        "
        style={{ borderColor: "var(--color-primary)" }}
      >
        {/* ─── MISSION ─── */}
        {/* The core belief — big, bold, memorable */}
        <p
          className="text-xl md:text-2xl font-bold mb-3"
          style={{ color: "var(--color-primary)" }}
        >
          {t(BRAND.missionEl, BRAND.missionEn)}
        </p>

        {/* ─── EXPLANATION ─── */}
        {/* One paragraph explaining WHY this matters */}
        <p className="text-gray-600 text-sm md:text-base leading-relaxed mb-4">
          {t(
            "Οι επαγγελματίες δουλεύουν σκληρά. Δεν πρέπει να πληρώνουν 15-20% για κάθε εργασία απλά για να βρουν πελάτες. Στο Trustia.gr, ο επαγγελματίας πληρώνει ένα δίκαιο, σταθερό ποσό και κρατάει ό,τι κερδίζει. Ο πελάτης βρίσκει αξιόπιστους επαγγελματίες με επαληθευμένες κριτικές — χωρίς κρυφές χρεώσεις, χωρίς εκπλήξεις.",
            "Professionals work hard. They shouldn't pay 15-20% of every job just to find clients. On Trustia.gr, the professional pays a fair, fixed amount and keeps everything they earn. Customers find reliable professionals with verified reviews — no hidden fees, no surprises."
          )}
        </p>

        {/* ─── THREE PILLARS ─── */}
        {/* Quick scannable points reinforcing the message */}
        <div className="flex flex-wrap gap-4 text-xs md:text-sm">
          {/* Pillar 1: No commissions */}
          <span className="flex items-center gap-1.5 text-gray-500">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: "var(--color-success)" }}
            ></span>
            {t("Χωρίς προμήθειες", "No commissions")}
          </span>

          {/* Pillar 2: Verified reviews */}
          <span className="flex items-center gap-1.5 text-gray-500">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: "var(--color-success)" }}
            ></span>
            {t("Επαληθευμένες κριτικές", "Verified reviews")}
          </span>

          {/* Pillar 3: No ads */}
          <span className="flex items-center gap-1.5 text-gray-500">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: "var(--color-success)" }}
            ></span>
            {t("Χωρίς διαφημίσεις", "No ads")}
          </span>

          {/* Pillar 4: Fair for everyone */}
          <span className="flex items-center gap-1.5 text-gray-500">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: "var(--color-success)" }}
            ></span>
            {t("Δίκαιο για όλους", "Fair for everyone")}
          </span>
        </div>
      </div>
    </section>
  );
}