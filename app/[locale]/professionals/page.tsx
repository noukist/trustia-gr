// =============================================================
// app/professionals/page.tsx
// =============================================================
// Professional recruitment landing page.
// Replaces the placeholder. No auth required — fully public.
//
// SECTIONS
//   1. Hero          — headline, value props, primary CTA
//   2. Comparison    — vs "Πλατφόρμες με Προμήθεια" table with ✓ / ✗
//   3. Pricing       — three tiers × three plans from PLAN_OPTIONS
//   4. How it works  — 4-step process for professionals
//   5. Features grid — 2 × 3 feature cards
//   6. Final CTA     — repeat signup prompt
// =============================================================

import React       from "react";
import Link        from "next/link";
import type { Metadata } from "next";
import { Check, X, ArrowRight, Star, Clock, Shield, BarChart2, Calendar, ShoppingBag } from "lucide-react";
import { setRequestLocale } from "next-intl/server";

import { PLAN_OPTIONS, CATEGORIES } from "@/lib/constants";
import Button from "@/components/ui/Button";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === "en"
      ? "For Professionals | Trustia.gr"
      : "Για Επαγγελματίες | Trustia.gr",
    description: locale === "en"
      ? "Join Trustia and keep 100% of your earnings. 0% commission, 3 months FREE, intro price from €2.75/month."
      : "Μπες στο Trustia και κράτα 100% των αμοιβών σου. 0% προμήθεια, 3 μήνες ΔΩΡΕΑΝ, Τιμή Γνωριμίας από €2.75/μήνα.",
  };
}

// ── Tier meta ─────────────────────────────────────────────────
interface TierMeta {
  id:        "light" | "trades" | "specialists";
  label:     string;
  emoji:     string;
  examples:  string;
  catCount:  number;
  highlight?: boolean;
}

const TIERS: TierMeta[] = [
  {
    id:       "light",
    label:    "Ελαφριές Υπηρεσίες",
    emoji:    "🧹",
    examples: "Καθαριστές, Κηπουροί, Babysitting, Ιδιαίτερα",
    catCount: CATEGORIES.filter((c) => c.tier === "light").length,
  },
  {
    id:        "trades",
    label:     "Τεχνικά & Ομορφιά",
    emoji:     "🔧",
    examples:  "Υδραυλικοί, Ηλεκτρολόγοι, Nail Tech, Κομμωτές",
    catCount:  CATEGORIES.filter((c) => c.tier === "trades").length,
    highlight: true,
  },
  {
    id:       "specialists",
    label:    "Ειδικοί",
    emoji:    "🏗️",
    examples: "Αρχιτέκτονες, Ανακαινίσεις, Ηλιακά, Μηχανικοί",
    catCount: CATEGORIES.filter((c) => c.tier === "specialists").length,
  },
];

// ── Section wrapper ───────────────────────────────────────────
function Section({
  children,
  style,
  id,
}: {
  children: React.ReactNode;
  style?:   React.CSSProperties;
  id?:      string;
}) {
  return (
    <section
      id={id}
      style={{
        padding: "5rem 1.5rem",
        ...style,
      }}
    >
      <div style={{ maxWidth: "1080px", margin: "0 auto" }}>
        {children}
      </div>
    </section>
  );
}

function SectionHeading({
  label,
  title,
  sub,
}: {
  label?: string;
  title:  string;
  sub?:   string;
}) {
  return (
    <div style={{ textAlign: "center", marginBottom: "3rem" }}>
      {label && (
        <p
          style={{
            display:         "inline-block",
            backgroundColor: "var(--color-primary-bg)",
            color:           "var(--color-primary)",
            borderRadius:    "999px",
            padding:         "0.25rem 1rem",
            fontSize:        "0.8125rem",
            fontWeight:      700,
            textTransform:   "uppercase",
            letterSpacing:   "0.07em",
            marginBottom:    "0.875rem",
          }}
        >
          {label}
        </p>
      )}
      <h2
        style={{
          fontSize:   "clamp(1.5rem, 4vw, 2.25rem)",
          fontWeight: 800,
          color:      "var(--color-text)",
          margin:     sub ? "0 0 0.75rem" : "0",
          lineHeight: 1.2,
        }}
      >
        {title}
      </h2>
      {sub && (
        <p
          style={{
            fontSize:  "1.0625rem",
            color:     "var(--color-text-muted)",
            maxWidth:  "560px",
            margin:    "0 auto",
            lineHeight: 1.6,
          }}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

// =============================================================
// 1. HERO
// =============================================================
function Hero() {
  return (
    <section
      style={{
        background:    "linear-gradient(145deg, #1a5f5f 0%, var(--color-primary) 50%, #2ab8b8 100%)",
        padding:       "5rem 1.5rem 4rem",
        textAlign:     "center",
        color:         "#fff",
        position:      "relative",
        overflow:      "hidden",
      }}
    >
      {/* Background decorative circles */}
      <div
        aria-hidden="true"
        style={{
          position:        "absolute",
          top:             "-80px",
          right:           "-80px",
          width:           "300px",
          height:          "300px",
          borderRadius:    "50%",
          backgroundColor: "rgba(255,255,255,0.05)",
          pointerEvents:   "none",
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position:        "absolute",
          bottom:          "-60px",
          left:            "-60px",
          width:           "220px",
          height:          "220px",
          borderRadius:    "50%",
          backgroundColor: "rgba(255,255,255,0.04)",
          pointerEvents:   "none",
        }}
      />

      <div style={{ maxWidth: "720px", margin: "0 auto", position: "relative" }}>
        {/* Badge */}
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
            backdropFilter:  "blur(4px)",
          }}
        >
          🎉 3 μήνες ΔΩΡΕΑΝ — Τιμή Γνωριμίας
        </span>

        {/* Headline */}
        <h1
          style={{
            fontSize:   "clamp(2rem, 6vw, 3.25rem)",
            fontWeight: 900,
            lineHeight: 1.1,
            margin:     "0 0 1.25rem",
            letterSpacing: "-0.02em",
          }}
        >
          Είσαι επαγγελματίας;
          <br />
          <span style={{ color: "#D4F0F0" }}>Μπες στο Trustia.</span>
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontSize:   "clamp(1rem, 2.5vw, 1.25rem)",
            lineHeight: 1.6,
            opacity:    0.92,
            margin:     "0 0 2.25rem",
          }}
        >
          0% προμήθεια&nbsp;&nbsp;•&nbsp;&nbsp;3 μήνες ΔΩΡΕΑΝ
          <br />
          Κράτα το <strong>100%</strong> των αμοιβών σου
        </p>

        {/* CTA */}
        <div
          style={{
            display:        "flex",
            justifyContent: "center",
            gap:            "0.875rem",
            flexWrap:       "wrap",
          }}
        >
          <Link
            href="/register/professional"
            style={{
              display:         "inline-flex",
              alignItems:      "center",
              gap:             "0.5rem",
              padding:         "0.9375rem 2rem",
              backgroundColor: "var(--color-accent)",
              color:           "#fff",
              borderRadius:    "12px",
              fontWeight:      800,
              fontSize:        "1.0625rem",
              textDecoration:  "none",
              boxShadow:       "0 4px 20px rgba(0,0,0,0.25)",
              transition:      "transform 0.15s, box-shadow 0.15s",
            }}
          >
            Ξεκίνα Δωρεάν
            <ArrowRight size={18} />
          </Link>

          <Link
            href="#pricing"
            style={{
              display:         "inline-flex",
              alignItems:      "center",
              gap:             "0.4rem",
              padding:         "0.9375rem 1.75rem",
              backgroundColor: "rgba(255,255,255,0.12)",
              border:          "1.5px solid rgba(255,255,255,0.35)",
              color:           "#fff",
              borderRadius:    "12px",
              fontWeight:      600,
              fontSize:        "1rem",
              textDecoration:  "none",
            }}
          >
            Δες τις τιμές ↓
          </Link>
        </div>

        {/* Social proof strip */}
        <div
          style={{
            display:        "flex",
            justifyContent: "center",
            gap:            "2rem",
            flexWrap:       "wrap",
            marginTop:      "2.5rem",
            opacity:        0.85,
          }}
        >
          {[
            { n: "51",  label: "κατηγορίες" },
            { n: "0%",  label: "προμήθεια" },
            { n: "3",   label: "μήνες ΔΩΡΕΑΝ" },
          ].map(({ n, label }) => (
            <div key={label} style={{ textAlign: "center" }}>
              <p style={{ fontSize: "1.75rem", fontWeight: 800, margin: 0, lineHeight: 1 }}>{n}</p>
              <p style={{ fontSize: "0.8rem", margin: "0.2rem 0 0", opacity: 0.85 }}>{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// =============================================================
// 2. COMPARISON TABLE
// =============================================================
function ComparisonSection() {
  const rows = [
    {
      label:      "Προμήθεια ανά κράτηση",
      them:       "15 – 20%",
      us:         "0%",
      usGood:     true,
    },
    {
      label:      "Καθαριστής €800/μήνα",
      them:       "Πληρώνει €120–160/μήνα",
      us:         "Πληρώνει €2.75/μήνα",
      usGood:     true,
    },
    {
      label:      "Ηλεκτρολόγος €2.000/μήνα",
      them:       "Πληρώνει €300–400/μήνα",
      us:         "Πληρώνει €7/μήνα",
      usGood:     true,
    },
    {
      label:      "Nail tech €1.500/μήνα",
      them:       "Πληρώνει €225–300/μήνα",
      us:         "Πληρώνει €7/μήνα",
      usGood:     true,
    },
    {
      label:      "Δοκιμαστική περίοδος",
      them:       "Δεν υπάρχει",
      us:         "3 μήνες ΔΩΡΕΑΝ",
      usGood:     true,
    },
    {
      label:      "Εγγυημένη σταθερή τιμή",
      them:       "Αλλάζει ανά πάσα στιγμή",
      us:         "🔒 Κλειδωμένη για τους 50 πρώτους",
      usGood:     true,
    },
  ];

  const headerCell: React.CSSProperties = {
    padding:    "0.875rem 1.25rem",
    fontWeight: 700,
    fontSize:   "0.9375rem",
    textAlign:  "center",
  };

  return (
    <Section style={{ backgroundColor: "var(--color-bg-light)" }}>
      <SectionHeading
        label="Γιατί Trustia;"
        title="Σύγκριση με τον ανταγωνισμό"
        sub="Οι υπάρχουσες πλατφόρμες παίρνουν μεγάλο κομμάτι των εσόδων σου. Εμείς όχι."
      />

      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width:           "100%",
            borderCollapse:  "separate",
            borderSpacing:   0,
            backgroundColor: "#fff",
            borderRadius:    "16px",
            overflow:        "hidden",
            border:          "1.5px solid var(--color-border)",
            fontSize:        "0.9rem",
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  ...headerCell,
                  textAlign:       "left",
                  backgroundColor: "var(--color-bg-light)",
                  color:           "var(--color-text-muted)",
                  borderBottom:    "1.5px solid var(--color-border)",
                  width:           "40%",
                }}
              >
                &nbsp;
              </th>
              {/* Generic competitor column */}
              <th
                style={{
                  ...headerCell,
                  backgroundColor: "#FEF2F2",
                  color:           "#991B1B",
                  borderBottom:    "1.5px solid var(--color-border)",
                  borderLeft:      "1px solid var(--color-border)",
                }}
              >
                Πλατφόρμες με Προμήθεια
                <br />
                <span style={{ fontWeight: 400, fontSize: "0.75rem", opacity: 0.8 }}>
                  (με προμήθεια)
                </span>
              </th>
              {/* Trustia */}
              <th
                style={{
                  ...headerCell,
                  backgroundColor: "var(--color-primary)",
                  color:           "#fff",
                  borderBottom:    "1.5px solid var(--color-primary)",
                  borderLeft:      "1px solid rgba(255,255,255,0.2)",
                }}
              >
                Trustia.gr ✓
                <br />
                <span style={{ fontWeight: 400, fontSize: "0.75rem", opacity: 0.9 }}>
                  (εμείς)
                </span>
              </th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row, i) => (
              <tr
                key={row.label}
                style={{
                  backgroundColor: i % 2 === 0 ? "#fff" : "var(--color-bg-light)",
                }}
              >
                {/* Row label */}
                <td
                  style={{
                    padding:     "0.875rem 1.25rem",
                    fontWeight:  600,
                    color:       "var(--color-text)",
                    borderBottom: i < rows.length - 1 ? "1px solid var(--color-border)" : "none",
                  }}
                >
                  {row.label}
                </td>

                {/* Them (bad) */}
                <td
                  style={{
                    padding:      "0.875rem 1.25rem",
                    textAlign:    "center",
                    color:        "#991B1B",
                    borderBottom: i < rows.length - 1 ? "1px solid var(--color-border)" : "none",
                    borderLeft:   "1px solid var(--color-border)",
                  }}
                >
                  <span
                    style={{
                      display:    "inline-flex",
                      alignItems: "center",
                      gap:        "0.375rem",
                    }}
                  >
                    <X size={15} style={{ flexShrink: 0, color: "#E74C3C" }} />
                    {row.them}
                  </span>
                </td>

                {/* Us (good) */}
                <td
                  style={{
                    padding:         "0.875rem 1.25rem",
                    textAlign:       "center",
                    fontWeight:      700,
                    color:           "#166534",
                    backgroundColor: i % 2 === 0 ? "rgba(39,174,96,0.04)" : "rgba(39,174,96,0.07)",
                    borderBottom:    i < rows.length - 1 ? "1px solid rgba(39,174,96,0.15)" : "none",
                    borderLeft:      "1px solid rgba(39,174,96,0.15)",
                  }}
                >
                  <span
                    style={{
                      display:    "inline-flex",
                      alignItems: "center",
                      gap:        "0.375rem",
                    }}
                  >
                    <Check size={15} style={{ flexShrink: 0, color: "#27AE60" }} />
                    {row.us}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p
        style={{
          textAlign:  "center",
          fontSize:   "0.8125rem",
          color:      "var(--color-text-muted)",
          marginTop:  "1.25rem",
        }}
      >
        * Σύγκριση βασισμένη σε δημόσιες τιμές ανταγωνιστών, Μάιος 2026
      </p>
    </Section>
  );
}

// =============================================================
// 3. PRICING
// =============================================================
function PricingSection() {
  // annual plan is "Δημοφιλέστερο"
  const annualPlan  = PLAN_OPTIONS.find((p) => p.id === "annual")!;
  const semiPlan    = PLAN_OPTIONS.find((p) => p.id === "semi")!;
  const monthlyPlan = PLAN_OPTIONS.find((p) => p.id === "monthly")!;

  return (
    <Section id="pricing">
      {/* Free trial banner */}
      <div
        style={{
          background:    "linear-gradient(90deg, var(--color-primary) 0%, #2ab8b8 100%)",
          borderRadius:  "14px",
          padding:       "1.125rem 1.5rem",
          textAlign:     "center",
          color:         "#fff",
          marginBottom:  "2.5rem",
          fontSize:      "1.0625rem",
          fontWeight:    700,
        }}
      >
        🎉 3 μήνες ΔΩΡΕΑΝ — Ξεκινήστε χωρίς πληρωμή!
        <span
          style={{
            display:         "inline-block",
            marginLeft:      "0.75rem",
            backgroundColor: "rgba(255,255,255,0.2)",
            borderRadius:    "999px",
            padding:         "0.15rem 0.75rem",
            fontSize:        "0.8125rem",
            fontWeight:      500,
          }}
        >
          Δεν χρειάζεται πιστωτική κάρτα
        </span>
      </div>

      <SectionHeading
        label="Τιμολόγηση"
        title="Τιμή Γνωριμίας"
        sub="Τρεις κατηγορίες. Επίλεξε τη διάρκεια που σε συμφέρει. Κλείδωσε την τιμή για πάντα."
      />

      {/* Tier cards */}
      <div
        style={{
          display:             "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap:                 "1.25rem",
          marginBottom:        "2rem",
        }}
      >
        {TIERS.map((tier) => (
          <div
            key={tier.id}
            style={{
              backgroundColor: "#fff",
              border:          tier.highlight
                ? "2px solid var(--color-primary)"
                : "1.5px solid var(--color-border)",
              borderRadius:    "16px",
              padding:         "1.75rem",
              position:        "relative",
              boxShadow:       tier.highlight
                ? "0 8px 32px rgba(42,143,143,0.15)"
                : "none",
            }}
          >
            {/* "Δημοφιλέστερο" ribbon on Trades tier */}
            {tier.highlight && (
              <span
                style={{
                  position:        "absolute",
                  top:             "-1px",
                  right:           "1.25rem",
                  backgroundColor: "var(--color-primary)",
                  color:           "#fff",
                  borderRadius:    "0 0 8px 8px",
                  padding:         "0.25rem 0.875rem",
                  fontSize:        "0.72rem",
                  fontWeight:      700,
                  textTransform:   "uppercase",
                  letterSpacing:   "0.05em",
                }}
              >
                ⭐ Δημοφιλέστερο
              </span>
            )}

            {/* Tier header */}
            <div style={{ marginBottom: "1.25rem" }}>
              <p style={{ fontSize: "1.75rem", margin: "0 0 0.375rem" }}>{tier.emoji}</p>
              <h3
                style={{
                  fontWeight:   800,
                  fontSize:     "1.125rem",
                  color:        "var(--color-text)",
                  margin:       "0 0 0.25rem",
                }}
              >
                {tier.label}
              </h3>
              <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", margin: 0 }}>
                {tier.examples} &nbsp;·&nbsp; {tier.catCount} κατηγορίες
              </p>
            </div>

            {/* Plan options */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem", marginBottom: "1.5rem" }}>
              {[monthlyPlan, semiPlan, annualPlan].map((plan) => {
                const isAnnual   = plan.id === "annual";
                const totalPrice = plan.total[tier.id];
                const perMonth   = plan.perMonth[tier.id];
                return (
                  <div
                    key={plan.id}
                    style={{
                      display:         "flex",
                      alignItems:      "center",
                      justifyContent:  "space-between",
                      padding:         "0.625rem 0.875rem",
                      borderRadius:    "10px",
                      backgroundColor: isAnnual ? "var(--color-primary-bg)" : "var(--color-bg-light)",
                      border:          isAnnual ? "1.5px solid var(--color-primary)" : "1px solid var(--color-border)",
                      gap:             "0.5rem",
                    }}
                  >
                    <div>
                      <p
                        style={{
                          fontWeight:  isAnnual ? 700 : 500,
                          fontSize:    "0.875rem",
                          color:       isAnnual ? "var(--color-primary)" : "var(--color-text)",
                          margin:      0,
                        }}
                      >
                        {plan.labelEl}
                        {isAnnual && (
                          <span
                            style={{
                              marginLeft:      "0.4rem",
                              backgroundColor: "var(--color-accent)",
                              color:           "#fff",
                              borderRadius:    "4px",
                              padding:         "0.05rem 0.4rem",
                              fontSize:        "0.65rem",
                              fontWeight:      700,
                              verticalAlign:   "middle",
                            }}
                          >
                            🔒 Κλείδωμα
                          </span>
                        )}
                      </p>
                      <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", margin: "0.1rem 0 0" }}>
                        €{perMonth.toFixed(2).replace(/\.00$/, "")} / μήνα
                      </p>
                    </div>
                    <span
                      style={{
                        fontWeight: 800,
                        fontSize:   "1rem",
                        color:      isAnnual ? "var(--color-primary)" : "var(--color-text)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      €{totalPrice}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* CTA */}
            <Link
              href="/register/professional"
              style={{
                display:         "block",
                textAlign:       "center",
                padding:         "0.8125rem",
                backgroundColor: tier.highlight ? "var(--color-primary)" : "#fff",
                border:          `2px solid ${tier.highlight ? "var(--color-primary)" : "var(--color-border)"}`,
                color:           tier.highlight ? "#fff" : "var(--color-text)",
                borderRadius:    "10px",
                fontWeight:      700,
                fontSize:        "0.9375rem",
                textDecoration:  "none",
                transition:      "background-color 0.15s",
              }}
            >
              Ξεκίνα Δωρεάν →
            </Link>
          </div>
        ))}
      </div>

      {/* Founding member note */}
      <div
        style={{
          display:         "flex",
          alignItems:      "center",
          justifyContent:  "center",
          gap:             "0.625rem",
          backgroundColor: "rgba(212,160,57,0.08)",
          border:          "1.5px solid rgba(212,160,57,0.35)",
          borderRadius:    "12px",
          padding:         "1rem 1.5rem",
          maxWidth:        "580px",
          margin:          "0 auto",
        }}
      >
        <span style={{ fontSize: "1.25rem" }}>🏆</span>
        <p style={{ margin: 0, fontSize: "0.9rem", color: "#92400E", fontWeight: 600, lineHeight: 1.4 }}>
          Οι πρώτοι <strong>50 επαγγελματίες</strong> κλειδώνουν αυτή την τιμή για πάντα,
          ακόμα και αν οι τιμές ανέβουν μελλοντικά.
        </p>
      </div>
    </Section>
  );
}

// =============================================================
// 4. HOW IT WORKS
// =============================================================
function HowItWorksSection() {
  const steps = [
    {
      n:      "1",
      emoji:  "✍️",
      title:  "Εγγραφή σε 2 λεπτά",
      desc:   "Επέλεξε κατηγορία, τρόπο κράτησης και πλάνο. Δεν χρειάζεσαι πιστωτική κάρτα.",
    },
    {
      n:      "2",
      emoji:  "🪪",
      title:  "Δημιούργησε το Προφίλ σου",
      desc:   "Φωτογραφία, βιογραφικό, τιμή, υπηρεσίες. Σε λίγα λεπτά είσαι ορατός σε όλη την Ελλάδα.",
    },
    {
      n:      "3",
      emoji:  "📲",
      title:  "Λάμβανε Κρατήσεις",
      desc:   "Πελάτες σε βρίσκουν μέσω αναζήτησης ή Google. Επικοινωνούν μέσω τηλεφώνου ή online κράτησης.",
    },
    {
      n:      "4",
      emoji:  "💰",
      title:  "Κέρδισε χωρίς Προμήθεια",
      desc:   "Εισπράττεις απευθείας από τον πελάτη. Εμείς παίρνουμε €0. Εσύ κρατάς το 100%.",
    },
  ];

  return (
    <Section style={{ backgroundColor: "var(--color-bg-light)" }}>
      <SectionHeading
        label="Πώς Λειτουργεί"
        title="Από την εγγραφή στα κέρδη σε 4 βήματα"
      />

      <div
        style={{
          display:             "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap:                 "1.5rem",
        }}
      >
        {steps.map((step, idx) => (
          <div
            key={step.n}
            style={{
              backgroundColor: "#fff",
              borderRadius:    "14px",
              padding:         "1.75rem",
              border:          "1.5px solid var(--color-border)",
              position:        "relative",
            }}
          >
            {/* Step number */}
            <div
              style={{
                width:           "36px",
                height:          "36px",
                borderRadius:    "10px",
                backgroundColor: "var(--color-primary)",
                color:           "#fff",
                fontWeight:      800,
                fontSize:        "1rem",
                display:         "flex",
                alignItems:      "center",
                justifyContent:  "center",
                marginBottom:    "1rem",
              }}
            >
              {step.n}
            </div>

            {/* Connector arrow (except last) */}
            {idx < steps.length - 1 && (
              <div
                aria-hidden="true"
                className="hidden lg:block"
                style={{
                  position:  "absolute",
                  top:       "2.25rem",
                  right:     "-0.875rem",
                  color:     "var(--color-border)",
                  fontSize:  "1.25rem",
                  zIndex:    1,
                }}
              >
                →
              </div>
            )}

            <p style={{ fontSize: "1.75rem", margin: "0 0 0.625rem" }}>{step.emoji}</p>
            <h3
              style={{
                fontWeight:   700,
                fontSize:     "1rem",
                color:        "var(--color-text)",
                margin:       "0 0 0.5rem",
              }}
            >
              {step.title}
            </h3>
            <p
              style={{
                fontSize:   "0.875rem",
                color:      "var(--color-text-muted)",
                lineHeight: 1.6,
                margin:     0,
              }}
            >
              {step.desc}
            </p>
          </div>
        ))}
      </div>
    </Section>
  );
}

// =============================================================
// 5. FEATURES GRID
// =============================================================
function FeaturesSection() {
  const features = [
    {
      icon:  "📞",
      title: "Τηλέφωνο ή Online Κράτηση",
      desc:  "Επίλεξε πώς θέλεις να δέχεσαι πελάτες: μόνο τηλέφωνο, ημερομηνία ή πλήρες ημερολόγιο.",
    },
    {
      icon:  "⭐",
      title: "Σύστημα Κριτικών με Βαρύτητα",
      desc:  "Επαληθευμένες κριτικές από κρατήσεις έχουν 4× βαρύτητα. Η φήμη σου οικοδομείται γρήγορα.",
    },
    {
      icon:  "🗓️",
      title: "Ημερολόγιο & Ωράριο",
      desc:  "Ορίσε τη διαθεσιμότητά σου. Αυτόματη απόρριψη εκτός ωραρίου. Διακοπές με ένα κλικ.",
    },
    {
      icon:  "🛍️",
      title: "Online Shop (Beauty)",
      desc:  "Πώλησε προϊόντα μαζί με τις υπηρεσίες σου. Για κατηγορίες ομορφιάς, ετήσιο πλάνο.",
    },
    {
      icon:  "📊",
      title: "Στατιστικά Προφίλ",
      desc:  "Προβολές, κλήσεις, κρατήσεις — δες πώς σε βρίσκουν οι πελάτες. Σύντομα.",
    },
    {
      icon:  "🔒",
      title: "Κλείδωμα Τιμής για Πάντα",
      desc:  "Οι πρώτοι 50 κλειδώνουν τη σημερινή τιμή για πάντα, ακόμα κι αν ανέβουν οι τιμές.",
    },
  ];

  return (
    <Section>
      <SectionHeading
        label="Χαρακτηριστικά"
        title="Όλα όσα χρειάζεσαι για να αναπτύξεις την πελατεία σου"
      />

      <div
        style={{
          display:             "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap:                 "1.125rem",
        }}
      >
        {features.map((f) => (
          <div
            key={f.title}
            style={{
              display:         "flex",
              gap:             "1rem",
              padding:         "1.375rem",
              backgroundColor: "#fff",
              border:          "1.5px solid var(--color-border)",
              borderRadius:    "12px",
              alignItems:      "flex-start",
            }}
          >
            <span style={{ fontSize: "1.75rem", flexShrink: 0, lineHeight: 1 }}>{f.icon}</span>
            <div>
              <h3
                style={{
                  fontWeight:   700,
                  fontSize:     "0.9375rem",
                  color:        "var(--color-text)",
                  margin:       "0 0 0.375rem",
                }}
              >
                {f.title}
              </h3>
              <p
                style={{
                  fontSize:   "0.8375rem",
                  color:      "var(--color-text-muted)",
                  lineHeight: 1.55,
                  margin:     0,
                }}
              >
                {f.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

// =============================================================
// 6. FINAL CTA
// =============================================================
function FinalCTA() {
  return (
    <section
      style={{
        background:  "linear-gradient(145deg, #1a5f5f 0%, var(--color-primary) 100%)",
        padding:     "5rem 1.5rem",
        textAlign:   "center",
        color:       "#fff",
      }}
    >
      <div style={{ maxWidth: "560px", margin: "0 auto" }}>
        <p style={{ fontSize: "2.5rem", margin: "0 0 1rem" }}>🚀</p>
        <h2
          style={{
            fontSize:   "clamp(1.75rem, 5vw, 2.5rem)",
            fontWeight: 900,
            margin:     "0 0 1rem",
            lineHeight: 1.15,
          }}
        >
          Έτοιμος να ξεκινήσεις;
        </h2>
        <p
          style={{
            fontSize:     "1.0625rem",
            opacity:      0.9,
            margin:       "0 0 2rem",
            lineHeight:   1.6,
          }}
        >
          Εγγράψου σε 2 λεπτά. Δεν χρειάζεσαι πιστωτική κάρτα.
          <br />
          Τα 3 πρώτα μήνα είναι εντελώς δωρεάν.
        </p>

        <Link
          href="/register/professional"
          style={{
            display:         "inline-flex",
            alignItems:      "center",
            gap:             "0.625rem",
            padding:         "1rem 2.25rem",
            backgroundColor: "var(--color-accent)",
            color:           "#fff",
            borderRadius:    "12px",
            fontWeight:      800,
            fontSize:        "1.125rem",
            textDecoration:  "none",
            boxShadow:       "0 6px 24px rgba(0,0,0,0.3)",
            marginBottom:    "1rem",
          }}
        >
          Ξεκίνα Δωρεάν
          <ArrowRight size={20} />
        </Link>

        <p style={{ opacity: 0.75, fontSize: "0.8125rem", margin: "0.75rem 0 0" }}>
          Δεν χρειάζεται πιστωτική κάρτα &nbsp;·&nbsp; Ακύρωση οποτεδήποτε
        </p>
      </div>
    </section>
  );
}

// =============================================================
// PAGE EXPORT
// =============================================================
export default async function ProfessionalsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <main>
      <Hero />
      <ComparisonSection />
      <PricingSection />
      <HowItWorksSection />
      <FeaturesSection />
      <FinalCTA />
    </main>
  );
}
