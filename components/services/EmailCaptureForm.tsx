// =============================================================
// components/services/EmailCaptureForm.tsx
// =============================================================
// Client Component — handles the email notification sign-up form
// shown in the ZeroResults state on the services page.
//
// WHY THIS IS A SEPARATE CLIENT COMPONENT
//   app/services/page.tsx is an async Server Component.
//   React Server Components cannot contain event handlers like
//   onSubmit. By extracting this interactive piece into its own
//   "use client" module, the parent page stays a pure Server
//   Component while the form gets full client-side interactivity.
//
// DATA FLOW
//   Calls saveNotificationRequest (Server Action) which INSERTs
//   into the notification_requests table.  RLS allows anon +
//   authenticated users to insert; see migration 018.
// =============================================================

"use client";

import React, { useState }                   from "react";
import { Mail, Check, Loader2 }              from "lucide-react";
import { saveNotificationRequest }           from "@/app/actions/save-notification-request";

interface EmailCaptureFormProps {
  /** Greek name of the category the user searched for (display only) */
  categoryName: string;
  /** Category slug / ID stored in the DB (e.g. "plumber") */
  categoryId:   string;
  /** Location display name (empty string if no location was set) */
  location:     string;
}

export default function EmailCaptureForm({
  categoryName,
  categoryId,
  location,
}: EmailCaptureFormProps) {
  const [email,     setEmail]     = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    // Client-side format guard before hitting the server
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Παρακαλώ εισάγετε έγκυρο email.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const result = await saveNotificationRequest({
        email:      email.trim(),
        categoryId,
        location:   location ?? "",
      });

      if (!result.ok) {
        setError(result.message ?? "Κάτι πήγε στραβά. Δοκιμάστε ξανά.");
        return;
      }

      setSubmitted(true);
    } catch {
      setError("Κάτι πήγε στραβά. Δοκιμάστε ξανά.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div
        style={{
          display:         "flex",
          alignItems:      "center",
          justifyContent:  "center",
          gap:             "0.5rem",
          padding:         "0.75rem 1rem",
          backgroundColor: "rgba(39,174,96,0.1)",
          border:          "1.5px solid rgba(39,174,96,0.3)",
          borderRadius:    "10px",
          color:           "#166534",
          fontWeight:      600,
          fontSize:        "0.875rem",
        }}
      >
        <Check size={16} />
        Θα σας ειδοποιήσουμε μόλις εγγραφεί {categoryName}
        {location ? ` στο ${location}` : ""}!
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
    >
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <input
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError(""); }}
          placeholder="email@example.com"
          aria-label="Το email σας"
          required
          disabled={loading}
          style={{
            flex:         "1 1 180px",
            padding:      "0.5rem 0.875rem",
            border:       `1.5px solid ${error ? "#E74C3C" : "var(--color-border)"}`,
            borderRadius: "8px",
            fontSize:     "0.875rem",
            fontFamily:   "inherit",
            outline:      "none",
            color:        "var(--color-text)",
          }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            display:         "inline-flex",
            alignItems:      "center",
            gap:             "0.375rem",
            padding:         "0.5rem 1rem",
            backgroundColor: "var(--color-primary)",
            color:           "#fff",
            border:          "none",
            borderRadius:    "8px",
            fontSize:        "0.875rem",
            fontWeight:      600,
            fontFamily:      "inherit",
            cursor:          loading ? "wait" : "pointer",
            whiteSpace:      "nowrap",
          }}
        >
          {loading ? (
            <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
          ) : (
            <Mail size={14} aria-hidden="true" />
          )}
          Ειδοποίηση
        </button>
      </div>

      {error && (
        <p style={{ fontSize: "0.775rem", color: "#E74C3C", margin: 0 }}>{error}</p>
      )}

      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </form>
  );
}
