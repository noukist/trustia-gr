// =============================================================
// app/page.tsx — Homepage of Trustia.gr
// =============================================================
// 6 sections: Hero, Categories, Stats, How It Works, Featured, CTA
// Navbar, Footer, AnnouncementBar handled by layout.tsx
// =============================================================

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CATEGORIES } from "@/lib/constants";

// ── Lucide icons ──
import {
  Search, MapPin, ChevronDown, CheckCircle, Star,
  Wrench, Zap, Sparkles, Paintbrush, Wind, Scissors,
  UserCheck, Calendar, Briefcase, ArrowRight,
} from "lucide-react";

// ── Types for Google Places autocomplete ──
interface PlaceResult {
  placeId: string;
  name: string;
  fullPath: string;
}

// =============================================================
// MINI PRO CARD — Hero right side preview cards
// =============================================================
function MiniProCard({ name, category, rating, reviews, bg, color, online, rotate }: {
  name: string; category: string; rating: number; reviews: number;
  bg: string; color: string; online: boolean; rotate: string;
}) {
  const initials = name.split(" ").map(n => n[0]).join("");
  return (
    <div className={`bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.08)] w-[310px] border border-gray-100 p-4 ${rotate} transition-transform hover:scale-[1.02]`}>
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: bg, color }}>{initials}</div>
          {online && <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white" />}
        </div>
        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm">{name}</p>
          <p className="text-xs text-gray-500 mt-0.5">{category}</p>
          <div className="flex items-center gap-0.5 mt-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className={`w-3 h-3 ${i < Math.floor(rating) ? "text-amber-400 fill-amber-400" : "text-gray-200 fill-gray-200"}`} />
            ))}
            <span className="text-xs font-semibold text-gray-900 ml-1">{rating}</span>
            <span className="text-xs text-gray-400">({reviews})</span>
          </div>
        </div>
        {/* Badge */}
        <div className="px-2 py-1 rounded-full flex-shrink-0" style={{ backgroundColor: "var(--color-primary-light)" }}>
          <span className="text-[0.65rem] font-semibold whitespace-nowrap" style={{ color: "var(--color-primary)" }}>✓ Επαληθ.</span>
        </div>
      </div>
    </div>
  );
}

// =============================================================
// SECTION 1: HERO
// Two-column: search bar with Google Places autocomplete + cards
// =============================================================
function Hero() {
  // ── Category dropdown state ──
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");

  // ── Location autocomplete state ──
  // Connects to /api/places which uses Google Places API
  const [areaSearch, setAreaSearch] = useState("");
  const [suggestions, setSuggestions] = useState<PlaceResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState("");

  // Fetch location suggestions from Google Places API
  // Debounced by 300ms to avoid excessive API calls
  useEffect(() => {
    if (areaSearch.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch("/api/places?q=" + encodeURIComponent(areaSearch));
        const data = await res.json();
        setSuggestions(data);
        if (data.length > 0) setShowSuggestions(true);
      } catch {
        setSuggestions([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [areaSearch]);

  // Navigate to /services with selected filters
  const handleSearch = () => {
    const params = new URLSearchParams();
    if (selectedCategoryId) params.set("category", selectedCategoryId);
    if (selectedPlace) params.set("area", selectedPlace);
    window.location.href = "/services?" + params.toString();
  };

  // Categories grouped by tier for dropdown
  const categoryGroups = [
    { label: "Τεχνικά", items: CATEGORIES.filter(c => c.tier === "trades").slice(0, 8) },
    { label: "Ελαφριές Εργασίες", items: CATEGORIES.filter(c => c.tier === "light") },
    { label: "Ειδικοί", items: CATEGORIES.filter(c => c.tier === "specialists").slice(0, 6) },
  ];

  return (
    <section className="px-5 sm:px-8 overflow-hidden" style={{ background: "linear-gradient(180deg, #D4EDED 0%, #EBF5F5 60%, #F7F8FA 100%)" }}>
      <div className="max-w-[1200px] mx-auto py-12 md:py-16 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10 lg:gap-12 items-center">

          {/* ── LEFT COLUMN ── */}
          <div>
            {/* Commission badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6" style={{ backgroundColor: "var(--color-primary)", color: "white" }}>
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-semibold">0% Προμήθεια</span>
            </div>

            {/* Heading */}
            <h1 className="text-[clamp(2.2rem,5vw,3.25rem)] font-extrabold leading-[1.1] tracking-[-0.025em] mb-4" style={{ color: "#1A2B3C" }}>
              Βρες τον ειδικό<br className="hidden sm:block" /> για κάθε ανάγκη
            </h1>

            {/* Subtitle */}
            <p className="text-lg text-gray-500 leading-relaxed mb-8 max-w-[480px]">
              Αξιόπιστοι επαγγελματίες στην περιοχή σου. Επαληθευμένες κριτικές. Κράτηση online.
            </p>

            {/* ── SEARCH BAR ── */}
            <div className="bg-white rounded-2xl border-[1.5px] border-gray-200 shadow-[0_4px_24px_rgba(0,0,0,0.07)] p-2 mb-5 max-w-[550px] focus-within:border-[var(--color-primary)] transition-colors">
              <div className="flex flex-col sm:flex-row items-stretch">

                {/* Category dropdown — wider, more spacious */}
                <div className="flex-1 relative min-w-[200px]">
                  <button onClick={() => setCategoryOpen(!categoryOpen)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-gray-50 rounded-xl transition-colors">
                    <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className={`flex-1 text-sm ${selectedCategory ? "text-gray-900 font-medium" : "text-gray-400"}`}>
                      {selectedCategory || "Τι χρειάζεστε;"}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${categoryOpen ? "rotate-180" : ""}`} />
                  </button>

                  {/* Dropdown — wider, taller, better spaced */}
                  {categoryOpen && (
                    <div className="absolute top-full left-0 mt-2 bg-white rounded-xl border border-gray-200 shadow-[0_12px_40px_rgba(0,0,0,0.12)] z-50 py-3 max-h-80 overflow-y-auto"
                      style={{ minWidth: "320px" }}>
                      {categoryGroups.map((group) => (
                        <div key={group.label}>
                          {/* Group label */}
                          <p className="px-5 pt-3 pb-2 text-xs font-bold uppercase tracking-wider" style={{ color: "var(--color-primary)" }}>
                            {group.label}
                          </p>
                          {group.items.map((cat) => (
                            <button key={cat.id}
                              className="w-full text-left px-5 py-2.5 text-gray-800 hover:bg-[var(--color-primary-light)] transition-colors text-sm flex items-center gap-2"
                              onClick={() => {
                                setSelectedCategory(cat.nameEl);
                                setSelectedCategoryId(cat.id);
                                setCategoryOpen(false);
                              }}>
                              <span className="text-base">{cat.emoji}</span>
                              <span>{cat.nameEl}</span>
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Dividers */}
                <div className="hidden sm:flex items-center"><div className="w-px h-7 bg-gray-200" /></div>
                <div className="sm:hidden h-px bg-gray-200 mx-4" />

                {/* Location input — with Google Places autocomplete */}
                <div className="flex-1 relative min-w-[180px]">
                  <div className="flex items-center gap-3 px-4 py-3.5">
                    <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <input
                      type="text"
                      value={areaSearch}
                      onChange={(e) => {
                        setAreaSearch(e.target.value);
                        setSelectedPlace("");
                      }}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                      placeholder="Περιοχή..."
                      className="flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 outline-none"
                    />
                  </div>

                  {/* Location suggestions dropdown */}
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.12)] z-50 max-h-60 overflow-y-auto">
                      {suggestions.map((place) => (
                        <button key={place.placeId}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setAreaSearch(place.name);
                            setSelectedPlace(place.name);
                            setShowSuggestions(false);
                          }}
                          className="w-full text-left px-4 py-3 hover:bg-[var(--color-primary-light)] text-sm text-gray-700 border-b border-gray-50 last:border-0 transition-colors">
                          <span className="font-medium">{place.name}</span>
                          <span className="text-xs text-gray-400 block mt-0.5">{place.fullPath}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Search button — CORAL, now functional */}
                <button onClick={handleSearch}
                  className="text-white px-6 py-3.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 m-0.5 text-sm hover:opacity-90 cursor-pointer"
                  style={{ backgroundColor: "var(--color-accent)" }}>
                  <Search className="w-4 h-4" />
                  Αναζήτηση
                </button>
              </div>
            </div>

            {/* Trust signals */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
              <span className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5" style={{ color: "var(--color-primary)" }} /> Επαληθευμένοι επαγγελματίες</span>
              <span className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5" style={{ color: "var(--color-primary)" }} /> Δωρεάν για πελάτες</span>
              <span className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5" style={{ color: "var(--color-primary)" }} /> Άμεση κράτηση</span>
            </div>
          </div>

          {/* ── RIGHT COLUMN: Mini cards (desktop only) ── */}
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
// SECTION 2: POPULAR CATEGORIES — 6 tiles with Lucide icons
// =============================================================
function PopularCategories() {
  const popular = [
    { Icon: Wrench, name: "Υδραυλικός", count: 24, id: "plumber" },
    { Icon: Zap, name: "Ηλεκτρολόγος", count: 18, id: "electrician" },
    { Icon: Sparkles, name: "Καθαρισμός", count: 31, id: "house-cleaning" },
    { Icon: Scissors, name: "Τεχνίτρια Νυχιών", count: 22, id: "nail-tech" },
    { Icon: Paintbrush, name: "Ελαιοχρωματιστής", count: 15, id: "painter" },
    { Icon: Wind, name: "Κλιματισμός", count: 12, id: "hvac" },
  ];

  return (
    <section className="py-14 px-5 sm:px-8 bg-white">
      <div className="max-w-[1200px] mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Δημοφιλείς Κατηγορίες</h2>
          <p className="text-gray-500">Βρείτε τον κατάλληλο επαγγελματία ανά κατηγορία</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {popular.map((cat) => (
            <Link key={cat.id} href={`/services?category=${cat.id}`}
              className="group bg-white border border-gray-200 rounded-xl py-6 px-5 flex flex-col items-center gap-3 hover:border-[var(--color-primary)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
              <div className="w-14 h-14 rounded-full flex items-center justify-center group-hover:scale-110 transition-all duration-200" style={{ backgroundColor: "var(--color-primary-light)" }}>
                <cat.Icon className="w-6 h-6 transition-colors duration-200" style={{ color: "var(--color-primary)" }} />
              </div>
              <span className="text-sm font-semibold text-gray-900 text-center">{cat.name}</span>
              <span className="text-xs text-gray-400">{cat.count} επαγγελματίες</span>
            </Link>
          ))}
        </div>
        <div className="text-center mt-8">
          <Link href="/services" className="text-sm font-semibold hover:underline inline-flex items-center gap-1" style={{ color: "var(--color-primary)" }}>
            Δες όλες τις κατηγορίες <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

// =============================================================
// SECTION 3: STATS BAR — Teal background, white numbers
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
              {i < 2 && <div className="hidden md:block w-px h-10 bg-white/20" />}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// =============================================================
// SECTION 4: HOW IT WORKS — 3 steps with dashed connector
// =============================================================
function HowItWorks() {
  const steps = [
    { num: 1, Icon: Search, title: "Αναζήτηση", desc: "Βρείτε επαγγελματίες στην περιοχή σας ανά κατηγορία και τοποθεσία." },
    { num: 2, Icon: UserCheck, title: "Σύγκριση", desc: "Δείτε κριτικές, portfolio, τιμές και διαθεσιμότητα." },
    { num: 3, Icon: Calendar, title: "Κράτηση", desc: "Επικοινωνήστε ή κλείστε ραντεβού online — δωρεάν." },
  ];

  return (
    <section className="py-14 px-5 sm:px-8" style={{ backgroundColor: "var(--color-bg-light)" }}>
      <div className="max-w-[900px] mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-12">Πώς Λειτουργεί</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-6 relative">
          {/* Dashed connector */}
          <div className="hidden md:block absolute top-[20px] border-t-2 border-dashed border-gray-300"
            style={{ left: "calc(16.67% + 24px)", right: "calc(16.67% + 24px)" }} />
          {steps.map((step) => (
            <div key={step.num} className="flex flex-col items-center text-center relative z-10">
              <div className="w-10 h-10 rounded-full text-white flex items-center justify-center font-bold text-sm mb-5 shadow-md"
                style={{ backgroundColor: "var(--color-primary)" }}>{step.num}</div>
              <div className="w-16 h-16 rounded-xl bg-white border border-gray-200 shadow-sm flex items-center justify-center mb-4">
                <step.Icon className="w-7 h-7" style={{ color: "var(--color-primary)" }} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
              <p className="text-sm text-gray-500 max-w-[240px] leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// =============================================================
// SECTION 5: FEATURED PROFESSIONALS — 3 sample cards
// =============================================================
function FeaturedPros() {
  const pros = [
    { name: "Νίκος Παπαδόπουλος", cat: "Υδραυλικός", city: "Θεσσαλονίκη", rating: 4.9, reviews: 47, online: true, booking: true, bg: "#EBF5F5", color: "#2A8F8F" },
    { name: "Μαρία Αλεξίου", cat: "Καθαρισμός", city: "Καλαμαριά", rating: 4.8, reviews: 32, online: true, booking: true, bg: "#FFF0EB", color: "#D4654A" },
    { name: "Γιώργος Δημητρίου", cat: "Ηλεκτρολόγος", city: "Θέρμη", rating: 5.0, reviews: 28, online: false, booking: false, bg: "#EBF0FF", color: "#4A6AE8" },
  ];

  return (
    <section className="py-14 px-5 sm:px-8 bg-white">
      <div className="max-w-[1200px] mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Κορυφαίοι Επαγγελματίες</h2>
          <p className="text-gray-500">Μερικοί από τους καλύτερα βαθμολογημένους επαγγελματίες μας</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {pros.map((pro) => {
            const initials = pro.name.split(" ").map(n => n[0]).join("");
            return (
              <div key={pro.name}
                className="group bg-white border border-gray-200 rounded-xl p-5 hover:border-[var(--color-primary)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col"
                style={{ borderLeft: `3px solid ${pro.color}` }}>
                <div className="flex items-start gap-3 mb-4">
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold" style={{ backgroundColor: pro.bg, color: pro.color }}>{initials}</div>
                    {pro.online && <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900">{pro.name}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">{pro.cat} • {pro.city}</p>
                  </div>
                </div>
                <div className="flex items-center gap-0.5 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-4 h-4 ${i < Math.floor(pro.rating) ? "text-amber-400 fill-amber-400" : "text-gray-200 fill-gray-200"}`} />
                  ))}
                  <span className="text-sm font-bold text-gray-900 ml-1.5">{pro.rating}</span>
                  <span className="text-sm text-gray-500">({pro.reviews} κριτικές)</span>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full"
                    style={{ backgroundColor: "var(--color-primary-light)", color: "var(--color-primary)" }}>
                    <CheckCircle className="w-3 h-3" /> Επαληθευμένος
                  </span>
                  {pro.booking && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full"
                      style={{ backgroundColor: "var(--color-primary-light)", color: "var(--color-primary)" }}>
                      <Calendar className="w-3 h-3" /> Online κράτηση
                    </span>
                  )}
                </div>
                <span className="text-sm font-semibold mt-auto group-hover:translate-x-1 transition-transform inline-flex items-center gap-1"
                  style={{ color: "var(--color-primary)" }}>
                  Προβολή Προφίλ <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            );
          })}
        </div>
        <div className="text-center mt-8">
          <Link href="/services" className="inline-flex items-center gap-1 text-sm font-semibold hover:underline"
            style={{ color: "var(--color-primary)" }}>
            Δες όλους τους επαγγελματίες <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

// =============================================================
// SECTION 6: PRO CTA — Dark banner for professionals
// =============================================================
function ProCTA() {
  return (
    <section className="py-16 px-5 sm:px-8" style={{ backgroundColor: "#0F1D2F" }}>
      <div className="max-w-[520px] mx-auto text-center">
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ backgroundColor: "rgba(42,143,143,0.15)" }}>
          <Briefcase className="w-7 h-7 text-[#7DD3D3]" />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Είσαι επαγγελματίας;</h2>
        <p className="text-gray-400 leading-relaxed mb-8">
          Εγγράψου και ξεκίνα να δέχεσαι πελάτες σήμερα. Μηδέν προμήθεια — πληρώνεις μόνο τη συνδρομή σου. Από €10/μήνα.
        </p>
        <Link href="/pricing"
          className="inline-flex items-center gap-2 text-white px-8 py-3.5 rounded-xl font-semibold transition-all text-lg hover:opacity-90"
          style={{ backgroundColor: "var(--color-accent)" }}>
          Ξεκίνα Τώρα <ArrowRight className="w-5 h-5" />
        </Link>
        <p className="text-sm text-gray-600 mt-6">
          <span className="inline-flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Εγγραφή σε 2 λεπτά</span>
          <span className="mx-2">·</span>
          <span className="inline-flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Ακύρωση ανά πάσα στιγμή</span>
        </p>
      </div>
    </section>
  );
}

// =============================================================
// MAIN PAGE
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