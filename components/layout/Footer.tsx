"use client";

import Link from "next/link";
import { BRAND } from "@/lib/constants";

interface FooterProps {
  lang: "el" | "en";
}

export default function Footer({ lang }: FooterProps) {
  const t = (el: string, en: string) => (lang === "el" ? el : en);

  return (
    <footer className="bg-gray-900 text-gray-400 px-6 py-10 mt-12">
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Column 1: Brand Info */}
        <div>
          <h4 className="text-white font-bold text-lg mb-3">{BRAND.name}</h4>
          <p className="text-sm">{t(BRAND.taglineEl, BRAND.taglineEn)}</p>
          <p className="text-xs mt-3 text-gray-500 italic">{t(BRAND.missionEl, BRAND.missionEn)}</p>
          <p className="text-xs mt-4 text-gray-600">{t("Χωρίς διαφημίσεις. Ποτέ.", "Ad-free. Always.")}</p>
        </div>

        {/* Column 2: Popular Services */}
        <div>
          <h5 className="text-white font-semibold mb-3">{t("Δημοφιλείς Υπηρεσίες", "Popular Services")}</h5>
          <div className="flex flex-col gap-2 text-sm">
            <Link href="/services?category=plumber" className="hover:text-white transition-colors">{t("Υδραυλικός", "Plumber")}</Link>
            <Link href="/services?category=electrician" className="hover:text-white transition-colors">{t("Ηλεκτρολόγος", "Electrician")}</Link>
            <Link href="/services?category=house-cleaning" className="hover:text-white transition-colors">{t("Καθαρισμός Σπιτιού", "House Cleaning")}</Link>
            <Link href="/services?category=renovation" className="hover:text-white transition-colors">{t("Ανακαίνιση", "Renovation")}</Link>
            <Link href="/services?category=nail-tech" className="hover:text-white transition-colors">{t("Τεχνίτρια Νυχιών", "Nail Technician")}</Link>
            <Link href="/services?category=hvac" className="hover:text-white transition-colors">{t("Κλιματισμός", "HVAC / AC")}</Link>
          </div>
        </div>

        {/* Column 3: Contact */}
        <div>
          <h5 className="text-white font-semibold mb-3">{t("Επικοινωνία", "Contact")}</h5>
          <a href={"mailto:" + BRAND.email} className="text-sm hover:text-white transition-colors block">{BRAND.email}</a>
          <p className="text-sm mt-2">{BRAND.location}</p>
          <div className="flex flex-col gap-2 mt-4 text-sm">
            <Link href="/pricing" className="hover:text-white transition-colors">{t("Τιμοκατάλογος", "Pricing")}</Link>
            <Link href="/how-it-works" className="hover:text-white transition-colors">{t("Πώς Λειτουργεί", "How It Works")}</Link>
          </div>
        </div>
      </div>

      {/* Bottom bar with copyright */}
      <div className="max-w-5xl mx-auto mt-8 pt-6 border-t border-gray-800 text-center text-xs text-gray-600">
        © 2026 LazyConsultant — {BRAND.name} — {t("Με αγάπη από τη Θεσσαλονίκη", "Made with love in Thessaloniki")}
      </div>
    </footer>
  );
}