// =============================================================
// app/page.tsx — Homepage of Trustia.gr
// =============================================================
// This is the main landing page visitors see at trustia.gr
// It contains 6 sections in order:
// 1. Hero — two-column layout with search bar + preview cards
// 2. Popular Categories — 6 clickable category tiles
// 3. Stats Bar — teal background with key numbers
// 4. How It Works — 3-step explanation
// 5. Featured Professionals — 3 sample pro cards
// 6. Pro CTA — dark banner targeting professionals
//
// Layout note: Navbar, Footer, and AnnouncementBar are handled
// by app/layout.tsx — they wrap this page automatically.
// =============================================================

"use client";

import { useState } from "react";
import Link from "next/link";
import { CATEGORIES } from "@/lib/constants";

// =============================================================
// MINI PROFESSIONAL CARD — Used in the Hero section (right side)
// Shows a compact preview of a professional with name, category,
// rating, and verified badge. Slightly rotated for visual depth.
// =============================================================
function MiniProCard({ name, category, rating, reviews, bg, color, online, rotate }: {
  name: string;       // Full name e.g. "Νίκος Παπαδόπουλος"
  category: string;   // Category + city e.g. "Υδραυλικός • Θεσσαλονίκη"
  rating: number;     // Star rating e.g. 4.9
  reviews: number;    // Number of reviews e.g. 47
  bg: string;         // Avatar background color e.g. "#EBF5F5"
  color: string;      // Avatar text color e.g. "#2A8F8F"
  online: boolean;    // Show green online indicator dot
  rotate: string;     // Tailwind rotation class for visual depth
}) {
  // Generate initials from full name (e.g. "ΝΠ" from "Νίκος Παπαδόπουλος")
  const initials = name.split(" ").map(n => n[0]).join("");

  return (
    <div className={`bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.08)] w-[310px] border border-gray-100 p-4 ${rotate} transition-transform hover:scale-[1.02]`}>
      <div className="flex items-center gap-3">
        {/* Avatar circle with initials */}
        <div className="relative flex-shrink-0">
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: bg, color }}>
            {initials}
          </div>
          {/* Green dot = professional is currently online */}
          {online && <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white" />}
        </div>

        {/* Name, category, and star rating */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm">{name}</p>
          <p className="text-xs text-gray-500 mt-0.5">{category}</p>
          <div className="flex items-center gap-1 mt-1">
            {/* 5 stars — filled amber or empty gray */}
            {[...Array(5)].map((_, i) => (
              <span key={i} className={`text-xs ${i < Math.floor(rating) ? "text-amber-400" : "text-gray-200"}`}>★</span>
            ))}
            <span className="text-xs font-semibold text-gray-900 ml-0.5">{rating}</span>
            <span className="text-xs text-gray-400">({reviews})</span>
          </div>
        </div>

        {/* Verified badge */}
        <div className="px-2 py-1 rounded-full flex-shrink-0" style={{ backgroundColor: "var(--color-primary-light)" }}>
          <span className="text-[0.65rem] font-semibold whitespace-nowrap" style={{ color: "var(--color-primary)" }}>✓ Επαληθ.</span>
        </div>
      </div>
    </div>
  );
}

// =============================================================
// SECTION 1: HERO
// Two-column layout:
// - Left: heading, subtitle, search bar, trust signals
// - Right: 3 mini professional cards (desktop only)
// Background: teal-to-gray gradient for visual warmth
// =============================================================
function Hero() {
  // Track dropdown state and selected category
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");

  // Group categories by tier for the dropdown
  const categoryGroups = [
    { label: "Τεχνικά", items: CATEGORIES.filter(c => c.tier === "trades").slice(0, 6) },
    { label: "Ελαφριές Εργασίες", items: CATEGORIES.filter(c => c.tier === "light") },
    { label: "Ειδικοί", items: CATEGORIES.filter(c => c.tier === "specialists").slice(0, 4) },
  ];

  return (
    <section className="px-5 sm:px-8 overflow-hidden" style={{ background: "linear-gradient(180deg, #D4EDED 0%, #EBF5F5 60%, #F7F8FA 100%)" }}>
      <div className="max-w-[1200px] mx-auto py-12 md:py-16 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10 lg:gap-12 items-center">

          {/* ── LEFT COLUMN: Text + Search ── */}
          <div>
            {/* "0% Commission" badge — solid teal with white text */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6" style={{ backgroundColor: "var(--color-primary)", color: "white" }}>
              <span>✓</span>
              <span className="text-sm font-semibold">0% Προμήθεια</span>
            </div>

            {/* Main heading — responsive font size */}
            <h1 className="text-[clamp(2.2rem,5vw,3.25rem)] font-extrabold leading-[1.1] tracking-[-0.025em] mb-4" style={{ color: "#1A2B3C" }}>
              Βρες τον ειδικό<br className="hidden sm:block" /> για κάθε ανάγκη
            </h1>

            {/* Subtitle */}
            <p className="text-lg text-gray-500 leading-relaxed mb-8 max-w-[480px]">
              Αξιόπιστοι επαγγελματίες στην περιοχή σου. Επαληθευμένες κριτικές. Κράτηση online.
            </p>

            {/* ── SEARCH BAR ── */}
            {/* White card with category dropdown + location input + coral search button */}
            <div className="bg-white rounded-2xl border-[1.5px] border-gray-200 shadow-[0_4px_24px_rgba(0,0,0,0.07)] p-2 mb-5 max-w-[540px] focus-within:border-[var(--color-primary)] transition-colors">
              <div className="flex flex-col sm:flex-row items-stretch">

                {/* Category dropdown */}
                <div className="flex-1 relative">
                  <button onClick={() => setCategoryOpen(!categoryOpen)} className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-gray-50 rounded-xl transition-colors">
                    <span className="text-gray-400">🔍</span>
                    <span className={`flex-1 text-sm ${selectedCategory ? "text-gray-900 font-medium" : "text-gray-400"}`}>
                      {selectedCategory || "Τι χρειάζεστε;"}
                    </span>
                    <span className={`text-gray-400 text-xs transition-transform ${categoryOpen ? "rotate-180" : ""}`}>▼</span>
                  </button>

                  {/* Dropdown menu — grouped by tier */}
                  {categoryOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-gray-200 shadow-[0_12px_40px_rgba(0,0,0,0.12)] z-50 py-2 max-h-64 overflow-y-auto">
                      {categoryGroups.map((group) => (
                        <div key={group.label}>
                          <p className="px-4 pt-2 pb-1 text-[0.7rem] font-semibold text-gray-400 uppercase tracking-wider">{group.label}</p>
                          {group.items.map((cat) => (
                            <button key={cat.id} className="w-full text-left px-4 py-2 text-gray-900 hover:bg-[var(--color-primary-light)] transition-colors text-sm"
                              onClick={() => { setSelectedCategory(cat.nameEl); setCategoryOpen(false); }}>
                              {cat.emoji} {cat.nameEl}
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Vertical divider between fields (desktop) */}
                <div className="hidden sm:flex items-center"><div className="w-px h-7 bg-gray-200" /></div>
                {/* Horizontal divider (mobile) */}
                <div className="sm:hidden h-px bg-gray-200 mx-4" />

                {/* Location input */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 px-4 py-3.5">
                    <span className="text-gray-400">📍</span>
                    <input type="text" placeholder="Περιοχή..." className="flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 outline-none" />
                  </div>
                </div>

                {/* Search button — CORAL accent color (only CTA buttons use this) */}
                <Link href="/services" className="text-white px-6 py-3.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 m-0.5 text-sm hover:opacity-90" style={{ backgroundColor: "var(--color-accent)" }}>
                  🔍 Αναζήτηση
                </Link>
              </div>
            </div>

            {/* Trust signals — three checkmarks */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
              <span className="flex items-center gap-1"><span style={{ color: "var(--color-primary)" }}>✓</span> Επαληθευμένοι επαγγελματίες</span>
              <span className="flex items-center gap-1"><span style={{ color: "var(--color-primary)" }}>✓</span> Δωρεάν για πελάτες</span>
              <span className="flex items-center gap-1"><span style={{ color: "var(--color-primary)" }}>✓</span> Άμεση κράτηση</span>
            </div>
          </div>

          {/* ── RIGHT COLUMN: Mini professional cards (desktop only) ── */}
          {/* These are slightly rotated to create visual depth */}
          <div className="hidden lg:flex flex-col items-center justify-center gap-4 relative">
            <MiniProCard name="Νίκος Παπαδόπουλος" category="Υδραυλικός • Θεσσαλονίκη" rating={4.9} reviews={47} bg="#EBF5F5" color="#2A8F8F" online={true} rotate="rotate-[-2deg] translate-x-2" />
            <MiniProCard name="Μαρία Αλεξίου" category="Καθαρισμός • Καλαμαριά" rating={4.8} reviews={32} bg="#FFF0EB" color="#D4654A" online={true} rotate="rotate-[1.5deg] -translate-x-2" />
            <MiniProCard name="Γιώργος Δημητρίου" category="Ηλεκτρολόγος • Θέρμη" rating={5.0} reviews={28} bg="#EBF0FF" color="#4A6AE8" online={false} rotate="rotate-[-1deg] translate-x-4" />
          </div>
        </div>
      </div>
    </section>
  );
}

// =============================================================
// SECTION 2: POPULAR CATEGORIES
// 6 clickable tiles in a 3x2 grid (2x3 on mobile)
// Each links to /services?category={id}
// =============================================================
function PopularCategories() {
  // Top 6 categories to feature on the homepage
  const popular = [
    { emoji: "🔧", name: "Υδραυλικός", count: 24, id: "plumber" },
    { emoji: "⚡", name: "Ηλεκτρολόγος", count: 18, id: "electrician" },
    { emoji: "🧹", name: "Καθαρισμός", count: 31, id: "house-cleaning" },
    { emoji: "💅", name: "Τεχνίτρια Νυχιών", count: 22, id: "nail-tech" },
    { emoji: "🎨", name: "Ελαιοχρωματιστής", count: 15, id: "painter" },
    { emoji: "❄️", name: "Κλιματισμός", count: 12, id: "hvac" },
  ];

  return (
    <section className="py-14 px-5 sm:px-8 bg-white">
      <div className="max-w-[1200px] mx-auto">
        {/* Section header */}
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Δημοφιλείς Κατηγορίες</h2>
          <p className="text-gray-500">Βρείτε τον κατάλληλο επαγγελματία ανά κατηγορία</p>
        </div>

        {/* Category grid — 3 columns desktop, 2 mobile */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {popular.map((cat) => (
            <Link key={cat.id} href={`/services?category=${cat.id}`}
              className="group bg-white border border-gray-200 rounded-xl py-6 px-5 flex flex-col items-center gap-3 hover:border-[var(--color-primary)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
              {/* Emoji icon in teal circle */}
              <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl group-hover:scale-110 transition-transform" style={{ backgroundColor: "var(--color-primary-light)" }}>
                {cat.emoji}
              </div>
              {/* Category name */}
              <span className="text-sm font-semibold text-gray-900 text-center">{cat.name}</span>
              {/* Professional count */}
              <span className="text-xs text-gray-400">{cat.count} επαγγελματίες</span>
            </Link>
          ))}
        </div>

        {/* Link to full services page */}
        <div className="text-center mt-8">
          <Link href="/services" className="text-sm font-semibold hover:underline" style={{ color: "var(--color-primary)" }}>
            Δες όλες τις κατηγορίες →
          </Link>
        </div>
      </div>
    </section>
  );
}

// =============================================================
// SECTION 3: STATS BAR
// Full-width teal background with 3 key metrics
// This is the ONE section with a bold colored background
// =============================================================
function StatsBar() {
  return (
    <section className="py-10 px-5 sm:px-8" style={{ backgroundColor: "var(--color-primary)" }}>
      <div className="max-w-[1200px] mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
          {[
            { v: "1,200+", l: "Επαγγελματίες" },
            { v: "50+", l: "Πόλεις" },
            { v: "4.8 ★", l: "Μέση βαθμολογία" }
          ].map((s, i) => (
            <div key={s.l} className="flex items-center gap-10">
              <div className="text-center">
                <p className="text-3xl font-bold text-white leading-tight">{s.v}</p>
                <p className="text-sm text-white/75 mt-1">{s.l}</p>
              </div>
              {/* Vertical divider between stats (desktop only) */}
              {i < 2 && <div className="hidden md:block w-px h-10 bg-white/20" />}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// =============================================================
// SECTION 4: HOW IT WORKS
// 3-step horizontal flow with dashed connector line
// Steps: Search → Compare → Book
// =============================================================
function HowItWorks() {
  const steps = [
    { num: 1, icon: "🔍", title: "Αναζήτηση", desc: "Βρείτε επαγγελματίες στην περιοχή σας ανά κατηγορία και τοποθεσία." },
    { num: 2, icon: "👤", title: "Σύγκριση", desc: "Δείτε κριτικές, portfolio, τιμές και διαθεσιμότητα." },
    { num: 3, icon: "📅", title: "Κράτηση", desc: "Επικοινωνήστε ή κλείστε ραντεβού online — δωρεάν." },
  ];

  return (
    <section className="py-14 px-5 sm:px-8" style={{ backgroundColor: "var(--color-bg-light)" }}>
      <div className="max-w-[900px] mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-12">Πώς Λειτουργεί</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-6 relative">
          {/* Dashed connector line between steps (desktop only) */}
          <div className="hidden md:block absolute top-[20px] border-t-2 border-dashed border-gray-300"
            style={{ left: "calc(16.67% + 24px)", right: "calc(16.67% + 24px)" }} />

          {steps.map((step) => (
            <div key={step.num} className="flex flex-col items-center text-center relative z-10">
              {/* Step number circle — teal */}
              <div className="w-10 h-10 rounded-full text-white flex items-center justify-center font-bold text-sm mb-5 shadow-md"
                style={{ backgroundColor: "var(--color-primary)" }}>
                {step.num}
              </div>
              {/* Step icon in white card */}
              <div className="w-16 h-16 rounded-xl bg-white border border-gray-200 shadow-sm flex items-center justify-center mb-4 text-2xl">
                {step.icon}
              </div>
              {/* Step title */}
              <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
              {/* Step description */}
              <p className="text-sm text-gray-500 max-w-[240px] leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// =============================================================
// SECTION 5: FEATURED PROFESSIONALS
// 3 detailed professional cards with colored left borders,
// ratings, verified badges, and booking indicators.
// These are sample data — will be replaced with real Supabase
// data once professionals sign up.
// =============================================================
function FeaturedPros() {
  // Sample professionals for the homepage
  const pros = [
    { name: "Νίκος Παπαδόπουλος", cat: "Υδραυλικός", city: "Θεσσαλονίκη", rating: 4.9, reviews: 47, online: true, booking: true, bg: "#EBF5F5", color: "#2A8F8F" },
    { name: "Μαρία Αλεξίου", cat: "Καθαρισμός", city: "Καλαμαριά", rating: 4.8, reviews: 32, online: true, booking: true, bg: "#FFF0EB", color: "#D4654A" },
    { name: "Γιώργος Δημητρίου", cat: "Ηλεκτρολόγος", city: "Θέρμη", rating: 5.0, reviews: 28, online: false, booking: false, bg: "#EBF0FF", color: "#4A6AE8" },
  ];

  return (
    <section className="py-14 px-5 sm:px-8 bg-white">
      <div className="max-w-[1200px] mx-auto">
        {/* Section header */}
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Κορυφαίοι Επαγγελματίες</h2>
          <p className="text-gray-500">Μερικοί από τους καλύτερα βαθμολογημένους επαγγελματίες μας</p>
        </div>

        {/* Professional cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {pros.map((pro) => {
            const initials = pro.name.split(" ").map(n => n[0]).join("");
            return (
              <div key={pro.name}
                className="group bg-white border border-gray-200 rounded-xl p-5 hover:border-[var(--color-primary)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col"
                style={{ borderLeft: `3px solid ${pro.color}` }}>

                {/* Avatar + name + category */}
                <div className="flex items-start gap-3 mb-4">
                  <div className="relative flex-shrink-0">
                    {/* Initials avatar with unique color per pro */}
                    <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold"
                      style={{ backgroundColor: pro.bg, color: pro.color }}>
                      {initials}
                    </div>
                    {/* Green online indicator */}
                    {pro.online && <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900">{pro.name}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">{pro.cat} • {pro.city}</p>
                  </div>
                </div>

                {/* Star rating */}
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={`text-sm ${i < Math.floor(pro.rating) ? "text-amber-400" : "text-gray-200"}`}>★</span>
                  ))}
                  <span className="text-sm font-bold text-gray-900 ml-1">{pro.rating}</span>
                  <span className="text-sm text-gray-500">({pro.reviews} κριτικές)</span>
                </div>

                {/* Badges — verified + optional online booking */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full"
                    style={{ backgroundColor: "var(--color-primary-light)", color: "var(--color-primary)" }}>
                    ✓ Επαληθευμένος
                  </span>
                  {pro.booking && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full"
                      style={{ backgroundColor: "var(--color-primary-light)", color: "var(--color-primary)" }}>
                      📅 Online κράτηση
                    </span>
                  )}
                </div>

                {/* Profile link — slides right on hover */}
                <span className="text-sm font-semibold mt-auto group-hover:translate-x-1 transition-transform inline-flex items-center gap-1"
                  style={{ color: "var(--color-primary)" }}>
                  Προβολή Προφίλ →
                </span>
              </div>
            );
          })}
        </div>

        {/* Link to all professionals */}
        <div className="text-center mt-8">
          <Link href="/services" className="inline-flex items-center gap-2 text-sm font-semibold hover:underline"
            style={{ color: "var(--color-primary)" }}>
            Δες όλους τους επαγγελματίες →
          </Link>
        </div>
      </div>
    </section>
  );
}

// =============================================================
// SECTION 6: PRO CTA — Call to action for professionals
// Dark navy background (#0F1D2F) with coral accent button.
// Targets tradespeople who might want to join the platform.
// =============================================================
function ProCTA() {
  return (
    <section className="py-16 px-5 sm:px-8" style={{ backgroundColor: "#0F1D2F" }}>
      <div className="max-w-[520px] mx-auto text-center">
        {/* Briefcase icon in teal-tinted circle */}
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl"
          style={{ backgroundColor: "rgba(42,143,143,0.15)" }}>
          💼
        </div>

        {/* Heading */}
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Είσαι επαγγελματίας;</h2>

        {/* Description */}
        <p className="text-gray-400 leading-relaxed mb-8">
          Εγγράψου και ξεκίνα να δέχεσαι πελάτες σήμερα. Μηδέν προμήθεια — πληρώνεις μόνο τη συνδρομή σου. Από €10/μήνα.
        </p>

        {/* CTA button — coral accent color */}
        <Link href="/pricing"
          className="inline-flex items-center gap-2 text-white px-8 py-3.5 rounded-xl font-semibold transition-all text-lg hover:opacity-90"
          style={{ backgroundColor: "var(--color-accent)" }}>
          Ξεκίνα Τώρα →
        </Link>

        {/* Trust points */}
        <p className="text-sm text-gray-600 mt-6">
          ✓ Εγγραφή σε 2 λεπτά <span className="mx-2">·</span> ✓ Ακύρωση ανά πάσα στιγμή
        </p>
      </div>
    </section>
  );
}

// =============================================================
// MAIN PAGE EXPORT
// Assembles all sections in order.
// Navbar, Footer, AnnouncementBar are added by layout.tsx
// =============================================================
export default function HomePage() {
  return (
    <div>
      <Hero />
      <PopularCategories />
      <StatsBar />
      <HowItWorks />
      <FeaturedPros />
      <ProCTA />
    </div>
  );
}