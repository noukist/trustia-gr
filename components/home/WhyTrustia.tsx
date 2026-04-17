// =============================================================
// WhyTrustia.tsx — Trust section explaining why customers
// should use Trustia.gr instead of calling randomly
// =============================================================
// This section addresses the customer's key concern:
// "Why should I trust this website?"
//
// It highlights three trust pillars:
// 1. Verified reviews (only real customers can review)
// 2. Work photos (see results before you book)
// 3. Fair prices (no commission = no inflated prices)
//
// This section was added based on your insight that we need
// to advertise that reviews protect the CUSTOMER, not just
// serve the professional.
// =============================================================

"use client";

// -------------------------------------------------------------
// Props — language for translations
// -------------------------------------------------------------
interface WhyTrustiaProps {
  lang: "el" | "en";
}

export default function WhyTrustia({ lang }: WhyTrustiaProps) {
  // Helper: translate between Greek and English
  const t = (el: string, en: string) => (lang === "el" ? el : en);

  // ─── TRUST PILLARS ───
  // Three reasons customers can trust Trustia.gr
  const pillars = [
    {
      icon: "✓",
      titleEl: "Επαληθευμένες Κριτικές",
      titleEn: "Verified Reviews",
      descEl: "Μόνο πραγματικοί πελάτες που χρησιμοποίησαν τον επαγγελματία μπορούν να αφήσουν κριτική. Καμία ψεύτικη αξιολόγηση.",
      descEn: "Only real customers who actually used the professional can leave a review. No fake reviews.",
      // Green color for the checkmark — matches "verified" branding
      color: "var(--color-success)",
      bgColor: "var(--color-bg-green)",
    },
    {
      icon: "📸",
      titleEl: "Φωτογραφίες Δουλειάς",
      titleEn: "Work Photos",
      descEl: "Δες φωτογραφίες από πραγματικές εργασίες πριν κλείσεις ραντεβού. Ξέρεις τι θα πάρεις.",
      descEn: "See photos from real jobs before you book. You know what you'll get.",
      color: "var(--color-primary)",
      bgColor: "var(--color-bg-blue)",
    },
    {
      icon: "💰",
      titleEl: "Δίκαιες Τιμές",
      titleEn: "Fair Prices",
      descEl: "Οι επαγγελματίες μας δεν πληρώνουν προμήθεια, άρα δεν \"φουσκώνουν\" τη δική σου τιμή.",
      descEn: "Our professionals don't pay commission, so they don't inflate your price.",
      color: "var(--color-accent)",
      bgColor: "var(--color-bg-amber)",
    },
  ];

  return (
    <section className="max-w-5xl mx-auto px-6 py-12">
      {/* ─── SECTION HEADING ─── */}
      <h2
        className="text-2xl font-bold text-center mb-2"
        style={{ color: "var(--color-primary)" }}
      >
        {t("Γιατί Trustia.gr;", "Why Trustia.gr?")}
      </h2>

      {/* ─── SUBHEADING ─── */}
      {/* Reinforces the trust message */}
      <p className="text-center text-gray-500 mb-8 max-w-xl mx-auto">
        {t(
          "Κάθε κριτική είναι επαληθευμένη. Κάθε επαγγελματίας είναι αξιολογημένος. Ξέρεις τι θα πάρεις πριν καν κλείσεις.",
          "Every review is verified. Every professional is rated. You know what you'll get before you even book."
        )}
      </p>

      {/* ─── PILLARS GRID ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {pillars.map((pillar, index) => (
          <div
            key={index}
            className="
              rounded-2xl p-6 text-center
              border border-gray-100
              hover:shadow-md transition-shadow
            "
            style={{ backgroundColor: pillar.bgColor }}
          >
            {/* ── Icon Circle ── */}
            {/* Colored circle with the trust icon */}
            <div
              className="
                w-14 h-14 rounded-full mx-auto mb-4
                flex items-center justify-center
                text-2xl text-white font-bold
              "
              style={{ backgroundColor: pillar.color }}
            >
              {pillar.icon}
            </div>

            {/* ── Title ── */}
            <h3
              className="font-bold text-lg mb-2"
              style={{ color: pillar.color }}
            >
              {t(pillar.titleEl, pillar.titleEn)}
            </h3>

            {/* ── Description ── */}
            <p className="text-sm text-gray-600 leading-relaxed">
              {t(pillar.descEl, pillar.descEn)}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}