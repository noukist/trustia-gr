// =============================================================
// app/[locale]/profile/page.tsx
// =============================================================
// Customer profile page — auth-gated Server Component.
//
// AUTH FLOW
//   1. No session               → redirect /[locale]/login?next=/[locale]/profile
//   2. Session + professional   → redirect /[locale]/dashboard  (pros have their own page)
//   3. Session + customer only  → render profile editor
//
// DATA FETCHED
//   - auth user (id, email, user_metadata for OAuth name/avatar)
//   - customers row (may be null for brand-new OAuth users)
//
// The interactive parts (form fields, save button) are handled
// by the CustomerProfileForm client component.
// =============================================================

import type { Metadata }                     from "next";
import { redirect }                          from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient }                      from "@/lib/supabase/server";
import CustomerProfileForm                   from "@/components/profile/CustomerProfileForm";

// Dynamic metadata — layout template appends "| Trustia.gr"
export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "myProfile" });
  return { title: t("title") };
}

// Next.js 16: params is a Promise
type PageParams = Promise<{ locale: string }>;

export default async function ProfilePage({
  params,
}: {
  params: PageParams;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t        = await getTranslations("myProfile");
  const supabase = await createClient();

  // ── 1. Auth check ────────────────────────────────────────────
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login?next=/${locale}/profile`);
  }

  // ── 2. Professional guard — pros belong in /dashboard ────────
  const { data: proRow } = await supabase
    .from("professionals")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (proRow) {
    redirect(`/${locale}/dashboard`);
  }

  // ── 3. Fetch customer row (may be null for new OAuth users) ──
  const { data: customer } = await supabase
    .from("customers")
    .select("id, display_name, phone, email, avatar_url, marketing_consent")
    .eq("user_id", user.id)
    .maybeSingle();

  // Derive display values — prefer DB row, fall back to OAuth metadata
  const displayName      = customer?.display_name ?? (user.user_metadata?.full_name as string) ?? "";
  const phone            = customer?.phone ?? "";
  const email            = customer?.email ?? user.email ?? "";
  const avatarUrl        = customer?.avatar_url ?? (user.user_metadata?.avatar_url as string) ?? null;
  const marketingConsent = customer?.marketing_consent ?? false;

  // OAuth detection — email is locked on Google / Facebook accounts
  const provider = user.app_metadata?.provider as string | undefined;
  const isOAuth  = provider === "google" || provider === "facebook";

  // Build initials for the avatar fallback circle
  const nameInitials = displayName
    ? displayName
        .split(" ")
        .map((w: string) => w.charAt(0))
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : email.charAt(0).toUpperCase();

  // ── Render ────────────────────────────────────────────────────

  return (
    <main
      style={{
        minHeight:       "calc(100vh - 72px)",
        backgroundColor: "var(--color-bg-light)",
        padding:         "2.5rem 1.5rem",
      }}
    >
      <div style={{ maxWidth: "640px", margin: "0 auto" }}>

        {/* ── Page header ── */}
        <div style={{ marginBottom: "2rem" }}>
          <h1
            style={{
              fontSize:      "clamp(1.5rem, 4vw, 2rem)",
              fontWeight:    800,
              color:         "var(--color-text)",
              margin:        "0 0 0.4rem",
              letterSpacing: "-0.025em",
            }}
          >
            {t("title")}
          </h1>
          <p style={{ color: "var(--color-text-muted)", margin: 0, fontSize: "0.95rem" }}>
            {t("subtitle")}
          </p>
        </div>

        {/* ── Avatar + name card ── */}
        <div
          style={{
            backgroundColor: "#ffffff",
            border:          "1.5px solid var(--color-border)",
            borderRadius:    "16px",
            padding:         "1.5rem",
            marginBottom:    "1.25rem",
            display:         "flex",
            alignItems:      "center",
            gap:             "1.25rem",
          }}
        >
          {/* Avatar circle / photo */}
          <div
            style={{
              width:           "72px",
              height:          "72px",
              borderRadius:    "50%",
              backgroundColor: "var(--color-primary)",
              color:           "#ffffff",
              display:         "flex",
              alignItems:      "center",
              justifyContent:  "center",
              fontSize:        "1.5rem",
              fontWeight:      700,
              flexShrink:      0,
              overflow:        "hidden",
            }}
          >
            {avatarUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={avatarUrl}
                alt={displayName || email}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              nameInitials
            )}
          </div>

          {/* Name + email summary */}
          <div>
            <p
              style={{
                fontWeight:   700,
                color:        "var(--color-text)",
                margin:       "0 0 0.25rem",
                fontSize:     "1.05rem",
                lineHeight:   1.3,
              }}
            >
              {displayName || email}
            </p>
            <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", margin: 0 }}>
              {email}
            </p>
          </div>
        </div>

        {/* ── Editable form (Client Component) ── */}
        <CustomerProfileForm
          userId={user.id}
          customerId={customer?.id ?? null}
          initialDisplayName={displayName}
          initialPhone={phone}
          initialEmail={email}
          initialMarketingConsent={marketingConsent}
          isOAuth={isOAuth}
        />

      </div>
    </main>
  );
}
