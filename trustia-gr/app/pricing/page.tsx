// =============================================================
// app/pricing/page.tsx — Pricing page for professionals
// =============================================================
// URL: trustia.gr/pricing
//
// This is where professionals come to see how much it costs
// to join Trustia.gr. The flow is carefully designed:
//
// STEP 1: "Τι δουλειά κάνεις;" — Grid of ALL 48 categories
//         NO prices visible. Just icons and names.
//         The professional clicks their category.
//
// STEP 2: Shows ONLY that category's tier pricing.
//         An electrician (trades tier) sees €15/€20/€25.
//         A cleaner (light tier) sees €10/€15/€20.
//         They NEVER see each other's prices.
//
// STEP 3: "Εγγραφή" button → takes them to registration.
//
// This two-step approach was a key business decision:
// - It prevents price comparison between tiers
// - Each professional feels their price is THE price
// - No one feels they're paying "more" than someone else
// =============================================================

"use client";

import { useState } from "react";
import Link from "next/link";
import { CATEGORIES, TIERS } from "@/lib/constants";

export default function PricingPage() {
  // ─── STATE ───
  // selectedCategoryId: which category the professional clicked
  // null = still on Step 1 (category selection)
  // string = on Step 2 (showing that tier's pricing)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  // accountType: solo professional or business (2+ employees)
  // This changes which pricing column they see
  const [accountType, setAccountType] = useState<"solo" | "business">("solo");

  // Find the full category object for the selected category
  const selectedCategory = selectedCategoryId
    ? CATEGORIES.find((c) => c.id === selectedCategoryId)
    : null;

  // Get the tier pricing for the selected category
  const selectedTier = selectedCategory
    ? TIERS[selectedCategory.tier]
    : null;

  // Helper: translate between Greek and English
  // TODO: Get language from context instead of hardcoding
  const lang = "el";
  const t = (el: string, en: string) => (lang === "el" ? el : en);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 py-12">

        {/* ─── PAGE HEADING ─── */}
        <h1
          className="text-3xl font-bold text-center mb-2"
          style={{ color: "var(--color-primary)" }}
        >
          {t("Γίνε Μέλος στο Trustia.gr", "Join Trustia.gr")}
        </h1>

        {/* ─── SUBHEADING ─── */}
        <p className="text-center text-gray-500 mb-2">
          {t(
            "Τιμές Εκκίνησης 2026 • Κλειδωμένη τιμή για όσο παραμένεις μέλος",
            "Launch Prices 2026 • Locked price while you're a member"
          )}
        </p>

        {/* ─── FOUNDING MEMBER BADGE ─── */}
        <p className="text-center text-sm font-semibold mb-8"
          style={{ color: "var(--color-accent)" }}
        >
          {t(
            "🔥 Τιμή Ιδρυτικού Μέλους — Μόνο για τα πρώτα 50 μέλη — Κλειδωμένη τιμή για πάντα",
            "🔥 Founding Member Price — First 50 members — Locked forever"
          )}
        </p>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* STEP 1: Category Selection (no prices visible)        */}
        {/* Shows when no category is selected yet                */}
        {/* ═══════════════════════════════════════════════════════ */}
        {!selectedCategory && (
          <div>
            {/* Instruction text */}
            <p className="text-center text-gray-600 mb-6 text-lg">
              {t("Επίλεξε την κατηγορία σου:", "Choose your category:")}
            </p>

            {/* ─── CATEGORY GRID ─── */}
            {/* All 48 categories in a responsive grid */}
            {/* NO prices shown — just emoji + name */}
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className="
                    flex flex-col items-center justify-center
                    p-3 md:p-4
                    bg-white border border-gray-100
                    rounded-2xl shadow-sm
                    hover:shadow-md hover:border-blue-200
                    transition-all
                    group
                  "
                >
                  {/* Icon with grayscale hover effect */}
                  <div className="
                    w-10 h-10 md:w-12 md:h-12
                    mb-2 flex items-center justify-center
                    bg-gray-50 rounded-xl
                    group-hover:bg-blue-50
                    transition-colors
                  ">
                    <span className="
                      text-xl md:text-2xl
                      grayscale group-hover:grayscale-0
                      transition-all duration-300
                    ">
                      {cat.emoji}
                    </span>
                  </div>

                  {/* Category name — no price! */}
                  <span className="text-xs font-medium text-slate-700 text-center leading-tight">
                    {lang === "el" ? cat.nameEl : cat.nameEn}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        {/* STEP 2: Tier Pricing (only for selected category)     */}
        {/* Shows ONLY after the professional clicks a category   */}
        {/* They see ONLY their tier — never other tiers          */}
        {/* ═══════════════════════════════════════════════════════ */}
        {selectedCategory && selectedTier && (
          <div>
            {/* Back button to go back to category selection */}
            <button
              onClick={() => {
                setSelectedCategoryId(null);
                setAccountType("solo");
              }}
              className="text-sm text-[var(--color-primary)] mb-6 hover:underline"
            >
              ← {t("Αλλαγή κατηγορίας", "Change category")}
            </button>

            {/* Selected category confirmation */}
            <div className="text-center mb-6">
              <span className="text-4xl">{selectedCategory.emoji}</span>
              <h2
                className="text-xl font-bold mt-2"
                style={{ color: "var(--color-primary)" }}
              >
                {lang === "el" ? selectedCategory.nameEl : selectedCategory.nameEn}
              </h2>
            </div>

            {/* ── Account Type Toggle ── */}
            {/* Solo professional vs Business (2+ employees) */}
            <div className="flex justify-center gap-2 mb-8">
              <button
                onClick={() => setAccountType("solo")}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium transition-all
                  ${accountType === "solo"
                    ? "bg-[var(--color-primary)] text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }
                `}
              >
                {t("Ατομικός", "Solo Professional")}
              </button>
              <button
                onClick={() => setAccountType("business")}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium transition-all
                  ${accountType === "business"
                    ? "bg-[var(--color-primary)] text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }
                `}
              >
                {t("Επιχείρηση (2+ άτομα)", "Business (2+ employees)")}
              </button>
            </div>

            {/* ── Pricing Cards ── */}
            {/* Three options: Annual, Semi-annual, Monthly */}
            <div className="max-w-lg mx-auto space-y-4">
              {/* Annual plan — best value, highlighted */}
              <div className="
                flex items-center justify-between
                p-5 rounded-xl
                border-2 border-[var(--color-accent)]
                bg-[var(--color-bg-amber)]
              ">
                <div>
                  <div className="font-bold text-lg">
                    {t("Ετήσιο", "Annual")}
                    <span className="text-xs font-semibold ml-2 px-2 py-0.5 rounded-full bg-[var(--color-accent)] text-gray-900">
                      {t("Δημοφιλές", "Popular")}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {t(
                      `€${(accountType === "solo" ? selectedTier.annualMonthly : selectedTier.businessAnnual) * 12}/έτος`,
                      `€${(accountType === "solo" ? selectedTier.annualMonthly : selectedTier.businessAnnual) * 12}/year`
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-black" style={{ color: "var(--color-primary)" }}>
                    €{accountType === "solo" ? selectedTier.annualMonthly : selectedTier.businessAnnual}
                    <span className="text-sm font-normal text-gray-500">/μο</span>
                  </div>
                </div>
              </div>

              {/* Semi-annual plan */}
              <div className="
                flex items-center justify-between
                p-5 rounded-xl
                border-2 border-gray-200
              ">
                <div>
                  <div className="font-bold text-lg">
                    {t("Εξαμηνιαίο", "Semi-Annual")}
                  </div>
                  <div className="text-sm text-gray-500">
                    {t(
                      `€${(accountType === "solo" ? selectedTier.semiMonthly : selectedTier.businessSemi) * 6}/εξάμηνο`,
                      `€${(accountType === "solo" ? selectedTier.semiMonthly : selectedTier.businessSemi) * 6}/6 months`
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-black" style={{ color: "var(--color-primary)" }}>
                    €{accountType === "solo" ? selectedTier.semiMonthly : selectedTier.businessSemi}
                    <span className="text-sm font-normal text-gray-500">/μο</span>
                  </div>
                </div>
              </div>

              {/* Monthly plan */}
              <div className="
                flex items-center justify-between
                p-5 rounded-xl
                border-2 border-gray-200
              ">
                <div>
                  <div className="font-bold text-lg">
                    {t("Μηνιαίο", "Monthly")}
                  </div>
                  <div className="text-sm text-gray-500">
                    {t("Χωρίς δέσμευση", "No commitment")}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-black" style={{ color: "var(--color-primary)" }}>
                    €{accountType === "solo" ? selectedTier.monthly : selectedTier.businessMonthly}
                    <span className="text-sm font-normal text-gray-500">/μο</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Multi-category info ── */}
            <div className="max-w-lg mx-auto mt-4 p-3 bg-gray-50 rounded-xl text-xs text-gray-500">
              <p className="font-semibold mb-1">{t("Πολλαπλές κατηγορίες:", "Multiple categories:")}</p>
              <p>{t("2η κατηγορία: -30% • 3η κατηγορία: Δωρεάν • Μέγιστο: 3", "2nd category: -30% • 3rd category: Free • Max: 3")}</p>
            </div>

            {/* ── Register Button ── */}
            <div className="max-w-lg mx-auto mt-6">
              <Link
                href="/register"
                className="
                  block w-full py-3 text-center
                  bg-[var(--color-accent)] hover:bg-[var(--color-accent-light)]
                  text-gray-900 font-bold rounded-xl text-lg
                  transition-all
                "
              >
                {t("Εγγραφή", "Register")} →
              </Link>
            </div>

            {/* ── What's Included ── */}
            <div className="max-w-lg mx-auto mt-6 text-center text-xs text-gray-400 space-y-1">
              <p>✓ {t("Προφίλ με φωτογραφίες", "Profile with photos")}</p>
              <p>✓ {t("Επαληθευμένες κριτικές", "Verified reviews")}</p>
              <p>✓ {t("Σύστημα κρατήσεων (προαιρετικό)", "Booking system (optional)")}</p>
              <p>✓ {t("Εμφάνιση σε αναζητήσεις", "Appear in search results")}</p>
              <p>✓ {t("Στατιστικά & αναφορές", "Statistics & reports")}</p>
              <p>✓ {t("Χωρίς προμήθειες — κρατάς το 100%", "No commissions — keep 100%")}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}