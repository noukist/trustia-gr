// app/terms/page.tsx — Όροι Χρήσης (placeholder)
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Όροι Χρήσης | Trustia.gr",
};

export default function TermsPage() {
  return (
    <main style={{ maxWidth: "760px", margin: "0 auto", padding: "4rem 1.5rem" }}>
      <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
        Νομικά
      </p>
      <h1 style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 800, color: "var(--color-text)", margin: "0 0 1rem" }}>
        Όροι Χρήσης
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
        <div>
          <p style={{ fontWeight: 700, color: "#92400E", margin: "0 0 0.25rem" }}>
            Σε εξέλιξη
          </p>
          <p style={{ fontSize: "0.875rem", color: "#92400E", margin: 0, lineHeight: 1.6 }}>
            Το πλήρες κείμενο των Όρων Χρήσης βρίσκεται σε νομική επεξεργασία.
            Επικοινωνήστε μαζί μας στο{" "}
            <a href="mailto:info@trustia.gr" style={{ color: "#92400E", fontWeight: 700 }}>
              info@trustia.gr
            </a>{" "}
            για οποιαδήποτε ερώτηση.
          </p>
        </div>
      </div>

      <section style={{ lineHeight: 1.8, color: "var(--color-text)", fontSize: "0.9375rem" }}>
        <h2 style={{ fontWeight: 700, fontSize: "1.125rem", margin: "0 0 0.75rem" }}>1. Αποδοχή Όρων</h2>
        <p style={{ marginBottom: "1.5rem" }}>
          Χρησιμοποιώντας το Trustia.gr αποδέχεστε τους παρόντες Όρους Χρήσης.
          Αν δεν συμφωνείτε, παρακαλούμε μη χρησιμοποιείτε την υπηρεσία.
        </p>

        <h2 style={{ fontWeight: 700, fontSize: "1.125rem", margin: "0 0 0.75rem" }}>2. Περιγραφή Υπηρεσίας</h2>
        <p style={{ marginBottom: "1.5rem" }}>
          Το Trustia.gr είναι πλατφόρμα σύνδεσης επαγγελματιών και πελατών.
          Δεν αναλαμβάνουμε εκτέλεση υπηρεσιών και δεν είμαστε εργοδότης κανενός επαγγελματία.
        </p>

        <h2 style={{ fontWeight: 700, fontSize: "1.125rem", margin: "0 0 0.75rem" }}>3. Λογαριασμός Χρήστη</h2>
        <p style={{ marginBottom: "1.5rem" }}>
          Είστε υπεύθυνοι για την ασφάλεια του κωδικού σας και για κάθε δραστηριότητα στον λογαριασμό σας.
        </p>

        <h2 style={{ fontWeight: 700, fontSize: "1.125rem", margin: "0 0 0.75rem" }}>4. Επικοινωνία</h2>
        <p style={{ marginBottom: "1.5rem" }}>
          Για ερωτήσεις σχετικά με τους Όρους Χρήσης:{" "}
          <a href="mailto:info@trustia.gr" style={{ color: "var(--color-primary)", fontWeight: 600 }}>
            info@trustia.gr
          </a>
        </p>
      </section>

      <div style={{ marginTop: "2.5rem", paddingTop: "1.5rem", borderTop: "1px solid var(--color-border)" }}>
        <Link
          href="/"
          style={{
            color:          "var(--color-primary)",
            fontWeight:     600,
            fontSize:       "0.9rem",
            textDecoration: "none",
          }}
        >
          ← Αρχική
        </Link>
      </div>
    </main>
  );
}
