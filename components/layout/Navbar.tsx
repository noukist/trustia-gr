// =============================================================
// components/layout/Navbar.tsx
// =============================================================
// Sticky top navigation bar for Trustia.gr.
//
// "use client" is required because this component:
//   - Tracks scroll position to add a shadow when the user scrolls
//   - Manages the mobile drawer open/close state
//
// Structure:
//   <header>            — sticky wrapper with scroll shadow
//     <nav>             — centered container (max-w 1200px)
//       Logo            — TRUSTIA.GR, links to /
//       Desktop Links   — hidden on mobile (md:flex)
//       Desktop CTA     — Σύνδεση button, hidden on mobile
//       Hamburger       — visible only on mobile (md:hidden)
//   Backdrop            — dark overlay behind the open drawer
//   Drawer              — slides in from the right on mobile
// =============================================================

"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, X, LogIn } from "lucide-react";

// ---------------------------------------------------------------
// Navigation links — edit here to add/remove nav items
// ---------------------------------------------------------------
const NAV_LINKS = [
  { href: "/services",     label: "Υπηρεσίες" },
  { href: "/professionals", label: "Για Επαγγελματίες" },
  { href: "/how-it-works", label: "Πώς Λειτουργεί" },
] as const;

// ---------------------------------------------------------------
// Component
// ---------------------------------------------------------------
export default function Navbar() {
  // Whether the mobile drawer is open
  const [drawerOpen, setDrawerOpen] = useState(false);
  // Whether the user has scrolled down (used to add shadow / border)
  const [scrolled, setScrolled] = useState(false);

  // Listen for scroll to apply the sticky shadow effect
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 6);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  const closeDrawer = () => setDrawerOpen(false);

  return (
    <>
      {/* ── Sticky header ── */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          backgroundColor: "#ffffff",
          // Border and shadow appear only after scrolling
          borderBottom: `1px solid ${scrolled ? "var(--color-border)" : "transparent"}`,
          boxShadow: scrolled ? "0 2px 16px rgba(0,0,0,0.07)" : "none",
          transition: "border-color 0.2s ease, box-shadow 0.2s ease",
        }}
      >
        {/* Max-width container */}
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "0 1.5rem",
            height: "64px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1.5rem",
          }}
        >
          {/* ── Logo ── */}
          <Link
            href="/"
            aria-label="Trustia.gr — Αρχική"
            style={{ textDecoration: "none", flexShrink: 0 }}
          >
            <span
              style={{
                fontSize: "1.375rem",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                lineHeight: 1,
                color: "var(--color-primary)",
              }}
            >
              TRUSTIA
              <span style={{ color: "var(--color-accent)" }}>.GR</span>
            </span>
          </Link>

          {/* ── Desktop nav links (hidden on mobile) ── */}
          <nav
            aria-label="Κύρια πλοήγηση"
            className="hidden md:flex"
            style={{ alignItems: "center", gap: "2rem", flex: 1 }}
          >
            {NAV_LINKS.map(({ href, label }) => (
              <NavLink key={href} href={href}>
                {label}
              </NavLink>
            ))}
          </nav>

          {/* ── Desktop CTA: Σύνδεση (hidden on mobile) ── */}
          <div
            className="hidden md:flex"
            style={{ alignItems: "center", flexShrink: 0 }}
          >
            <LoginButton />
          </div>

          {/* ── Mobile hamburger button (hidden on desktop) ── */}
          <button
            className="md:hidden"
            aria-label={drawerOpen ? "Κλείσιμο μενού" : "Άνοιγμα μενού"}
            aria-expanded={drawerOpen}
            onClick={() => setDrawerOpen((v) => !v)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "0.375rem",
              color: "var(--color-text)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "8px",
              flexShrink: 0,
            }}
          >
            {drawerOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* ── Mobile backdrop ── */}
      {/* Clicking the backdrop closes the drawer */}
      <div
        aria-hidden="true"
        onClick={closeDrawer}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 48,
          backgroundColor: "rgba(0, 0, 0, 0.35)",
          // Fade in when open, invisible and non-interactive when closed
          opacity: drawerOpen ? 1 : 0,
          pointerEvents: drawerOpen ? "auto" : "none",
          transition: "opacity 0.25s ease",
        }}
      />

      {/* ── Mobile slide-out drawer ── */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Μενού πλοήγησης"
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          zIndex: 49,
          // Responsive width: 320px on larger phones, 85% on very small screens
          width: "min(320px, 85vw)",
          backgroundColor: "#ffffff",
          boxShadow: "-4px 0 32px rgba(0, 0, 0, 0.12)",
          display: "flex",
          flexDirection: "column",
          // Slide in from right
          transform: drawerOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {/* Drawer header: logo + close button */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "1rem 1.25rem",
            borderBottom: "1px solid var(--color-border)",
          }}
        >
          <Link
            href="/"
            onClick={closeDrawer}
            style={{ textDecoration: "none" }}
            aria-label="Trustia.gr — Αρχική"
          >
            <span
              style={{
                fontSize: "1.15rem",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                color: "var(--color-primary)",
              }}
            >
              TRUSTIA
              <span style={{ color: "var(--color-accent)" }}>.GR</span>
            </span>
          </Link>

          <button
            aria-label="Κλείσιμο μενού"
            onClick={closeDrawer}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--color-text-muted)",
              padding: "0.25rem",
              display: "flex",
              alignItems: "center",
              borderRadius: "6px",
            }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Drawer nav links */}
        <nav
          aria-label="Πλοήγηση"
          style={{ flex: 1, overflowY: "auto", padding: "0.5rem 0" }}
        >
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={closeDrawer}
              style={{
                display: "block",
                padding: "0.9rem 1.25rem",
                color: "var(--color-text)",
                textDecoration: "none",
                fontSize: "1rem",
                fontWeight: 500,
                borderBottom: "1px solid var(--color-bg-light)",
                transition: "background-color 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--color-primary-bg)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Drawer footer: Σύνδεση CTA */}
        <div
          style={{
            padding: "1.25rem",
            borderTop: "1px solid var(--color-border)",
          }}
        >
          <Link
            href="/login"
            onClick={closeDrawer}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              padding: "0.75rem",
              border: "1.5px solid var(--color-primary)",
              borderRadius: "10px",
              color: "var(--color-primary)",
              textDecoration: "none",
              fontSize: "0.9375rem",
              fontWeight: 600,
              backgroundColor: "transparent",
              transition: "background-color 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--color-primary-bg)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <LogIn size={18} />
            Σύνδεση
          </Link>
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------
// Sub-components — kept here to avoid unnecessary file splitting
// ---------------------------------------------------------------

/** Desktop nav link with hover color change */
function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      style={{
        color: "var(--color-text-muted)",
        textDecoration: "none",
        fontSize: "0.9375rem",
        fontWeight: 500,
        whiteSpace: "nowrap",
        transition: "color 0.15s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = "var(--color-primary)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = "var(--color-text-muted)";
      }}
    >
      {children}
    </Link>
  );
}

/** Desktop Σύνδεση button */
function LoginButton() {
  return (
    <Link
      href="/login"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.375rem",
        padding: "0.5rem 1.125rem",
        borderRadius: "8px",
        border: "1.5px solid var(--color-primary)",
        color: "var(--color-primary)",
        backgroundColor: "transparent",
        fontSize: "0.9rem",
        fontWeight: 600,
        textDecoration: "none",
        whiteSpace: "nowrap",
        transition: "background-color 0.15s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "var(--color-primary-bg)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "transparent";
      }}
    >
      <LogIn size={15} />
      Σύνδεση
    </Link>
  );
}
