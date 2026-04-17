// =============================================================
// page.tsx — Homepage of Trustia.gr (Redesigned)
// =============================================================
"use client";

import { useState } from "react";
import Link from "next/link";
import { CATEGORIES } from "@/lib/constants";

// ─── MINI PROFESSIONAL CARD (Hero right side) ───
function MiniProCard({ name, category, rating, reviews, bg, color, online, rotate }: {
  name: string; category: string; rating: number; reviews: number;
  bg: string; color: string; online: boolean; rotate: string;
}) {
  const initials = name.split(" ").map(n => n[0]).join("");
  return (
    <div className={`bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.08)] w-[320px] border border-gray-100 p-5 ${rotate} transition-transform hover:scale-[1.02]`}>
      <div className="flex items-center gap-4">
        <div className="relative flex-shrink-0">
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-[0.95rem] font-bold" style={{ backgroundColor: bg, color }}>{initials}</div>
          {online && <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-[2.5px] border-white" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-[0.95rem]">{name}</p>
          <p className="text-[0.85rem] text-gray-500 mt-0.5">{category}</p>
          <div className="flex items-center gap-1.5 mt-2">
            {[...Array(5)].map((_, i) => (
              <span key={i} className={`text-xs ${i < Math.floor(rating) ? "text-amber-400" : "text-gray-200"}`}>★</span>
            ))}
            <span className="text-[0.8rem] font-semibold text-gray-900 ml-0.5">{rating}</span>
            <span className="text-[0.8rem] text-gray-400">({reviews})</span>
          </div>
        </div>
        <div className="px-3 py-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: "var(--color-primary-light)" }}>
          <span className="text-[0.7rem] font-semibold whitespace-nowrap" style={{ color: "var(--color-primary)" }}>✓ Επαληθευμένος</span>
        </div>
      </div>
    </div>
  );
}

// ═══ HERO ═══
function Hero() {
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const categoryGroups = [
    { label: "Τεχνικά", items: CATEGORIES.filter(c => c.tier === "trades").slice(0, 6) },
    { label: "Ελαφριές Εργασίες", items: CATEGORIES.filter(c => c.tier === "light") },
    { label: "Ειδικοί", items: CATEGORIES.filter(c => c.tier === "specialists").slice(0, 4) },
  ];

  return (
    <section className="px-5 sm:px-8 overflow-hidden" style={{ backgroundColor: "var(--color-bg-light)" }}>
      <div className="max-w-[1200px] mx-auto py-16 md:py-24 lg:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-12 lg:gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8" style={{ backgroundColor: "var(--color-primary-light)" }}>
              <span style={{ color: "var(--color-primary)" }}>✓</span>
              <span className="text-[0.85rem] font-semibold" style={{ color: "var(--color-primary)" }}>0% Προμήθεια</span>
            </div>
            <h1 className="text-[clamp(2.5rem,5.5vw,3.75rem)] font-extrabold leading-[1.08] tracking-[-0.025em] mb-6" style={{ color: "var(--color-text, #1A2B3C)" }}>
              Βρες τον ειδικό<br className="hidden sm:block" /> για κάθε ανάγκη
            </h1>
            <p className="text-[1.2rem] text-gray-500 leading-[1.65] mb-10 max-w-[520px]">
              Αξιόπιστοι επαγγελματίες στην περιοχή σου. Επαληθευμένες κριτικές. Κράτηση online.
            </p>
            <div className="bg-white rounded-2xl border-[1.5px] border-gray-200 shadow-[0_4px_24px_rgba(0,0,0,0.07)] p-2 mb-6 max-w-[580px] focus-within:border-[var(--color-primary)] transition-colors">
              <div className="flex flex-col sm:flex-row items-stretch">
                <div className="flex-1 relative">
                  <button onClick={() => setCategoryOpen(!categoryOpen)} className="w-full flex items-center gap-3 px-4 py-4 text-left hover:bg-gray-50 rounded-xl transition-colors">
                    <span className="text-gray-400 flex-shrink-0">🔍</span>
                    <span className={`flex-1 text-[0.95rem] ${selectedCategory ? "text-gray-900 font-medium" : "text-gray-400"}`}>{selectedCategory || "Τι χρειάζεστε;"}</span>
                    <span className={`text-gray-400 text-xs transition-transform ${categoryOpen ? "rotate-180" : ""}`}>▼</span>
                  </button>
                  {categoryOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-gray-200 shadow-[0_12px_40px_rgba(0,0,0,0.12)] z-50 py-2 max-h-72 overflow-y-auto">
                      {categoryGroups.map((group) => (
                        <div key={group.label}>
                          <p className="px-4 pt-3 pb-1.5 text-[0.75rem] font-semibold text-gray-400 uppercase tracking-wider">{group.label}</p>
                          {group.items.map((cat) => (
                            <button key={cat.id} className="w-full text-left px-4 py-2.5 text-gray-900 hover:bg-[var(--color-primary-light)] transition-colors text-[0.9rem]"
                              onClick={() => { setSelectedCategory(cat.nameEl); setCategoryOpen(false); }}>
                              {cat.emoji} {cat.nameEl}
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="hidden sm:flex items-center px-0"><div className="w-px h-8 bg-gray-200" /></div>
                <div className="sm:hidden h-px bg-gray-200 mx-4" />
                <div className="flex-1">
                  <div className="flex items-center gap-3 px-4 py-4">
                    <span className="text-gray-400 flex-shrink-0">📍</span>
                    <input type="text" placeholder="Περιοχή..." className="flex-1 bg-transparent text-[0.95rem] text-gray-900 placeholder:text-gray-400 outline-none" />
                  </div>
                </div>
                <Link href="/services" className="text-white px-7 py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 m-0.5 text-[0.95rem] hover:opacity-90" style={{ backgroundColor: "var(--color-accent)" }}>
                  🔍 Αναζήτηση
                </Link>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[0.9rem] text-gray-500">
              <span className="flex items-center gap-1.5"><span style={{ color: "var(--color-primary)" }}>✓</span> Επαληθευμένοι επαγγελματίες</span>
              <span className="flex items-center gap-1.5"><span style={{ color: "var(--color-primary)" }}>✓</span> Δωρεάν για πελάτες</span>
              <span className="flex items-center gap-1.5"><span style={{ color: "var(--color-primary)" }}>✓</span> Άμεση κράτηση</span>
            </div>
          </div>
          <div className="hidden lg:flex flex-col items-center justify-center gap-5 relative py-4">
            <MiniProCard name="Νίκος Παπαδόπουλος" category="Υδραυλικός • Θεσσαλονίκη" rating={4.9} reviews={47} bg="#EBF5F5" color="#2A8F8F" online={true} rotate="rotate-[-2deg] translate-x-3" />
            <MiniProCard name="Μαρία Αλεξίου" category="Καθαρισμός • Καλαμαριά" rating={4.8} reviews={32} bg="#FFF0EB" color="#D4654A" online={true} rotate="rotate-[1.5deg] -translate-x-3" />
            <MiniProCard name="Γιώργος Δημητρίου" category="Ηλεκτρολόγος • Θέρμη" rating={5.0} reviews={28} bg="#EBF0FF" color="#4A6AE8" online={false} rotate="rotate-[-1deg] translate-x-5" />
          </div>
        </div>
      </div>
    </section>
  );
}

// ═══ POPULAR CATEGORIES ═══
function PopularCategories() {
  const popular = [
    { emoji: "🔧", name: "Υδραυλικός", count: 24, id: "plumber" },
    { emoji: "⚡", name: "Ηλεκτρολόγος", count: 18, id: "electrician" },
    { emoji: "🧹", name: "Καθαρισμός", count: 31, id: "house-cleaning" },
    { emoji: "💅", name: "Τεχνίτρια Νυχιών", count: 22, id: "nail-tech" },
    { emoji: "🎨", name: "Ελαιοχρωματιστής", count: 15, id: "painter" },
    { emoji: "❄️", name: "Κλιματισμός", count: 12, id: "hvac" },
  ];
  return (
    <section className="py-24 px-5 sm:px-8 bg-white">
      <div className="max-w-[1200px] mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-[2rem] font-bold text-gray-900 mb-3">Δημοφιλείς Κατηγορίες</h2>
          <p className="text-[1.05rem] text-gray-500">Βρείτε τον κατάλληλο επαγγελματία ανά κατηγορία</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
          {popular.map((cat) => (
            <Link key={cat.id} href={`/services?category=${cat.id}`} className="group bg-white border border-gray-200 rounded-2xl py-8 px-6 flex flex-col items-center gap-4 hover:border-[var(--color-primary)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-200 cursor-pointer">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl group-hover:scale-110 transition-transform" style={{ backgroundColor: "var(--color-primary-light)" }}>{cat.emoji}</div>
              <span className="text-[1.05rem] font-semibold text-gray-900 text-center">{cat.name}</span>
              <span className="text-[0.85rem] text-gray-400">{cat.count} επαγγελματίες</span>
            </Link>
          ))}
        </div>
        <div className="text-center mt-10">
          <Link href="/services" className="font-semibold hover:underline" style={{ color: "var(--color-primary)" }}>Δες όλες τις κατηγορίες →</Link>
        </div>
      </div>
    </section>
  );
}

// ═══ STATS BAR ═══
function StatsBar() {
  return (
    <section className="py-12 px-5 sm:px-8" style={{ backgroundColor: "var(--color-primary)" }}>
      <div className="max-w-[1200px] mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-center gap-10 md:gap-20">
          {[{ v: "1,200+", l: "Επαγγελματίες" }, { v: "50+", l: "Πόλεις" }, { v: "4.8 ★", l: "Μέση βαθμολογία" }].map((s, i) => (
            <div key={s.l} className="flex items-center gap-12">
              <div className="text-center">
                <p className="text-[2.25rem] font-bold text-white leading-tight">{s.v}</p>
                <p className="text-[0.95rem] text-white/75 mt-1">{s.l}</p>
              </div>
              {i < 2 && <div className="hidden md:block w-px h-12 bg-white/20" />}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ═══ HOW IT WORKS ═══
function HowItWorks() {
  const steps = [
    { num: 1, icon: "🔍", title: "Αναζήτηση", desc: "Βρείτε επαγγελματίες στην περιοχή σας με βάση κατηγορία και τοποθεσία." },
    { num: 2, icon: "👤", title: "Σύγκριση", desc: "Δείτε κριτικές, portfolio, τιμές και διαθεσιμότητα. Όλα επαληθευμένα." },
    { num: 3, icon: "📅", title: "Κράτηση", desc: "Επικοινωνήστε απευθείας ή κλείστε ραντεβού online — δωρεάν για εσάς." },
  ];
  return (
    <section className="py-28 px-5 sm:px-8" style={{ backgroundColor: "var(--color-bg-light)" }}>
      <div className="max-w-[1000px] mx-auto">
        <h2 className="text-[2rem] font-bold text-gray-900 text-center mb-20">Πώς Λειτουργεί</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-8 relative">
          <div className="hidden md:block absolute top-[24px] border-t-[2.5px] border-dashed border-gray-300" style={{ left: "calc(16.67% + 28px)", right: "calc(16.67% + 28px)" }} />
          {steps.map((step) => (
            <div key={step.num} className="flex flex-col items-center text-center relative z-10">
              <div className="w-12 h-12 rounded-full text-white flex items-center justify-center font-bold text-[1.1rem] mb-8 shadow-[0_4px_12px_rgba(42,143,143,0.3)]" style={{ backgroundColor: "var(--color-primary)" }}>{step.num}</div>
              <div className="w-20 h-20 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-center justify-center mb-6 text-3xl">{step.icon}</div>
              <h3 className="text-[1.25rem] font-bold text-gray-900 mb-3">{step.title}</h3>
              <p className="text-[0.95rem] text-gray-500 max-w-[280px] leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ═══ FEATURED PROFESSIONALS ═══
function FeaturedPros() {
  const pros = [
    { name: "Νίκος Παπαδόπουλος", cat: "Υδραυλικός", city: "Θεσσαλονίκη", rating: 4.9, reviews: 47, online: true, booking: true, bg: "#EBF5F5", color: "#2A8F8F" },
    { name: "Μαρία Αλεξίου", cat: "Καθαρισμός", city: "Καλαμαριά", rating: 4.8, reviews: 32, online: true, booking: true, bg: "#FFF0EB", color: "#D4654A" },
    { name: "Γιώργος Δημητρίου", cat: "Ηλεκτρολόγος", city: "Θέρμη", rating: 5.0, reviews: 28, online: false, booking: false, bg: "#EBF0FF", color: "#4A6AE8" },
  ];
  return (
    <section className="py-24 px-5 sm:px-8 bg-white">
      <div className="max-w-[1200px] mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-[2rem] font-bold text-gray-900 mb-3">Κορυφαίοι Επαγγελματίες</h2>
          <p className="text-[1.05rem] text-gray-500">Δείτε μερικούς από τους καλύτερα βαθμολογημένους επαγγελματίες μας</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {pros.map((pro) => {
            const initials = pro.name.split(" ").map(n => n[0]).join("");
            return (
              <div key={pro.name} className="group bg-white border border-gray-200 rounded-2xl p-7 hover:border-[var(--color-primary)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-200 cursor-pointer flex flex-col">
                <div className="flex items-start gap-4 mb-6">
                  <div className="relative flex-shrink-0">
                    <div className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg" style={{ backgroundColor: pro.bg, color: pro.color }}>{initials}</div>
                    {pro.online && <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-[2.5px] border-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-[1.1rem] text-gray-900">{pro.name}</h3>
                    <p className="text-[0.95rem] text-gray-500 mt-1">{pro.cat} • {pro.city}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 mb-6">
                  {[...Array(5)].map((_, i) => (<span key={i} className={`text-base ${i < Math.floor(pro.rating) ? "text-amber-400" : "text-gray-200"}`}>★</span>))}
                  <span className="text-[0.95rem] font-bold text-gray-900 ml-1.5">{pro.rating}</span>
                  <span className="text-[0.9rem] text-gray-500">({pro.reviews} κριτικές)</span>
                </div>
                <div className="flex flex-wrap gap-2.5 mb-6">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[0.8rem] font-semibold rounded-full" style={{ backgroundColor: "var(--color-primary-light)", color: "var(--color-primary)" }}>✓ Επαληθευμένος</span>
                  {pro.booking && (<span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[0.8rem] font-semibold rounded-full" style={{ backgroundColor: "var(--color-primary-light)", color: "var(--color-primary)" }}>📅 Online κράτηση</span>)}
                </div>
                <span className="font-semibold text-[0.95rem] mt-auto group-hover:translate-x-1 transition-transform inline-flex items-center gap-1" style={{ color: "var(--color-primary)" }}>Προβολή Προφίλ →</span>
              </div>
            );
          })}
        </div>
        <div className="text-center mt-12">
          <Link href="/services" className="inline-flex items-center gap-2 font-semibold text-[1rem] hover:underline" style={{ color: "var(--color-primary)" }}>Δες όλους τους επαγγελματίες →</Link>
        </div>
      </div>
    </section>
  );
}

// ═══ CTA BANNER ═══
function ProCTA() {
  return (
    <section className="py-24 px-5 sm:px-8" style={{ backgroundColor: "#0F1D2F" }}>
      <div className="max-w-[580px] mx-auto text-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-8 text-3xl" style={{ backgroundColor: "rgba(42,143,143,0.15)" }}>💼</div>
        <h2 className="text-[2rem] md:text-[2.25rem] font-bold text-white mb-5">Είσαι επαγγελματίας;</h2>
        <p className="text-[1.1rem] text-gray-400 leading-relaxed mb-10">Εγγράψου και ξεκίνα να δέχεσαι πελάτες σήμερα. Μηδέν προμήθεια — πληρώνεις μόνο τη συνδρομή σου. Από €10/μήνα.</p>
        <Link href="/pricing" className="inline-flex items-center gap-2.5 text-white px-10 py-4 rounded-xl font-semibold transition-all text-[1.1rem] hover:opacity-90" style={{ backgroundColor: "var(--color-accent)" }}>Ξεκίνα Τώρα →</Link>
        <p className="text-[0.9rem] text-gray-600 mt-8">✓ Εγγραφή σε 2 λεπτά <span className="mx-3">·</span> ✓ Ακύρωση ανά πάσα στιγμή</p>
      </div>
    </section>
  );
}

// ═══ MAIN PAGE ═══
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
