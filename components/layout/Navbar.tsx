// =============================================================
// components/layout/Navbar.tsx — Main navigation bar
// =============================================================
// Present on every page. Handles:
// - Brand logo linking to homepage
// - Navigation links (Services, Pricing, How It Works)
// - Language toggle (EL/EN)
// - Auth state: shows login button OR user avatar with dropdown
// - Mobile hamburger menu
//
// Auth flow:
// 1. On load, checks Supabase Auth for logged-in user
// 2. Listens for auth state changes (login/logout)
// 3. If logged in: shows avatar + name + dropdown menu
// 4. If not: shows "Σύνδεση" button linking to /login
//
// Dropdown menu options vary by role:
// - Customer: My Profile, Settings, Logout
// - Professional: Dashboard, My Profile, Settings, Logout
// - Admin: Admin Panel, Dashboard, My Profile, Settings, Logout
// =============================================================

"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface NavbarProps {
  lang: "el" | "en";
  onToggleLang: () => void;
}

export default function Navbar({ lang, onToggleLang }: NavbarProps) {
  // ─── STATE ───
  // menuOpen: controls mobile hamburger menu visibility
  const [menuOpen, setMenuOpen] = useState(false);

  // dropdownOpen: controls the user profile dropdown on desktop
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // user: stores logged-in user info (null = not logged in)
  const [user, setUser] = useState<{
    name: string;
    email: string;
    avatar: string;
  } | null>(null);

  // dropdownRef: used to detect clicks outside the dropdown to close it
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Language helper
  const t = (el: string, en: string) => (lang === "el" ? el : en);

  // ─── CHECK AUTH STATE ON LOAD ───
  // Fetches the current user from Supabase Auth
  // Also sets up a listener for auth changes (login/logout)
  useEffect(() => {
    async function getUser() {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setUser({
          name: data.user.user_metadata?.full_name || data.user.email || "",
          email: data.user.email || "",
          avatar: data.user.user_metadata?.avatar_url || "",
        });
      }
    }
    getUser();

    // Listen for login/logout events
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          setUser({
            name:
              session.user.user_metadata?.full_name ||
              session.user.email ||
              "",
            email: session.user.email || "",
            avatar: session.user.user_metadata?.avatar_url || "",
          });
        } else {
          setUser(null);
        }
      }
    );

    // Cleanup listener when component unmounts
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // ─── CLOSE DROPDOWN ON OUTSIDE CLICK ───
  // If user clicks anywhere outside the dropdown, close it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ─── LOGOUT HANDLER ───
  // Signs out from Supabase and redirects to homepage
  async function handleLogout() {
    await supabase.auth.signOut();
    setUser(null);
    setDropdownOpen(false);
    window.location.href = "/";
  }

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 bg-white/90 backdrop-blur-md border-b border-gray-200">
      {/* ─── LOGO ─── */}
      {/* Clicking the logo always returns to homepage */}
      <Link
        href="/"
        className="flex items-center gap-2"
        onClick={() => setMenuOpen(false)}
      >
        <span
          className="text-2xl font-black"
          style={{ color: "var(--color-primary)" }}
        >
          MASTORI
        </span>
        <span className="text-xs text-gray-400">.gr</span>
      </Link>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* DESKTOP NAVIGATION                                     */}
      {/* Hidden on mobile (md:flex), shown on desktop           */}
      {/* ═══════════════════════════════════════════════════════ */}
      <div className="hidden md:flex items-center gap-6 text-sm">
        {/* Main nav links */}
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

        {/* ─── USER SECTION ─── */}
        {/* If logged in: avatar + name + dropdown */}
        {/* If not logged in: login button */}
        {user ? (
          <div className="relative" ref={dropdownRef}>
            {/* Clickable avatar + name area */}
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              {/* User's Google profile photo */}
              {user.avatar && (
                <img
                  src={user.avatar}
                  alt={user.name}
                  width={32}
                  height={32}
                  className="rounded-full border-2 border-gray-200"
                />
              )}
              {/* User's display name */}
              <span className="text-sm font-medium text-gray-700">
                {user.name}
              </span>
              {/* Dropdown arrow indicator */}
              <span className="text-xs text-gray-400">
                {dropdownOpen ? "▲" : "▼"}
              </span>
            </button>

            {/* ─── DROPDOWN MENU ─── */}
            {/* Appears below the avatar when clicked */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg py-2 z-50">
                {/* User info header */}
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-800">
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-400">{user.email}</p>
                </div>

                {/* My Profile link */}
                <Link
                  href="/profile"
                  onClick={() => setDropdownOpen(false)}
                  className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  👤 {t("Το Προφίλ μου", "My Profile")}
                </Link>

                {/* Dashboard link — for professionals */}
                <Link
                  href="/dashboard"
                  onClick={() => setDropdownOpen(false)}
                  className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  📊 {t("Πίνακας Ελέγχου", "Dashboard")}
                </Link>

                {/* Admin Panel link — visible to all for now */}
                {/* Later: only show if user role is admin */}
                <Link
                  href="/admin"
                  onClick={() => setDropdownOpen(false)}
                  className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  🔧 Admin Panel
                </Link>

                {/* Divider before logout */}
                <div className="border-t border-gray-100 my-1"></div>

                {/* Logout button */}
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                >
                  🚪 {t("Αποσύνδεση", "Logout")}
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Not logged in — show login button */
          <Link
            href="/login"
            className="px-3 py-1.5 bg-[var(--color-primary)] text-white rounded-lg text-sm hover:opacity-90 transition-all"
          >
            {t("Σύνδεση", "Login")}
          </Link>
        )}

        {/* Language toggle button */}
        <button
          onClick={onToggleLang}
          className="text-xs border rounded px-2 py-1 text-gray-500 hover:text-gray-700 hover:border-gray-400 transition-colors"
        >
          {lang === "el" ? "EN" : "ΕΛ"}
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* MOBILE HAMBURGER BUTTON                                */}
      {/* Visible only on mobile (md:hidden)                     */}
      {/* ═══════════════════════════════════════════════════════ */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="md:hidden text-2xl text-gray-600"
        aria-label="Toggle menu"
      >
        {menuOpen ? "✕" : "☰"}
      </button>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* MOBILE MENU                                            */}
      {/* Full-width dropdown below the navbar on mobile         */}
      {/* ═══════════════════════════════════════════════════════ */}
      {menuOpen && (
        <div className="absolute top-14 left-0 right-0 bg-white border-b shadow-lg p-4 flex flex-col gap-3 md:hidden z-50">
          {/* Nav links */}
          <Link
            href="/services"
            className="text-gray-600"
            onClick={() => setMenuOpen(false)}
          >
            {t("Υπηρεσίες", "Services")}
          </Link>
          <Link
            href="/pricing"
            className="text-gray-600"
            onClick={() => setMenuOpen(false)}
          >
            {t("Για Επαγγελματίες", "For Pros")}
          </Link>
          <Link
            href="/how-it-works"
            className="text-gray-600"
            onClick={() => setMenuOpen(false)}
          >
            {t("Πώς Λειτουργεί", "How It Works")}
          </Link>

          {/* User section in mobile menu */}
          {user ? (
            <div className="pt-3 border-t">
              {/* User info */}
              <div className="flex items-center gap-2 mb-3">
                {user.avatar && (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    width={28}
                    height={28}
                    className="rounded-full"
                  />
                )}
                <div>
                  <span className="text-sm font-medium block">
                    {user.name}
                  </span>
                  <span className="text-xs text-gray-400">{user.email}</span>
                </div>
              </div>

              {/* Mobile menu links */}
              <Link
                href="/profile"
                className="block py-2 text-sm text-gray-600"
                onClick={() => setMenuOpen(false)}
              >
                👤 {t("Το Προφίλ μου", "My Profile")}
              </Link>
              <Link
                href="/dashboard"
                className="block py-2 text-sm text-gray-600"
                onClick={() => setMenuOpen(false)}
              >
                📊 {t("Πίνακας Ελέγχου", "Dashboard")}
              </Link>
              <Link
                href="/admin"
                className="block py-2 text-sm text-gray-600"
                onClick={() => setMenuOpen(false)}
              >
                🔧 Admin Panel
              </Link>

              {/* Logout */}
              <button
                onClick={() => {
                  handleLogout();
                  setMenuOpen(false);
                }}
                className="block w-full text-left py-2 text-sm text-red-500 mt-2 border-t"
              >
                🚪 {t("Αποσύνδεση", "Logout")}
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="text-gray-600"
              onClick={() => setMenuOpen(false)}
            >
              {t("Σύνδεση", "Login")}
            </Link>
          )}

          {/* Language toggle */}
          <button
            onClick={() => {
              onToggleLang();
              setMenuOpen(false);
            }}
            className="text-sm text-gray-500 text-left pt-2 border-t"
          >
            {lang === "el" ? "Switch to English" : "Αλλαγή σε Ελληνικά"}
          </button>
        </div>
      )}
    </nav>
  );
}