// =============================================================
// components/professional/ActionPanel.tsx
// =============================================================
// Sticky action panel for professional profile pages.
// Handles phone reveal + booking initiation, both gated behind auth.
//
// LAYOUT
//   Desktop (md+):  sticky card in the right sidebar (rendered by
//                   parent in a right-column div)
//   Mobile:         fixed bottom bar overlaid on the page
//
// BUTTON LAYOUT PER BOOKING MODE
//   contact → phone button only   (no booking button)
//   date    → phone button  +  "Επιλογή Ημερομηνίας" button
//   full    → phone button  +  "Κράτηση Online" button
//
//   The phone button is ALWAYS shown regardless of booking mode.
//   The booking button is an ADDITIONAL option for date/full modes.
//
// AUTH FLOW
//   Phone reveal → check Supabase session → show modal if logged out
//   Book button  → same check → placeholder form if logged in
//
// SECURITY NOTE
//   The phone number is passed as a prop from the server (it lives in
//   the professionals row). For a fully server-authorised approach,
//   move the phone reveal to a signed server action in Phase 2.
// =============================================================

"use client";

import { useState }         from "react";
import { Phone, Calendar, Copy, Check, X } from "lucide-react";
import { useTranslations }   from "next-intl";
import { createClient }      from "@/lib/supabase/client";
import LoginPromptModal      from "@/components/ui/LoginPromptModal";
import DateBookingForm       from "@/components/professional/DateBookingForm";

// ── Props ──────────────────────────────────────────────────────
interface ActionPanelProps {
  professionalId: string;          // needed for phone-reveal tracking
  phone:          string;
  bookingMode:    "contact" | "date" | "full";
  bookingEnabled: boolean;
  proName:        string;
}

// ── Booking placeholder ──────────────────────────────────────
function BookingPlaceholder({
  mode,
  onClose,
}: {
  mode:    "date" | "full";
  onClose: () => void;
}) {
  const t  = useTranslations("profile");
  const tc = useTranslations("common");
  return (
    <div
      onClick={onClose}
      style={{
        position:        "fixed",
        inset:           0,
        backgroundColor: "rgba(0,0,0,0.5)",
        zIndex:          500,
        display:         "flex",
        alignItems:      "center",
        justifyContent:  "center",
        padding:         "1rem",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: "#fff",
          borderRadius:    "16px",
          padding:         "2rem",
          maxWidth:        "420px",
          width:           "100%",
          position:        "relative",
          boxShadow:       "0 20px 60px rgba(0,0,0,0.25)",
          textAlign:       "center",
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={tc("close")}
          style={{
            position:  "absolute",
            top:       "1rem",
            right:     "1rem",
            background:"none",
            border:    "none",
            cursor:    "pointer",
            color:     "var(--color-text-muted)",
            display:   "flex",
          }}
        >
          <X size={20} />
        </button>

        <span style={{ fontSize: "2.5rem" }}>
          {mode === "full" ? "🗓️" : "📅"}
        </span>

        <h2
          style={{
            fontSize:     "1.125rem",
            fontWeight:   700,
            color:        "var(--color-text)",
            margin:       "0.75rem 0 0.5rem",
          }}
        >
          {mode === "full" ? t("bookingFullTitle") : t("bookingDateTitle")}
        </h2>
        <p
          style={{
            fontSize:  "0.875rem",
            color:     "var(--color-text-muted)",
            lineHeight: 1.6,
          }}
        >
          {t("bookingComingSoon1")}
          <br />
          {t("bookingComingSoon2")}
        </p>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────
export default function ActionPanel({
  professionalId,
  phone,
  bookingMode,
  bookingEnabled,
  proName,
}: ActionPanelProps) {
  const t = useTranslations("profile");

  // "idle" | "revealed" = phone state
  const [phoneState,    setPhoneState]   = useState<"idle" | "revealed">("idle");
  const [copied,        setCopied]       = useState(false);
  const [modal,         setModal]        = useState<"login-phone" | "login-booking" | "booking" | null>(null);

  // ── Auth helpers ──────────────────────────────────────────
  async function getSession() {
    const supabase = createClient();
    const { data }  = await supabase.auth.getSession();
    return data.session;
  }

  async function handlePhoneClick() {
    if (phoneState === "revealed") return;
    const session = await getSession();
    if (!session) {
      setModal("login-phone");
      return;
    }
    setPhoneState("revealed");

    // Fire-and-forget: increment phone_reveals counter via SECURITY DEFINER RPC.
    // Non-fatal — UI is never blocked by this call.
    const supabase = createClient();
    supabase
      .rpc("increment_phone_reveal", { prof_id: professionalId })
      .then(({ error }) => {
        if (error) console.warn("[ActionPanel] phone reveal track:", error.message);
      });
  }

  async function handleBookClick() {
    const session = await getSession();
    if (!session) {
      setModal("login-booking");
      return;
    }
    setModal("booking");
  }

  async function copyPhone() {
    try {
      await navigator.clipboard.writeText(phone);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard denied */
    }
  }

  // ── Shared button styles ──────────────────────────────────
  const primaryBtn: React.CSSProperties = {
    display:         "flex",
    alignItems:      "center",
    justifyContent:  "center",
    gap:             "0.5rem",
    width:           "100%",
    padding:         "0.875rem",
    backgroundColor: "var(--color-primary)",
    color:           "#fff",
    border:          "none",
    borderRadius:    "10px",
    fontWeight:      700,
    fontSize:        "1rem",
    cursor:          "pointer",
    fontFamily:      "inherit",
    transition:      "opacity 0.15s",
  };

  const outlineBtn: React.CSSProperties = {
    ...primaryBtn,
    backgroundColor: "#fff",
    color:           "var(--color-primary)",
    border:          "2px solid var(--color-primary)",
  };

  const ghostBtn: React.CSSProperties = {
    display:         "flex",
    alignItems:      "center",
    gap:             "0.375rem",
    background:      "none",
    border:          "none",
    cursor:          "pointer",
    color:           "var(--color-text-muted)",
    fontSize:        "0.8125rem",
    fontFamily:      "inherit",
    padding:         "0.25rem 0.5rem",
    borderRadius:    "6px",
  };

  // ── Phone reveal content ──────────────────────────────────
  const phoneContent =
    phoneState === "revealed" ? (
      <div>
        {/* Phone number display */}
        <div
          style={{
            display:         "flex",
            alignItems:      "center",
            justifyContent:  "space-between",
            padding:         "0.75rem 1rem",
            backgroundColor: "var(--color-primary-bg)",
            borderRadius:    "10px",
            marginBottom:    "0.5rem",
          }}
        >
          <span
            style={{
              fontWeight:  700,
              fontSize:    "1.125rem",
              color:       "var(--color-primary-dark)",
              letterSpacing: "0.03em",
            }}
          >
            {phone}
          </span>
          <button
            type="button"
            onClick={copyPhone}
            style={ghostBtn}
            title={t("copyNumber")}
          >
            {copied ? <Check size={15} style={{ color: "#27AE60" }} /> : <Copy size={15} />}
            {copied ? t("copied") : t("copyAction")}
          </button>
        </div>

        {/* Mobile call button */}
        <a
          href={`tel:${phone}`}
          style={{
            ...primaryBtn,
            textDecoration: "none",
          }}
        >
          <Phone size={17} />
          {t("callAction")}
        </a>
      </div>
    ) : (
      <button type="button" onClick={handlePhoneClick} style={primaryBtn}>
        <Phone size={17} />
        {t("actionCall")}
      </button>
    );

  // ── Booking button — ADDITIONAL option for date/full modes ──
  // Phone button above is always shown for ALL three booking modes.
  // This booking button is rendered only as an extra action alongside it.
  const bookingContent = bookingMode !== "contact" ? (
    <button
      type="button"
      onClick={handleBookClick}
      disabled={!bookingEnabled}
      style={{
        ...outlineBtn,
        opacity: bookingEnabled ? 1 : 0.5,
        cursor:  bookingEnabled ? "pointer" : "not-allowed",
      }}
    >
      <Calendar size={17} />
      {bookingMode === "full" ? t("bookOnline") : t("actionBookDate")}
    </button>
  ) : null;

  // ── Card content (full layout for desktop) ────────────────
  const fullCard = (
    <div
      style={{
        backgroundColor: "#fff",
        border:          "1.5px solid var(--color-border)",
        borderRadius:    "16px",
        padding:         "1.5rem",
        display:         "flex",
        flexDirection:   "column",
        gap:             "0.875rem",
      }}
    >
      <p
        style={{
          fontSize:     "0.75rem",
          fontWeight:   700,
          textTransform:"uppercase",
          letterSpacing:"0.06em",
          color:        "var(--color-text-muted)",
          margin:       0,
        }}
      >
        {t("contactWith", { firstName: proName.split(" ")[0] })}
      </p>

      {phoneContent}
      {bookingContent}

      <p
        style={{
          fontSize:  "0.775rem",
          color:     "var(--color-text-muted)",
          textAlign: "center",
          margin:    0,
        }}
      >
        {t("zeroCommission")}
      </p>
    </div>
  );

  // ── Mobile bar content (compact) ─────────────────────────
  const mobileBar = (
    <div
      style={{
        backgroundColor: "#fff",
        borderTop:       "1.5px solid var(--color-border)",
        padding:         "0.75rem 1rem",
        display:         "flex",
        gap:             "0.625rem",
        alignItems:      "center",
      }}
    >
      {phoneState === "revealed" ? (
        <>
          <a
            href={`tel:${phone}`}
            style={{
              flex:            1,
              display:         "flex",
              alignItems:      "center",
              justifyContent:  "center",
              gap:             "0.375rem",
              padding:         "0.75rem",
              backgroundColor: "var(--color-primary)",
              color:           "#fff",
              borderRadius:    "10px",
              fontWeight:      700,
              fontSize:        "0.9375rem",
              textDecoration:  "none",
            }}
          >
            <Phone size={16} />
            {phone}
          </a>
          {bookingContent && (
            <div style={{ flex: "0 0 auto" }}>
              <button
                type="button"
                onClick={handleBookClick}
                disabled={!bookingEnabled}
                style={{
                  ...outlineBtn,
                  width:   "auto",
                  padding: "0.75rem 1rem",
                  opacity: bookingEnabled ? 1 : 0.5,
                  cursor:  bookingEnabled ? "pointer" : "not-allowed",
                }}
              >
                <Calendar size={16} />
              </button>
            </div>
          )}
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={handlePhoneClick}
            style={{ ...primaryBtn, flex: 1, padding: "0.75rem" }}
          >
            <Phone size={16} />
            {t("phoneBtn")}
          </button>
          {bookingContent && (
            <button
              type="button"
              onClick={handleBookClick}
              disabled={!bookingEnabled}
              style={{
                ...outlineBtn,
                flex:    "0 0 auto",
                width:   "auto",
                padding: "0.75rem 1rem",
                opacity: bookingEnabled ? 1 : 0.5,
                cursor:  bookingEnabled ? "pointer" : "not-allowed",
              }}
            >
              <Calendar size={16} />
            </button>
          )}
        </>
      )}
    </div>
  );

  return (
    <>
      {/* ── Desktop sticky card (hidden on mobile) ── */}
      <div className="hidden md:block" style={{ position: "sticky", top: "80px" }}>
        {fullCard}
      </div>

      {/* ── Mobile fixed bottom bar (hidden on desktop) ── */}
      <div
        className="md:hidden"
        style={{
          position: "fixed",
          bottom:   0,
          left:     0,
          right:    0,
          zIndex:   100,
        }}
      >
        {mobileBar}
      </div>

      {/* ── Modals ── */}
      {modal === "login-phone" && (
        <LoginPromptModal
          message={t("loginToSeePhone")}
          onClose={() => setModal(null)}
        />
      )}
      {modal === "login-booking" && (
        <LoginPromptModal
          message={t("loginToBook")}
          onClose={() => setModal(null)}
        />
      )}
      {/* Date mode — real booking form */}
      {modal === "booking" && bookingMode === "date" && (
        <DateBookingForm
          professionalId={professionalId}
          proName={proName}
          onClose={() => setModal(null)}
        />
      )}
      {/* Full calendar — placeholder until Phase 2 */}
      {modal === "booking" && bookingMode === "full" && (
        <BookingPlaceholder
          mode="full"
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}
