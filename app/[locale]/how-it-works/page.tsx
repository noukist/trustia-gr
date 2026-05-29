// =============================================================
// app/[locale]/how-it-works/page.tsx
// =============================================================
// "Πώς Λειτουργεί" — explainer page for customers AND professionals.
// Fully static, publicly accessible.
//
// i18n: all sub-components are sync Server Components so they use
// useTranslations() (from "next-intl") directly — no prop drilling.
//
// SECTIONS
//   1. Hero           — dual-audience headline + jump links
//   2. Customer steps — 4-step process for finding & booking
//   3. Pro steps      — 4-step process for signing up & earning
//   4. Booking modes  — three cards explaining Contact/Date/Full
//   5. FAQ accordion  — 6 questions via native <details>/<summary>
//   6. Dual CTA       — bottom row for customers + professionals
// =============================================================

import React       from "react";
import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { ArrowRight, Phone, Calendar, CalendarDays } from "lucide-react";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "howItWorks" });
  return {
    title: t("heroTitle1"),   // "Πώς Λειτουργεί" — layout adds "| Trustia.gr"
    description: t("subtitle"),
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
        position:      "relative",
        display:       "flex",
        flexDirection: "column",
        gap:           "0.875rem",
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
            fontWeight: 700,
            fontSize:   "1rem",
            color:      "var(--color-text)",
            margin:     "0 0 0.4rem",
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
  const t = useTranslations("howItWorks");
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
          {t("heroBadge")}
        </span>

        <h1
          style={{
            fontSize:      "clamp(2rem, 6vw, 3rem)",
            fontWeight:    900,
            lineHeight:    1.1,
            margin:        "0 0 1rem",
            letterSpacing: "-0.02em",
          }}
        >
          {t("heroTitle1")}
          <br />
          <span style={{ color: "#D4F0F0" }}>{t("heroTitle2")}</span>
        </h1>

        <p
          style={{
            fontSize:   "clamp(1rem, 2.5vw, 1.1875rem)",
            opacity:    0.92,
            lineHeight: 1.6,
            margin:     "0 0 2rem",
          }}
        >
          {t("heroSub1")}
          <br />
          {t("heroSub2")}
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
            {t("heroForCustomers")}
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
            {t("heroForProfessionals")}
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
  const t = useTranslations("howItWorks");

  // Built inside the component so t() is available
  const steps = [
    { emoji: "🔍", title: t("customerStep1Title"), desc: t("customerStep1Desc") },
    { emoji: "📋", title: t("customerStep2Title"), desc: t("customerStep2Desc") },
    { emoji: "📞", title: t("customerStep3Title"), desc: t("customerStep3Desc") },
    { emoji: "⭐", title: t("customerStep4Title"), desc: t("customerStep4Desc") },
  ];

  return (
    <section
      id="customers"
      style={{ padding: "5rem 1.5rem", backgroundColor: "#fff" }}
    >
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <SectionHeading
          label={t("customerLabel")}
          title={t("customerTitle")}
          sub={t("customerSub")}
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
              key={i}
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
            {t("customerCta")}
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
  const t = useTranslations("howItWorks");

  const steps = [
    { emoji: "✍️", title: t("proPageStep1Title"), desc: t("proPageStep1Desc") },
    { emoji: "🪪",  title: t("proPageStep2Title"), desc: t("proPageStep2Desc") },
    { emoji: "📲", title: t("proPageStep3Title"), desc: t("proPageStep3Desc") },
    { emoji: "💰", title: t("proPageStep4Title"), desc: t("proPageStep4Desc") },
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
          label={t("proLabel")}
          title={t("proPageTitle")}
          sub={t("proPageSub")}
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
              key={i}
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
            {t("proPageCta")}
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
  const t = useTranslations("howItWorks");

  // "badge" values are English code names — intentionally not translated
  const modes = [
    {
      icon:    <Phone size={28} style={{ color: "var(--color-primary)" }} />,
      title:   t("mode1Title"),
      badge:   "Contact Only",
      who:     t("mode1Who"),
      sees:    t("mode1Sees"),
      needs:   t("mode1Needs"),
      color:   "#6B7280",
      bgColor: "rgba(107,114,128,0.07)",
    },
    {
      icon:    <Calendar size={28} style={{ color: "#D97706" }} />,
      title:   t("mode2Title"),
      badge:   "Date Booking",
      who:     t("mode2Who"),
      sees:    t("mode2Sees"),
      needs:   t("mode2Needs"),
      color:   "#D97706",
      bgColor: "rgba(217,119,6,0.07)",
    },
    {
      icon:      <CalendarDays size={28} style={{ color: "var(--color-primary)" }} />,
      title:     t("mode3Title"),
      badge:     "Full Calendar",
      who:       t("mode3Who"),
      sees:      t("mode3Sees"),
      needs:     t("mode3Needs"),
      color:     "var(--color-primary)",
      bgColor:   "var(--color-primary-bg)",
      highlight: true,
    },
  ];

  return (
    <section style={{ padding: "5rem 1.5rem", backgroundColor: "#fff" }}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <SectionHeading
          label={t("modesLabel")}
          title={t("modesTitle")}
          sub={t("modesSub")}
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
              key={mode.badge}
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
              {/* Badge (English code name) */}
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
                  fontSize:      "0.775rem",
                  fontWeight:    600,
                  color:         "var(--color-text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  margin:        "0 0 0.5rem",
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
                  fontSize:    "0.775rem",
                  color:       "var(--color-text-muted)",
                  margin:      0,
                  paddingTop:  "0.75rem",
                  borderTop:   "1px solid var(--color-border)",
                  display:     "flex",
                  alignItems:  "center",
                  gap:         "0.3rem",
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
// SECTION 5 — FAQ ACCORDION
// =============================================================
// Uses native <details>/<summary> — zero JS, accessible, works
// as a Server Component. Answers expand on click without hydration.
// =============================================================
function FAQ() {
  const t = useTranslations("howItWorks");

  // Build FAQ items from message keys
  const items = [
    { q: t("faq1Q"), a: t("faq1A") },
    { q: t("faq2Q"), a: t("faq2A") },
    { q: t("faq3Q"), a: t("faq3A") },
    { q: t("faq4Q"), a: t("faq4A") },
    { q: t("faq5Q"), a: t("faq5A") },
    { q: t("faq6Q"), a: t("faq6A") },
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
          label={t("faqLabel")}
          title={t("faqTitle")}
        />

        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {items.map((item, i) => (
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
                  listStyle:      "none",
                  display:        "flex",
                  justifyContent: "space-between",
                  alignItems:     "center",
                  gap:            "1rem",
                  userSelect:     "none",
                }}
              >
                {item.q}
                <span
                  aria-hidden="true"
                  style={{
                    flexShrink: 0,
                    fontSize:   "1.1rem",
                    color:      "var(--color-text-muted)",
                    lineHeight: 1,
                  }}
                >
                  ﹢
                </span>
              </summary>

              <p
                style={{
                  padding:    "1rem 1.375rem 1.125rem",
                  margin:     0,
                  fontSize:   "0.9rem",
                  color:      "var(--color-text-muted)",
                  lineHeight: 1.7,
                  borderTop:  "1px solid var(--color-border)",
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
  const t = useTranslations("howItWorks");
  return (
    <section style={{ padding: "5rem 1.5rem", backgroundColor: "#fff" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <h2
          style={{
            textAlign:  "center",
            fontSize:   "clamp(1.5rem, 4vw, 2rem)",
            fontWeight: 800,
            color:      "var(--color-text)",
            margin:     "0 0 2.5rem",
            lineHeight: 1.2,
          }}
        >
          {t("dualCtaTitle")}
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
                  fontWeight: 800,
                  fontSize:   "1.125rem",
                  color:      "var(--color-text)",
                  margin:     "0 0 0.375rem",
                }}
              >
                {t("dualCtaCustomerTitle")}
              </h3>
              <p
                style={{
                  fontSize:   "0.875rem",
                  color:      "var(--color-text-muted)",
                  margin:     0,
                  lineHeight: 1.5,
                }}
              >
                {t("dualCtaCustomerDesc")}
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
              {t("dualCtaCustomerBtn")}
              <ArrowRight size={16} />
            </Link>
            <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", margin: 0 }}>
              {t("dualCtaCustomerNote")}
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
                  fontWeight: 800,
                  fontSize:   "1.125rem",
                  color:      "#fff",
                  margin:     "0 0 0.375rem",
                }}
              >
                {t("dualCtaProTitle")}
              </h3>
              <p
                style={{
                  fontSize:   "0.875rem",
                  opacity:    0.9,
                  margin:     0,
                  lineHeight: 1.5,
                }}
              >
                {t("dualCtaProDesc")}
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
              {t("dualCtaProBtn")}
              <ArrowRight size={16} />
            </Link>
            <p style={{ fontSize: "0.75rem", opacity: 0.8, margin: 0 }}>
              {t("dualCtaProNote")}
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
