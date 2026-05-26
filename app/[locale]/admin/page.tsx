// =============================================================
// app/[locale]/admin/page.tsx
// =============================================================
// Full admin panel — auth-gated, role-gated Server Component.
//
// AUTH / ROLE FLOW
//   1. No session                    → redirect /[locale]/login
//   2. Session but no "admin" role   → redirect /[locale]  (home)
//   3. Session + admin role          → render panel
//
// TABS (via ?tab= URL param)
//   overview      — platform stats (pros, customers, bookings, reports)
//   professionals — professionals table with status management
//   reports       — flagged professionals, resolve/dismiss
//   announcements — announcement bar CRUD
//   settings      — platform_settings key-value editor
//
// Server Actions used for status changes (activate/ban) and
// payment verification.  Interactive tabs (reports, announcements,
// settings) use Client Components that write directly to Supabase.
// =============================================================

import type { Metadata }                     from "next";
import { redirect }                          from "next/navigation";
import { revalidatePath }                    from "next/cache";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient }                      from "@/lib/supabase/server";
import { CATEGORIES }                        from "@/lib/constants";
import {
  Users, BookOpen, Flag, Star, Building2, ExternalLink
} from "lucide-react";

import AdminNav          from "@/components/admin/AdminNav";
import ReportsTab        from "@/components/admin/ReportsTab";
import AnnouncementsTab  from "@/components/admin/AnnouncementsTab";
import SettingsTab       from "@/components/admin/SettingsTab";

export const metadata: Metadata = {
  title: "Admin | Trustia.gr",
};

// ── Params types ──────────────────────────────────────────────
type PageParams       = Promise<{ locale: string }>;
type PageSearchParams = Promise<Record<string, string | string[] | undefined>>;

// ── DB row types ──────────────────────────────────────────────

interface DbSubscriptionRow {
  id:             string;
  tier:           string;
  billing_plan:   string;
  monthly_price:  number;
  payment_status: "pending" | "verified" | "failed" | "refunded";
  is_founding:    boolean;
  ends_at:        string;
}

interface DbProfessionalRow {
  id:            string;
  slug:          string | null;
  first_name:    string;
  last_name:     string;
  email:         string;
  phone:         string;
  category_id:   string;
  status:        "pending" | "active" | "inactive" | "banned";
  profile_views: number;
  review_count:  number;
  rating:        number;
  created_at:    string;
  subscriptions: DbSubscriptionRow[] | null;
}

interface DbReportRow {
  id:          string;
  reason:      string;
  details:     string | null;
  status:      "pending" | "reviewed" | "resolved" | "dismissed";
  created_at:  string;
  target_id:   string;
  reporter_id: string | null;
}

interface DbAnnouncement {
  id:         string;
  text_el:    string;
  text_en:    string | null;
  link_url:   string | null;
  active:     boolean;
  starts_at:  string | null;
  ends_at:    string | null;
  created_at: string;
}

interface DbSetting {
  key:         string;
  value:       unknown;
  description: string | null;
}

// ── Payment badge style map ───────────────────────────────────
const PAYMENT_BADGE: Record<string, { bg: string; color: string }> = {
  pending:  { bg: "#FEF3C7", color: "#D97706" },
  verified: { bg: "#D1FAE5", color: "#059669" },
  failed:   { bg: "#FEE2E2", color: "#DC2626" },
  refunded: { bg: "#F3F4F6", color: "#6B7280" },
};

const STATUS_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  pending:  { bg: "#FEF3C7", color: "#D97706", label: "Εκκρεμεί"      },
  active:   { bg: "#D1FAE5", color: "#059669", label: "Ενεργός"       },
  inactive: { bg: "#F3F4F6", color: "#6B7280", label: "Ανενεργός"     },
  banned:   { bg: "#FEE2E2", color: "#DC2626", label: "Αποκλεισμένος" },
};

// ── Server Action: verify payment ────────────────────────────
async function verifyPayment(formData: FormData) {
  "use server";
  const subscriptionId = formData.get("subscriptionId") as string;
  const locale         = (formData.get("locale") as string) ?? "el";
  if (!subscriptionId) return;
  const supabase = await createClient();
  await supabase
    .from("subscriptions")
    .update({ payment_status: "verified" })
    .eq("id", subscriptionId);
  revalidatePath(`/${locale}/admin`);
}

// ── Server Action: update professional status ─────────────────
async function updateProStatus(formData: FormData) {
  "use server";
  const proId  = formData.get("proId")  as string;
  const status = formData.get("status") as string;
  const locale = (formData.get("locale") as string) ?? "el";
  if (!proId || !status) return;
  const supabase = await createClient();
  await supabase
    .from("professionals")
    .update({ status })
    .eq("id", proId);
  revalidatePath(`/${locale}/admin`);
}

// ── Page ──────────────────────────────────────────────────────
export default async function AdminPage({
  params,
  searchParams,
}: {
  params:       PageParams;
  searchParams: PageSearchParams;
}) {
  const { locale } = await params;
  const sp         = await searchParams;
  setRequestLocale(locale);

  const t        = await getTranslations("admin");
  const supabase = await createClient();

  // ── 1. Auth check ──────────────────────────────────────────
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/${locale}/login?next=/${locale}/admin`);
  }

  // ── 2. Admin role check ────────────────────────────────────
  const { data: roleRows } = await supabase
    .from("user_roles")
    .select("roles(name)")
    .eq("user_id", user.id);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isAdmin = roleRows?.some((r: any) => r.roles?.name === "admin") ?? false;
  if (!isAdmin) redirect(`/${locale}`);

  // ── 3. Read active tab & filter ────────────────────────────
  const tab    = (sp.tab    as string) ?? "overview";
  const filter = (sp.filter as string) ?? "all";

  // ── 4. Fetch data for each tab ─────────────────────────────

  // Always-needed: professionals (used in overview + professionals tab)
  const { data: rawPros } = await supabase
    .from("professionals")
    .select(`
      id, slug, first_name, last_name, email, phone,
      category_id, status, profile_views, review_count, rating,
      created_at,
      subscriptions (
        id, tier, billing_plan, monthly_price,
        payment_status, is_founding, ends_at
      )
    `)
    .order("created_at", { ascending: false })
    .returns<DbProfessionalRow[]>();

  const professionals = rawPros ?? [];

  // ── Reports tab data ───────────────────────────────────────
  let reports: Array<DbReportRow & {
    professional_name: string | null;
    professional_slug: string | null;
  }> = [];

  if (tab === "reports" || tab === "overview") {
    const { data: rawReports } = await supabase
      .from("reports")
      .select("id, reason, details, status, created_at, target_id, reporter_id")
      .eq("target_type", "professional")
      .order("created_at", { ascending: false })
      .limit(200);

    if (rawReports) {
      // Enrich with professional name/slug
      const proMap = new Map(professionals.map((p) => [
        p.id,
        { name: `${p.first_name} ${p.last_name}`, slug: p.slug },
      ]));

      reports = rawReports.map((r) => ({
        ...r,
        status: r.status as "pending" | "reviewed" | "resolved" | "dismissed",
        professional_name: proMap.get(r.target_id)?.name ?? null,
        professional_slug: proMap.get(r.target_id)?.slug ?? null,
      }));
    }
  }

  // ── Announcements tab data ─────────────────────────────────
  let announcements: DbAnnouncement[] = [];
  if (tab === "announcements") {
    const { data } = await supabase
      .from("announcements")
      .select("id, text_el, text_en, link_url, active, starts_at, ends_at, created_at")
      .order("active", { ascending: false })
      .order("created_at", { ascending: false });
    announcements = (data ?? []) as DbAnnouncement[];
  }

  // ── Settings tab data ──────────────────────────────────────
  let settings: DbSetting[] = [];
  if (tab === "settings") {
    const { data } = await supabase
      .from("platform_settings")
      .select("key, value, description")
      .order("key");
    settings = (data ?? []) as DbSetting[];
  }

  // ── 5. Overview stats ──────────────────────────────────────
  const total         = professionals.length;
  const activeCount   = professionals.filter((p) => p.status === "active").length;
  const pendingCount  = professionals.filter((p) =>
    p.subscriptions?.some((s) => s.payment_status === "pending")
  ).length;
  const bannedCount   = professionals.filter((p) => p.status === "banned").length;
  const pendingReports = reports.filter((r) => r.status === "pending").length;

  // Customer count (overview only)
  let customerCount = 0;
  let bookingCount  = 0;
  if (tab === "overview") {
    const [custRes, bookRes] = await Promise.all([
      supabase.from("customers").select("id", { count: "exact", head: true }),
      supabase.from("bookings").select("id", { count: "exact", head: true }),
    ]);
    customerCount = custRes.count ?? 0;
    bookingCount  = bookRes.count ?? 0;
  }

  // ── 6. Filter professionals table ─────────────────────────
  const proFilter = (sp["pro-filter"] as string) ?? "all";
  const visiblePros = proFilter === "pending"
    ? professionals.filter((p) => p.subscriptions?.some((s) => s.payment_status === "pending"))
    : proFilter === "banned"
    ? professionals.filter((p) => p.status === "banned")
    : professionals;

  // ── Render ─────────────────────────────────────────────────
  return (
    <div
      style={{
        display:         "flex",
        minHeight:       "calc(100vh - 64px)",
        backgroundColor: "var(--color-bg-light)",
      }}
    >
      {/* Sidebar */}
      <AdminNav tab={tab} />

      {/* Main content */}
      <main
        style={{
          flex:       1,
          padding:    "2rem 1.5rem 5rem",
          minWidth:   0,
        }}
      >
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>

          {/* ══════════════════════════════════════════════════
              TAB: OVERVIEW
          ══════════════════════════════════════════════════ */}
          {tab === "overview" && (
            <div>
              <div style={{ marginBottom: "1.75rem" }}>
                <h1 style={{ fontSize: "clamp(1.25rem, 4vw, 1.75rem)", fontWeight: 800, color: "var(--color-text)", margin: "0 0 0.3rem", letterSpacing: "-0.025em" }}>
                  {t("title")}
                </h1>
                <p style={{ color: "var(--color-text-muted)", margin: 0, fontSize: "0.9rem" }}>
                  {t("subtitle")}
                </p>
              </div>

              {/* Stats grid */}
              <div
                style={{
                  display:             "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                  gap:                 "1rem",
                  marginBottom:        "2rem",
                }}
              >
                {[
                  { label: "Επαγγελματίες",      value: total,         accent: "var(--color-primary)", icon: <Users      size={18} /> },
                  { label: "Πελάτες",             value: customerCount, accent: "#7C3AED",              icon: <Users      size={18} /> },
                  { label: "Κρατήσεις",           value: bookingCount,  accent: "#1D4ED8",              icon: <BookOpen   size={18} /> },
                  { label: "Εκκρ. Πληρωμές",     value: pendingCount,  accent: "#D97706",              icon: <Star       size={18} /> },
                  { label: "Εκκρ. Αναφορές",     value: pendingReports, accent: "#DC2626",             icon: <Flag       size={18} /> },
                  { label: "Αποκλεισμένοι",      value: bannedCount,   accent: "#6B7280",              icon: <Building2  size={18} /> },
                ].map(({ label, value, accent, icon }) => (
                  <div
                    key={label}
                    style={{
                      backgroundColor: "#fff",
                      border:          "1.5px solid var(--color-border)",
                      borderRadius:    "14px",
                      padding:         "1.125rem 1.25rem",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                      <span style={{ color: accent }}>{icon}</span>
                      <p style={{ fontSize: "0.725rem", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", margin: 0 }}>
                        {label}
                      </p>
                    </div>
                    <p style={{ fontSize: "1.875rem", fontWeight: 800, color: accent, margin: 0 }}>
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Recent professionals (last 5) */}
              <div style={{ marginBottom: "2rem" }}>
                <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-text)", margin: "0 0 0.875rem" }}>
                  Τελευταίες Εγγραφές
                </h2>
                <div
                  style={{
                    backgroundColor: "#fff",
                    border:          "1.5px solid var(--color-border)",
                    borderRadius:    "14px",
                    overflow:        "hidden",
                  }}
                >
                  {professionals.slice(0, 5).map((pro, idx) => {
                    const sub   = pro.subscriptions?.[0];
                    const sbadge = STATUS_BADGE[pro.status] ?? STATUS_BADGE.pending;
                    const isLast = idx === Math.min(4, professionals.length - 1);
                    return (
                      <div
                        key={pro.id}
                        style={{
                          display:      "flex",
                          alignItems:   "center",
                          gap:          "1rem",
                          padding:      "0.875rem 1.25rem",
                          borderBottom: isLast ? "none" : "1px solid var(--color-border)",
                          flexWrap:     "wrap",
                        }}
                      >
                        <div style={{ flex: 1, minWidth: "160px" }}>
                          <p style={{ margin: "0 0 0.1rem", fontWeight: 700, fontSize: "0.875rem", color: "var(--color-text)" }}>
                            {pro.first_name} {pro.last_name}
                          </p>
                          <p style={{ margin: 0, fontSize: "0.775rem", color: "var(--color-text-muted)" }}>
                            {pro.email}
                          </p>
                        </div>
                        <span
                          style={{
                            padding:         "0.2rem 0.6rem",
                            borderRadius:    "99px",
                            fontSize:        "0.725rem",
                            fontWeight:      700,
                            backgroundColor: sbadge.bg,
                            color:           sbadge.color,
                          }}
                        >
                          {sbadge.label}
                        </span>
                        <span style={{ fontSize: "0.775rem", color: "var(--color-text-muted)" }}>
                          {sub?.tier ?? "—"} · {new Date(pro.created_at).toLocaleDateString("el-GR")}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════
              TAB: PROFESSIONALS
          ══════════════════════════════════════════════════ */}
          {tab === "professionals" && (
            <div>
              <div style={{ marginBottom: "1.5rem" }}>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--color-text)", margin: "0 0 0.25rem" }}>
                  Επαγγελματίες
                </h2>
                <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", margin: 0 }}>
                  {total} εγγεγραμμένοι · {activeCount} ενεργοί · {bannedCount} αποκλεισμένοι
                </p>
              </div>

              {/* Filter pills */}
              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
                {[
                  { key: "all",     label: "Όλοι"             },
                  { key: "pending", label: "Εκκρεμείς Πληρωμές" },
                  { key: "banned",  label: "Αποκλεισμένοι"    },
                ].map(({ key, label }) => {
                  const active = proFilter === key;
                  return (
                    <a
                      key={key}
                      href={`?tab=professionals&pro-filter=${key}`}
                      style={{
                        padding:         "0.375rem 1rem",
                        borderRadius:    "99px",
                        fontSize:        "0.85rem",
                        fontWeight:      600,
                        textDecoration:  "none",
                        backgroundColor: active ? "var(--color-primary)" : "#fff",
                        color:           active ? "#fff" : "var(--color-text)",
                        border:          `1.5px solid ${active ? "var(--color-primary)" : "var(--color-border)"}`,
                      }}
                    >
                      {label}
                    </a>
                  );
                })}
              </div>

              {/* Table */}
              <div
                style={{
                  backgroundColor: "#fff",
                  border:          "1.5px solid var(--color-border)",
                  borderRadius:    "16px",
                  overflow:        "hidden",
                }}
              >
                {!visiblePros.length ? (
                  <div style={{ padding: "3rem", textAlign: "center", color: "var(--color-text-muted)" }}>
                    {t("noResults")}
                  </div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
                      <thead>
                        <tr style={{ backgroundColor: "var(--color-bg-light)", borderBottom: "1.5px solid var(--color-border)" }}>
                          {["Όνομα", "Email", "Κατηγορία", "Κατάσταση", "Συνδρομή", "Πληρωμή", "Κρατήσεις", "Εγγραφή", ""].map((col, i) => (
                            <th
                              key={i}
                              style={{
                                padding:       "0.875rem 0.875rem",
                                textAlign:     "left",
                                fontWeight:    700,
                                color:         "var(--color-text-muted)",
                                fontSize:      "0.725rem",
                                textTransform: "uppercase",
                                letterSpacing: "0.06em",
                                whiteSpace:    "nowrap",
                              }}
                            >
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {visiblePros.map((pro, idx) => {
                          const sub       = pro.subscriptions?.[0];
                          const payStatus = sub?.payment_status;
                          const pbadge    = payStatus ? PAYMENT_BADGE[payStatus] : null;
                          const sbadge    = STATUS_BADGE[pro.status] ?? STATUS_BADGE.pending;
                          const cat       = CATEGORIES.find((c) => c.id === pro.category_id);
                          const isLast    = idx === visiblePros.length - 1;

                          return (
                            <tr
                              key={pro.id}
                              style={{ borderBottom: isLast ? "none" : "1px solid var(--color-border)" }}
                            >
                              {/* Name + profile link */}
                              <td style={{ padding: "0.875rem 0.875rem", fontWeight: 600, color: "var(--color-text)", whiteSpace: "nowrap" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                  {pro.first_name} {pro.last_name}
                                  {pro.slug && (
                                    <a
                                      href={`/${locale}/professional/${pro.slug}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{ color: "var(--color-text-muted)", lineHeight: 1 }}
                                    >
                                      <ExternalLink size={12} />
                                    </a>
                                  )}
                                </div>
                              </td>

                              {/* Email */}
                              <td style={{ padding: "0.875rem 0.875rem", color: "var(--color-text-muted)", fontSize: "0.8rem" }}>
                                {pro.email}
                              </td>

                              {/* Category */}
                              <td style={{ padding: "0.875rem 0.875rem", color: "var(--color-text-muted)", whiteSpace: "nowrap", fontSize: "0.8rem" }}>
                                {cat?.emoji} {cat?.nameEl ?? pro.category_id}
                              </td>

                              {/* Status badge */}
                              <td style={{ padding: "0.875rem 0.875rem", whiteSpace: "nowrap" }}>
                                <span
                                  style={{
                                    padding:         "0.2rem 0.55rem",
                                    borderRadius:    "99px",
                                    fontSize:        "0.725rem",
                                    fontWeight:      700,
                                    backgroundColor: sbadge.bg,
                                    color:           sbadge.color,
                                  }}
                                >
                                  {sbadge.label}
                                </span>
                              </td>

                              {/* Subscription */}
                              <td style={{ padding: "0.875rem 0.875rem", color: "var(--color-text-muted)", fontSize: "0.8rem", whiteSpace: "nowrap" }}>
                                {sub ? `${sub.tier} · ${sub.billing_plan}${sub.is_founding ? " ★" : ""}` : "—"}
                              </td>

                              {/* Payment badge */}
                              <td style={{ padding: "0.875rem 0.875rem" }}>
                                {pbadge ? (
                                  <span
                                    style={{
                                      padding:         "0.2rem 0.55rem",
                                      borderRadius:    "99px",
                                      fontSize:        "0.725rem",
                                      fontWeight:      700,
                                      backgroundColor: pbadge.bg,
                                      color:           pbadge.color,
                                      whiteSpace:      "nowrap",
                                    }}
                                  >
                                    {payStatus}
                                  </span>
                                ) : "—"}
                              </td>

                              {/* Review count / rating */}
                              <td style={{ padding: "0.875rem 0.875rem", color: "var(--color-text-muted)", fontSize: "0.8rem", whiteSpace: "nowrap" }}>
                                {pro.review_count > 0
                                  ? `★ ${pro.rating.toFixed(1)} (${pro.review_count})`
                                  : "—"}
                              </td>

                              {/* Date */}
                              <td style={{ padding: "0.875rem 0.875rem", color: "var(--color-text-muted)", fontSize: "0.775rem", whiteSpace: "nowrap" }}>
                                {new Date(pro.created_at).toLocaleDateString("el-GR")}
                              </td>

                              {/* Actions column */}
                              <td style={{ padding: "0.875rem 0.875rem", whiteSpace: "nowrap" }}>
                                <div style={{ display: "flex", gap: "0.4rem" }}>
                                  {/* Verify payment */}
                                  {sub && payStatus === "pending" && (
                                    <form action={verifyPayment}>
                                      <input type="hidden" name="subscriptionId" value={sub.id} />
                                      <input type="hidden" name="locale" value={locale} />
                                      <button
                                        type="submit"
                                        style={{
                                          padding:         "0.3rem 0.7rem",
                                          backgroundColor: "var(--color-primary)",
                                          color:           "#fff",
                                          border:          "none",
                                          borderRadius:    "6px",
                                          fontSize:        "0.75rem",
                                          fontWeight:      700,
                                          fontFamily:      "inherit",
                                          cursor:          "pointer",
                                          whiteSpace:      "nowrap",
                                        }}
                                      >
                                        {t("verifyBtn")}
                                      </button>
                                    </form>
                                  )}

                                  {/* Activate (if inactive/pending status) */}
                                  {(pro.status === "inactive" || pro.status === "pending") && (
                                    <form action={updateProStatus}>
                                      <input type="hidden" name="proId"  value={pro.id}    />
                                      <input type="hidden" name="status" value="active"    />
                                      <input type="hidden" name="locale" value={locale}    />
                                      <button
                                        type="submit"
                                        style={{
                                          padding:         "0.3rem 0.7rem",
                                          backgroundColor: "#D1FAE5",
                                          color:           "#059669",
                                          border:          "1px solid #A7F3D0",
                                          borderRadius:    "6px",
                                          fontSize:        "0.75rem",
                                          fontWeight:      700,
                                          fontFamily:      "inherit",
                                          cursor:          "pointer",
                                        }}
                                      >
                                        Ενεργοπ.
                                      </button>
                                    </form>
                                  )}

                                  {/* Ban (if active) */}
                                  {pro.status === "active" && (
                                    <form action={updateProStatus}>
                                      <input type="hidden" name="proId"  value={pro.id}    />
                                      <input type="hidden" name="status" value="banned"    />
                                      <input type="hidden" name="locale" value={locale}    />
                                      <button
                                        type="submit"
                                        style={{
                                          padding:         "0.3rem 0.7rem",
                                          backgroundColor: "#FEE2E2",
                                          color:           "#DC2626",
                                          border:          "1px solid #FECACA",
                                          borderRadius:    "6px",
                                          fontSize:        "0.75rem",
                                          fontWeight:      700,
                                          fontFamily:      "inherit",
                                          cursor:          "pointer",
                                        }}
                                      >
                                        Ban
                                      </button>
                                    </form>
                                  )}

                                  {/* Unban */}
                                  {pro.status === "banned" && (
                                    <form action={updateProStatus}>
                                      <input type="hidden" name="proId"  value={pro.id}    />
                                      <input type="hidden" name="status" value="active"    />
                                      <input type="hidden" name="locale" value={locale}    />
                                      <button
                                        type="submit"
                                        style={{
                                          padding:         "0.3rem 0.7rem",
                                          backgroundColor: "#F3F4F6",
                                          color:           "#374151",
                                          border:          "1px solid #D1D5DB",
                                          borderRadius:    "6px",
                                          fontSize:        "0.75rem",
                                          fontWeight:      700,
                                          fontFamily:      "inherit",
                                          cursor:          "pointer",
                                        }}
                                      >
                                        Unban
                                      </button>
                                    </form>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════
              TAB: REPORTS
          ══════════════════════════════════════════════════ */}
          {tab === "reports" && (
            <ReportsTab reports={reports} />
          )}

          {/* ══════════════════════════════════════════════════
              TAB: ANNOUNCEMENTS
          ══════════════════════════════════════════════════ */}
          {tab === "announcements" && (
            <AnnouncementsTab announcements={announcements} />
          )}

          {/* ══════════════════════════════════════════════════
              TAB: SETTINGS
          ══════════════════════════════════════════════════ */}
          {tab === "settings" && (
            <SettingsTab settings={settings} />
          )}

        </div>
      </main>
    </div>
  );
}
