// =============================================================
// Navbar.tsx — Top navigation bar for Mastori.gr
// =============================================================
// This component appears on EVERY page of the website.
// It contains:
// - The Mastori.gr logo (clickable, goes to homepage)
// - Navigation links (Services, For Pros, How it Works)
// - Login button
// - Language toggle (EL/EN)
// - Mobile hamburger menu (shows on small screens)
//
// The navbar is "sticky" — it stays at the top when you scroll.
// It also has a subtle backdrop blur for a modern feel.
// =============================================================

"use client"; // This tells Next.js this component runs in the browser
              // (needed because we use useState for the mobile menu)

import { useState } from "react";
import Link from "next/link";
import { BRAND } from "@/lib/constants";

// -------------------------------------------------------------
// Props interface — what the parent component can pass to Navbar
// For now, just the language setting
// -------------------------------------------------------------
interface NavbarProps {
  /** Current language: "el" for Greek, "en" for English */
  lang: "el" | "en";
  /** Function to toggle language */
  onToggleLang: () => void;
}

export default function Navbar({ lang, onToggleLang }: NavbarProps) {
  // State to control whether the mobile menu is open or closed
  // On desktop, the menu is always visible. On mobile, it's hidden
  // until the user taps the hamburger icon (☰)
  const [menuOpen, setMenuOpen] = useState(false);

  // Helper function to translate text based on current language
  // Usage: t("Αρχική", "Home") → returns "Αρχική" if Greek, "Home" if English
  const t = (el: string, en: string) => (lang === "el" ? el : en);

  return (
    <nav
      className="
        sticky top-0 z-50          /* Stays at top when scrolling */
        flex items-center           /* Horizontal layout, vertically centered */
        justify-between             /* Logo on left, links on right */
        px-4 py-3                   /* Padding: 16px horizontal, 12px vertical */
        bg-white/90                 /* White background with slight transparency */
        backdrop-blur-md            /* Blur content behind the navbar */
        border-b border-gray-200    /* Subtle bottom border */
      "
    >
      {/* ─── LOGO ─── */}
      {/* Clicking the logo always takes you back to the homepage */}
      <Link
        href="/"
        className="flex items-center gap-2"
        onClick={() => setMenuOpen(false)} // Close mobile menu when clicking logo
      >
        {/* Main brand name in navy blue */}
        <span
          className="text-2xl font-black"
          style={{ color: "var(--color-primary)" }}
        >
          MASTORI
        </span>
        {/* The .gr suffix in lighter gray */}
        <span className="text-xs text-gray-400">.gr</span>
      </Link>

      {/* ─── DESKTOP NAVIGATION ─── */}
      {/* These links are hidden on mobile (hidden) and shown on medium+ screens (md:flex) */}
      <div className="hidden md:flex items-center gap-6 text-sm">
        {/* Each link navigates to a different page */}
        <Link
          href="/services"
          className="text-gray-600 hover:text-[var(--color-primary)] transition-colors"
        >
          {t("Υπηρεσίες", "Services")}
        </Link>

        <Link
          href="/pricing"
          className="text-gray-600 hover:text-[var(--color-primary)] transition-colors"
        >
          {t("Για Επαγγελματίες", "For Pros")}
        </Link>

        <Link
          href="/how-it-works"
          className="text-gray-600 hover:text-[var(--color-primary)] transition-colors"
        >
          {t("Πώς Λειτουργεί", "How It Works")}
        </Link>

        {/* Login button — styled differently to stand out */}
        <Link
          href="/login"
          className="
            px-3 py-1.5
            bg-[var(--color-primary)] text-white
            rounded-lg text-sm
            hover:bg-[var(--color-primary-light)]
            transition-colors
          "
        >
          {t("Σύνδεση", "Login")}
        </Link>

        {/* Language toggle button */}
        {/* Shows "EN" when in Greek mode, "ΕΛ" when in English mode */}
        <button
          onClick={onToggleLang}
          className="
            text-xs border rounded px-2 py-1
            text-gray-500 hover:text-gray-700
            hover:border-gray-400
            transition-colors
          "
        >
          {lang === "el" ? "EN" : "ΕΛ"}
        </button>
      </div>

      {/* ─── MOBILE HAMBURGER BUTTON ─── */}
      {/* Only visible on small screens (md:hidden hides it on desktop) */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="md:hidden text-2xl text-gray-600"
        aria-label="Toggle menu" // Accessibility: screen readers say "Toggle menu"
      >
        {/* Show ✕ when menu is open, ☰ when closed */}
        {menuOpen ? "✕" : "☰"}
      </button>

      {/* ─── MOBILE MENU DROPDOWN ─── */}
      {/* Only renders when menuOpen is true AND on small screens */}
      {menuOpen && (
        <div
          className="
            absolute top-14 left-0 right-0  /* Position below the navbar */
            bg-white border-b shadow-lg      /* White background with shadow */
            p-4                              /* Padding inside */
            flex flex-col gap-3              /* Stack links vertically */
            md:hidden                        /* Hide on desktop */
            z-50                             /* Stay above other content */
          "
        >
          <Link
            href="/services"
            className="text-gray-600 hover:text-[var(--color-primary)]"
            onClick={() => setMenuOpen(false)} // Close menu after clicking
          >
            {t("Υπηρεσίες", "Services")}
          </Link>

          <Link
            href="/pricing"
            className="text-gray-600 hover:text-[var(--color-primary)]"
            onClick={() => setMenuOpen(false)}
          >
            {t("Για Επαγγελματίες", "For Pros")}
          </Link>

          <Link
            href="/how-it-works"
            className="text-gray-600 hover:text-[var(--color-primary)]"
            onClick={() => setMenuOpen(false)}
          >
            {t("Πώς Λειτουργεί", "How It Works")}
          </Link>

          <Link
            href="/login"
            className="text-gray-600 hover:text-[var(--color-primary)]"
            onClick={() => setMenuOpen(false)}
          >
            {t("Σύνδεση", "Login")}
          </Link>

          {/* Language toggle in mobile menu */}
          <button
            onClick={() => {
              onToggleLang();
              setMenuOpen(false);
            }}
            className="text-sm text-gray-500 text-left"
          >
            {lang === "el" ? "Switch to English" : "Αλλαγή σε Ελληνικά"}
          </button>
        </div>
      )}
    </nav>
  );
}