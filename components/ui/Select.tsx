// =============================================================
// components/ui/Select.tsx
// =============================================================
// Reusable <select> field for Trustia.gr forms.
//
// Mirrors the Input API — same label / error / icon pattern.
// The custom chevron arrow is injected via CSS background-image in
// globals.css (.ui-field-select) to replace the browser default.
//
// Props:
//   options  — flat array of { value, label, group? } objects
//   grouped  — when true, options are rendered inside <optgroup> elements
//              grouped by the `group` property
//
// Structure:
//   <div.ui-field>
//     <label>
//     <div.ui-field-wrap>
//       [Icon]
//       <select>
//         <option> / <optgroup> + <option>
//     <p.ui-field-error-msg>
// =============================================================

"use client";

import React, { forwardRef } from "react";
import type { LucideProps } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────
type IconComponent = React.ComponentType<LucideProps>;

export interface SelectOption {
  value: string;
  label: string;
  /** When grouped=true, options sharing the same group string are collected
   *  under an <optgroup label={group}> */
  group?: string;
}

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  /** Field label rendered above the select */
  label?:   string;
  /** Validation error — shows red border + error message */
  error?:   string;
  /** Lucide icon displayed on the left side of the select */
  icon?:    IconComponent;
  /** The list of options (or option groups) to render */
  options:  SelectOption[];
  /**
   * When true, options are rendered as <optgroup> elements grouped by
   * the `group` property of each option. Options without a group value
   * are rendered at the top without a grouping wrapper.
   */
  grouped?: boolean;
}

// ── Helpers ───────────────────────────────────────────────────
/** Group an options array by the `group` key, preserving insertion order */
function groupOptions(options: SelectOption[]) {
  const ungrouped: SelectOption[] = [];
  const groups    = new Map<string, SelectOption[]>();

  for (const opt of options) {
    if (!opt.group) {
      ungrouped.push(opt);
    } else {
      const bucket = groups.get(opt.group) ?? [];
      bucket.push(opt);
      groups.set(opt.group, bucket);
    }
  }

  return { ungrouped, groups };
}

// ── Component ─────────────────────────────────────────────────
const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, icon: Icon, options, grouped = false, id, className, ...rest },
  ref,
) {
  const fieldId = id ?? (label ? `field-${label.toLowerCase().replace(/\s+/g, "-")}` : undefined);

  // ── Render options ──────────────────────────────────────────
  let optionNodes: React.ReactNode;

  if (grouped) {
    const { ungrouped, groups } = groupOptions(options);

    optionNodes = (
      <>
        {/* Ungrouped options rendered first */}
        {ungrouped.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}

        {/* Grouped options */}
        {Array.from(groups.entries()).map(([groupLabel, groupOpts]) => (
          <optgroup key={groupLabel} label={groupLabel}>
            {groupOpts.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </optgroup>
        ))}
      </>
    );
  } else {
    optionNodes = options.map((opt) => (
      <option key={opt.value} value={opt.value}>
        {opt.label}
      </option>
    ));
  }

  return (
    <div className="ui-field">
      {/* Label */}
      {label && (
        <label htmlFor={fieldId} className="ui-field-label">
          {label}
        </label>
      )}

      {/* Select wrapper */}
      <div className="ui-field-wrap">
        {/* Left icon */}
        {Icon && (
          <span className="ui-field-icon" aria-hidden="true">
            <Icon size={18} />
          </span>
        )}

        {/* Native select */}
        <select
          ref={ref}
          id={fieldId}
          className={[
            "ui-field-input",
            "ui-field-select",
            Icon  ? "ui-field-input-icon"  : "",
            error ? "ui-field-input-error" : "",
            className ?? "",
          ]
            .filter(Boolean)
            .join(" ")}
          aria-invalid={!!error}
          aria-describedby={error && fieldId ? `${fieldId}-error` : undefined}
          {...rest}
        >
          {optionNodes}
        </select>
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

export default Select;
