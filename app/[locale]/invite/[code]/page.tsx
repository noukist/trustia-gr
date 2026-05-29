// =============================================================
// app/[locale]/invite/[code]/page.tsx
// =============================================================
// Review invitation landing page.
//
// FLOW
//   1. Fetch review_invitations row by code
//   2. Validate: row exists, not expired, used_count < max_uses
//   3. Fetch the professional's slug
//   4. Redirect to /professional/[slug]?invite=[code]
//      — the professional profile page reads ?invite= and
//        auto-opens WriteReviewModal pre-set to invitation type
//
// If the code is invalid or exhausted, show a friendly error page.
// =============================================================

import { redirect }                          from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { createClient }                      from "@/lib/supabase/server";
import { Link }                              from "@/i18n/navigation";

type PageParams = Promise<{ locale: string; code: string }>;

export default async function InvitePage({ params }: { params: PageParams }) {
  const { locale, code } = await params;
  setRequestLocale(locale);

  const t        = await getTranslations({ locale, namespace: "invite" });
  const supabase = await createClient();

  // ── 1. Fetch invitation ──────────────────────────────────────
  const { data: inv } = await supabase
    .from("review_invitations")
    .select("id, professional_id, max_uses, used_count, expires_at")
    .eq("code", code)
    .maybeSingle();

  // ── 2. Validate ──────────────────────────────────────────────
  const now = new Date();

  const invalid =
    !inv ||
    inv.used_count >= inv.max_uses ||
    (inv.expires_at && new Date(inv.expires_at) < now);

  if (invalid) {
    return (
      <main
        style={{
          minHeight:       "calc(100vh - 72px)",
          display:         "flex",
          alignItems:      "center",
          justifyContent:  "center",
          padding:         "2rem",
          backgroundColor: "var(--color-bg-light)",
        }}
      >
        <div
          style={{
            maxWidth:        "420px",
            width:           "100%",
            backgroundColor: "#fff",
            border:          "1.5px solid var(--color-border)",
            borderRadius:    "16px",
            padding:         "2.5rem 2rem",
            textAlign:       "center",
          }}
        >
          <p style={{ fontSize: "3rem", margin: "0 0 1rem" }}>🔗</p>
          <h1
            style={{
              fontSize:     "1.25rem",
              fontWeight:   700,
              color:        "var(--color-text)",
              margin:       "0 0 0.5rem",
            }}
          >
            {t("invalidTitle")}
          </h1>
          <p
            style={{
              fontSize:  "0.9rem",
              color:     "var(--color-text-muted)",
              margin:    "0 0 1.5rem",
              lineHeight: 1.6,
            }}
          >
            {t("invalidHint")}
          </p>
          <Link
            href="/"
            style={{
              display:         "inline-flex",
              alignItems:      "center",
              padding:         "0.625rem 1.5rem",
              backgroundColor: "var(--color-primary)",
              color:           "#fff",
              borderRadius:    "10px",
              fontWeight:      700,
              fontSize:        "0.9375rem",
              textDecoration:  "none",
            }}
          >
            {t("goHome")}
          </Link>
        </div>
      </main>
    );
  }

  // ── 3. Fetch professional slug ───────────────────────────────
  const { data: pro } = await supabase
    .from("professionals")
    .select("slug, id")
    .eq("id", inv.professional_id)
    .maybeSingle();

  if (!pro) {
    // Professional deleted — treat as invalid
    redirect(`/${locale}`);
  }

  const proPath = pro.slug ?? pro.id;

  // ── 4. Redirect to professional profile with invite param ────
  redirect(`/${locale === "el" ? "" : locale + "/"}professional/${proPath}?invite=${code}`);
}
