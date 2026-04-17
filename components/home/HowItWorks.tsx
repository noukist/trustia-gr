// =============================================================
// HowItWorks.tsx — 3-step explanation for customers
// =============================================================
// This section answers "How does Trustia.gr work?" in 3 simple
// steps. It sits below the category grid on the homepage.
//
// The goal is to make the process feel effortless:
// 1. Search → 2. Book or Contact → 3. Review
//
// Each step is a card with a large number, icon, title, and
// short description. On desktop they sit side by side.
// On mobile they stack vertically.
// =============================================================

"use client";

// -------------------------------------------------------------
// Props — language for translations
// -------------------------------------------------------------
interface HowItWorksProps {
  lang: "el" | "en";
}

export default function HowItWorks({ lang }: HowItWorksProps) {
  // Helper: translate between Greek and English
  const t = (el: string, en: string) => (lang === "el" ? el : en);

  // ─── STEPS DATA ───
  // Each step has an icon, title (Greek + English), and description
  // We define them as an array so we can map over them cleanly
  const steps = [
    {
      // Step 1: Finding a professional
      number: "1",
      icon: "🔍",
      titleEl: "Βρες",
      titleEn: "Find",
      descEl: "Αναζήτησε τον επαγγελματία που χρειάζεσαι ανά κατηγορία και περιοχή. Δες κριτικές, βαθμολογίες και τιμές.",
      descEn: "Search for the professional you need by category and area. See reviews, ratings, and prices.",
    },
    {
      // Step 2: Booking or contacting
      number: "2",
      icon: "📅",
      titleEl: "Κλείσε Ραντεβού",
      titleEn: "Book",
      descEl: "Κλείσε ραντεβού online ή επικοινώνησε απευθείας. Εσύ επιλέγεις τον τρόπο.",
      descEn: "Book online or contact them directly. You choose how.",
    },
    {
      // Step 3: Leaving a verified review
      number: "3",
      icon: "⭐",
      titleEl: "Αξιολόγησε",
      titleEn: "Review",
      descEl: "Μετά τη δουλειά, άφησε μια επαληθευμένη κριτική. Βοήθησε τους επόμενους πελάτες.",
      descEn: "After the job, leave a verified review. Help future customers make the right choice.",
    },
  ];

  return (
    // Light gray background to visually separate from the white sections
    <section className="bg-[var(--color-bg-light)] py-12">
      <div className="max-w-5xl mx-auto px-6">

        {/* ─── SECTION HEADING ─── */}
        <h2
          className="text-2xl font-bold text-center mb-8"
          style={{ color: "var(--color-primary)" }}
        >
          {t("Πώς Λειτουργεί", "How It Works")}
        </h2>

        {/* ─── STEPS GRID ─── */}
        {/* 1 column on mobile, 3 columns on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step) => (
            <div
              key={step.number}
              className="
                bg-white rounded-2xl p-6
                text-center shadow-sm
                hover:shadow-md transition-shadow
              "
            >
              {/* ── Step Number ── */}
              {/* Small circle with the step number */}
              <div
                className="
                  w-8 h-8 rounded-full mx-auto mb-3
                  flex items-center justify-center
                  text-white text-sm font-bold
                "
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                {step.number}
              </div>

              {/* ── Icon ── */}
              {/* Large emoji representing the step */}
              <div className="text-4xl mb-3">{step.icon}</div>

              {/* ── Title ── */}
              <h3
                className="font-bold text-lg mb-2"
                style={{ color: "var(--color-primary)" }}
              >
                {t(step.titleEl, step.titleEn)}
              </h3>

              {/* ── Description ── */}
              <p className="text-sm text-gray-600 leading-relaxed">
                {t(step.descEl, step.descEn)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}