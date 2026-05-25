// =============================================================
// app/[locale]/page.tsx — Trustia.gr Homepage
// =============================================================
// Server Component. Composes the homepage sections.
// Locale is propagated to child components via NextIntlClientProvider
// (set up in app/[locale]/layout.tsx).
// =============================================================

import { setRequestLocale } from "next-intl/server";
import HeroSection     from "@/components/home/HeroSection";
import BrandStatement  from "@/components/home/BrandStatement";
import CategoryGrid    from "@/components/home/CategoryGrid";
import HowItWorks      from "@/components/home/HowItWorks";
import ProCTA          from "@/components/home/ProCTA";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <HeroSection />
      <BrandStatement />
      <CategoryGrid />
      <HowItWorks />
      <ProCTA />
    </>
  );
}
