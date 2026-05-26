// =============================================================
// components/professional/FavoriteButton.tsx
// =============================================================
// Heart toggle for saving / unsaving a professional.
//
// PROPS
//   customerId      — customers.id of the logged-in user.
//                     null = not logged in → button redirects to login.
//   initialFavorited — server-seeded; avoids a client-side fetch
//                     on first render.
//
// TOGGLE LOGIC
//   • Optimistic update: flip state immediately, then call Supabase.
//   • On error: revert state + brief shake animation.
//   • INSERT on save, DELETE on unsave.
//
// RLS: favorites_manage_own policy covers both INSERT and DELETE.
// =============================================================

"use client";

import { useState }        from "react";
import { Heart }           from "lucide-react";
import { usePathname }     from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { createClient }    from "@/lib/supabase/client";

// ── Props ─────────────────────────────────────────────────────

interface FavoriteButtonProps {
  professionalId:  string;
  /** customers.id — null when the visitor is not logged in */
  customerId:      string | null;
  initialFavorited: boolean;
}

// ── Component ─────────────────────────────────────────────────

export default function FavoriteButton({
  professionalId,
  customerId,
  initialFavorited,
}: FavoriteButtonProps) {
  const t       = useTranslations("favorites");
  const pathname = usePathname();

  const [favorited, setFavorited] = useState(initialFavorited);
  const [loading,   setLoading]   = useState(false);
  const [shake,     setShake]     = useState(false);

  // ── Not logged in → redirect to login ────────────────────
  if (!customerId) {
    return (
      <a
        href={`/login?next=${encodeURIComponent(pathname)}`}
        aria-label={t("save")}
        title={t("save")}
        style={{
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          width:          "36px",
          height:         "36px",
          borderRadius:   "8px",
          border:         "1.5px solid var(--color-border)",
          background:     "#fff",
          color:          "var(--color-text-muted)",
          textDecoration: "none",
          transition:     "border-color 0.15s, color 0.15s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "#E74C3C";
          e.currentTarget.style.color       = "#E74C3C";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "var(--color-border)";
          e.currentTarget.style.color       = "var(--color-text-muted)";
        }}
      >
        <Heart size={16} />
      </a>
    );
  }

  // ── Toggle handler ────────────────────────────────────────
  async function handleToggle() {
    if (loading) return;
    setLoading(true);

    const prev = favorited;
    // Optimistic update
    setFavorited(!prev);

    try {
      const supabase = createClient();

      if (prev) {
        // Remove from favorites
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("customer_id", customerId)
          .eq("professional_id", professionalId);
        if (error) throw error;
      } else {
        // Add to favorites
        const { error } = await supabase
          .from("favorites")
          .insert({ customer_id: customerId, professional_id: professionalId });
        if (error) throw error;
      }
    } catch (err) {
      console.error("[FavoriteButton] toggle error:", err);
      // Revert on failure
      setFavorited(prev);
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setLoading(false);
    }
  }

  // ── Render ────────────────────────────────────────────────
  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading}
      aria-label={favorited ? t("unsave") : t("save")}
      title={favorited ? t("unsave") : t("save")}
      style={{
        display:         "flex",
        alignItems:      "center",
        justifyContent:  "center",
        width:           "36px",
        height:          "36px",
        borderRadius:    "8px",
        border:          `1.5px solid ${favorited ? "#E74C3C" : "var(--color-border)"}`,
        background:      favorited ? "#FFF1F0" : "#fff",
        color:           favorited ? "#E74C3C" : "var(--color-text-muted)",
        cursor:          loading ? "default" : "pointer",
        transition:      "border-color 0.15s, background-color 0.15s, color 0.15s, transform 0.1s",
        transform:       shake ? "translateX(-3px)" : "translateX(0)",
        fontFamily:      "inherit",
      }}
      onMouseEnter={(e) => {
        if (!loading) {
          e.currentTarget.style.borderColor       = "#E74C3C";
          e.currentTarget.style.color             = "#E74C3C";
          e.currentTarget.style.backgroundColor   = "#FFF1F0";
        }
      }}
      onMouseLeave={(e) => {
        if (!loading) {
          e.currentTarget.style.borderColor       = favorited ? "#E74C3C" : "var(--color-border)";
          e.currentTarget.style.color             = favorited ? "#E74C3C" : "var(--color-text-muted)";
          e.currentTarget.style.backgroundColor   = favorited ? "#FFF1F0" : "#fff";
        }
      }}
    >
      <Heart
        size={16}
        fill={favorited ? "#E74C3C" : "none"}
        style={{ transition: "fill 0.15s" }}
      />
    </button>
  );
}
