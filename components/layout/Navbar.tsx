"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BRAND } from "@/lib/constants";
import { supabase } from "@/lib/supabase";

interface NavbarProps {
  lang: "el" | "en";
  onToggleLang: () => void;
}

export default function Navbar({ lang, onToggleLang }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  // Store the logged-in user's info (null = not logged in)
  const [user, setUser] = useState<{ name: string; email: string; avatar: string } | null>(null);

  const t = (el: string, en: string) => (lang === "el" ? el : en);

  // Check if user is logged in when component loads
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

    // Listen for login/logout changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          name: session.user.user_metadata?.full_name || session.user.email || "",
          email: session.user.email || "",
          avatar: session.user.user_metadata?.avatar_url || "",
        });
      } else {
        setUser(null);
      }
    });

    return () => { listener.subscription.unsubscribe(); };
  }, []);

  // Logout handler
  async function handleLogout() {
    await supabase.auth.signOut();
    setUser(null);
    window.location.href = "/";
  }

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 bg-white/90 backdrop-blur-md border-b border-gray-200">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2" onClick={() => setMenuOpen(false)}>
        <span className="text-2xl font-black" style={{ color: "var(--color-primary)" }}>MASTORI</span>
        <span className="text-xs text-gray-400">.gr</span>
      </Link>

      {/* Desktop nav */}
      <div className="hidden md:flex items-center gap-6 text-sm">
        <Link href="/services" className="text-gray-600 hover:text-[var(--color-primary)] transition-colors">
          {t("Υπηρεσίες", "Services")}
        </Link>
        <Link href="/pricing" className="text-gray-600 hover:text-[var(--color-primary)] transition-colors">
          {t("Για Επαγγελματίες", "For Pros")}
        </Link>
        <Link href="/how-it-works" className="text-gray-600 hover:text-[var(--color-primary)] transition-colors">
          {t("Πώς Λειτουργεί", "How It Works")}
        </Link>

        {/* Show user info if logged in, login button if not */}
        {user ? (
          <div className="flex items-center gap-3">
            {/* User avatar */}
            {user.avatar && (
              <img
                src={user.avatar}
                alt={user.name}
                width={28}
                height={28}
                className="rounded-full"
              />
            )}
            {/* User name */}
            <span className="text-sm font-medium text-gray-700">
              {user.name}
            </span>
            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors"
            >
              {t("Αποσύνδεση", "Logout")}
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="px-3 py-1.5 bg-[var(--color-primary)] text-white rounded-lg text-sm hover:bg-[var(--color-primary-light)] transition-colors"
          >
            {t("Σύνδεση", "Login")}
          </Link>
        )}

        <button onClick={onToggleLang} className="text-xs border rounded px-2 py-1 text-gray-500 hover:text-gray-700 hover:border-gray-400 transition-colors">
          {lang === "el" ? "EN" : "ΕΛ"}
        </button>
      </div>

      {/* Mobile hamburger */}
      <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-2xl text-gray-600" aria-label="Toggle menu">
        {menuOpen ? "✕" : "☰"}
      </button>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="absolute top-14 left-0 right-0 bg-white border-b shadow-lg p-4 flex flex-col gap-3 md:hidden z-50">
          <Link href="/services" className="text-gray-600" onClick={() => setMenuOpen(false)}>{t("Υπηρεσίες", "Services")}</Link>
          <Link href="/pricing" className="text-gray-600" onClick={() => setMenuOpen(false)}>{t("Για Επαγγελματίες", "For Pros")}</Link>
          <Link href="/how-it-works" className="text-gray-600" onClick={() => setMenuOpen(false)}>{t("Πώς Λειτουργεί", "How It Works")}</Link>

          {user ? (
            <div className="flex items-center gap-2 pt-2 border-t">
              {user.avatar && <img src={user.avatar} alt={user.name} width={24} height={24} className="rounded-full" />}
              <span className="text-sm font-medium">{user.name}</span>
              <button onClick={() => { handleLogout(); setMenuOpen(false); }} className="text-xs text-red-500 ml-auto">
                {t("Αποσύνδεση", "Logout")}
              </button>
            </div>
          ) : (
            <Link href="/login" className="text-gray-600" onClick={() => setMenuOpen(false)}>{t("Σύνδεση", "Login")}</Link>
          )}

          <button onClick={() => { onToggleLang(); setMenuOpen(false); }} className="text-sm text-gray-500 text-left">
            {lang === "el" ? "Switch to English" : "Αλλαγή σε Ελληνικά"}
          </button>
        </div>
      )}
    </nav>
  );
}