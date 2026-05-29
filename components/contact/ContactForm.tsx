// =============================================================
// components/contact/ContactForm.tsx
// =============================================================
// Client component — contact form on /contact page.
// Calls sendContactMessage server action on submit.
// =============================================================

"use client";

import React, { useState }          from "react";
import { Send, CheckCircle2, Loader2 } from "lucide-react";
import { sendContactMessage }        from "@/app/actions/send-contact-message";

interface ContactFormProps {
  locale: string;
}

export default function ContactForm({ locale }: ContactFormProps) {
  const isEl = locale !== "en";

  const [name,      setName]      = useState("");
  const [email,     setEmail]     = useState("");
  const [subject,   setSubject]   = useState("");
  const [message,   setMessage]   = useState("");
  const [loading,   setLoading]   = useState(false);
  const [success,   setSuccess]   = useState(false);
  const [error,     setError]     = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await sendContactMessage({ name, email, subject, message, locale });

    if (!result.ok) {
      setError(result.message ?? (isEl ? "Κάτι πήγε στραβά." : "Something went wrong."));
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  const label = (el: string, en: string) => isEl ? el : en;

  if (success) {
    return (
      <div
        style={{
          display:         "flex",
          flexDirection:   "column",
          alignItems:      "center",
          gap:             "1rem",
          padding:         "3rem 2rem",
          backgroundColor: "rgba(39,174,96,0.06)",
          border:          "1.5px solid rgba(39,174,96,0.3)",
          borderRadius:    "16px",
          textAlign:       "center",
        }}
      >
        <CheckCircle2 size={48} style={{ color: "#27AE60" }} />
        <h3 style={{ fontWeight: 800, fontSize: "1.125rem", color: "var(--color-text)", margin: 0 }}>
          {label("Το μήνυμά σας εστάλη!", "Message sent!")}
        </h3>
        <p style={{ fontSize: "0.9rem", color: "var(--color-text-muted)", margin: 0, lineHeight: 1.6 }}>
          {label(
            "Θα σας απαντήσουμε εντός 24 ωρών στο " + email + ".",
            "We'll reply within 24 hours to " + email + ".",
          )}
        </p>
      </div>
    );
  }

  const inputStyle: React.CSSProperties = {
    width:        "100%",
    padding:      "0.625rem 0.875rem",
    border:       "1.5px solid var(--color-border)",
    borderRadius: "8px",
    fontSize:     "0.9rem",
    fontFamily:   "inherit",
    color:        "var(--color-text)",
    outline:      "none",
    boxSizing:    "border-box",
    backgroundColor: "#fff",
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      style={{
        backgroundColor: "#fff",
        border:          "1.5px solid var(--color-border)",
        borderRadius:    "16px",
        padding:         "2rem",
        display:         "flex",
        flexDirection:   "column",
        gap:             "1.125rem",
      }}
    >
      <h2 style={{ fontWeight: 800, fontSize: "1.125rem", color: "var(--color-text)", margin: 0 }}>
        {label("Στείλτε μήνυμα", "Send a message")}
      </h2>

      {/* Error */}
      {error && (
        <p style={{ fontSize: "0.875rem", color: "#E74C3C", margin: 0, padding: "0.625rem 0.875rem", backgroundColor: "rgba(231,76,60,0.07)", borderRadius: "8px", border: "1px solid rgba(231,76,60,0.2)" }}>
          {error}
        </p>
      )}

      {/* Name + Email row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
          <label style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-text)" }}>
            {label("Όνομα", "Name")} *
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder={label("Το όνομά σας", "Your name")}
            required
            disabled={loading}
            style={inputStyle}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
          <label style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-text)" }}>
            Email *
          </label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="email@example.com"
            required
            disabled={loading}
            style={inputStyle}
          />
        </div>
      </div>

      {/* Subject */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
        <label style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-text)" }}>
          {label("Θέμα", "Subject")}
        </label>
        <input
          type="text"
          value={subject}
          onChange={e => setSubject(e.target.value)}
          placeholder={label("π.χ. Ερώτηση για εγγραφή", "e.g. Question about registration")}
          disabled={loading}
          style={inputStyle}
        />
      </div>

      {/* Message */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
        <label style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-text)" }}>
          {label("Μήνυμα", "Message")} *
        </label>
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder={label("Γράψτε το μήνυμά σας εδώ…", "Write your message here…")}
          rows={5}
          required
          disabled={loading}
          maxLength={2000}
          style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
        />
        <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", margin: 0, textAlign: "right" }}>
          {message.length}/2000
        </p>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        style={{
          display:         "inline-flex",
          alignItems:      "center",
          justifyContent:  "center",
          gap:             "0.5rem",
          padding:         "0.875rem",
          backgroundColor: "var(--color-primary)",
          color:           "#fff",
          border:          "none",
          borderRadius:    "10px",
          fontWeight:      700,
          fontSize:        "1rem",
          fontFamily:      "inherit",
          cursor:          loading ? "wait" : "pointer",
          opacity:         loading ? 0.75 : 1,
          transition:      "opacity 0.15s",
        }}
      >
        {loading
          ? <><Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> {label("Αποστολή…", "Sending…")}</>
          : <><Send size={17} /> {label("Αποστολή", "Send message")}</>
        }
      </button>

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </form>
  );
}
