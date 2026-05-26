// =============================================================
// app/[locale]/favorites/page.tsx
// =============================================================
// Saved professionals — auth-gated Server Component.
//
// AUTH FLOW
//   No session  → redirect to /login?next=/favorites
//   Professional → redirect to /dashboard (pros don't have favorites)
//
// DATA
//   Fetches favorites joined to professionals for the current customer.
//   Each card shows avatar, name, category emoji, city, star rating.
//
// REMOVAL
//   Server Action `removeFavorite` deletes by favorites.id.
//   revalidatePath refreshes the list without a full navigation.
// =============================================================

import type { Metadata }                     from "next";
import { redirect }                          from "next/navigation";
import { Link }                              from "@/i18n/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { revalidatePath }                    from "next/cache";
import { createClient }                      from "@/lib/supabase/server";
import { CATEGORIES }                        from "@/lib/constants";
import { Heart, Star, MapPin, X, Clock }     from "lucide-react";

// ── Metadata ─────────────────────────────────────────────────
export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "favorites" });
  return { title: t("title") };
}

type PageParams = Promise<{ locale: string }>;

// ── Server Action: remove a favorite ─────────────────────────
async function removeFavorite(formData: FormData) {
  "use server";
  const favoriteId = formData.get("favoriteId") as string;
  if (!favoriteId) return;
  const supabase = await createClient();
  await supabase.from("favorites").delete().eq("id", favoriteId);
  // Revalidate for both locales
  revalidatePath("/el/favorites");
  revalidatePath("/en/favorites");
  revalidatePath("/favorites");
}

// ── DB row type ───────────────────────────────────────────────
interface FavoriteRow {
  id:         string;
  created_at: string;
  professionals: {
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

// Recently-viewed row shape returned by Supabase join
interface RecentlyViewedRow {
  id:          string;
  viewed_at:   string;
  professionals: {
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

// ── Page ─────────────────────────────────────────────────────
export default async function FavoritesPage({
  params,
}: {
  params: PageParams;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t        = await getTranslations("favorites");
  const supabase = await createClient();

  // ── Auth check ────────────────────────────────────────────
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login?next=/${locale}/favorites`);

  // ── Redirect professionals to their dashboard ─────────────
  const { data: proRow } = await supabase
    .from("professionals")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (proRow) redirect(`/${locale}/dashboard`);

  // ── Fetch customer row ────────────────────────────────────
  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  // Brand-new user with no customer row → empty state
  const favorites:      FavoriteRow[]       = [];
  const recentlyViewed: RecentlyViewedRow[] = [];

  if (customer) {
    const [favData, recentData] = await Promise.all([
      // Saved favorites
      supabase
        .from("favorites")
        .select(
          "id, created_at, " +
          "professionals!favorites_professional_id_fkey(" +
            "id, slug, first_name, last_name, avatar_url, " +
            "category_id, city, rating, review_count" +
          ")",
        )
        .eq("customer_id", customer.id)
        .order("created_at", { ascending: false }),

      // Recently viewed — max 12, most recent first
      supabase
        .from("recently_viewed")
        .select(
          "id, viewed_at, " +
          "professionals!recently_viewed_professional_id_fkey(" +
            "id, slug, first_name, last_name, avatar_url, " +
            "category_id, city, rating, review_count" +
          ")",
        )
        .eq("customer_id", customer.id)
        .order("viewed_at", { ascending: false })
        .limit(12),
    ]);

    if (favData.data)    favorites.push(...(favData.data       as unknown as FavoriteRow[]));
    if (recentData.data) recentlyViewed.push(...(recentData.data as unknown as RecentlyViewedRow[]));
  }

  // PRD §34: only show "Recently Viewed" section after threshold of 3 profiles
  const showRecent = recentlyViewed.length >= 3;

  // ── Render ────────────────────────────────────────────────
  return (
    <main
      style={{
        minHeight:       "calc(100vh - 72px)",
        backgroundColor: "var(--color-bg-light)",
        padding:         "2.5rem 1.5rem",
      }}
    >
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>

        {/* ── Page header ── */}
        <div
          style={{
            display:      "flex",
            alignItems:   "center",
            gap:          "0.75rem",
            marginBottom: "2rem",
          }}
        >
          <Heart
            size={24}
            fill="#E74C3C"
            style={{ color: "#E74C3C", flexShrink: 0 }}
          />
          <div>
            <h1
              style={{
                fontSize:      "clamp(1.5rem, 4vw, 2rem)",
                fontWeight:    800,
                color:         "var(--color-text)",
                margin:        0,
                letterSpacing: "-0.025em",
              }}
            >
              {t("title")}
            </h1>
            <p style={{ color: "var(--color-text-muted)", margin: "0.25rem 0 0", fontSize: "0.9rem" }}>
              {favorites.length === 0 ? t("emptySubtitle") : t("subtitle", { count: favorites.length })}
            </p>
          </div>
        </div>

        {/* ── Empty state ── */}
        {favorites.length === 0 && (
          <div
            style={{
              textAlign:       "center",
              padding:         "4rem 1.5rem",
              backgroundColor: "#fff",
              borderRadius:    "16px",
              border:          "1.5px solid var(--color-border)",
            }}
          >
            <p style={{ fontSize: "3rem", margin: "0 0 1rem" }}>🤍</p>
            <h2
              style={{
                fontWeight:  700,
                fontSize:    "1.125rem",
                color:       "var(--color-text)",
                margin:      "0 0 0.5rem",
              }}
            >
              {t("emptyTitle")}
            </h2>
            <p
              style={{
                fontSize:  "0.9rem",
                color:     "var(--color-text-muted)",
                margin:    "0 0 1.5rem",
                lineHeight: 1.6,
              }}
            >
              {t("emptyHint")}
            </p>
            <Link
              href="/services"
              style={{
                display:         "inline-flex",
                alignItems:      "center",
                gap:             "0.375rem",
                padding:         "0.625rem 1.5rem",
                backgroundColor: "var(--color-primary)",
                color:           "#fff",
                borderRadius:    "10px",
                fontWeight:      700,
                fontSize:        "0.9375rem",
                textDecoration:  "none",
              }}
            >
              {t("browseBtn")}
            </Link>
          </div>
        )}

        {/* ── Favorites grid ── */}
        {favorites.length > 0 && (
          <div
            style={{
              display:             "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap:                 "1rem",
            }}
          >
            {favorites.map((fav) => {
              const pro  = fav.professionals;
              const name = `${pro.first_name} ${pro.last_name}`;
              const cat  = CATEGORIES.find((c) => c.id === pro.category_id);
              const catName = locale === "en" && cat?.nameEn ? cat.nameEn : cat?.nameEl ?? "";
              const catEmoji = cat?.emoji ?? "🔧";
              const slug = pro.slug ?? pro.id;

              // Build initials fallback
              const initials = (pro.first_name[0] + (pro.last_name[0] ?? "")).toUpperCase();

              return (
                <div
                  key={fav.id}
                  style={{
                    backgroundColor: "#fff",
                    border:          "1.5px solid var(--color-border)",
                    borderRadius:    "14px",
                    overflow:        "hidden",
                    position:        "relative",
                    transition:      "box-shadow 0.15s",
                  }}
                >
                  {/* Remove button */}
                  <form action={removeFavorite} style={{ position: "absolute", top: "0.625rem", right: "0.625rem", zIndex: 2 }}>
                    <input type="hidden" name="favoriteId" value={fav.id} />
                    <button
                      type="submit"
                      aria-label={t("remove")}
                      title={t("remove")}
                      style={{
                        width:           "28px",
                        height:          "28px",
                        borderRadius:    "50%",
                        backgroundColor: "rgba(255,255,255,0.9)",
                        border:          "1px solid var(--color-border)",
                        cursor:          "pointer",
                        display:         "flex",
                        alignItems:      "center",
                        justifyContent:  "center",
                        color:           "var(--color-text-muted)",
                        backdropFilter:  "blur(4px)",
                        transition:      "background-color 0.15s, color 0.15s",
                      }}
                    >
                      <X size={14} />
                    </button>
                  </form>

                  {/* Card link (whole card navigates to pro page) */}
                  <Link
                    href={`/professional/${slug}`}
                    style={{ textDecoration: "none", color: "inherit", display: "block" }}
                  >
                    {/* Avatar section */}
                    <div
                      style={{
                        height:          "100px",
                        backgroundColor: "var(--color-primary-bg)",
                        display:         "flex",
                        alignItems:      "center",
                        justifyContent:  "center",
                        overflow:        "hidden",
                      }}
                    >
                      {pro.avatar_url ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={pro.avatar_url}
                          alt={name}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : (
                        <div
                          style={{
                            width:           "64px",
                            height:          "64px",
                            borderRadius:    "50%",
                            backgroundColor: "var(--color-primary)",
                            color:           "#fff",
                            display:         "flex",
                            alignItems:      "center",
                            justifyContent:  "center",
                            fontSize:        "1.375rem",
                            fontWeight:      800,
                          }}
                        >
                          {initials}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div style={{ padding: "0.875rem 1rem" }}>
                      <p
                        style={{
                          fontWeight:    700,
                          fontSize:      "0.9375rem",
                          color:         "var(--color-text)",
                          margin:        "0 0 0.2rem",
                          overflow:      "hidden",
                          textOverflow:  "ellipsis",
                          whiteSpace:    "nowrap",
                        }}
                      >
                        {name}
                      </p>

                      {/* Category */}
                      <p
                        style={{
                          fontSize: "0.8rem",
                          color:    "var(--color-text-muted)",
                          margin:   "0 0 0.5rem",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {catEmoji} {catName}
                      </p>

                      {/* Rating + location row */}
                      <div
                        style={{
                          display:    "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap:        "0.5rem",
                        }}
                      >
                        {/* Star rating */}
                        <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                          <Star
                            size={13}
                            fill={pro.rating > 0 ? "#F59E0B" : "none"}
                            style={{ color: pro.rating > 0 ? "#F59E0B" : "var(--color-border)" }}
                          />
                          <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--color-text)" }}>
                            {pro.rating > 0 ? pro.rating.toFixed(1) : "—"}
                          </span>
                          {pro.review_count > 0 && (
                            <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                              ({pro.review_count})
                            </span>
                          )}
                        </div>

                        {/* City */}
                        {pro.city && (
                          <div style={{ display: "flex", alignItems: "center", gap: "0.2rem", overflow: "hidden" }}>
                            <MapPin size={11} style={{ color: "var(--color-text-muted)", flexShrink: 0 }} />
                            <span
                              style={{
                                fontSize:     "0.775rem",
                                color:        "var(--color-text-muted)",
                                overflow:     "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace:   "nowrap",
                              }}
                            >
                              {pro.city}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
        {/* ── Recently Viewed section (PRD §34 — threshold 3) ── */}
        {showRecent && (
          <div style={{ marginTop: "3rem" }}>

            {/* Section header */}
            <div
              style={{
                display:      "flex",
                alignItems:   "center",
                gap:          "0.625rem",
                marginBottom: "1.25rem",
              }}
            >
              <Clock size={20} style={{ color: "var(--color-text-muted)", flexShrink: 0 }} />
              <div>
                <h2
                  style={{
                    fontSize:      "1.125rem",
                    fontWeight:    700,
                    color:         "var(--color-text)",
                    margin:        0,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {t("recentTitle")}
                </h2>
                <p style={{ color: "var(--color-text-muted)", margin: "0.15rem 0 0", fontSize: "0.85rem" }}>
                  {t("recentSubtitle")}
                </p>
              </div>
            </div>

            {/* Recently viewed grid */}
            <div
              style={{
                display:             "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap:                 "0.875rem",
              }}
            >
              {recentlyViewed.map((rv) => {
                const pro      = rv.professionals;
                const name     = `${pro.first_name} ${pro.last_name}`;
                const cat      = CATEGORIES.find((c) => c.id === pro.category_id);
                const catName  = locale === "en" && cat?.nameEn ? cat.nameEn : cat?.nameEl ?? "";
                const catEmoji = cat?.emoji ?? "🔧";
                const slug     = pro.slug ?? pro.id;
                const initials = (pro.first_name[0] + (pro.last_name[0] ?? "")).toUpperCase();

                return (
                  <Link
                    key={rv.id}
                    href={`/professional/${slug}`}
                    style={{ textDecoration: "none", color: "inherit" }}
                  >
                    <div
                      style={{
                        backgroundColor: "#fff",
                        border:          "1.5px solid var(--color-border)",
                        borderRadius:    "12px",
                        overflow:        "hidden",
                        transition:      "box-shadow 0.15s",
                        display:         "flex",
                        alignItems:      "center",
                        gap:             "0.75rem",
                        padding:         "0.75rem",
                      }}
                    >
                      {/* Avatar */}
                      <div
                        style={{
                          width:           "48px",
                          height:          "48px",
                          borderRadius:    "50%",
                          overflow:        "hidden",
                          flexShrink:      0,
                          backgroundColor: "var(--color-primary-bg)",
                          display:         "flex",
                          alignItems:      "center",
                          justifyContent:  "center",
                        }}
                      >
                        {pro.avatar_url ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={pro.avatar_url}
                            alt={name}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        ) : (
                          <span
                            style={{
                              fontSize:   "1rem",
                              fontWeight: 800,
                              color:      "var(--color-primary)",
                            }}
                          >
                            {initials}
                          </span>
                        )}
                      </div>

                      {/* Info */}
                      <div style={{ minWidth: 0 }}>
                        <p
                          style={{
                            fontWeight:   700,
                            fontSize:     "0.875rem",
                            color:        "var(--color-text)",
                            margin:       "0 0 0.15rem",
                            overflow:     "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace:   "nowrap",
                          }}
                        >
                          {name}
                        </p>
                        <p
                          style={{
                            fontSize:     "0.775rem",
                            color:        "var(--color-text-muted)",
                            margin:       "0 0 0.2rem",
                            overflow:     "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace:   "nowrap",
                          }}
                        >
                          {catEmoji} {catName}
                        </p>
                        {/* Rating */}
                        <div style={{ display: "flex", alignItems: "center", gap: "0.2rem" }}>
                          <Star
                            size={11}
                            fill={pro.rating > 0 ? "#F59E0B" : "none"}
                            style={{ color: pro.rating > 0 ? "#F59E0B" : "var(--color-border)" }}
                          />
                          <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text)" }}>
                            {pro.rating > 0 ? pro.rating.toFixed(1) : "—"}
                          </span>
                          {pro.city && (
                            <>
                              <span style={{ color: "var(--color-border)", fontSize: "0.7rem" }}>·</span>
                              <MapPin size={9} style={{ color: "var(--color-text-muted)" }} />
                              <span style={{ fontSize: "0.7rem", color: "var(--color-text-muted)" }}>{pro.city}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
