// =============================================================
// app/[locale]/admin/page.tsx
// =============================================================
// Admin panel — auth-gated, role-gated Server Component.
//
// AUTH / ROLE FLOW
//   1. No session                    → redirect /[locale]/login
//   2. Session but no "admin" role   → redirect /[locale]  (home)
//   3. Session + admin role          → render panel
//
// Admin role is detected exactly like the Navbar: by querying
// the user_roles → roles join and checking roles.name === "admin".
//
// FEATURES
//   - Stats strip: total pros, active subscriptions, pending payments
//   - Filter tabs: All / Pending
//   - Professionals table with subscription + payment status
//   - "Verify" button for pending-payment rows (Server Action)
//
// The "Verify" button uses a plain HTML <form action> wired to
// the `verifyPayment` Server Action — works without JavaScript.
// =============================================================

import type { Metadata }                     from "next";
import { redirect }                          from "next/navigation";
import { revalidatePath }                    from "next/cache";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient }                      from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Admin | Trustia.gr",
};

// Next.js 16: both params and searchParams are Promises
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
  first_name:    string;
  last_name:     string;
  email:         string;
  phone:         string;
  category_id:   string;
  status:        string;
  created_at:    string;
  subscriptions: DbSubscriptionRow[] | null;
}

// ── Payment badge style map ───────────────────────────────────

const PAYMENT_BADGE: Record<
  string,
  { bg: string; color: string }
> = {
  pending:  { bg: "#FEF3C7", color: "#D97706" },
  verified: { bg: "#D1FAE5", color: "#059669" },
  failed:   { bg: "#FEE2E2", color: "#DC2626" },
  refunded: { bg: "#F3F4F6", color: "#6B7280" },
};

// ── Server Action: verify a single subscription payment ───────

async function verifyPayment(formData: FormData) {
  "use server";

  const subscriptionId = formData.get("subscriptionId") as string;
  const locale         = (formData.get("locale") as string) ?? "el";

  if (!subscriptionId) return;

  const supabase = await createClient();

  const { error } = await supabase
    .from("subscriptions")
    .update({ payment_status: "verified" })
    .eq("id", subscriptionId);

  if (error) {
    console.error("[admin/verifyPayment] update error:", error.message);
    return;
  }

  // Bust the cache for both locales so the table refreshes
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
  const { locale }  = await params;
  const sp          = await searchParams;
  setRequestLocale(locale);

  const t        = await getTranslations("admin");
  const supabase = await createClient();

  // ── 1. Auth check ────────────────────────────────────────────
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login?next=/${locale}/admin`);
  }

  // ── 2. Admin role check ──────────────────────────────────────
  // Same query pattern used in the Navbar component.
  const { data: roleRows } = await supabase
    .from("user_roles")
    .select("roles(name)")
    .eq("user_id", user.id);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isAdmin = roleRows?.some((r: any) => r.roles?.name === "admin") ?? false;

  if (!isAdmin) {
    redirect(`/${locale}`);
  }

  // ── 3. Fetch professionals with their subscriptions ──────────
  // We get all subscriptions per professional as an array;
  // [0] is used as the "latest" row below.
  const { data: professionals } = await supabase
    .from("professionals")
    .select(`
      id, first_name, last_name, email, phone,
      category_id, status, created_at,
      subscriptions (
        id, tier, billing_plan, monthly_price,
        payment_status, is_founding, ends_at
      )
    `)
    .order("created_at", { ascending: false })
    .returns<DbProfessionalRow[]>();

  // ── 4. Derive stats ──────────────────────────────────────────

  const total          = professionals?.length ?? 0;
  const activeCount    = professionals?.filter((p) =>
    p.subscriptions?.some((s) => s.payment_status === "verified")
  ).length ?? 0;
  const pendingCount   = professionals?.filter((p) =>
    p.subscriptions?.some((s) => s.payment_status === "pending")
  ).length ?? 0;

  // ── 5. Apply filter tab ──────────────────────────────────────
  const filter  = (sp.filter as string) ?? "all";
  const visible = filter === "pending"
    ? professionals?.filter((p) =>
        p.subscriptions?.some((s) => s.payment_status === "pending")
      )
    : professionals;

  // ── Render ────────────────────────────────────────────────────

  return (
    <main
      style={{
        minHeight:       "calc(100vh - 72px)",
        backgroundColor: "var(--color-bg-light)",
        padding:         "2.5rem 1.5rem",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>

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

        {/* ── Stats strip ── */}
        <div
          style={{
            display:             "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap:                 "1rem",
            marginBottom:        "2rem",
          }}
        >
          {(
            [
              { label: t("statsTotal"),   value: total,        accent: "var(--color-primary)" },
              { label: t("statsActive"),  value: activeCount,  accent: "#059669"               },
              { label: t("statsPending"), value: pendingCount, accent: "#D97706"               },
            ] as const
          ).map(({ label, value, accent }) => (
            <div
              key={label}
              style={{
                backgroundColor: "#ffffff",
                border:          "1.5px solid var(--color-border)",
                borderRadius:    "14px",
                padding:         "1.25rem 1.5rem",
              }}
            >
              <p
                style={{
                  fontSize:      "0.75rem",
                  fontWeight:    700,
                  color:         "var(--color-text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.07em",
                  margin:        "0 0 0.5rem",
                }}
              >
                {label}
              </p>
              <p
                style={{
                  fontSize:   "2rem",
                  fontWeight: 800,
                  color:      accent,
                  margin:     0,
                }}
              >
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* ── Filter tabs ── */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem" }}>
          {(["all", "pending"] as const).map((f) => {
            const active = filter === f;
            return (
              <a
                key={f}
                href={`?filter=${f}`}
                style={{
                  padding:         "0.375rem 1rem",
                  borderRadius:    "99px",
                  fontSize:        "0.85rem",
                  fontWeight:      600,
                  textDecoration:  "none",
                  backgroundColor: active ? "var(--color-primary)" : "#ffffff",
                  color:           active ? "#ffffff" : "var(--color-text)",
                  border:          `1.5px solid ${active ? "var(--color-primary)" : "var(--color-border)"}`,
                }}
              >
                {f === "all" ? t("filterAll") : t("filterPending")}
              </a>
            );
          })}
        </div>

        {/* ── Professionals table ── */}
        <div
          style={{
            backgroundColor: "#ffffff",
            border:          "1.5px solid var(--color-border)",
            borderRadius:    "16px",
            overflow:        "hidden",
          }}
        >
          {!visible?.length ? (
            /* Empty state */
            <div
              style={{
                padding:    "3rem",
                textAlign:  "center",
                color:      "var(--color-text-muted)",
                fontSize:   "0.95rem",
              }}
            >
              {t("noResults")}
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width:           "100%",
                  borderCollapse:  "collapse",
                  fontSize:        "0.875rem",
                }}
              >
                {/* Table head */}
                <thead>
                  <tr
                    style={{
                      backgroundColor: "var(--color-bg-light)",
                      borderBottom:    "1.5px solid var(--color-border)",
                    }}
                  >
                    {[
                      t("colName"),
                      t("colEmail"),
                      t("colSubscription"),
                      t("colPayment"),
                      t("colDate"),
                      "", // verify action column
                    ].map((col, i) => (
                      <th
                        key={i}
                        style={{
                          padding:       "0.875rem 1rem",
                          textAlign:     "left",
                          fontWeight:    700,
                          color:         "var(--color-text-muted)",
                          fontSize:      "0.775rem",
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

                {/* Table body */}
                <tbody>
                  {visible.map((pro, idx) => {
                    // Use the first subscription (latest, since ordered by created_at desc)
                    const sub       = pro.subscriptions?.[0];
                    const payStatus = sub?.payment_status;
                    const badge     = payStatus ? PAYMENT_BADGE[payStatus] : null;

                    // Capitalise first letter of payment status key for translation lookup
                    const payLabel = payStatus
                      ? t(
                          `payment${payStatus.charAt(0).toUpperCase() + payStatus.slice(1)}` as
                            | "paymentPending"
                            | "paymentVerified"
                            | "paymentFailed"
                            | "paymentRefunded"
                        )
                      : "—";

                    const isLast = idx === (visible?.length ?? 0) - 1;

                    return (
                      <tr
                        key={pro.id}
                        style={{
                          borderBottom: isLast
                            ? "none"
                            : "1px solid var(--color-border)",
                        }}
                      >
                        {/* Name */}
                        <td
                          style={{
                            padding:    "0.875rem 1rem",
                            fontWeight: 600,
                            color:      "var(--color-text)",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {pro.first_name} {pro.last_name}
                        </td>

                        {/* Email */}
                        <td
                          style={{
                            padding: "0.875rem 1rem",
                            color:   "var(--color-text-muted)",
                          }}
                        >
                          {pro.email}
                        </td>

                        {/* Subscription */}
                        <td
                          style={{
                            padding:    "0.875rem 1rem",
                            color:      "var(--color-text-muted)",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {sub
                            ? `${sub.tier} · ${sub.billing_plan}${sub.is_founding ? " ★" : ""}`
                            : "—"}
                        </td>

                        {/* Payment status badge */}
                        <td style={{ padding: "0.875rem 1rem" }}>
                          {badge ? (
                            <span
                              style={{
                                display:         "inline-flex",
                                padding:         "0.225rem 0.625rem",
                                borderRadius:    "99px",
                                fontSize:        "0.775rem",
                                fontWeight:      700,
                                backgroundColor: badge.bg,
                                color:           badge.color,
                                whiteSpace:      "nowrap",
                              }}
                            >
                              {payLabel}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>

                        {/* Registration date */}
                        <td
                          style={{
                            padding:    "0.875rem 1rem",
                            color:      "var(--color-text-muted)",
                            whiteSpace: "nowrap",
                            fontSize:   "0.8rem",
                          }}
                        >
                          {new Date(pro.created_at).toLocaleDateString("el-GR")}
                        </td>

                        {/* Verify action */}
                        <td style={{ padding: "0.875rem 1rem" }}>
                          {sub && payStatus === "pending" && (
                            /*
                             * Plain HTML form — no JS required.
                             * The hidden `locale` field is passed through so
                             * the Server Action knows which path to revalidate.
                             */
                            <form action={verifyPayment}>
                              <input
                                type="hidden"
                                name="subscriptionId"
                                value={sub.id}
                              />
                              <input type="hidden" name="locale" value={locale} />
                              <button
                                type="submit"
                                style={{
                                  padding:         "0.35rem 0.875rem",
                                  backgroundColor: "var(--color-primary)",
                                  color:           "#ffffff",
                                  border:          "none",
                                  borderRadius:    "6px",
                                  fontSize:        "0.8rem",
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
    </main>
  );
}
