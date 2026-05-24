// =============================================================
// app/page.tsx — Homepage placeholder (Coming Soon)
// =============================================================
// This is a temporary Server Component that will be replaced
// with the full homepage once we build the components.
//
// Uses only inline CSS variables from globals.css — no external
// components or Tailwind classes that might not resolve yet.
// =============================================================

export default function HomePage() {
  return (
    <main
      style={{
        // Full viewport height, centered content
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        // Subtle teal background tint from brand palette
        backgroundColor: "var(--color-bg-light)",
        padding: "2rem",
        textAlign: "center",
      }}
    >
      {/* ── Logo / Brand mark ── */}
      <div
        style={{
          marginBottom: "2rem",
        }}
      >
        {/* Teal circle as a temporary logo placeholder */}
        <div
          style={{
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            backgroundColor: "var(--color-primary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 1.5rem",
            boxShadow: "0 4px 24px rgba(42, 143, 143, 0.3)",
          }}
        >
          {/* "T" initial as a stand-in until the real logo SVG is wired in */}
          <span
            style={{
              color: "#ffffff",
              fontSize: "2rem",
              fontWeight: "700",
              letterSpacing: "-0.05em",
            }}
          >
            T
          </span>
        </div>

        {/* Brand name */}
        <h1
          style={{
            fontSize: "clamp(2rem, 5vw, 3.5rem)",
            fontWeight: "700",
            color: "var(--color-primary)",
            margin: "0 0 0.5rem",
            letterSpacing: "-0.02em",
            lineHeight: "1.1",
          }}
        >
          TRUSTIA.GR
        </h1>

        {/* Gold divider */}
        <div
          style={{
            width: "60px",
            height: "4px",
            backgroundColor: "var(--color-accent)",
            borderRadius: "2px",
            margin: "1rem auto",
          }}
        />
      </div>

      {/* ── Coming Soon card ── */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          padding: "2.5rem 3rem",
          maxWidth: "480px",
          width: "100%",
          boxShadow: "0 2px 20px rgba(0, 0, 0, 0.08)",
          border: "1px solid var(--color-border)",
        }}
      >
        {/* Greek tagline */}
        <p
          style={{
            fontSize: "1.25rem",
            fontWeight: "500",
            color: "var(--color-text)",
            margin: "0 0 0.75rem",
          }}
        >
          Βρες τον ειδικό για κάθε ανάγκη
        </p>

        {/* English subtitle */}
        <p
          style={{
            fontSize: "0.9rem",
            color: "var(--color-text-muted)",
            margin: "0 0 2rem",
          }}
        >
          Find the right professional for every need
        </p>

        {/* Status badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            backgroundColor: "var(--color-primary-bg)",
            color: "var(--color-primary-dark)",
            borderRadius: "99px",
            padding: "0.5rem 1.25rem",
            fontSize: "0.875rem",
            fontWeight: "600",
            border: "1px solid var(--color-primary-light)",
          }}
        >
          {/* Pulsing dot to indicate active development */}
          <span
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: "var(--color-primary)",
              display: "inline-block",
              animation: "pulse 2s infinite",
            }}
          />
          Coming Soon — Σύντομα
        </div>
      </div>

      {/* ── Footer note ── */}
      <p
        style={{
          marginTop: "3rem",
          fontSize: "0.8rem",
          color: "var(--color-text-muted)",
        }}
      >
        Trustia.gr &copy; {new Date().getFullYear()} &mdash; Αθήνα, Ελλάδα
      </p>

      {/* Pulse animation for the status dot */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(0.85); }
        }
      `}</style>
    </main>
  );
}
