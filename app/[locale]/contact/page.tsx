// app/[locale]/contact/page.tsx — Επικοινωνία / Contact
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { Mail, MapPin, Clock } from "lucide-react";
import { setRequestLocale } from "next-intl/server";
import ContactForm from "@/components/contact/ContactForm";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === "en" ? "Contact" : "Επικοινωνία",
    description: locale === "en"
      ? "Contact the Trustia.gr team"
      : "Επικοινωνήστε με την ομάδα του Trustia.gr",
  };
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <main style={{ maxWidth: "760px", margin: "0 auto", padding: "4rem 1.5rem" }}>
      <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
        Υποστήριξη
      </p>
      <h1 style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 800, color: "var(--color-text)", margin: "0 0 0.625rem" }}>
        Επικοινωνία
      </h1>
      <p style={{ fontSize: "1rem", color: "var(--color-text-muted)", margin: "0 0 3rem", lineHeight: 1.6 }}>
        Η ομάδα μας είναι εδώ για να σας βοηθήσει. Στείλτε μας email και θα απαντήσουμε εντός 24 ωρών.
      </p>

      {/* Contact cards */}
      <div
        style={{
          display:             "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap:                 "1.25rem",
          marginBottom:        "3rem",
        }}
      >
        {/* Email */}
        <div
          style={{
            backgroundColor: "#fff",
            border:          "1.5px solid var(--color-border)",
            borderRadius:    "14px",
            padding:         "1.5rem",
            display:         "flex",
            flexDirection:   "column",
            gap:             "0.75rem",
          }}
        >
          <div
            style={{
              width:           "44px",
              height:          "44px",
              borderRadius:    "12px",
              backgroundColor: "var(--color-primary-bg)",
              display:         "flex",
              alignItems:      "center",
              justifyContent:  "center",
            }}
          >
            <Mail size={20} style={{ color: "var(--color-primary)" }} />
          </div>
          <div>
            <p style={{ fontWeight: 700, color: "var(--color-text)", margin: "0 0 0.25rem", fontSize: "0.9375rem" }}>
              Email
            </p>
            <a
              href="mailto:info@trustia.gr"
              style={{ color: "var(--color-primary)", fontWeight: 600, fontSize: "0.9rem", textDecoration: "none" }}
            >
              info@trustia.gr
            </a>
          </div>
        </div>

        {/* Support email */}
        <div
          style={{
            backgroundColor: "#fff",
            border:          "1.5px solid var(--color-border)",
            borderRadius:    "14px",
            padding:         "1.5rem",
            display:         "flex",
            flexDirection:   "column",
            gap:             "0.75rem",
          }}
        >
          <div
            style={{
              width:           "44px",
              height:          "44px",
              borderRadius:    "12px",
              backgroundColor: "var(--color-primary-bg)",
              display:         "flex",
              alignItems:      "center",
              justifyContent:  "center",
            }}
          >
            <Mail size={20} style={{ color: "var(--color-primary)" }} />
          </div>
          <div>
            <p style={{ fontWeight: 700, color: "var(--color-text)", margin: "0 0 0.25rem", fontSize: "0.9375rem" }}>
              Υποστήριξη
            </p>
            <a
              href="mailto:support@trustia.gr"
              style={{ color: "var(--color-primary)", fontWeight: 600, fontSize: "0.9rem", textDecoration: "none" }}
            >
              support@trustia.gr
            </a>
          </div>
        </div>

        {/* Location */}
        <div
          style={{
            backgroundColor: "#fff",
            border:          "1.5px solid var(--color-border)",
            borderRadius:    "14px",
            padding:         "1.5rem",
            display:         "flex",
            flexDirection:   "column",
            gap:             "0.75rem",
          }}
        >
          <div
            style={{
              width:           "44px",
              height:          "44px",
              borderRadius:    "12px",
              backgroundColor: "var(--color-primary-bg)",
              display:         "flex",
              alignItems:      "center",
              justifyContent:  "center",
            }}
          >
            <MapPin size={20} style={{ color: "var(--color-primary)" }} />
          </div>
          <div>
            <p style={{ fontWeight: 700, color: "var(--color-text)", margin: "0 0 0.25rem", fontSize: "0.9375rem" }}>
              Εδρα
            </p>
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", margin: 0 }}>
              Θεσσαλονίκη, Ελλάδα
            </p>
          </div>
        </div>

        {/* Hours */}
        <div
          style={{
            backgroundColor: "#fff",
            border:          "1.5px solid var(--color-border)",
            borderRadius:    "14px",
            padding:         "1.5rem",
            display:         "flex",
            flexDirection:   "column",
            gap:             "0.75rem",
          }}
        >
          <div
            style={{
              width:           "44px",
              height:          "44px",
              borderRadius:    "12px",
              backgroundColor: "var(--color-primary-bg)",
              display:         "flex",
              alignItems:      "center",
              justifyContent:  "center",
            }}
          >
            <Clock size={20} style={{ color: "var(--color-primary)" }} />
          </div>
          <div>
            <p style={{ fontWeight: 700, color: "var(--color-text)", margin: "0 0 0.25rem", fontSize: "0.9375rem" }}>
              Απόκριση
            </p>
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", margin: 0 }}>
              Εντός 24 ωρών
            </p>
          </div>
        </div>
      </div>

      {/* Contact form */}
      <ContactForm locale={locale} />

      <div style={{ paddingTop: "1.5rem", borderTop: "1px solid var(--color-border)", marginTop: "1.5rem" }}>
        <Link href="/" style={{ color: "var(--color-primary)", fontWeight: 600, fontSize: "0.9rem", textDecoration: "none" }}>
          ← Αρχική
        </Link>
      </div>
    </main>
  );
}
