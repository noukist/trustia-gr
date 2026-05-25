// app/[locale]/cookies/page.tsx — Πολιτική Cookies / Cookie Policy
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { setRequestLocale } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === "en" ? "Cookie Policy" : "Πολιτική Cookies",
  };
}

export default async function CookiesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <main style={{ maxWidth: "760px", margin: "0 auto", padding: "4rem 1.5rem" }}>
      <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
        Νομικά
      </p>
      <h1 style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 800, color: "var(--color-text)", margin: "0 0 1rem" }}>
        Πολιτική Cookies
      </h1>
      <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", marginBottom: "2.5rem" }}>
        Τελευταία ενημέρωση: Μάιος 2026
      </p>

      <div
        style={{
          backgroundColor: "rgba(212,160,57,0.08)",
          border:          "1.5px solid rgba(212,160,57,0.3)",
          borderRadius:    "12px",
          padding:         "1.25rem 1.5rem",
          marginBottom:    "2.5rem",
          display:         "flex",
          gap:             "0.75rem",
          alignItems:      "flex-start",
        }}
      >
        <span style={{ fontSize: "1.25rem", flexShrink: 0 }}>🚧</span>
        <p style={{ fontSize: "0.875rem", color: "#92400E", margin: 0, lineHeight: 1.6 }}>
          Η πλήρης Πολιτική Cookies βρίσκεται σε επεξεργασία.
          Για ερωτήσεις:{" "}
          <a href="mailto:info@trustia.gr" style={{ color: "#92400E", fontWeight: 700 }}>
            info@trustia.gr
          </a>
        </p>
      </div>

      <section style={{ lineHeight: 1.8, color: "var(--color-text)", fontSize: "0.9375rem" }}>
        <h2 style={{ fontWeight: 700, fontSize: "1.125rem", margin: "0 0 0.75rem" }}>Τι είναι τα Cookies;</h2>
        <p style={{ marginBottom: "1.5rem" }}>
          Τα cookies είναι μικρά αρχεία κειμένου που αποθηκεύονται στη συσκευή σας
          όταν επισκέπτεστε τον ιστότοπό μας.
        </p>

        <h2 style={{ fontWeight: 700, fontSize: "1.125rem", margin: "0 0 0.75rem" }}>Cookies που Χρησιμοποιούμε</h2>
        <ul style={{ marginBottom: "1.5rem", paddingLeft: "1.25rem" }}>
          <li><strong>Απαραίτητα:</strong> Διατήρηση σύνδεσης (Supabase Auth)</li>
          <li><strong>Προτιμήσεων:</strong> Γλώσσα, ρυθμίσεις εμφάνισης</li>
          <li><strong>Ανάλυσης:</strong> Google Analytics (ανώνυμα δεδομένα)</li>
        </ul>

        <h2 style={{ fontWeight: 700, fontSize: "1.125rem", margin: "0 0 0.75rem" }}>Διαχείριση Cookies</h2>
        <p style={{ marginBottom: "1.5rem" }}>
          Μπορείτε να διαγράψετε ή να απενεργοποιήσετε τα cookies από τις ρυθμίσεις
          του περιηγητή σας. Σημειώστε ότι απενεργοποιώντας τα απαραίτητα cookies
          ενδέχεται να επηρεαστεί η λειτουργία της πλατφόρμας.
        </p>
      </section>

      <div style={{ marginTop: "2.5rem", paddingTop: "1.5rem", borderTop: "1px solid var(--color-border)" }}>
        <Link href="/" style={{ color: "var(--color-primary)", fontWeight: 600, fontSize: "0.9rem", textDecoration: "none" }}>
          ← Αρχική
        </Link>
      </div>
    </main>
  );
}
