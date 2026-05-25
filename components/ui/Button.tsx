// =============================================================
// components/ui/Button.tsx
// =============================================================
// Polymorphic button component for Trustia.gr.
//
// Renders as:
//   <button>  — when no `href` prop is given (default)
//   <Link>    — when an `href` prop is passed (Next.js client navigation)
//
// Variants:  primary | secondary | outline | ghost
// Sizes:     sm | md | lg
// Extras:    loading (spinner), disabled, fullWidth, icon (Lucide)
//
// All hover/focus/disabled visual states live in globals.css under
// the ".ui-btn*" class namespace — keeping this component logic-only.
// =============================================================

"use client";

import React from "react";
import { Link } from "@/i18n/navigation";
import { Loader2 } from "lucide-react";
import type { LucideProps } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────
export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";
export type ButtonSize    = "sm" | "md" | "lg";

/** Icon component type — any Lucide icon (or compatible SVG wrapper) */
export type IconComponent = React.ComponentType<LucideProps>;

// Icon sizes keyed by button size
const ICON_SIZE: Record<ButtonSize, number> = { sm: 14, md: 16, lg: 18 };

// ── Props ──────────────────────────────────────────────────────
// We extend ButtonHTMLAttributes so callers can pass onClick, form,
// type="submit", aria-*, data-* etc. without explicit declarations.
// "size" from HTMLButtonElement is omitted to avoid conflict with our size prop.
export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "size"> {
  variant?:      ButtonVariant;
  size?:         ButtonSize;
  loading?:      boolean;
  fullWidth?:    boolean;
  /** A Lucide icon component (e.g. `icon={Search}`) */
  icon?:         IconComponent;
  /** Whether the icon appears before or after the label. Default "left". */
  iconPosition?: "left" | "right";
  /**
   * When provided the component renders as a Next.js <Link> instead of <button>.
   * Useful for navigation actions that look like buttons.
   */
  href?:         string;
  /** Passed through to the underlying <Link> / <a> when href is set */
  target?:       string;
  rel?:          string;
}

// ── Component ──────────────────────────────────────────────────
export default function Button({
  variant      = "primary",
  size         = "md",
  loading      = false,
  fullWidth    = false,
  icon: Icon,
  iconPosition = "left",
  href,
  target,
  rel,
  disabled,
  children,
  className,
  style,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;

  // ── CSS class list (all visual states handled in globals.css)
  const classes = [
    "ui-btn",
    `ui-btn-${variant}`,
    `ui-btn-${size}`,
    fullWidth   ? "ui-btn-full"     : "",
    isDisabled  ? "ui-btn-disabled" : "",
    className   ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  // ── Icon slot ──
  // When loading, replace any provided icon with an animated spinner.
  const iconEl = loading ? (
    <Loader2 size={ICON_SIZE[size]} className="ui-btn-spinner" aria-hidden="true" />
  ) : Icon ? (
    <Icon size={ICON_SIZE[size]} aria-hidden="true" />
  ) : null;

  // ── Content layout (icon left | children | icon right)
  const content = (
    <>
      {iconPosition === "left"  && iconEl}
      {children}
      {iconPosition === "right" && iconEl}
    </>
  );

  // ── Render as Link when href is provided ──
  if (href) {
    return (
      <Link
        href={href}
        target={target}
        rel={rel ?? (target === "_blank" ? "noopener noreferrer" : undefined)}
        className={classes}
        style={style}
        aria-disabled={isDisabled || undefined}
        tabIndex={isDisabled ? -1 : undefined}
        // Propagate onClick when caller needs it on the link
        onClick={(rest as React.AnchorHTMLAttributes<HTMLAnchorElement>).onClick as React.MouseEventHandler<HTMLAnchorElement>}
      >
        {content}
      </Link>
    );
  }

  // ── Default: render as <button>
  return (
    <button
      type="button"
      disabled={isDisabled}
      className={classes}
      style={style}
      {...rest}
    >
      {content}
    </button>
  );
}
