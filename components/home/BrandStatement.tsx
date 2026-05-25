// =============================================================
// components/home/BrandStatement.tsx
// =============================================================
// Mission/values strip shown between the Hero and CategoryGrid.
// Server Component — no client JS.
//
// Purpose: builds trust in 3 seconds. The visitor learns what
// Trustia.gr stands for before they even start searching.
// Content comes directly from the business plan (Option C).
//
// Design: left teal-border accent card, mission headline,
// two-sentence explanation, four green-dot value pills.
// =============================================================

import { getTranslations } from "next-intl/server";
import { CheckCircle2 } from "lucide-react";

export default async function BrandStatement() {
  const t = await getTranslations("home");

  const PILLARS = [
    t("brandPillar1"),
    t("brandPillar2"),
    t("brandPillar3"),
    t("brandPillar4"),
  ];

  return (
    <section
      style={{
        backgroundColor: "#ffffff",
        padding: "3rem 1.5rem 2rem",
      }}
    >
      <div
        style={{
          maxWidth: "860px",
          margin: "0 auto",
          // Left teal border accent
          borderLeft: "4px solid var(--color-primary)",
          paddingLeft: "1.75rem",
        }}
      >
        {/* Mission headline */}
        <p
          style={{
            fontSize: "clamp(1.1rem, 2.5vw, 1.375rem)",
            fontWeight: 800,
            color: "var(--color-primary)",
            margin: "0 0 0.875rem",
            letterSpacing: "-0.02em",
            lineHeight: 1.3,
          }}
        >
          {t("brandMission")}
        </p>

        {/* Explanation */}
        <p
          style={{
            fontSize: "0.9375rem",
            color: "var(--color-text-muted)",
            lineHeight: 1.75,
            margin: "0 0 1.25rem",
            maxWidth: "680px",
          }}
        >
          {t("brandExplain")}
        </p>

        {/* Value pills */}
        <ul
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.875rem",
            listStyle: "none",
            padding: 0,
            margin: 0,
          }}
        >
          {PILLARS.map((pillar) => (
            <li
              key={pillar}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.375rem",
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "var(--color-text-muted)",
              }}
            >
              <CheckCircle2
                size={15}
                style={{ color: "#27AE60", flexShrink: 0 }}
                aria-hidden="true"
              />
              {pillar}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
