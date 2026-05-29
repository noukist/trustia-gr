// =============================================================
// app/[locale]/business/[slug]/page.tsx
// =============================================================
// Public business page — trustia.gr/business/[slug]
// PRD §15: cover, logo, business name, about, team, portfolio.
//
// SERVER COMPONENT — no auth required to view.
// Fetches: business_pages → professional → team_members → portfolio
// =============================================================

import type { Metadata }                        from "next";
import { notFound }                             from "next/navigation";
import { Link }                                 from "@/i18n/navigation";
import { setRequestLocale, getTranslations }    from "next-intl/server";
import { createClient }                         from "@/lib/supabase/server";
import { CATEGORIES }                           from "@/lib/constants";
import { MapPin, Star, ArrowLeft, Users }       from "lucide-react";

type PageParams = Promise<{ locale: string; slug: string }>;

// ── Metadata ──────────────────────────────────────────────────

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
  const { locale, slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("business_pages")
    .select("business_name, about")
    .eq("slug", slug)
    .maybeSingle();

  if (!data) return { title: "Σελίδα δεν βρέθηκε" };

  return {
    title:       data.business_name,
    description: data.about?.slice(0, 160) ?? `${data.business_name} — Trustia.gr`,
  };
}

// ── DB types ──────────────────────────────────────────────────

interface DbBusinessPage {
  id:            string;
  business_name: string;
  slug:          string;
  about:         string | null;
  cover_url:     string | null;
  logo_url:      string | null;
  professional: {
    id:           string;
    slug:         string | null;
    first_name:   string;
    last_name:    string;
    avatar_url:   string | null;
    category_id:  string;
    city:         string | null;
    rating:       number;
    review_count: number;
  };
}

interface DbTeamMember {
  id:        string;
  name:      string;
  role:      string | null;
  photo_url: string | null;
  sort_order: number;
}

interface DbPortfolioPhoto {
  id:        string;
  photo_url: string;
  caption:   string | null;
}

// ── Page ──────────────────────────────────────────────────────

export default async function BusinessPage({ params }: { params: PageParams }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const t        = await getTranslations("business");
  const supabase = await createClient();

  // ── Fetch business page ───────────────────────────────────
  const { data: bpRaw } = await supabase
    .from("business_pages")
    .select(
      "id, business_name, slug, about, cover_url, logo_url, " +
      "professional:professional_id(" +
        "id, slug, first_name, last_name, avatar_url, " +
        "category_id, city, rating, review_count" +
      ")",
    )
    .eq("slug", slug)
    .is("deleted_at", null)
    .maybeSingle();

  if (!bpRaw) notFound();

  const bp  = bpRaw as unknown as DbBusinessPage;
  const pro = bp.professional;

  // ── Fetch team + portfolio in parallel ────────────────────
  const [teamRes, portfolioRes] = await Promise.all([
    supabase
      .from("team_members")
      .select("id, name, role, photo_url, sort_order")
      .eq("business_page_id", bp.id)
      .order("sort_order"),
    supabase
      .from("portfolio_photos")
      .select("id, photo_url, caption")
      .eq("professional_id", pro.id)
      .is("deleted_at", null)
      .order("sort_order")
      .limit(12),
  ]);

  const team      = (teamRes.data      ?? []) as DbTeamMember[];
  const portfolio = (portfolioRes.data ?? []) as DbPortfolioPhoto[];

  const cat      = CATEGORIES.find((c) => c.id === pro.category_id);
  const catName  = locale === "en" && cat?.nameEn ? cat.nameEn : cat?.nameEl ?? "";
  const catEmoji = cat?.emoji ?? "🔧";
  const proName  = `${pro.first_name} ${pro.last_name}`;
  const proSlug  = pro.slug ?? pro.id;

  // ── Render ────────────────────────────────────────────────
  return (
    <div style={{ backgroundColor: "var(--color-bg-light)", minHeight: "100vh" }}>

      {/* ── Cover photo ── */}
      <div
        style={{
          width:           "100%",
          height:          "clamp(180px, 28vw, 320px)",
          backgroundColor: "var(--color-primary)",
          backgroundImage: bp.cover_url ? `url(${bp.cover_url})` : undefined,
          backgroundSize:  "cover",
          backgroundPosition: "center",
          position:        "relative",
        }}
      >
        {/* Back button */}
        <Link
          href={`/professional/${proSlug}`}
          style={{
            position:        "absolute",
            top:             "1rem",
            left:            "1rem",
            display:         "inline-flex",
            alignItems:      "center",
            gap:             "0.375rem",
            padding:         "0.4rem 0.875rem",
            backgroundColor: "rgba(255,255,255,0.9)",
            backdropFilter:  "blur(4px)",
            border:          "1px solid rgba(255,255,255,0.6)",
            borderRadius:    "8px",
            fontSize:        "0.8125rem",
            fontWeight:      600,
            color:           "var(--color-text)",
            textDecoration:  "none",
          }}
        >
          <ArrowLeft size={14} />
          {t("backToProfile")}
        </Link>
      </div>

      {/* ── Identity bar ── */}
      <div style={{ backgroundColor: "#fff", borderBottom: "1px solid var(--color-border)" }}>
        <div
          style={{
            maxWidth:   "900px",
            margin:     "0 auto",
            padding:    "0 1.5rem",
            display:    "flex",
            alignItems: "flex-end",
            gap:        "1.25rem",
            position:   "relative",
            paddingBottom: "1.25rem",
          }}
        >
          {/* Logo — overlaps cover */}
          <div
            style={{
              width:           "88px",
              height:          "88px",
              borderRadius:    "16px",
              border:          "3px solid #fff",
              backgroundColor: "var(--color-primary-bg)",
              backgroundImage: bp.logo_url ? `url(${bp.logo_url})` : undefined,
              backgroundSize:  "cover",
              backgroundPosition: "center",
              flexShrink:      0,
              marginTop:       "-44px",
              boxShadow:       "0 4px 16px rgba(0,0,0,0.12)",
              display:         "flex",
              alignItems:      "center",
              justifyContent:  "center",
              fontSize:        "2rem",
            }}
          >
            {!bp.logo_url && catEmoji}
          </div>

          <div style={{ paddingTop: "0.75rem" }}>
            <h1
              style={{
                fontSize:      "clamp(1.25rem, 4vw, 1.625rem)",
                fontWeight:    800,
                color:         "var(--color-text)",
                margin:        "0 0 0.2rem",
                letterSpacing: "-0.025em",
              }}
            >
              {bp.business_name}
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", flexWrap: "wrap" }}>
              <span style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
                {catEmoji} {catName}
              </span>
              {pro.city && (
                <>
                  <span style={{ color: "var(--color-border)" }}>·</span>
                  <span style={{ display: "flex", alignItems: "center", gap: "0.2rem", fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
                    <MapPin size={13} /> {pro.city}
                  </span>
                </>
              )}
              {pro.rating > 0 && (
                <>
                  <span style={{ color: "var(--color-border)" }}>·</span>
                  <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
                    <Star size={13} fill="#F59E0B" style={{ color: "#F59E0B" }} />
                    {pro.rating.toFixed(1)} ({pro.review_count})
                  </span>
                </>
              )}
            </div>
          </div>

          {/* CTA button */}
          <div style={{ marginLeft: "auto", paddingTop: "0.75rem" }}>
            <Link
              href={`/professional/${proSlug}`}
              style={{
                display:         "inline-flex",
                alignItems:      "center",
                padding:         "0.625rem 1.25rem",
                backgroundColor: "var(--color-primary)",
                color:           "#fff",
                borderRadius:    "10px",
                fontWeight:      700,
                fontSize:        "0.9rem",
                textDecoration:  "none",
              }}
            >
              {t("bookNow")}
            </Link>
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "2rem 1.5rem", display: "flex", flexDirection: "column", gap: "2rem" }}>

        {/* About */}
        {bp.about && (
          <section>
            <h2 style={{ fontSize: "1.0625rem", fontWeight: 700, color: "var(--color-text)", margin: "0 0 0.875rem" }}>
              {t("about")}
            </h2>
            <div
              style={{
                backgroundColor: "#fff",
                border:          "1.5px solid var(--color-border)",
                borderRadius:    "14px",
                padding:         "1.25rem 1.5rem",
                fontSize:        "0.9375rem",
                lineHeight:      1.8,
                color:           "var(--color-text)",
                whiteSpace:      "pre-wrap",
              }}
            >
              {bp.about}
            </div>
          </section>
        )}

        {/* Team */}
        {team.length > 0 && (
          <section>
            <h2 style={{ fontSize: "1.0625rem", fontWeight: 700, color: "var(--color-text)", margin: "0 0 0.875rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Users size={18} style={{ color: "var(--color-primary)" }} />
              {t("team")}
            </h2>
            <div
              style={{
                display:             "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                gap:                 "1rem",
              }}
            >
              {team.map((member) => {
                const initials = member.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
                return (
                  <div
                    key={member.id}
                    style={{
                      backgroundColor: "#fff",
                      border:          "1.5px solid var(--color-border)",
                      borderRadius:    "14px",
                      padding:         "1.25rem 1rem",
                      textAlign:       "center",
                    }}
                  >
                    {/* Avatar */}
                    <div
                      style={{
                        width:           "64px",
                        height:          "64px",
                        borderRadius:    "50%",
                        margin:          "0 auto 0.75rem",
                        backgroundImage: member.photo_url ? `url(${member.photo_url})` : undefined,
                        backgroundSize:  "cover",
                        backgroundPosition: "center",
                        backgroundColor: member.photo_url ? undefined : "var(--color-primary-bg)",
                        display:         "flex",
                        alignItems:      "center",
                        justifyContent:  "center",
                        fontSize:        "1.125rem",
                        fontWeight:      700,
                        color:           "var(--color-primary)",
                      }}
                    >
                      {!member.photo_url && initials}
                    </div>
                    <p style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--color-text)", margin: "0 0 0.2rem" }}>
                      {member.name}
                    </p>
                    {member.role && (
                      <p style={{ fontSize: "0.775rem", color: "var(--color-text-muted)", margin: 0 }}>
                        {member.role}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Portfolio */}
        {portfolio.length > 0 && (
          <section>
            <h2 style={{ fontSize: "1.0625rem", fontWeight: 700, color: "var(--color-text)", margin: "0 0 0.875rem" }}>
              {t("portfolio")}
            </h2>
            <div
              style={{
                display:             "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap:                 "0.75rem",
              }}
            >
              {portfolio.map((photo) => (
                <div
                  key={photo.id}
                  style={{
                    borderRadius:    "12px",
                    overflow:        "hidden",
                    border:          "1.5px solid var(--color-border)",
                    backgroundColor: "var(--color-bg-light)",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.photo_url}
                    alt={photo.caption ?? "Portfolio"}
                    style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover", display: "block" }}
                  />
                  {photo.caption && (
                    <p style={{ padding: "0.5rem 0.75rem", fontSize: "0.8rem", color: "var(--color-text-muted)", margin: 0 }}>
                      {photo.caption}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Footer CTA */}
        <div
          style={{
            backgroundColor: "var(--color-primary)",
            borderRadius:    "16px",
            padding:         "2rem",
            textAlign:       "center",
            color:           "#fff",
          }}
        >
          <p style={{ fontSize: "1.0625rem", fontWeight: 700, margin: "0 0 0.5rem" }}>
            {t("ctaTitle", { name: bp.business_name })}
          </p>
          <p style={{ fontSize: "0.9rem", opacity: 0.85, margin: "0 0 1.25rem" }}>
            {t("ctaSub")}
          </p>
          <Link
            href={`/professional/${proSlug}`}
            style={{
              display:         "inline-flex",
              alignItems:      "center",
              padding:         "0.7rem 2rem",
              backgroundColor: "#fff",
              color:           "var(--color-primary)",
              borderRadius:    "10px",
              fontWeight:      800,
              fontSize:        "0.9375rem",
              textDecoration:  "none",
            }}
          >
            {t("bookNow")}
          </Link>
        </div>

      </div>
    </div>
  );
}
