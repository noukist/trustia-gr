import Logo   from "@/components/ui/Logo";
import Button from "@/components/ui/Button";
import { ArrowLeft } from "lucide-react";

export const metadata = { title: "Για Επαγγελματίες | Trustia.gr" };

export default function ProfessionalsPage() {
  return (
    <div
      style={{
        minHeight:      "70vh",
        display:        "flex",
        flexDirection:  "column",
        alignItems:     "center",
        justifyContent: "center",
        textAlign:      "center",
        padding:        "3rem 1.5rem",
        gap:            "1.25rem",
      }}
    >
      <Logo size="lg" linkToHome={false} />
      <h1
        style={{
          fontSize:   "clamp(1.75rem, 5vw, 2.5rem)",
          fontWeight: 800,
          color:      "var(--color-text)",
          margin:     0,
        }}
      >
        Για Επαγγελματίες
      </h1>
      <p
        style={{
          fontSize: "1.0625rem",
          color:    "var(--color-text-muted)",
          margin:   0,
        }}
      >
        Σύντομα κοντά σας 🚀
      </p>
      <Button variant="outline" size="md" href="/">
        <ArrowLeft size={16} aria-hidden="true" /> Αρχική
      </Button>
    </div>
  );
}
