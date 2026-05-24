// =============================================================
// components/home/HeroSection.tsx
// =============================================================
// Full-width hero section for the Trustia.gr homepage.
//
// "use client" because:
//   - Controlled form inputs (category, location state)
//   - useRouter for programmatic navigation on search submit
//
// Visual design:
//   - Deep-teal → brand-teal diagonal gradient background
//   - Two decorative semi-transparent circles (no external images)
//   - Centered content block: badge → headline → subtitle → search
//   - Search form: white elevated card with grouped category <select>
//     and location text input → /services?category=X&location=Y
//   - Trust strip below the form
// =============================================================

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { CATEGORIES } from "@/lib/constants";

// Pre-split by tier so JSX stays clean
const CAT_LIGHT       = CATEGORIES.filter((c) => c.tier === "light");
const CAT_TRADES      = CATEGORIES.filter((c) => c.tier === "trades");
const CAT_SPECIALISTS = CATEGORIES.filter((c) => c.tier === "specialists");

// Inline chevron SVG used as the <select> arrow (pure CSS, no img)
const CHEVRON_BG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`;

export default function HeroSection() {
  const router = useRouter();
  const [category, setCategory] = useState<string>("");
  const [location, setLocation]  = useState<string>("");

  /** Push to /services with any chosen filters */
  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (category)        params.set("category", category);
    if (location.trim()) params.set("location",  location.trim());
    router.push(`/services?${params.toString()}`);
  }

  return (
    <section
      style={{
        position: "relative",
        overflow: "hidden",
        // Deep teal → brand teal diagonal gradient — no external images
        background: "linear-gradient(135deg, #0C5252 0%, #1A7070 45%, #2A8F8F 100%)",
        padding: "5rem 1.5rem 6rem",
      }}
    >
      {/* ── Decorative circles (CSS only, aria-hidden) ── */}
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "-100px",
          right: "-100px",
          width: "480px",
          height: "480px",
          borderRadius: "50%",
          background: "rgba(255,255,255,0.045)",
          pointerEvents: "none",
        }}
      />
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          bottom: "-140px",
          left: "-80px",
          width: "400px",
          height: "400px",
          borderRadius: "50%",
          background: "rgba(255,255,255,0.03)",
          pointerEvents: "none",
        }}
      />

      {/* ── Main content ── */}
      <div
        style={{
          maxWidth: "780px",
          margin: "0 auto",
          textAlign: "center",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Founding-member badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            backgroundColor: "rgba(255,255,255,0.12)",
            border: "1px solid rgba(255,255,255,0.22)",
            borderRadius: "99px",
            padding: "0.35rem 1rem",
            marginBottom: "1.5rem",
            fontSize: "0.8125rem",
            fontWeight: 600,
            color: "rgba(255,255,255,0.92)",
            letterSpacing: "0.01em",
          }}
        >
          🎉 3 μήνες ΔΩΡΕΑΝ για νέους επαγγελματίες
        </div>

        {/* H1 — main value proposition */}
        <h1
          style={{
            color: "#ffffff",
            fontSize: "clamp(2rem, 5.5vw, 3.75rem)",
            fontWeight: 800,
            letterSpacing: "-0.035em",
            lineHeight: 1.1,
            margin: "0 0 1rem",
          }}
        >
          Βρες τον ειδικό για κάθε ανάγκη
        </h1>

        {/* Subtitle */}
        <p
          style={{
            color: "rgba(255,255,255,0.78)",
            fontSize: "clamp(1rem, 2.5vw, 1.175rem)",
            lineHeight: 1.65,
            margin: "0 0 2.5rem",
          }}
        >
          51 κατηγορίες υπηρεσιών&nbsp;•&nbsp;0% προμήθεια για επαγγελματίες
        </p>

        {/* ── Search form ── */}
        <form
          onSubmit={handleSearch}
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.625rem",
            alignItems: "stretch",
            background: "#ffffff",
            borderRadius: "16px",
            padding: "0.625rem",
            boxShadow: "0 8px 48px rgba(0,0,0,0.22)",
          }}
        >
          {/* Category <select> — grouped by tier */}
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-label="Επιλογή κατηγορίας"
            style={{
              flex: "2 1 200px",
              border: "1.5px solid var(--color-border)",
              borderRadius: "10px",
              padding: "0.75rem 2.25rem 0.75rem 1rem",
              fontSize: "0.9375rem",
              color: category ? "var(--color-text)" : "var(--color-text-muted)",
              backgroundColor: "#fff",
              cursor: "pointer",
              outline: "none",
              // Custom arrow chevron via inline SVG data-URI
              appearance: "none",
              WebkitAppearance: "none",
              backgroundImage: CHEVRON_BG,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 0.75rem center",
            }}
          >
            <option value="">Όλες οι κατηγορίες</option>

            <optgroup label="Καθαρισμός & Ελαφριές">
              {CAT_LIGHT.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.emoji} {c.nameEl}
                </option>
              ))}
            </optgroup>

            <optgroup label="Τεχνικά & Ομορφιά">
              {CAT_TRADES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.emoji} {c.nameEl}
                </option>
              ))}
            </optgroup>

            <optgroup label="Ειδικοί">
              {CAT_SPECIALISTS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.emoji} {c.nameEl}
                </option>
              ))}
            </optgroup>
          </select>

          {/* Vertical divider — visible only on md+ */}
          <span
            aria-hidden="true"
            className="hidden md:block"
            style={{
              width: "1px",
              alignSelf: "stretch",
              margin: "0.25rem 0",
              backgroundColor: "var(--color-border)",
            }}
          />

          {/* Location text input */}
          <input
            type="text"
            placeholder="π.χ. Θεσσαλονίκη"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            aria-label="Τοποθεσία"
            style={{
              flex: "1 1 150px",
              border: "1.5px solid var(--color-border)",
              borderRadius: "10px",
              padding: "0.75rem 1rem",
              fontSize: "0.9375rem",
              color: "var(--color-text)",
              outline: "none",
              backgroundColor: "#fff",
              transition: "border-color 0.15s",
            }}
            onFocus={(e)  => { e.currentTarget.style.borderColor = "var(--color-primary)"; }}
            onBlur={(e)   => { e.currentTarget.style.borderColor = "var(--color-border)"; }}
          />

          {/* Submit button */}
          <button
            type="submit"
            style={{
              flex: "0 0 auto",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.75rem 1.5rem",
              backgroundColor: "var(--color-primary)",
              color: "#ffffff",
              border: "none",
              borderRadius: "10px",
              fontSize: "0.9375rem",
              fontWeight: 700,
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "background-color 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--color-primary-dark)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "var(--color-primary)"; }}
          >
            <Search size={18} />
            Αναζήτηση
          </button>
        </form>

        {/* ── Trust strip ── */}
        <ul
          aria-label="Πλεονεκτήματα"
          style={{
            display: "flex",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: "1.25rem 2rem",
            marginTop: "1.75rem",
            listStyle: "none",
            padding: 0,
            margin: "1.75rem 0 0",
          }}
        >
          {[
            "✓ Δωρεάν για πελάτες",
            "✓ 51 κατηγορίες",
            "✓ Αξιόπιστες κριτικές",
          ].map((item) => (
            <li
              key={item}
              style={{
                color: "rgba(255,255,255,0.85)",
                fontSize: "0.875rem",
                fontWeight: 500,
              }}
            >
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
