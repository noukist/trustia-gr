// =============================================================
// app/dashboard/page.tsx
// =============================================================
// Professional dashboard — auth-gated server component.
//
// AUTH FLOW
//   1. No session               → redirect /login
//   2. Session but no pro row   → redirect / (customer account)
//   3. Session + pro row        → render dashboard
//
// TABS (via ?tab= URL param)
//   overview     (default) — stats, completion, quick actions
//   profile      — placeholder
//   bookings     — placeholder
//   reviews      — placeholder
//   subscription — plan, trial status, payment methods
//
// DATA FETCHED
//   professionals row (current user)
//   subscriptions row (latest, for the professional)
// =============================================================

import React          from "react";
import Link           from "next/link";
import { redirect }   from "next/navigation";
import type { Metadata } from "next";
import {
  CheckCircle2, AlertCircle, ExternalLink,
  Eye, Phone, Calendar, Star,
  CreditCard, Clock, Building2,
} from "lucide-react";

import { createClient }  from "@/lib/supabase/server";
import { CATEGORIES, PLAN_OPTIONS } from "@/lib/constants";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { useTranslations } from "next-intl";
import DashboardNav    from "@/components/dashboard/DashboardNav";
import Button          from "@/components/ui/Button";
import ProfileEditor   from "@/components/dashboard/ProfileEditor";
import BookingsTab     from "@/components/dashboard/BookingsTab";
import ReviewsTab      from "@/components/dashboard/ReviewsTab";

export const metadata: Metadata = {
  title: "Dashboard | Trustia.gr",
};

// ── Next.js 16: params/searchParams are Promises ─────────────
type PageSearchParams = Promise<Record<string, string | string[] | undefined>>;
type PageParams       = Promise<{ locale: string }>;

// ── DB row types ──────────────────────────────────────────────

interface DbProfessional {
  id:              string;
  slug:            string | null;
  first_name:      string;
  last_name:       string;
  phone:           string;
  email:           string;
  avatar_url:      string | null;
  category_id:     string;
  tier:            "light" | "trades" | "specialists";
  city:            string | null;
  lat:             number | null;
  lng:             number | null;
  bio:             string | null;
  price_text:      string | null;
  booking_mode:    "contact" | "date" | "full";
  rating:          number;
  review_count:    number;
  profile_complete:boolean;
  status:          string;
  created_at:      string;
}

interface DbSubscription {
  id:                  string;
  tier:                "light" | "trades" | "specialists";
  billing_plan:        "monthly" | "semi" | "annual";
  monthly_price:       number;
  total_amount:        number;
  payment_reference:   string;
  payment_status:      "pending" | "verified" | "failed" | "refunded";
  is_founding:         boolean;
  starts_at:           string;
  ends_at:             string;
}

// ── Display label helpers (return maps from t() inside components) ─

// ── Helpers ───────────────────────────────────────────────────

/** Profile completion: returns 0-100 and list of missing field keys (translated at render) */
function calcCompletion(pro: DbProfessional): {
  percent: number;
  missing: { field: string; labelKey: string; weight: number }[];
} {
  // Required fields are always filled at registration → 50% base
  const base = 50;

  // Optional fields — labelKey maps to dashboard.overview.addX translation
  const optionals = [
    { field: "avatar_url", labelKey: "addPhoto", weight: 20, done: !!pro.avatar_url },
    { field: "bio",        labelKey: "addBio",   weight: 20, done: !!pro.bio && pro.bio.length > 5 },
    { field: "price_text", labelKey: "addPrice", weight: 10, done: !!pro.price_text },
  ];

  const earnedBonus = optionals.filter((o) => o.done).reduce((s, o) => s + o.weight, 0);
  const missing     = optionals.filter((o) => !o.done);

  return { percent: base + earnedBonus, missing };
}

/** Days remaining until a date */
function daysUntil(iso: string): number {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000));
}

/** Progress through a period: 0-100 */
function periodProgress(startsAt: string, endsAt: string): number {
  const total   = new Date(endsAt).getTime() - new Date(startsAt).getTime();
  const elapsed = Date.now()               - new Date(startsAt).getTime();
  return Math.min(100, Math.max(0, (elapsed / total) * 100));
}

/** Derive two-letter initials */
function initials(first: string, last: string) {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

// ── Shared UI primitives ──────────────────────────────────────

function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?:   React.CSSProperties;
}) {
  return (
    <div
      style={{
        backgroundColor: "#fff",
        border:          "1.5px solid var(--color-border)",
        borderRadius:    "14px",
        padding:         "1.5rem",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function CardTitle({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontWeight:    700,
        fontSize:      "0.9375rem",
        color:         "var(--color-text)",
        margin:        "0 0 1.125rem",
        paddingBottom: "0.75rem",
        borderBottom:  "1px solid var(--color-border)",
      }}
    >
      {children}
    </p>
  );
}

// ── Stat card ─────────────────────────────────────────────────
function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon:  React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  label: string;
  value: string | number;
  sub?:  string;
}) {
  return (
    <div
      style={{
        backgroundColor: "#fff",
        border:          "1.5px solid var(--color-border)",
        borderRadius:    "12px",
        padding:         "1.25rem",
        display:         "flex",
        flexDirection:   "column",
        gap:             "0.5rem",
      }}
    >
      <Icon size={20} style={{ color: "var(--color-primary)" }} />
      <p style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--color-text)", margin: 0, lineHeight: 1 }}>
        {value}
      </p>
      <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", margin: 0 }}>
        {label}
      </p>
      {sub && (
        <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", margin: 0, opacity: 0.7 }}>
          {sub}
        </p>
      )}
    </div>
  );
}

// ── Progress bar ──────────────────────────────────────────────
function ProgressBar({
  value,
  color = "var(--color-primary)",
  height = 8,
}: {
  value:   number;
  color?:  string;
  height?: number;
}) {
  return (
    <div
      style={{
        width:           "100%",
        height:          `${height}px`,
        borderRadius:    "999px",
        backgroundColor: "var(--color-bg-light)",
        border:          "1px solid var(--color-border)",
        overflow:        "hidden",
      }}
    >
      <div
        style={{
          width:           `${value}%`,
          height:          "100%",
          borderRadius:    "999px",
          backgroundColor: color,
          transition:      "width 0.5s ease",
        }}
      />
    </div>
  );
}

// =============================================================
// TAB: OVERVIEW
// =============================================================
function OverviewTab({
  pro,
  sub,
  showWelcome,
}: {
  pro:         DbProfessional;
  sub:         DbSubscription | null;
  showWelcome: boolean;
}) {
  const t          = useTranslations("dashboard");
  const cat        = CATEGORIES.find((c) => c.id === pro.category_id);
  const completion = calcCompletion(pro);
  const daysLeft   = sub ? daysUntil(sub.ends_at) : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

      {/* ── Welcome banner (?welcome=1) ── */}
      {showWelcome && (
        <div
          style={{
            background:   "linear-gradient(135deg, var(--color-primary) 0%, #1a6f6f 100%)",
            borderRadius: "14px",
            padding:      "1.5rem",
            color:        "#fff",
          }}
        >
          <p style={{ fontSize: "1.25rem", fontWeight: 800, margin: "0 0 0.375rem" }}>
            {t("overview.welcomeTitle")}
          </p>
          <p style={{ fontSize: "0.9375rem", margin: 0, opacity: 0.9, lineHeight: 1.5 }}>
            {t("overview.welcomeDesc")}
          </p>
        </div>
      )}

      {/* ── Trial expiry reminder (if < 14 days) ── */}
      {sub && sub.payment_status === "pending" && daysLeft !== null && daysLeft <= 14 && daysLeft > 0 && (
        <div
          style={{
            backgroundColor: "rgba(217,119,6,0.08)",
            border:          "1.5px solid rgba(217,119,6,0.3)",
            borderRadius:    "12px",
            padding:         "1rem 1.25rem",
            display:         "flex",
            alignItems:      "flex-start",
            gap:             "0.75rem",
          }}
        >
          <AlertCircle size={20} style={{ color: "#D97706", flexShrink: 0, marginTop: "2px" }} />
          <div>
            <p style={{ fontWeight: 700, color: "#92400E", margin: "0 0 0.25rem", fontSize: "0.9rem" }}>
              {daysLeft === 1
                ? t("overview.trialExpiryTomorrow")
                : t("overview.trialExpiryDays", { days: daysLeft ?? 0 })}
            </p>
            <p style={{ color: "#92400E", margin: 0, fontSize: "0.8125rem", opacity: 0.85 }}>
              {t("overview.trialPaymentCta")}{" "}
              <Link href="/dashboard?tab=subscription" style={{ fontWeight: 700, color: "#92400E" }}>
                {t("overview.trialPaymentLink")}
              </Link>
            </p>
          </div>
        </div>
      )}

      {/* ── Greeting ── */}
      <div>
        <h1
          style={{
            fontSize:   "clamp(1.25rem, 3vw, 1.625rem)",
            fontWeight: 800,
            color:      "var(--color-text)",
            margin:     0,
          }}
        >
          {t("overview.greeting", { name: pro.first_name })}
        </h1>
        <p style={{ color: "var(--color-text-muted)", margin: "0.25rem 0 0", fontSize: "0.875rem" }}>
          {cat?.emoji} {cat?.nameEl}
          {pro.city ? ` · ${pro.city}` : ""}
        </p>
      </div>

      {/* ── Stats grid ── */}
      <div
        style={{
          display:             "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
          gap:                 "0.875rem",
        }}
      >
        <StatCard icon={Eye}      label={t("overview.stats.views")}    value={0}                sub={t("overview.stats.last30Days")} />
        <StatCard icon={Phone}    label={t("overview.stats.calls")}    value={0}                sub={t("overview.stats.last30Days")} />
        <StatCard icon={Calendar} label={t("overview.stats.bookings")} value={0}                sub={t("overview.stats.total")} />
        <StatCard icon={Star}     label={t("overview.stats.rating")}   value={pro.review_count} sub={pro.rating > 0 ? `★ ${pro.rating.toFixed(1)}` : "—"} />
      </div>

      {/* ── Profile completion ── */}
      <Card>
        <CardTitle>{t("overview.completionTitle")}</CardTitle>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.625rem" }}>
          <span style={{ fontWeight: 700, fontSize: "1.5rem", color: "var(--color-text)" }}>
            {completion.percent}%
          </span>
          {completion.percent === 100 ? (
            <span
              style={{
                display:         "flex",
                alignItems:      "center",
                gap:             "0.25rem",
                backgroundColor: "rgba(39,174,96,0.1)",
                color:           "#27AE60",
                borderRadius:    "6px",
                padding:         "0.2rem 0.6rem",
                fontSize:        "0.8rem",
                fontWeight:      600,
              }}
            >
              <CheckCircle2 size={14} />
              {t("overview.completionFull")}
            </span>
          ) : (
            <span
              style={{
                backgroundColor: pro.profile_complete ? "rgba(39,174,96,0.1)" : "rgba(217,119,6,0.1)",
                color:           pro.profile_complete ? "#27AE60" : "#D97706",
                borderRadius:    "6px",
                padding:         "0.2rem 0.6rem",
                fontSize:        "0.8rem",
                fontWeight:      600,
              }}
            >
              {pro.profile_complete ? t("overview.completionVisible") : t("overview.completionHidden")}
            </span>
          )}
        </div>

        <ProgressBar
          value={completion.percent}
          color={completion.percent === 100 ? "#27AE60" : "var(--color-primary)"}
          height={10}
        />

        {/* Missing fields */}
        {completion.missing.length > 0 && (
          <div style={{ marginTop: "1rem" }}>
            <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", marginBottom: "0.625rem" }}>
              {t("overview.completionHint")}
            </p>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.375rem" }}>
              {completion.missing.map((m) => (
                <li
                  key={m.field}
                  style={{
                    display:    "flex",
                    alignItems: "center",
                    gap:        "0.5rem",
                    fontSize:   "0.875rem",
                    color:      "var(--color-text)",
                  }}
                >
                  <span
                    style={{
                      width:           "20px",
                      height:          "20px",
                      borderRadius:    "50%",
                      border:          "2px dashed var(--color-border)",
                      display:         "inline-flex",
                      alignItems:      "center",
                      justifyContent:  "center",
                      flexShrink:      0,
                      fontSize:        "0.6rem",
                      color:           "var(--color-text-muted)",
                    }}
                  >
                    +{m.weight}%
                  </span>
                  {t(`overview.${m.labelKey}` as Parameters<typeof t>[0])}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      {/* ── Quick actions ── */}
      <Card>
        <CardTitle>{t("overview.quickActions")}</CardTitle>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
          <Link
            href="/dashboard?tab=profile"
            style={{
              display:         "inline-flex",
              alignItems:      "center",
              gap:             "0.5rem",
              padding:         "0.625rem 1.25rem",
              backgroundColor: "var(--color-primary)",
              color:           "#fff",
              borderRadius:    "10px",
              fontWeight:      600,
              fontSize:        "0.875rem",
              textDecoration:  "none",
            }}
          >
            {t("overview.editProfile")}
          </Link>

          {pro.slug && (
            <Link
              href={`/professional/${pro.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display:         "inline-flex",
                alignItems:      "center",
                gap:             "0.5rem",
                padding:         "0.625rem 1.25rem",
                border:          "1.5px solid var(--color-border)",
                color:           "var(--color-text)",
                borderRadius:    "10px",
                fontWeight:      600,
                fontSize:        "0.875rem",
                textDecoration:  "none",
              }}
            >
              <ExternalLink size={14} />
              {t("overview.previewProfile")}
            </Link>
          )}
        </div>
      </Card>

    </div>
  );
}

// =============================================================
// TAB: SUBSCRIPTION
// =============================================================
function SubscriptionTab({
  pro,
  sub,
}: {
  pro: DbProfessional;
  sub: DbSubscription | null;
}) {
  const t = useTranslations("dashboard");

  // Build label maps from translations (inside component to access t)
  const TIER_LABEL: Record<string, string> = {
    light:       t("tiers.light"),
    trades:      t("tiers.trades"),
    specialists: t("tiers.specialists"),
  };
  const PLAN_LABEL: Record<string, string> = {
    monthly: t("plans.monthly"),
    semi:    t("plans.semi"),
    annual:  t("plans.annual"),
  };
  const PAYMENT_STATUS_LABEL: Record<string, { label: string; color: string }> = {
    pending:  { label: t("subscription.paymentPending"),  color: "#D97706" },
    verified: { label: t("subscription.paymentVerified"), color: "#27AE60" },
    failed:   { label: t("subscription.paymentFailed"),   color: "#E74C3C" },
    refunded: { label: t("subscription.paymentRefunded"), color: "#6B7280" },
  };

  if (!sub) {
    return (
      <Card>
        <p style={{ color: "var(--color-text-muted)", textAlign: "center", padding: "2rem 0" }}>
          {t("subscription.noSubscriptionFull")}
        </p>
      </Card>
    );
  }

  const daysLeft        = daysUntil(sub.ends_at);
  const progress        = periodProgress(sub.starts_at, sub.ends_at);
  const statusMeta      = PAYMENT_STATUS_LABEL[sub.payment_status] ?? PAYMENT_STATUS_LABEL.pending;
  const isExpired       = daysLeft === 0;
  const isPaid          = sub.payment_status === "verified";

  // Find the matching PLAN_OPTION for upgrade CTA
  const currentPlan     = PLAN_OPTIONS.find((p) => p.id === sub.billing_plan);
  const annualPlan      = PLAN_OPTIONS.find((p) => p.id === "annual");
  const tierKey         = sub.tier as "light" | "trades" | "specialists";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

      {/* ── Plan overview card ── */}
      <Card>
        <CardTitle>{t("subscription.currentPlan")}</CardTitle>

        <div
          style={{
            display:             "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
            gap:                 "1rem",
            marginBottom:        "1.25rem",
          }}
        >
          {/* Tier */}
          <div>
            <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", margin: "0 0 0.25rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {t("subscription.tier")}
            </p>
            <p style={{ fontWeight: 700, color: "var(--color-text)", margin: 0, fontSize: "0.9375rem" }}>
              {TIER_LABEL[sub.tier] ?? sub.tier}
            </p>
          </div>

          {/* Plan duration */}
          <div>
            <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", margin: "0 0 0.25rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {t("subscription.planDuration")}
            </p>
            <p style={{ fontWeight: 700, color: "var(--color-text)", margin: 0, fontSize: "0.9375rem" }}>
              {PLAN_LABEL[sub.billing_plan] ?? sub.billing_plan}
            </p>
          </div>

          {/* Monthly price */}
          <div>
            <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", margin: "0 0 0.25rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {t("subscription.pricePerMonth")}
            </p>
            <p style={{ fontWeight: 800, color: "var(--color-primary)", margin: 0, fontSize: "1.25rem" }}>
              €{sub.monthly_price.toFixed(2)}
              {sub.is_founding && (
                <span
                  style={{
                    marginLeft:      "0.5rem",
                    backgroundColor: "var(--color-accent)",
                    color:           "#fff",
                    borderRadius:    "6px",
                    padding:         "0.1rem 0.45rem",
                    fontSize:        "0.65rem",
                    fontWeight:      700,
                    verticalAlign:   "middle",
                  }}
                >
                  {t("subscription.foundingBadge")}
                </span>
              )}
            </p>
          </div>

          {/* Total */}
          <div>
            <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", margin: "0 0 0.25rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {t("subscription.totalAmount")}
            </p>
            <p style={{ fontWeight: 700, color: "var(--color-text)", margin: 0, fontSize: "0.9375rem" }}>
              €{sub.total_amount.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Status badge */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span
            style={{
              display:         "inline-flex",
              alignItems:      "center",
              gap:             "0.3rem",
              backgroundColor: `${statusMeta.color}18`,
              color:           statusMeta.color,
              border:          `1px solid ${statusMeta.color}44`,
              borderRadius:    "6px",
              padding:         "0.25rem 0.75rem",
              fontSize:        "0.8125rem",
              fontWeight:      600,
            }}
          >
            <span
              style={{
                width:           "7px",
                height:          "7px",
                borderRadius:    "50%",
                backgroundColor: statusMeta.color,
                display:         "inline-block",
              }}
            />
            {statusMeta.label}
          </span>

          {/* Founding member badge */}
          {sub.is_founding && (
            <span
              style={{
                display:         "inline-flex",
                alignItems:      "center",
                gap:             "0.3rem",
                backgroundColor: "rgba(212,160,57,0.1)",
                color:           "var(--color-accent)",
                border:          "1px solid rgba(212,160,57,0.3)",
                borderRadius:    "6px",
                padding:         "0.25rem 0.75rem",
                fontSize:        "0.8125rem",
                fontWeight:      600,
              }}
            >
              {t("subscription.foundingMember")}
            </span>
          )}
        </div>
      </Card>

      {/* ── Trial / subscription period ── */}
      <Card>
        <CardTitle>
          {isPaid ? t("subscription.subscriptionPeriod") : t("subscription.trialPeriod")}
        </CardTitle>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.625rem", flexWrap: "wrap", gap: "0.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Clock size={16} style={{ color: isExpired ? "#E74C3C" : "var(--color-primary)" }} />
            <span
              style={{
                fontWeight: 700,
                fontSize:   "1.25rem",
                color:      isExpired ? "#E74C3C" : "var(--color-text)",
              }}
            >
              {isExpired
                ? t("subscription.expired")
                : daysLeft === 1
                  ? t("subscription.daysRemainingOne")
                  : t("subscription.daysRemainingPlural", { days: daysLeft })}
            </span>
          </div>
          <span style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
            {t("subscription.endDate")} {new Date(sub.ends_at).toLocaleDateString("el-GR", { day: "numeric", month: "long", year: "numeric" })}
          </span>
        </div>

        <ProgressBar
          value={progress}
          color={isExpired ? "#E74C3C" : daysLeft <= 14 ? "#D97706" : "var(--color-primary)"}
          height={12}
        />

        <p style={{ fontSize: "0.775rem", color: "var(--color-text-muted)", marginTop: "0.5rem" }}>
          {t("subscription.startDate")} {new Date(sub.starts_at).toLocaleDateString("el-GR", { day: "numeric", month: "long", year: "numeric" })}
        </p>
      </Card>

      {/* ── Payment reference ── */}
      <Card>
        <CardTitle>{t("subscription.paymentCodeTitle")}</CardTitle>

        <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", margin: "0 0 0.875rem" }}>
          {t("subscription.paymentCodeDesc")}
        </p>

        {/* Reference display */}
        <div
          style={{
            display:         "flex",
            alignItems:      "center",
            justifyContent:  "space-between",
            backgroundColor: "var(--color-primary-bg)",
            border:          "2px solid var(--color-primary)",
            borderRadius:    "12px",
            padding:         "1rem 1.25rem",
            gap:             "0.75rem",
            flexWrap:        "wrap",
          }}
        >
          <div>
            <p style={{ fontSize: "0.7rem", color: "var(--color-primary)", margin: "0 0 0.25rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {t("subscription.referenceCode")}
            </p>
            <p
              style={{
                fontWeight:    800,
                fontSize:      "clamp(1.1rem, 4vw, 1.5rem)",
                color:         "var(--color-primary-dark, #1a6f6f)",
                letterSpacing: "0.06em",
                margin:        0,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {sub.payment_reference || "TRS-" + new Date().getFullYear() + "-XXXX"}
            </p>
          </div>
          <span style={{ fontSize: "2rem" }}>🧾</span>
        </div>
      </Card>

      {/* ── Payment methods ── */}
      {!isPaid && (
        <Card>
          <CardTitle>{t("subscription.paymentMethodsTitle")}</CardTitle>

          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

            {/* IRIS */}
            <div
              style={{
                border:       "1.5px solid var(--color-border)",
                borderRadius: "12px",
                padding:      "1.25rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.75rem" }}>
                {/* IRIS logo placeholder (blue/teal) */}
                <div
                  style={{
                    width:           "36px",
                    height:          "36px",
                    borderRadius:    "8px",
                    background:      "linear-gradient(135deg, #003087, #009FDA)",
                    display:         "flex",
                    alignItems:      "center",
                    justifyContent:  "center",
                    color:           "#fff",
                    fontWeight:      800,
                    fontSize:        "0.7rem",
                    letterSpacing:   "0.02em",
                    flexShrink:      0,
                  }}
                >
                  IRIS
                </div>
                <div>
                  <p style={{ fontWeight: 700, color: "var(--color-text)", margin: 0, fontSize: "0.9375rem" }}>
                    {t("subscription.irisTitle")}
                  </p>
                  <p style={{ color: "var(--color-text-muted)", margin: 0, fontSize: "0.8rem" }}>
                    {t("subscription.irisDesc")}
                  </p>
                </div>
              </div>
              {/* QR placeholder */}
              <div
                style={{
                  width:           "120px",
                  height:          "120px",
                  border:          "2px dashed var(--color-border)",
                  borderRadius:    "10px",
                  display:         "flex",
                  alignItems:      "center",
                  justifyContent:  "center",
                  color:           "var(--color-text-muted)",
                  fontSize:        "0.75rem",
                  textAlign:       "center",
                  backgroundColor: "var(--color-bg-light)",
                }}
              >
                {t("subscription.qrComingSoon")}
              </div>
            </div>

            {/* Bank transfer */}
            <div
              style={{
                border:       "1.5px solid var(--color-border)",
                borderRadius: "12px",
                padding:      "1.25rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.875rem" }}>
                <Building2 size={20} style={{ color: "var(--color-primary)" }} />
                <p style={{ fontWeight: 700, color: "var(--color-text)", margin: 0, fontSize: "0.9375rem" }}>
                  {t("subscription.bankTransferTitle")}
                </p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {[
                  { label: t("subscription.bankName"),        value: "Εθνική Τράπεζα" },
                  { label: "IBAN",                            value: "GR00 0000 0000 0000 0000 0000 000" },
                  { label: t("subscription.bankBeneficiary"), value: "Trustia.gr ΙΚΕ" },
                  { label: t("subscription.bankReference"),   value: sub.payment_reference || "—", highlight: true },
                ].map(({ label, value, highlight }) => (
                  <div
                    key={label}
                    style={{
                      display:         "flex",
                      justifyContent:  "space-between",
                      alignItems:      "center",
                      padding:         "0.5rem 0",
                      borderBottom:    "1px solid var(--color-border)",
                      gap:             "1rem",
                      flexWrap:        "wrap",
                    }}
                  >
                    <span style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", flexShrink: 0 }}>
                      {label}
                    </span>
                    <span
                      style={{
                        fontSize:   "0.875rem",
                        fontWeight: highlight ? 700 : 500,
                        color:      highlight ? "var(--color-primary)" : "var(--color-text)",
                        textAlign:  "right",
                        fontFamily: highlight ? "monospace" : "inherit",
                      }}
                    >
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* PayPal */}
            <div
              style={{
                border:       "1.5px solid var(--color-border)",
                borderRadius: "12px",
                padding:      "1.25rem",
                display:      "flex",
                alignItems:   "center",
                justifyContent: "space-between",
                gap:          "1rem",
                flexWrap:     "wrap",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                {/* PayPal logo colours */}
                <div
                  style={{
                    width:           "36px",
                    height:          "36px",
                    borderRadius:    "8px",
                    background:      "linear-gradient(135deg, #003087, #009CDE)",
                    display:         "flex",
                    alignItems:      "center",
                    justifyContent:  "center",
                    color:           "#fff",
                    fontWeight:      800,
                    fontSize:        "0.65rem",
                    flexShrink:      0,
                  }}
                >
                  PP
                </div>
                <div>
                  <p style={{ fontWeight: 700, color: "var(--color-text)", margin: 0, fontSize: "0.9375rem" }}>
                    PayPal
                  </p>
                  <p style={{ color: "var(--color-text-muted)", margin: 0, fontSize: "0.8rem" }}>
                    {t("subscription.paypalDesc")}
                  </p>
                </div>
              </div>
              <a
                href="https://paypal.me/trustiagr"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display:         "inline-flex",
                  alignItems:      "center",
                  gap:             "0.375rem",
                  padding:         "0.5rem 1rem",
                  backgroundColor: "#003087",
                  color:           "#fff",
                  borderRadius:    "8px",
                  fontWeight:      600,
                  fontSize:        "0.875rem",
                  textDecoration:  "none",
                }}
              >
                <ExternalLink size={14} />
                {t("subscription.paypalBtn")}
              </a>
            </div>

          </div>
        </Card>
      )}

      {/* ── Upgrade CTA (if not on annual) ── */}
      {sub.billing_plan !== "annual" && annualPlan && (
        <div
          style={{
            background:   "linear-gradient(135deg, var(--color-primary) 0%, #1a6f6f 100%)",
            borderRadius: "14px",
            padding:      "1.5rem",
            color:        "#fff",
            display:      "flex",
            alignItems:   "center",
            justifyContent: "space-between",
            gap:          "1rem",
            flexWrap:     "wrap",
          }}
        >
          <div>
            <p style={{ fontWeight: 800, fontSize: "1rem", margin: "0 0 0.25rem" }}>
              {t("subscription.upgradeTitle")}
            </p>
            <p style={{ opacity: 0.9, fontSize: "0.875rem", margin: 0, lineHeight: 1.5 }}>
              {t("subscription.upgradeDesc", { price: annualPlan.perMonth[tierKey].toFixed(2) })}
            </p>
          </div>
          <Link
            href="/dashboard?tab=subscription"
            style={{
              display:         "inline-flex",
              alignItems:      "center",
              padding:         "0.625rem 1.25rem",
              backgroundColor: "rgba(255,255,255,0.2)",
              border:          "1.5px solid rgba(255,255,255,0.5)",
              borderRadius:    "10px",
              color:           "#fff",
              fontWeight:      700,
              fontSize:        "0.875rem",
              textDecoration:  "none",
              whiteSpace:      "nowrap",
            }}
          >
            {t("subscription.upgradeBtn")}
          </Link>
        </div>
      )}

    </div>
  );
}

// =============================================================
// PLACEHOLDER TAB
// =============================================================
function PlaceholderTab({ label }: { label: string }) {
  return (
    <Card>
      <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
        <p style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>🚧</p>
        <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--color-text)", marginBottom: "0.5rem" }}>
          {label}
        </h2>
        <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
          Αυτή η λειτουργία έρχεται σύντομα.
        </p>
      </div>
    </Card>
  );
}

// =============================================================
// MAIN PAGE (Server Component)
// =============================================================
export default async function DashboardPage({
  params,
  searchParams,
}: {
  params: PageParams;
  searchParams: PageSearchParams;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const p           = await searchParams;
  const str         = (k: string) => (Array.isArray(p[k]) ? p[k][0] : p[k]) ?? "";
  const tab         = str("tab")     || "overview";
  const showWelcome = str("welcome") === "1";

  // ── Auth check ────────────────────────────────────────────
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard");

  // ── Professional check ────────────────────────────────────
  const { data: proRaw } = await supabase
    .from("professionals")
    .select(
      "id, slug, first_name, last_name, phone, email, avatar_url, " +
      "category_id, tier, city, lat, lng, bio, price_text, booking_mode, " +
      "rating, review_count, profile_complete, status, created_at",
    )
    .eq("user_id", user.id)
    .maybeSingle();

  // If the user has no professional profile, redirect to home
  if (!proRaw) redirect("/");

  const pro = proRaw as unknown as DbProfessional;

  // ── Fetch latest subscription ─────────────────────────────
  const { data: subRaw } = await supabase
    .from("subscriptions")
    .select(
      "id, tier, billing_plan, monthly_price, total_amount, " +
      "payment_reference, payment_status, is_founding, starts_at, ends_at",
    )
    .eq("professional_id", pro.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const sub = subRaw as unknown as DbSubscription | null;

  // ── Derived values ────────────────────────────────────────
  const proInitials = initials(pro.first_name, pro.last_name);

  // Detect OAuth accounts so ProfileEditor can disable the email field.
  // Supabase sets app_metadata.provider to "google" or "facebook" for OAuth.
  const provider      = (user.app_metadata?.provider as string | undefined) ?? "";
  const isOAuthAccount = provider === "google" || provider === "facebook";

  // ── Translations ──────────────────────────────────────────
  const t = await getTranslations("dashboard");

  // ── Tab titles for section heading ────────────────────────
  const TAB_TITLES: Record<string, string> = {
    overview:     t("tabs.overview"),
    profile:      t("tabs.profile"),
    bookings:     t("tabs.bookings"),
    reviews:      t("tabs.reviews"),
    subscription: t("tabs.subscription"),
  };

  // ── Render ─────────────────────────────────────────────────
  return (
    <div
      style={{
        display:         "flex",
        minHeight:       "calc(100vh - 64px)",  // 64px = Navbar height
        backgroundColor: "var(--color-bg-light)",
      }}
    >
      {/* ── Left sidebar / mobile bottom tabs ── */}
      <DashboardNav
        tab={tab}
        proFirstName={pro.first_name}
        proSlug={pro.slug}
        avatarUrl={pro.avatar_url}
        initials={proInitials}
      />

      {/* ── Main content area ── */}
      <main
        style={{
          flex:          1,
          minWidth:      0,
          padding:       "2rem 1.5rem",
          // Extra bottom padding on mobile for the fixed bottom tabs
          paddingBottom: "calc(2rem + 58px)",
          maxWidth:      "860px",
        }}
      >
        {/* Section heading */}
        <h2
          style={{
            fontSize:     "1.125rem",
            fontWeight:   700,
            color:        "var(--color-text)",
            margin:       "0 0 1.5rem",
          }}
        >
          {TAB_TITLES[tab] ?? t("tabs.overview")}
        </h2>

        {/* Tab content */}
        {tab === "subscription" ? (
          <SubscriptionTab pro={pro} sub={sub} />
        ) : tab === "profile" ? (
          <ProfileEditor
            professionalId={pro.id}
            userId={user.id}
            initialData={{
              first_name:      pro.first_name,
              last_name:       pro.last_name,
              phone:           pro.phone,
              email:           pro.email,
              avatar_url:      pro.avatar_url,
              category_id:     pro.category_id,
              tier:            pro.tier,
              city:            pro.city,
              lat:             pro.lat,
              lng:             pro.lng,
              bio:             pro.bio,
              price_text:      pro.price_text,
              booking_mode:    pro.booking_mode,
              profile_complete: pro.profile_complete,
            }}
            isOAuthAccount={isOAuthAccount}
          />
        ) : tab === "bookings" ? (
          <BookingsTab professionalId={pro.id} />
        ) : tab === "reviews" ? (
          <ReviewsTab professionalId={pro.id} />
        ) : (
          <OverviewTab pro={pro} sub={sub} showWelcome={showWelcome} />
        )}
      </main>
    </div>
  );
}
