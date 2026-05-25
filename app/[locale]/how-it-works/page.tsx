// =============================================================
// app/how-it-works/page.tsx
// =============================================================
// "Πώς Λειτουργεί" — explainer page for customers AND professionals.
// Fully static, publicly accessible. Replaces the placeholder.
//
// SECTIONS
//   1. Hero           — dual-audience headline + tab switcher
//   2. Customer steps — 4-step process for finding & booking
//   3. Pro steps      — 4-step process for signing up & earning
//   4. Booking modes  — three cards explaining Contact/Date/Full
//   5. FAQ accordion  — 6 questions, client-side expand/collapse
//   6. Dual CTA       — bottom row for customers + professionals
// =============================================================

import React       from "react";
import Link        from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Phone, Calendar, CalendarDays, ChevronDown } from "lucide-react";
import { setRequestLocale } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === "en"
      ? "How It Works | Trustia.gr"
      : "Πώς Λειτουργεί | Trustia.gr",
    description: locale === "en"
      ? "Learn how Trustia.gr connects customers with professionals. 0% commission, 3 months free, 51 categories."
      : "Μάθε πώς το Trustia.gr συνδέει πελάτες με επαγγελματίες. 0% προμήθεια, 3 μήνες δωρεάν, 51 κατηγορίες.",
  };
}

// ── Shared layout helpers ─────────────────────────────────────

function SectionHeading({
  label,
  title,
  sub,
  light,
}: {
  label?: string;
  title:  string;
  sub?:   string;
  light?: boolean;           // true = white text (on dark bg)
}) {
  return (
    <div style={{ textAlign: "center", marginBottom: "3rem" }}>
      {label && (
        <span
          style={{
            display:         "inline-block",
            backgroundColor: light ? "rgba(255,255,255,0.15)" : "var(--color-primary-bg)",
            color:           light ? "#fff"                  : "var(--color-primary)",
            border:          light ? "1px solid rgba(255,255,255,0.3)" : "none",
            borderRadius:    "999px",
            padding:         "0.25rem 1rem",
            fontSize:        "0.8rem",
            fontWeight:      700,
            textTransform:   "uppercase",
            letterSpacing:   "0.07em",
            marginBottom:    "0.875rem",
          }}
        >
          {label}
        </span>
      )}
      <h2
        style={{
          fontSize:   "clamp(1.5rem, 4vw, 2.25rem)",
          fontWeight: 800,
          color:      light ? "#fff" : "var(--color-text)",
          margin:     sub ? "0 0 0.75rem" : "0",
          lineHeight: 1.2,
        }}
      >
        {title}
      </h2>
      {sub && (
        <p
          style={{
            fontSize:   "1.0625rem",
            color:      light ? "rgba(255,255,255,0.85)" : "var(--color-text-muted)",
            maxWidth:   "580px",
            margin:     "0 auto",
            lineHeight: 1.6,
          }}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

// ── Step card ─────────────────────────────────────────────────
function StepCard({
  n,
  emoji,
  title,
  desc,
  isLast,
}: {
  n:      number;
  emoji:  string;
  title:  string;
  desc:   string;
  isLast: boolean;
}) {
  return (
    <div
      style={{
        position:  "relative",
        display:   "flex",
        flexDirection: "column",
        gap:       "0.875rem",
      }}
    >
      {/* Connector line between steps (desktop only) */}
      {!isLast && (
        <div
          aria-hidden="true"
          className="hidden lg:block"
          style={{
            position:        "absolute",
            top:             "18px",
            left:            "calc(50% + 28px)",
            right:           "calc(-50% + 28px)",
            height:          "2px",
            backgroundImage: "linear-gradient(90deg, var(--color-primary) 0%, var(--color-border) 100%)",
            zIndex:          0,
          }}
        />
      )}

      {/* Step number badge */}
      <div
        style={{
          width:           "36px",
          height:          "36px",
          borderRadius:    "50%",
          backgroundColor: "var(--color-primary)",
          color:           "#fff",
          fontWeight:      800,
          fontSize:        "0.9rem",
          display:         "flex",
          alignItems:      "center",
          justifyContent:  "center",
          zIndex:          1,
          position:        "relative",
          margin:          "0 auto",
        }}
      >
        {n}
      </div>

      <div style={{ textAlign: "center" }}>
        <p style={{ fontSize: "2.25rem", margin: "0 0 0.5rem", lineHeight: 1 }}>{emoji}</p>
        <h3
          style={{
            fontWeight:   700,
            fontSize:     "1rem",
            color:        "var(--color-text)",
            margin:       "0 0 0.4rem",
          }}
        >
          {title}
        </h3>
        <p
          style={{
            fontSize:   "0.875rem",
            color:      "var(--color-text-muted)",
            lineHeight: 1.6,
            margin:     0,
          }}
        >
          {desc}
        </p>
      </div>
    </div>
  );
}

// =============================================================
// SECTION 1 — HERO
// =============================================================
function Hero() {
  return (
    <section
      style={{
        background:  "linear-gradient(145deg, #1a5f5f 0%, var(--color-primary) 60%, #2ab8b8 100%)",
        padding:     "4.5rem 1.5rem 3.5rem",
        textAlign:   "center",
        color:       "#fff",
      }}
    >
      <div style={{ maxWidth: "680px", margin: "0 auto" }}>
        <span
          style={{
            display:         "inline-block",
            backgroundColor: "rgba(255,255,255,0.15)",
            border:          "1px solid rgba(255,255,255,0.3)",
            borderRadius:    "999px",
            padding:         "0.3rem 1rem",
            fontSize:        "0.8125rem",
            fontWeight:      600,
            marginBottom:    "1.25rem",
          }}
        >
          51 κατηγορίες · Σε όλη την Ελλάδα
        </span>

        <h1
          style={{
            fontSize:   "clamp(2rem, 6vw, 3rem)",
            fontWeight: 900,
            lineHeight: 1.1,
            margin:     "0 0 1rem",
            letterSpacing: "-0.02em",
          }}
        >
          Πώς Λειτουργεί
          <br />
          <span style={{ color: "#D4F0F0" }}>το Trustia.gr</span>
        </h1>

        <p
          style={{
            fontSize:   "clamp(1rem, 2.5vw, 1.1875rem)",
            opacity:    0.92,
            lineHeight: 1.6,
            margin:     "0 0 2rem",
          }}
        >
          Απλό για πελάτες. Δίκαιο για επαγγελματίες.
          <br />
          Μηδέν προμήθεια. Εκατό τοις εκατό αμοιβή.
        </p>

        {/* Jump links */}
        <div
          style={{
            display:        "flex",
            justifyContent: "center",
            gap:            "0.875rem",
            flexWrap:       "wrap",
          }}
        >
          <a
            href="#customers"
            style={{
              padding:         "0.75rem 1.5rem",
              backgroundColor: "rgba(255,255,255,0.15)",
              border:          "1.5px solid rgba(255,255,255,0.35)",
              borderRadius:    "10px",
              color:           "#fff",
              fontWeight:      600,
              fontSize:        "0.9375rem",
              textDecoration:  "none",
            }}
          >
            👤 Για Πελάτες
          </a>
          <a
            href="#professionals"
            style={{
              padding:         "0.75rem 1.5rem",
              backgroundColor: "var(--color-accent)",
              border:          "1.5px solid var(--color-accent)",
              borderRadius:    "10px",
              color:           "#fff",
              fontWeight:      600,
              fontSize:        "0.9375rem",
              textDecoration:  "none",
            }}
          >
            🔧 Για Επαγγελματίες
          </a>
        </div>
      </div>
    </section>
  );
}

// =============================================================
// SECTION 2 — CUSTOMER STEPS
// =============================================================
function CustomerSteps() {
  const steps = [
    {
      emoji: "🔍",
      title: "Αναζήτηση",
      desc:  "Γράψε τι χρειάζεσαι και πού. 51 κατηγορίες σε όλη την Ελλάδα.",
    },
    {
      emoji: "📋",
      title: "Σύγκριση",
      desc:  "Δες προφίλ, κριτικές, τιμές και διαθεσιμότητα. Χωρίς δέσμευση.",
    },
    {
      emoji: "📞",
      title: "Επικοινωνία ή Κράτηση",
      desc:  "Κάλεσε απευθείας ή κλείσε ραντεβού online — εσύ επιλέγεις.",
    },
    {
      emoji: "⭐",
      title: "Αξιολόγηση",
      desc:  "Άφησε κριτική μετά την υπηρεσία και βοήθησε την κοινότητα.",
    },
  ];

  return (
    <section
      id="customers"
      style={{ padding: "5rem 1.5rem", backgroundColor: "#fff" }}
    >
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <SectionHeading
          label="Για Πελάτες"
          title="Βρες τον ειδικό σε 4 απλά βήματα"
          sub="Δωρεάν για πελάτες. Πάντα."
        />

        <div
          style={{
            display:             "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap:                 "2rem",
          }}
        >
          {steps.map((s, i) => (
            <StepCard
              key={s.title}
              n={i + 1}
              emoji={s.emoji}
              title={s.title}
              desc={s.desc}
              isLast={i === steps.length - 1}
            />
          ))}
        </div>

        <div style={{ textAlign: "center", marginTop: "2.5rem" }}>
          <Link
            href="/services"
            style={{
              display:         "inline-flex",
              alignItems:      "center",
              gap:             "0.5rem",
              padding:         "0.8125rem 1.875rem",
              backgroundColor: "var(--color-primary)",
              color:           "#fff",
              borderRadius:    "10px",
              fontWeight:      700,
              fontSize:        "1rem",
              textDecoration:  "none",
            }}
          >
            Ξεκίνα Αναζήτηση
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}

// =============================================================
// SECTION 3 — PROFESSIONAL STEPS
// =============================================================
function ProfessionalSteps() {
  const steps = [
    {
      emoji: "✍️",
      title: "Εγγραφή",
      desc:  "Μόλις 2 λεπτά. 3 μήνες εντελώς ΔΩΡΕΑΝ. Δεν χρειάζεσαι πιστωτική κάρτα.",
    },
    {
      emoji: "🪪",
      title: "Δημιουργία Προφίλ",
      desc:  "Φωτογραφίες, υπηρεσίες, τιμές, ωράριο. Σε λίγα λεπτά ορατός σε όλη την Ελλάδα.",
    },
    {
      emoji: "📲",
      title: "Λήψη Κρατήσεων",
      desc:  "Τηλεφωνικά ή online — εσείς επιλέγετε. Πελάτες σε βρίσκουν μέσω αναζήτησης ή Google.",
    },
    {
      emoji: "💰",
      title: "Κέρδος χωρίς Προμήθεια",
      desc:  "Εισπράττετε απευθείας. Εμείς παίρνουμε €0 από τις αμοιβές σας. Ποτέ.",
    },
  ];

  return (
    <section
      id="professionals"
      style={{
        padding:         "5rem 1.5rem",
        backgroundColor: "var(--color-bg-light)",
      }}
    >
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <SectionHeading
          label="Για Επαγγελματίες"
          title="Από την εγγραφή στα κέρδη σε 4 βήματα"
          sub="Η δικαιότερη πλατφόρμα για επαγγελματίες στην Ελλάδα."
        />

        <div
          style={{
            display:             "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap:                 "2rem",
          }}
        >
          {steps.map((s, i) => (
            <StepCard
              key={s.title}
              n={i + 1}
              emoji={s.emoji}
              title={s.title}
              desc={s.desc}
              isLast={i === steps.length - 1}
            />
          ))}
        </div>

        <div style={{ textAlign: "center", marginTop: "2.5rem" }}>
          <Link
            href="/register/professional"
            style={{
              display:         "inline-flex",
              alignItems:      "center",
              gap:             "0.5rem",
              padding:         "0.8125rem 1.875rem",
              backgroundColor: "var(--color-accent)",
              color:           "#fff",
              borderRadius:    "10px",
              fontWeight:      700,
              fontSize:        "1rem",
              textDecoration:  "none",
            }}
          >
            Ξεκίνα Δωρεάν
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}

// =============================================================
// SECTION 4 — BOOKING MODES (PRD §22)
// =============================================================
function BookingModesSection() {
  const modes = [
    {
      icon:    <Phone size={28} style={{ color: "var(--color-primary)" }} />,
      emoji:   "📞",
      title:   "Μόνο Τηλέφωνο",
      badge:   "Contact Only",
      who:     "Ειδικοί, τεχνολογοφοβικοί",
      sees:    "Ο πελάτης βλέπει τηλέφωνο + email και καλεί απευθείας.",
      needs:   "Δεν απαιτεί επιχειρηματική σελίδα",
      color:   "#6B7280",
      bgColor: "rgba(107,114,128,0.07)",
    },
    {
      icon:    <Calendar size={28} style={{ color: "#D97706" }} />,
      emoji:   "📅",
      title:   "Κράτηση Ημερομηνίας",
      badge:   "Date Booking",
      who:     "Τεχνίτες, γενικές υπηρεσίες",
      sees:    "Ο πελάτης επιλέγει ημερομηνία και περιγράφει την ανάγκη του. Ο επαγγελματίας επιβεβαιώνει.",
      needs:   "Δεν απαιτεί επιχειρηματική σελίδα",
      color:   "#D97706",
      bgColor: "rgba(217,119,6,0.07)",
    },
    {
      icon:    <CalendarDays size={28} style={{ color: "var(--color-primary)" }} />,
      emoji:   "🗓️",
      title:   "Πλήρες Ημερολόγιο",
      badge:   "Full Calendar",
      who:     "Ομορφιά, όλες οι κατηγορίες",
      sees:    "Επιλογή υπηρεσίας → ημερομηνία → ώρα → υπολογισμός τιμής. Αυτόματη επιβεβαίωση.",
      needs:   "Απαιτεί Επιχειρηματική Σελίδα + min 1 υπηρεσία",
      color:   "var(--color-primary)",
      bgColor: "var(--color-primary-bg)",
      highlight: true,
    },
  ];

  return (
    <section style={{ padding: "5rem 1.5rem", backgroundColor: "#fff" }}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <SectionHeading
          label="Τρόποι Κράτησης"
          title="Τρεις επιλογές — εσύ αποφασίζεις"
          sub="Κάθε επαγγελματίας επιλέγει τον τρόπο που τον εξυπηρετεί κατά την εγγραφή. Μπορεί να τον αλλάξει οποτεδήποτε."
        />

        <div
          style={{
            display:             "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap:                 "1.25rem",
          }}
        >
          {modes.map((mode) => (
            <div
              key={mode.title}
              style={{
                backgroundColor: mode.highlight ? mode.bgColor : "#fff",
                border:          mode.highlight
                  ? "2px solid var(--color-primary)"
                  : "1.5px solid var(--color-border)",
                borderRadius:    "16px",
                padding:         "1.75rem",
                position:        "relative",
                boxShadow:       mode.highlight
                  ? "0 6px 24px rgba(42,143,143,0.12)"
                  : "none",
              }}
            >
              {/* Badge */}
              <span
                style={{
                  display:         "inline-block",
                  backgroundColor: `${mode.color}18`,
                  color:           mode.color,
                  border:          `1px solid ${mode.color}44`,
                  borderRadius:    "6px",
                  padding:         "0.2rem 0.6rem",
                  fontSize:        "0.7rem",
                  fontWeight:      700,
                  marginBottom:    "1rem",
                  letterSpacing:   "0.04em",
                }}
              >
                {mode.badge}
              </span>

              {/* Icon + title */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.875rem" }}>
                {mode.icon}
                <h3
                  style={{
                    fontWeight: 800,
                    fontSize:   "1.0625rem",
                    color:      "var(--color-text)",
                    margin:     0,
                  }}
                >
                  {mode.title}
                </h3>
              </div>

              {/* Who uses it */}
              <p
                style={{
                  fontSize:        "0.775rem",
                  fontWeight:      600,
                  color:           "var(--color-text-muted)",
                  textTransform:   "uppercase",
                  letterSpacing:   "0.05em",
                  margin:          "0 0 0.5rem",
                }}
              >
                {mode.who}
              </p>

              {/* Description */}
              <p
                style={{
                  fontSize:   "0.9rem",
                  color:      "var(--color-text)",
                  lineHeight: 1.6,
                  margin:     "0 0 0.875rem",
                }}
              >
                {mode.sees}
              </p>

              {/* Requirements */}
              <p
                style={{
                  fontSize:        "0.775rem",
                  color:           "var(--color-text-muted)",
                  margin:          0,
                  paddingTop:      "0.75rem",
                  borderTop:       "1px solid var(--color-border)",
                  display:         "flex",
                  alignItems:      "center",
                  gap:             "0.3rem",
                }}
              >
                <span
                  style={{
                    width:           "6px",
                    height:          "6px",
                    borderRadius:    "50%",
                    backgroundColor: mode.color,
                    flexShrink:      0,
                    display:         "inline-block",
                  }}
                />
                {mode.needs}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// =============================================================
// SECTION 5 — FAQ ACCORDION (client component)
// =============================================================
// The accordion needs useState, so it must be "use client".
// We keep the page as a Server Component and use a named export
// pattern — the FAQ component is in the same file but declared
// separately with its own "use client" directive.
//
// NOTE: In Next.js App Router, you CAN'T mix "use client" and
// Server Components in the same file. So we inline the FAQ as
// a STATIC list (no useState) — all FAQs open by default on
// mobile via CSS detail/summary elements (native HTML accordion).
// This keeps the page fully static while giving good UX.
// =============================================================
function FAQ() {
  const items = [
    {
      q: "Πόσο κοστίζει για πελάτες;",
      a: "Τίποτα. Η πλατφόρμα είναι εντελώς δωρεάν για πελάτες. Δεν χρειάζεσαι λογαριασμό για να βρεις επαγγελματία — απλά αναζήτησε και επικοινώνησε.",
    },
    {
      q: "Πόσο κοστίζει για επαγγελματίες;",
      a: "Από €2.75/μήνα με το ετήσιο πλάνο (Τιμή Γνωριμίας). Τα πρώτα 3 μήνα είναι εντελώς δωρεάν, χωρίς πιστωτική κάρτα. Μετά τη δωρεάν περίοδο επιλέγεις πλάνο ή το προφίλ παύει να εμφανίζεται (δεν διαγράφεται).",
    },
    {
      q: "Πώς πληρώνω τον επαγγελματία;",
      a: "Απευθείας — μετρητά, κάρτα ή τραπεζική μεταφορά. Το Trustia δεν μεσολαβεί στην πληρωμή και δεν παίρνει προμήθεια. Εσύ και ο επαγγελματίας τα κανονίζετε μεταξύ σας.",
    },
    {
      q: "Μπορώ να ακυρώσω κράτηση;",
      a: "Ναι. Η ακύρωση είναι δωρεάν και γίνεται οποτεδήποτε μέσα από τη σελίδα της κράτησης. Οι ακυρώσεις εμφανίζονται στο ιστορικό για τη διαφάνεια της κοινότητας.",
    },
    {
      q: "Πώς λειτουργούν οι κριτικές;",
      a: "Υπάρχουν τρεις τύποι κριτικών με διαφορετική βαρύτητα: ✓ Επαληθευμένη (από ολοκληρωμένη κράτηση, βάρος 2×), 🔗 Προσκεκλημένη (μέσω προσκλητηρίου link, βάρος 1×) και Χρήστη (οποιοσδήποτε εγγεγραμμένος, βάρος 0.5×). Η βαθμολογία είναι σταθμισμένος μέσος όρος.",
    },
    {
      q: "Είναι ασφαλές;",
      a: "Όλοι οι επαγγελματίες έχουν δημόσιο προφίλ με κριτικές από πραγματικούς πελάτες. Δεν κάνουμε εκ των προτέρων επαλήθευση ταυτότητας, αλλά το σύστημα κριτικών και η διαφάνεια του προφίλ (τηλέφωνο, πόλη, κατηγορία) βοηθούν στη λήψη τεκμηριωμένης απόφασης.",
    },
  ];

  return (
    <section
      style={{
        padding:         "5rem 1.5rem",
        backgroundColor: "var(--color-bg-light)",
      }}
    >
      <div style={{ maxWidth: "720px", margin: "0 auto" }}>
        <SectionHeading
          label="Συχνές Ερωτήσεις"
          title="Έχεις απορίες;"
        />

        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {items.map((item, i) => (
            /*
             * Using native <details>/<summary> for accordion behaviour.
             * Zero JavaScript, zero layout shift, accessible out of the box,
             * works perfectly as a Server Component.
             */
            <details
              key={i}
              style={{
                backgroundColor: "#fff",
                border:          "1.5px solid var(--color-border)",
                borderRadius:    "12px",
                overflow:        "hidden",
              }}
            >
              <summary
                style={{
                  padding:        "1.125rem 1.375rem",
                  fontWeight:     700,
                  fontSize:       "0.9375rem",
                  color:          "var(--color-text)",
                  cursor:         "pointer",
                  listStyle:      "none",      // Hide default marker
                  display:        "flex",
                  justifyContent: "space-between",
                  alignItems:     "center",
                  gap:            "1rem",
                  userSelect:     "none",
                }}
              >
                {item.q}
                {/* Custom chevron indicator — rotates via CSS when open */}
                <span
                  aria-hidden="true"
                  style={{
                    flexShrink:  0,
                    fontSize:    "1.1rem",
                    color:       "var(--color-text-muted)",
                    transition:  "transform 0.2s",
                    lineHeight:  1,
                  }}
                >
                  ﹢
                </span>
              </summary>

              <p
                style={{
                  padding:    "0 1.375rem 1.125rem",
                  margin:     0,
                  fontSize:   "0.9rem",
                  color:      "var(--color-text-muted)",
                  lineHeight: 1.7,
                  borderTop:  "1px solid var(--color-border)",
                  paddingTop: "1rem",
                }}
              >
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

// =============================================================
// SECTION 6 — DUAL CTA
// =============================================================
function DualCTA() {
  return (
    <section style={{ padding: "5rem 1.5rem", backgroundColor: "#fff" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <h2
          style={{
            textAlign:    "center",
            fontSize:     "clamp(1.5rem, 4vw, 2rem)",
            fontWeight:   800,
            color:        "var(--color-text)",
            margin:       "0 0 2.5rem",
            lineHeight:   1.2,
          }}
        >
          Ξεκίνα τώρα — για όλους
        </h2>

        <div
          style={{
            display:             "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap:                 "1.25rem",
          }}
        >
          {/* Customer CTA card */}
          <div
            style={{
              backgroundColor: "var(--color-bg-light)",
              border:          "1.5px solid var(--color-border)",
              borderRadius:    "16px",
              padding:         "2rem",
              textAlign:       "center",
              display:         "flex",
              flexDirection:   "column",
              alignItems:      "center",
              gap:             "1rem",
            }}
          >
            <span style={{ fontSize: "2.5rem" }}>👤</span>
            <div>
              <h3
                style={{
                  fontWeight:   800,
                  fontSize:     "1.125rem",
                  color:        "var(--color-text)",
                  margin:       "0 0 0.375rem",
                }}
              >
                Είμαι Πελάτης
              </h3>
              <p
                style={{
                  fontSize:   "0.875rem",
                  color:      "var(--color-text-muted)",
                  margin:     0,
                  lineHeight: 1.5,
                }}
              >
                Βρες επαγγελματία κοντά σου δωρεάν.
              </p>
            </div>
            <Link
              href="/services"
              style={{
                display:         "inline-flex",
                alignItems:      "center",
                gap:             "0.5rem",
                padding:         "0.8125rem 1.75rem",
                backgroundColor: "var(--color-primary)",
                color:           "#fff",
                borderRadius:    "10px",
                fontWeight:      700,
                fontSize:        "0.9375rem",
                textDecoration:  "none",
                width:           "100%",
                justifyContent:  "center",
              }}
            >
              Αναζήτηση Επαγγελματιών
              <ArrowRight size={16} />
            </Link>
            <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", margin: 0 }}>
              Δωρεάν · Χωρίς εγγραφή
            </p>
          </div>

          {/* Professional CTA card */}
          <div
            style={{
              background:    "linear-gradient(145deg, #1a5f5f 0%, var(--color-primary) 100%)",
              borderRadius:  "16px",
              padding:       "2rem",
              textAlign:     "center",
              color:         "#fff",
              display:       "flex",
              flexDirection: "column",
              alignItems:    "center",
              gap:           "1rem",
              boxShadow:     "0 8px 32px rgba(42,143,143,0.25)",
            }}
          >
            <span style={{ fontSize: "2.5rem" }}>🔧</span>
            <div>
              <h3
                style={{
                  fontWeight:   800,
                  fontSize:     "1.125rem",
                  color:        "#fff",
                  margin:       "0 0 0.375rem",
                }}
              >
                Είμαι Επαγγελματίας
              </h3>
              <p
                style={{
                  fontSize:   "0.875rem",
                  opacity:    0.9,
                  margin:     0,
                  lineHeight: 1.5,
                }}
              >
                3 μήνες ΔΩΡΕΑΝ · 0% προμήθεια.
              </p>
            </div>
            <Link
              href="/register/professional"
              style={{
                display:         "inline-flex",
                alignItems:      "center",
                gap:             "0.5rem",
                padding:         "0.8125rem 1.75rem",
                backgroundColor: "var(--color-accent)",
                color:           "#fff",
                borderRadius:    "10px",
                fontWeight:      700,
                fontSize:        "0.9375rem",
                textDecoration:  "none",
                width:           "100%",
                justifyContent:  "center",
              }}
            >
              Ξεκίνα Δωρεάν
              <ArrowRight size={16} />
            </Link>
            <p style={{ fontSize: "0.75rem", opacity: 0.8, margin: 0 }}>
              Δεν χρειάζεται πιστωτική κάρτα
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// =============================================================
// PAGE EXPORT
// =============================================================
export default async function HowItWorksPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <main>
      <Hero />
      <CustomerSteps />
      <ProfessionalSteps />
      <BookingModesSection />
      <FAQ />
      <DualCTA />
    </main>
  );
}
