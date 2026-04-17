// =============================================================
// app/how-it-works/page.tsx — Detailed explanation page
// =============================================================
// URL: trustia.gr/how-it-works
//
// This page expands on the 3-step homepage section.
// It explains the full process for TWO audiences:
// 1. Customers — how to find and book a professional
// 2. Professionals — how to join and grow on the platform
//
// This page serves both as an FAQ and as SEO content.
// People searching "πώς λειτουργεί το trustia" land here.
// =============================================================

"use client";

import Link from "next/link";

export default function HowItWorksPage() {
  const lang = "el";
  const t = (el: string, en: string) => (lang === "el" ? el : en);

  // ─── CUSTOMER STEPS ───
  // The journey from "I need a plumber" to "job done, review left"
  const customerSteps = [
    {
      number: "1",
      icon: "🔍",
      titleEl: "Αναζήτησε",
      titleEn: "Search",
      descEl: "Επίλεξε την υπηρεσία που χρειάζεσαι (π.χ. Υδραυλικός) και την περιοχή σου (π.χ. Κάτω Σχολάρι). Η αναζήτηση σου δείχνει μόνο επαγγελματίες που εξυπηρετούν τη δική σου περιοχή.",
      descEn: "Select the service you need (e.g. Plumber) and your area (e.g. Kato Scholari). Search shows only professionals who serve your specific area.",
    },
    {
      number: "2",
      icon: "👤",
      titleEl: "Σύγκρινε",
      titleEn: "Compare",
      descEl: "Δες το προφίλ κάθε επαγγελματία: βαθμολογία, επαληθευμένες κριτικές, φωτογραφίες δουλειάς, τιμές, και κατάταξη. Όλες οι κριτικές είναι από πραγματικούς πελάτες — καμία ψεύτικη.",
      descEn: "View each professional's profile: rating, verified reviews, work photos, prices, and ranking. All reviews are from real customers — no fakes.",
    },
    {
      number: "3",
      icon: "📅",
      titleEl: "Κλείσε Ραντεβού",
      titleEn: "Book",
      descEl: "Αν ο επαγγελματίας δέχεται online κρατήσεις (📅), διάλεξε ημερομηνία και ώρα από τις διαθέσιμες. Αν δέχεται μόνο τηλέφωνο (📞), επικοινώνησε απευθείας. Εσύ επιλέγεις.",
      descEn: "If the professional accepts online bookings (📅), pick a date and time from their availability. If they accept phone only (📞), contact them directly. You choose.",
    },
    {
      number: "4",
      icon: "✅",
      titleEl: "Επιβεβαίωση",
      titleEn: "Confirmation",
      descEl: "Λαμβάνεις email επιβεβαίωσης με τα στοιχεία του ραντεβού. Την προηγούμενη μέρα, λαμβάνεις υπενθύμιση. Μπορείς να ακυρώσεις ανά πάσα στιγμή.",
      descEn: "You receive a confirmation email with the appointment details. The day before, you get a reminder. You can cancel at any time.",
    },
    {
      number: "5",
      icon: "💰",
      titleEl: "Πληρωμή",
      titleEn: "Payment",
      descEl: "Πληρώνεις απευθείας τον επαγγελματία — μετρητά, IRIS, ή όπως συμφωνήσετε. Το Trustia.gr δεν μεσολαβεί στην πληρωμή. Χωρίς κρυφές χρεώσεις.",
      descEn: "You pay the professional directly — cash, IRIS, or however you agree. Trustia.gr does not process payments. No hidden fees.",
    },
    {
      number: "6",
      icon: "⭐",
      titleEl: "Αξιολόγησε",
      titleEn: "Review",
      descEl: "Μετά τη δουλειά, λαμβάνεις email για να αφήσεις κριτική. Βαθμολόγησε, γράψε σχόλιο, ανέβασε φωτογραφίες. Η κριτική σου βοηθά τον επόμενο πελάτη να επιλέξει σωστά.",
      descEn: "After the job, you receive an email to leave a review. Rate, comment, upload photos. Your review helps the next customer choose wisely.",
    },
  ];

  // ─── PROFESSIONAL STEPS ───
  // The journey from "I want to join" to "I'm getting customers"
  const proSteps = [
    {
      number: "1",
      icon: "📝",
      titleEl: "Εγγραφή",
      titleEn: "Register",
      descEl: "Επίλεξε την κατηγορία σου, συμπλήρωσε το προφίλ σου, και διάλεξε πλάνο (από €10/μήνα). Η εγγραφή ολοκληρώνεται σε 5 λεπτά.",
      descEn: "Choose your category, fill in your profile, and pick a plan (from €10/month). Registration takes 5 minutes.",
    },
    {
      number: "2",
      icon: "🔧",
      titleEl: "Ρύθμιση Προφίλ",
      titleEn: "Set Up Profile",
      descEl: "Πρόσθεσε φωτογραφίες, βιογραφικό, τιμές, περιοχές εξυπηρέτησης, και ώρες διαθεσιμότητας. Ενεργοποίησε το σύστημα κρατήσεων αν θέλεις online ραντεβού.",
      descEn: "Add photos, bio, prices, service areas, and availability hours. Enable the booking system if you want online appointments.",
    },
    {
      number: "3",
      icon: "📊",
      titleEl: "Λάβε Κρατήσεις",
      titleEn: "Get Bookings",
      descEl: "Οι πελάτες σε βρίσκουν μέσω αναζήτησης. Λαμβάνεις ειδοποίηση email για κάθε κράτηση. Αποδέχεσαι ή απορρίπτεις.",
      descEn: "Customers find you through search. You receive an email notification for each booking. Accept or decline.",
    },
    {
      number: "4",
      icon: "⭐",
      titleEl: "Μάζεψε Κριτικές",
      titleEn: "Collect Reviews",
      descEl: "Κάθε ολοκληρωμένη εργασία μπορεί να φέρει μια επαληθευμένη κριτική. Περισσότερες κριτικές = υψηλότερη κατάταξη = περισσότεροι πελάτες.",
      descEn: "Every completed job can bring a verified review. More reviews = higher ranking = more customers.",
    },
    {
      number: "5",
      icon: "📈",
      titleEl: "Ανέβα στην Κατάταξη",
      titleEn: "Climb the Rankings",
      descEl: "Η κατάταξή σου βασίζεται σε κριτικές, βαθμολογία, και ανταπόκριση — ποτέ στο πόσα πληρώνεις. Ο #1 Υδραυλικός στη Θεσσαλονίκη κερδίζει τους περισσότερους πελάτες.",
      descEn: "Your ranking is based on reviews, rating, and responsiveness — never on how much you pay. The #1 Plumber in Thessaloniki gets the most customers.",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* ─── PAGE HEADING ─── */}
        <h1
          className="text-3xl font-bold text-center mb-2"
          style={{ color: "var(--color-primary)" }}
        >
          {t("Πώς Λειτουργεί το Trustia.gr", "How Trustia.gr Works")}
        </h1>
        <p className="text-center text-gray-500 mb-12 max-w-xl mx-auto">
          {t(
            "Απλό, γρήγορο, δίκαιο — για πελάτες και επαγγελματίες.",
            "Simple, fast, fair — for customers and professionals."
          )}
        </p>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* SECTION 1: FOR CUSTOMERS                              */}
        {/* ═══════════════════════════════════════════════════════ */}
        <div className="mb-16">
          <h2
            className="text-2xl font-bold mb-8"
            style={{ color: "var(--color-primary)" }}
          >
            {t("Για Πελάτες", "For Customers")}
          </h2>

          {/* Steps displayed as a vertical timeline */}
          <div className="space-y-6">
            {customerSteps.map((step, index) => (
              <div key={step.number} className="flex gap-5">
                {/* ── Timeline column ── */}
                {/* Number circle + connecting line */}
                <div className="flex flex-col items-center">
                  {/* Step number circle */}
                  <div
                    className="
                      w-10 h-10 rounded-full flex-shrink-0
                      flex items-center justify-center
                      text-white font-bold text-sm
                    "
                    style={{ backgroundColor: "var(--color-primary)" }}
                  >
                    {step.number}
                  </div>
                  {/* Connecting line (not on last step) */}
                  {index < customerSteps.length - 1 && (
                    <div
                      className="w-0.5 flex-1 mt-2"
                      style={{ backgroundColor: "var(--color-bg-blue)" }}
                    ></div>
                  )}
                </div>

                {/* ── Content column ── */}
                <div className="pb-6">
                  {/* Icon + Title */}
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">{step.icon}</span>
                    <h3 className="font-bold text-lg text-gray-900">
                      {t(step.titleEl, step.titleEn)}
                    </h3>
                  </div>
                  {/* Description */}
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {t(step.descEl, step.descEn)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA for customers */}
          <div className="mt-8 text-center">
            <Link
              href="/services"
              className="
                inline-block px-8 py-3
                bg-[var(--color-primary)] text-white
                font-bold rounded-xl text-lg
                hover:opacity-90 transition-all
              "
            >
              {t("Βρες Επαγγελματία", "Find a Professional")} →
            </Link>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* SECTION 2: FOR PROFESSIONALS                          */}
        {/* ═══════════════════════════════════════════════════════ */}
        <div className="mb-12">
          <h2
            className="text-2xl font-bold mb-8"
            style={{ color: "var(--color-primary)" }}
          >
            {t("Για Επαγγελματίες", "For Professionals")}
          </h2>

          {/* Steps as timeline */}
          <div className="space-y-6">
            {proSteps.map((step, index) => (
              <div key={step.number} className="flex gap-5">
                {/* Timeline column */}
                <div className="flex flex-col items-center">
                  <div
                    className="
                      w-10 h-10 rounded-full flex-shrink-0
                      flex items-center justify-center
                      text-gray-900 font-bold text-sm
                    "
                    style={{ backgroundColor: "var(--color-accent)" }}
                  >
                    {step.number}
                  </div>
                  {index < proSteps.length - 1 && (
                    <div
                      className="w-0.5 flex-1 mt-2"
                      style={{ backgroundColor: "var(--color-bg-amber)" }}
                    ></div>
                  )}
                </div>

                {/* Content column */}
                <div className="pb-6">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">{step.icon}</span>
                    <h3 className="font-bold text-lg text-gray-900">
                      {t(step.titleEl, step.titleEn)}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {t(step.descEl, step.descEn)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA for professionals */}
          <div className="mt-8 text-center">
            <Link
              href="/pricing"
              className="
                inline-block px-8 py-3
                bg-[var(--color-accent)] text-gray-900
                font-bold rounded-xl text-lg
                hover:bg-[var(--color-accent-light)] transition-all
              "
            >
              {t("Γίνε Μέλος", "Join Now")} →
            </Link>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* FAQ SECTION                                           */}
        {/* ═══════════════════════════════════════════════════════ */}
        <div className="border-t pt-12">
          <h2
            className="text-2xl font-bold mb-8 text-center"
            style={{ color: "var(--color-primary)" }}
          >
            {t("Συχνές Ερωτήσεις", "Frequently Asked Questions")}
          </h2>

          <div className="space-y-6 max-w-2xl mx-auto">
            {[
              {
                qEl: "Πόσο κοστίζει για τους πελάτες;",
                qEn: "How much does it cost for customers?",
                aEl: "Τίποτα. Η χρήση του Trustia.gr είναι εντελώς δωρεάν για πελάτες. Αναζητήστε, κλείστε ραντεβού, αφήστε κριτική — χωρίς χρέωση.",
                aEn: "Nothing. Using Trustia.gr is completely free for customers. Search, book, leave reviews — no charge.",
              },
              {
                qEl: "Πώς πληρώνω τον επαγγελματία;",
                qEn: "How do I pay the professional?",
                aEl: "Απευθείας. Το Trustia.gr δεν μεσολαβεί στην πληρωμή. Συμφωνείτε μεταξύ σας — μετρητά, IRIS, μεταφορά, ό,τι σας βολεύει.",
                aEn: "Directly. Trustia.gr does not process payments. You agree between yourselves — cash, IRIS, transfer, whatever works.",
              },
              {
                qEl: "Πώς ξέρω ότι οι κριτικές είναι αληθινές;",
                qEn: "How do I know reviews are real?",
                aEl: "Μόνο δύο τύποι κριτικών υπάρχουν: από επαληθευμένες κρατήσεις μέσω της πλατφόρμας, ή από υπάρχοντες πελάτες που προσκαλεί ο επαγγελματίας. Ο admin δεν μπορεί να δημιουργήσει ψεύτικες κριτικές.",
                aEn: "Only two types of reviews exist: from verified bookings through the platform, or from existing customers invited by the professional. The admin cannot create fake reviews.",
              },
              {
                qEl: "Γιατί να μην χρησιμοποιήσω απλά τον Douleutaras;",
                qEn: "Why not just use Douleutaras?",
                aEl: "Ο Douleutaras χρεώνει τον επαγγελματία 15-20% από κάθε εργασία. Αυτό σημαίνει ότι ο υδραυλικός που θα σε χρεώσει €100, δίνει €15-20 στην πλατφόρμα. Στο Trustia.gr, ο επαγγελματίας πληρώνει ένα σταθερό €15/μήνα ανεξαρτήτως πόσα κερδίζει — άρα δεν έχει λόγο να \"φουσκώσει\" τη δική σου τιμή.",
                aEn: "Douleutaras charges the professional 15-20% of every job. This means the plumber who charges you €100 gives €15-20 to the platform. On Trustia.gr, the professional pays a flat €15/month regardless of earnings — so they have no reason to inflate your price.",
              },
              {
                qEl: "Μπορώ να ακυρώσω ένα ραντεβού;",
                qEn: "Can I cancel a booking?",
                aEl: "Ναι, ανά πάσα στιγμή. Ο επαγγελματίας ειδοποιείται αυτόματα και η θέση ελευθερώνεται. Ζητάμε μόνο να ενημερώνετε εγκαίρως.",
                aEn: "Yes, at any time. The professional is notified automatically and the slot reopens. We just ask that you notify in good time.",
              },
              {
                qEl: "Πόσο κοστίζει για τους επαγγελματίες;",
                qEn: "How much does it cost for professionals?",
                aEl: "Από €10/μήνα ανάλογα με την κατηγορία. Χωρίς προμήθειες, χωρίς κρυφές χρεώσεις. Κρατάτε το 100% των εσόδων σας.",
                aEn: "From €10/month depending on the category. No commissions, no hidden fees. You keep 100% of your earnings.",
              },
            ].map((faq, index) => (
              <div key={index} className="border-b border-gray-100 pb-4">
                {/* Question */}
                <h3 className="font-bold text-gray-900 mb-2">
                  {t(faq.qEl, faq.qEn)}
                </h3>
                {/* Answer */}
                <p className="text-sm text-gray-600 leading-relaxed">
                  {t(faq.aEl, faq.aEn)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}