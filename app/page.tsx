// =============================================================
// app/page.tsx — Trustia.gr Homepage
// =============================================================
// Server Component. Composes the four homepage sections in order:
//
//   1. HeroSection    — Full-width gradient hero with search form
//   2. CategoryGrid   — 12 most popular service categories
//   3. HowItWorks     — Three-step explainer (Search → Book → Review)
//   4. ProCTA         — Professional recruitment with founding-member offer
//
// Page-level metadata (title, description, OG) is inherited from
// app/layout.tsx — no override needed for the homepage default title.
// =============================================================

import HeroSection  from "@/components/home/HeroSection";
import CategoryGrid from "@/components/home/CategoryGrid";
import HowItWorks   from "@/components/home/HowItWorks";
import ProCTA       from "@/components/home/ProCTA";

export default function HomePage() {
  return (
    <>
      {/* 1 — Hero with search */}
      <HeroSection />

      {/* 2 — Popular category cards */}
      <CategoryGrid />

      {/* 3 — How it works steps */}
      <HowItWorks />

      {/* 4 — Professional recruitment CTA */}
      <ProCTA />
    </>
  );
}
