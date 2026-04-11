// =============================================================
// page.tsx — Homepage of Mastori.gr
// =============================================================
// The complete homepage with all sections in order:
// 1. Hero — search bar with autocomplete
// 2. Brand Statement — mission, values, who we are
// 3. Category Grid — 12 popular categories
// 4. How It Works — 3 step explanation
// 5. Why Mastori — trust section (reviews, photos, prices)
// 6. Pro CTA — call-to-action for professionals
// =============================================================

"use client";

import HeroSection from "@/components/home/HeroSection";
import BrandStatement from "@/components/home/BrandStatement";
import CategoryGrid from "@/components/home/CategoryGrid";
import HowItWorks from "@/components/home/HowItWorks";
import WhyMastori from "@/components/home/WhyMastori";
import ProCTA from "@/components/home/ProCTA";

export default function HomePage() {
  return (
    <div>
      {/* Big navy banner with search bar */}
      <HeroSection lang="el" />

      {/* Mission statement — who we are and what we believe */}
      <BrandStatement lang="el" />

      {/* Popular categories grid (12 clickable tiles) */}
      <CategoryGrid lang="el" />

      {/* How it works — 3 step explanation */}
      <HowItWorks lang="el" />

      {/* Why Mastori.gr — trust section */}
      <WhyMastori lang="el" />

      {/* Call-to-action for professionals */}
      <ProCTA lang="el" />
    </div>
  );
}