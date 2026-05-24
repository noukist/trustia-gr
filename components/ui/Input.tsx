// =============================================================
// components/ui/Input.tsx
// =============================================================
// Reusable text input field for Trustia.gr forms.
//
// Structure:
//   <div.ui-field>              — outer column wrapper
//     <label>                   — optional label above the field
//     <div.ui-field-wrap>       — relative wrapper for icon positioning
//       [Icon]                  — optional Lucide icon (left-aligned)
//       <input>                 — the native input element
//     <p.ui-field-error-msg>    — error text below (only when error prop set)
//
// All visual states (focus ring, error border, etc.) live in globals.css.
// =============================================================

"use client";

import React, { forwardRef } from "react";
import type { LucideProps } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────
type IconComponent = React.ComponentType<LucideProps>;

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Field label — rendered as <label> above the input */
  label?: string;
  /** Validation error — shows a red border and message below the field */
  error?: string;
  /** Lucide icon displayed on the left side of the input */
  icon?:  IconComponent;
}

// ── Component ─────────────────────────────────────────────────
// forwardRef lets parent components (e.g. form libraries, useRef) target
// the underlying <input> element directly.
const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, icon: Icon, id, className, ...rest },
  ref,
) {
  // When id is not provided, build a stable one from the label for
  // the <label htmlFor> association (accessibility).
  const fieldId = id ?? (label ? `field-${label.toLowerCase().replace(/\s+/g, "-")}` : undefined);

  return (
    <div className="ui-field">
      {/* Label */}
      {label && (
        <label htmlFor={fieldId} className="ui-field-label">
          {label}
        </label>
      )}

      {/* Input wrapper — keeps icon absolutely positioned inside */}
      <div className="ui-field-wrap">
        {/* Left icon */}
        {Icon && (
          <span className="ui-field-icon" aria-hidden="true">
            <Icon size={18} />
          </span>
        )}

        {/* Native input */}
        <input
          ref={ref}
          id={fieldId}
          className={[
            "ui-field-input",
            Icon  ? "ui-field-input-icon"  : "",
            error ? "ui-field-input-error" : "",
            className ?? "",
          ]
            .filter(Boolean)
            .join(" ")}
          aria-invalid={!!error}
          aria-describedby={error && fieldId ? `${fieldId}-error` : undefined}
          {...rest}
        />
      </div>

      {/* Error message */}
      {error && (
        <p
          id={fieldId ? `${fieldId}-error` : undefined}
          className="ui-field-error-msg"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
});

export default Input;
