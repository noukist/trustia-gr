// =============================================================
// components/layout/Navbar.tsx — Main navigation bar
// =============================================================
// Present on every page. Handles:
// - Brand logo linking to homepage
// - Navigation links (Services, Pricing, How It Works)
// - Language toggle (EL/EN)
// - Auth state: login button OR user avatar with dropdown
// - Mobile hamburger menu
//
// Role-based dropdown:
// - Customer: My Profile, Logout
// - Professional: My Profile, Dashboard, Logout
// - Admin: My Profile, Dashboard, Admin Panel, Logout
//
// How roles are detected:
// - Professional: has a record in 'professionals' table
// - Admin: email matches admin list (hardcoded for now)
// - Customer: everyone else who is logged in
// =============================================================

"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

// ─── ADMIN EMAILS ───
// Hardcoded for now. Later: check user_roles table in Supabase
const ADMIN_EMAILS = ["noukist@gmail.com"];

interface NavbarProps {
  lang: "el" | "en";
  onToggleLang: () => void;
}

export default function Navbar({ lang, onToggleLang }: NavbarProps) {
  // ─── STATE ───
  // menuOpen: controls mobile hamburger menu
  const [menuOpen, setMenuOpen] = useState(false);

  // dropdownOpen: controls desktop profile dropdown
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // user: logged-in user info (null = not logged in)
  const [user, setUser] = useState<{
    name: string;
    email: string;
    avatar: string;
  } | null>(null);

  // isProfessional: true if user has a record in professionals table
  const [isProfessional, setIsProfessional] = useState(false);

  // isAdmin: true if user's email is in the admin list
  const [isAdmin, setIsAdmin] = useState(false);

  // dropdownRef: detect clicks outside dropdown to close it
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Language helper
  const t = (el: string, en: string) => (lang === "el" ? el : en);

  // ─── CHECK AUTH + ROLE ON LOAD ───
  // 1. Get logged-in user from Supabase Auth
  // 2. Check if they're a professional (has record in professionals table)
  // 3. Check if they're an admin (email in admin list)
  useEffect(() => {
    async function getUser() {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        const email = data.user.email || "";

        setUser({
          name: data.user.user_metadata?.full_name || email,
          email: email,
          avatar: data.user.user_metadata?.avatar_url || "",
        });

        // Check if admin by email
        setIsAdmin(ADMIN_EMAILS.includes(email));

        // Check if professional by looking for a record in professionals table
        const { data: proData } = await supabase
          .from("professionals")
          .select("id")
          .eq("user_id", data.user.id)
          .single();

        setIsProfessional(!!proData);
      }
    }
    getUser();

    // Listen for login/logout events to update state in real-time
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          const email = session.user.email || "";

          setUser({
            name: session.user.user_metadata?.full_name || email,
            email: email,
            avatar: session.user.user_metadata?.avatar_url || "",
          });

          setIsAdmin(ADMIN_EMAILS.includes(email));

          // Check professional status on auth change too
          const { data: proData } = await supabase
            .from("professionals")
            .select("id")
            .eq("user_id", session.user.id)
            .single();

          setIsProfessional(!!proData);
        } else {
          // Logged out — reset everything
          setUser(null);
          setIsProfessional(false);
          setIsAdmin(false);
        }
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // ─── CLOSE DROPDOWN ON OUTSIDE CLICK ───
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
  async function handleLogout() {
    await supabase.auth.signOut();
    setUser(null);
    setIsProfessional(false);
    setIsAdmin(false);
    setDropdownOpen(false);
    window.location.href = "/";
  }

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 bg-white/90 backdrop-blur-md border-b border-gray-200">

      {/* ─── LOGO ─── */}
      <Link
        href="/"
        className="flex items-center"
        onClick={() => setMenuOpen(false)}
      >
        <img 
          src="/logo/trustia-light.svg" 
          alt="Trustia.gr" 
          className="h-22 w-auto"
        />
      </Link>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* DESKTOP NAVIGATION                                     */}
      {/* ═══════════════════════════════════════════════════════ */}
      <div className="hidden md:flex items-center gap-6 text-sm">
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
        {user ? (
          <div className="relative" ref={dropdownRef}>
            {/* Clickable avatar + name */}
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              {user.avatar && (
                <img
                  src={user.avatar}
                  alt={user.name}
                  width={32}
                  height={32}
                  className="rounded-full border-2 border-gray-200"
                />
              )}
              <span className="text-sm font-medium text-gray-700">
                {user.name}
              </span>
              <span className="text-xs text-gray-400">
                {dropdownOpen ? "▲" : "▼"}
              </span>
            </button>

            {/* ─── DROPDOWN MENU ─── */}
            {/* Items shown depend on user role */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg py-2 z-50">
                {/* User info header — always visible */}
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-800">
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-400">{user.email}</p>
                </div>

                {/* My Profile — visible to ALL logged-in users */}
                <Link
                  href="/profile"
                  onClick={() => setDropdownOpen(false)}
                  className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  👤 {t("Το Προφίλ μου", "My Profile")}
                </Link>

                {/* Dashboard — only for professionals */}
                {isProfessional && (
                  <Link
                    href="/dashboard"
                    onClick={() => setDropdownOpen(false)}
                    className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    📊 {t("Πίνακας Ελέγχου", "Dashboard")}
                  </Link>
                )}

                {/* Admin Panel — only for admins */}
                {isAdmin && (
                  <Link
                    href="/admin"
                    onClick={() => setDropdownOpen(false)}
                    className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    🔧 Admin Panel
                  </Link>
                )}

                {/* Divider */}
                <div className="border-t border-gray-100 my-1"></div>

                {/* Logout — always visible */}
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
          /* Not logged in — login button */
          <Link
            href="/login"
            className="px-3 py-1.5 bg-[var(--color-primary)] text-white rounded-lg text-sm hover:opacity-90 transition-all"
          >
            {t("Σύνδεση", "Login")}
          </Link>
        )}

        {/* Language toggle */}
        <button
          onClick={onToggleLang}
          className="text-xs border rounded px-2 py-1 text-gray-500 hover:text-gray-700 hover:border-gray-400 transition-colors"
        >
          {lang === "el" ? "EN" : "ΕΛ"}
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* MOBILE HAMBURGER BUTTON                                */}
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
      {/* Same role-based logic as desktop dropdown              */}
      {/* ═══════════════════════════════════════════════════════ */}
      {menuOpen && (
        <div className="absolute top-14 left-0 right-0 bg-white border-b shadow-lg p-4 flex flex-col gap-3 md:hidden z-50">
          {/* Nav links */}
          <Link href="/services" className="text-gray-600" onClick={() => setMenuOpen(false)}>
            {t("Υπηρεσίες", "Services")}
          </Link>
          <Link href="/pricing" className="text-gray-600" onClick={() => setMenuOpen(false)}>
            {t("Για Επαγγελματίες", "For Pros")}
          </Link>
          <Link href="/how-it-works" className="text-gray-600" onClick={() => setMenuOpen(false)}>
            {t("Πώς Λειτουργεί", "How It Works")}
          </Link>

          {/* User section */}
          {user ? (
            <div className="pt-3 border-t">
              {/* User info */}
              <div className="flex items-center gap-2 mb-3">
                {user.avatar && (
                  <img src={user.avatar} alt={user.name} width={28} height={28} className="rounded-full" />
                )}
                <div>
                  <span className="text-sm font-medium block">{user.name}</span>
                  <span className="text-xs text-gray-400">{user.email}</span>
                </div>
              </div>

              {/* My Profile — always */}
              <Link href="/profile" className="block py-2 text-sm text-gray-600" onClick={() => setMenuOpen(false)}>
                👤 {t("Το Προφίλ μου", "My Profile")}
              </Link>

              {/* Dashboard — professionals only */}
              {isProfessional && (
                <Link href="/dashboard" className="block py-2 text-sm text-gray-600" onClick={() => setMenuOpen(false)}>
                  📊 {t("Πίνακας Ελέγχου", "Dashboard")}
                </Link>
              )}

              {/* Admin Panel — admins only */}
              {isAdmin && (
                <Link href="/admin" className="block py-2 text-sm text-gray-600" onClick={() => setMenuOpen(false)}>
                  🔧 Admin Panel
                </Link>
              )}

              {/* Logout */}
              <button
                onClick={() => { handleLogout(); setMenuOpen(false); }}
                className="block w-full text-left py-2 text-sm text-red-500 mt-2 border-t"
              >
                🚪 {t("Αποσύνδεση", "Logout")}
              </button>
            </div>
          ) : (
            <Link href="/login" className="text-gray-600" onClick={() => setMenuOpen(false)}>
              {t("Σύνδεση", "Login")}
            </Link>
          )}

          {/* Language toggle */}
          <button
            onClick={() => { onToggleLang(); setMenuOpen(false); }}
            className="text-sm text-gray-500 text-left pt-2 border-t"
          >
            {lang === "el" ? "Switch to English" : "Αλλαγή σε Ελληνικά"}
          </button>
        </div>
      )}
    </nav>
  );
}