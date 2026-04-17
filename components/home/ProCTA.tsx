// =============================================================
// ProCTA.tsx — Call-to-Action for professionals to join
// =============================================================
// This section sits at the bottom of the homepage (before the
// footer) and targets PROFESSIONALS, not customers.
//
// It's the section that convinces a plumber or cleaner scrolling
// through the site to sign up. The messaging focuses on:
// 1. Low cost (from €10/month)
// 2. No commissions (keep 100%)
// 3. Urgency (Founding Member — first 50 only)
//
// Navy gradient background matches the hero section, creating
// visual bookends on the page.
// =============================================================

"use client";

import Link from "next/link";

// -------------------------------------------------------------
// Props — language for translations
// -------------------------------------------------------------
interface ProCTAProps {
  lang: "el" | "en";
}

export default function ProCTA({ lang }: ProCTAProps) {
  // Helper: translate between Greek and English
  const t = (el: string, en: string) => (lang === "el" ? el : en);

  return (
    <section
      className="py-12"
      style={{
        // Same navy gradient as the hero — creates visual consistency
        background: "linear-gradient(135deg, #1A2B3C, #2A8F8F)",
      }}
    >
      <div className="max-w-3xl mx-auto px-6 text-center">
        {/* ─── HEADING ─── */}
        {/* Directly addresses the professional */}
        <h2 className="text-3xl font-bold text-white mb-4">
          {t("Είσαι Επαγγελματίας;", "Are You a Professional?")}
        </h2>

        {/* ─── VALUE PROPOSITION ─── */}
        {/* Three key selling points in one line */}
        <p className="text-blue-200 mb-6 text-lg">
          {t(
            "Γίνε μέλος από €10/μήνα. Κράτα το 100% των εσόδων σου. Χωρίς προμήθειες.",
            "Join from €10/month. Keep 100% of your earnings. No commissions."
          )}
        </p>

        {/* ─── CTA BUTTON ─── */}
        {/* Gold button stands out against the navy background */}
        {/* Links to the pricing page where they select their category */}
        <Link
          href="/pricing"
          className="
            inline-block px-8 py-3
            bg-[var(--color-accent)] hover:bg-[var(--color-accent-light)]
            text-gray-900 font-bold rounded-xl text-lg
            transition-all
            hover:scale-105
          "
        >
          {t("Γίνε Μέλος", "Join Now")} →
        </Link>

        {/* ─── FOUNDING MEMBER URGENCY ─── */}
        {/* Small text creating scarcity — first 50 members get locked price */}
        <p className="text-blue-300 text-xs mt-4">
          {t(
            "Τιμή Ιδρυτικού Μέλους — Μόνο για τα πρώτα 50 μέλη — Κλειδωμένη τιμή για πάντα",
            "Founding Member Price — Only for the first 50 members — Price locked forever"
          )}
        </p>

        {/* ─── SAVINGS COMPARISON ─── */}
        {/* Quick math that makes the decision obvious */}
        <div className="mt-8 flex flex-col md:flex-row gap-4 justify-center">
          {/* What competitors charge */}
          <div className="bg-white/10 rounded-xl px-6 py-3 backdrop-blur-sm">
            <p className="text-red-300 text-sm font-semibold">
              {t("Προμήθεια 15-20%", "Commission 15-20%")}
            </p>
            <p className="text-white text-lg font-bold">
              €150-200/{t("μήνα", "month")}
            </p>
            <p className="text-blue-300 text-xs">
              {t("σε έσοδα €1.000/μήνα", "on €1,000/month earnings")}
            </p>
          </div>

          {/* What Trustia.gr charges */}
          <div className="bg-white/20 rounded-xl px-6 py-3 backdrop-blur-sm border border-white/30">
            <p className="text-green-300 text-sm font-semibold">
              Trustia.gr
            </p>
            <p className="text-white text-lg font-bold">
              €10-25/{t("μήνα", "month")}
            </p>
            <p className="text-blue-300 text-xs">
              {t("σταθερό, ανεξαρτήτως εσόδων", "flat fee, regardless of earnings")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}