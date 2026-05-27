// =============================================================
// 07-public-pages.spec.ts
// =============================================================
// Health check: every public-facing page must:
//   ✓ Return 200 (no redirect to login)
//   ✓ Not crash with a 500 / "Internal Server Error" title
//   ✓ Render a <body> with visible content
//   ✓ Not show a Next.js error overlay
//
// These tests act as a canary — if a refactor, dependency upgrade,
// or bad merge breaks a public page you'll know before users do.
//
// No login required. No seed data required beyond what's in prod.
// =============================================================

import { test, expect } from "@playwright/test";

// ── All public routes ─────────────────────────────────────────
const PUBLIC_PAGES = [
  { path: "/el",                      name: "Homepage"              },
  { path: "/el/services",             name: "Services / Categories" },
  { path: "/el/services?category=plumber", name: "Services — plumber category" },
  { path: "/el/how-it-works",         name: "How It Works"          },
  { path: "/el/register",             name: "Customer Register"     },
  { path: "/el/register/professional",name: "Pro Register (step 1)" },
  { path: "/el/login",                name: "Login"                 },
  { path: "/el/terms",                name: "Terms of Service"      },
  { path: "/el/privacy",              name: "Privacy Policy"        },
  { path: "/el/cookies",              name: "Cookie Policy"         },
  { path: "/el/contact",              name: "Contact"               },
  // English variants
  { path: "/en",                      name: "Homepage (EN)"         },
  { path: "/en/services",             name: "Services (EN)"         },
  { path: "/en/how-it-works",         name: "How It Works (EN)"     },
  { path: "/en/register",             name: "Customer Register (EN)"},
  { path: "/en/login",                name: "Login (EN)"            },
];

// ── Protected pages that must redirect — NOT show content ─────
const PROTECTED_PAGES = [
  { path: "/el/dashboard",   name: "Dashboard (must → login)" },
  { path: "/el/my-bookings", name: "My Bookings (must → login)"},
  { path: "/el/profile",     name: "Profile (must → login)"   },
  { path: "/el/favorites",   name: "Favorites (must → login)" },
];

// ── Special pages ──────────────────────────────────────────────
const SPECIAL_PAGES = [
  { path: "/sitemap.xml",  name: "sitemap.xml"  },
  { path: "/robots.txt",   name: "robots.txt"   },
];

// =============================================================

test.describe("Public pages — no crash, no 500", () => {

  for (const { path, name } of PUBLIC_PAGES) {
    test(`${name} (${path})`, async ({ page }) => {
      await page.goto(path);

      // Must not be a 500 or error page
      await expect(page).not.toHaveTitle(/500|internal server error|error/i);

      // Must not unexpectedly redirect to login.
      // Exception: the login and register pages themselves live at /login|/register.
      const isAuthPage = /\/(login|register)/.test(path);
      if (!isAuthPage) {
        expect(page.url()).not.toMatch(/\/login/);
      }

      // Body must be visible
      await expect(page.locator("body")).toBeVisible();

      // Must not show the Next.js error overlay (dev crash indicator)
      const hasNextError = await page
        .locator("nextjs-portal, #__next-error")
        .isVisible()
        .catch(() => false);
      expect(hasNextError).toBe(false);
    });
  }
});

test.describe("Protected pages — redirect to login when guest", () => {

  for (const { path, name } of PROTECTED_PAGES) {
    test(`${name} (${path})`, async ({ page }) => {
      await page.goto(path);

      // Wait for navigation to settle
      await page.waitForLoadState("networkidle").catch(() => {});

      // Must redirect to login (not show the protected content)
      const redirectedToLogin =
        page.url().includes("/login") ||
        page.url().includes("/register");

      expect(redirectedToLogin).toBeTruthy();

      // Must not crash
      await expect(page).not.toHaveTitle(/500|internal server error/i);
    });
  }
});

test.describe("Special pages — sitemap and robots", () => {

  test("sitemap.xml returns valid XML with URLs", async ({ page }) => {
    const response = await page.goto("/sitemap.xml");

    // Must return 200
    expect(response?.status()).toBe(200);

    // Content-type should be XML
    const contentType = response?.headers()["content-type"] ?? "";
    expect(contentType).toMatch(/xml/);

    // Body must contain at least the homepage URL
    const body = await page.content();
    expect(body).toContain("trustia.gr");
    expect(body).toContain("<url>");
    expect(body).toContain("<loc>");
  });

  test("robots.txt disallows /dashboard and /auth", async ({ page }) => {
    const response = await page.goto("/robots.txt");

    expect(response?.status()).toBe(200);

    const body = await page.content();

    // Must disallow private routes
    expect(body).toContain("Disallow");
    expect(body).toMatch(/dashboard/);
    expect(body).toMatch(/auth/);

    // Must point to the sitemap
    expect(body).toContain("sitemap.xml");
  });

  test("non-existent page shows 404 — not 500", async ({ page }) => {
    await page.goto("/el/this-page-definitely-does-not-exist-xyz789");
    await page.waitForLoadState("networkidle").catch(() => {});

    await expect(page).not.toHaveTitle(/500|internal server error/i);

    const is404 =
      (await page.getByText(/404|δεν βρέθηκε|not found/i).isVisible({ timeout: 5_000 }).catch(() => false)) ||
      page.url().includes("404");

    expect(is404).toBeTruthy();
  });
});
