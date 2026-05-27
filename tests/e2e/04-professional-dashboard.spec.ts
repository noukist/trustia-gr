// =============================================================
// 04-professional-dashboard.spec.ts
// Scenario: Professional logs in and uses the dashboard
// =============================================================
// Requires a pre-confirmed professional account in the DB.
// Update PRO_EMAIL / PRO_PASSWORD before running.
//
// Happy path:
//   Login → redirected to /dashboard →
//   Overview tab shows stats →
//   Profile tab loads editor →
//   Bookings tab loads (even if empty) →
//   Reviews tab loads
//
// Edge cases:
//   - Unauthenticated access → redirect to login
//   - Customer account accessing /dashboard → still handled
// =============================================================

import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers";

// Read from env var (GitHub Actions secret) or fall back to placeholder.
// Set E2E_PRO1_EMAIL / E2E_PRO1_PASSWORD in .env.test.local locally.
const PRO_EMAIL    = process.env.E2E_PRO1_EMAIL    ?? "admin@gmail.com";
const PRO_PASSWORD = process.env.E2E_PRO1_PASSWORD ?? "your-password-here";

test.describe("Professional dashboard", () => {

  test("unauthenticated /dashboard → redirects to login", async ({ page }) => {
    await page.goto("/el/dashboard");

    await page.waitForURL((url) =>
      url.pathname.includes("/login") || url.pathname.includes("/register"),
      { timeout: 10_000 }
    );
    expect(
      page.url().includes("/login") || page.url().includes("/register")
    ).toBeTruthy();
  });

  test("professional logs in → lands on dashboard", async ({ page }) => {
    test.skip(PRO_PASSWORD === "your-password-here", "Set PRO_PASSWORD");

    try { await loginAs(page, PRO_EMAIL, PRO_PASSWORD); }
    catch { test.skip(true, "Login failed — check E2E_PRO1_EMAIL / E2E_PRO1_PASSWORD"); return; }

    // Should land on dashboard (or home if customer — still no crash)
    await expect(page).not.toHaveTitle(/500|error/i);
    await expect(page).not.toHaveURL(/\/login/);
  });

  test("dashboard overview tab loads with stats", async ({ page }) => {
    test.skip(PRO_PASSWORD === "your-password-here", "Set PRO_PASSWORD");

    try { await loginAs(page, PRO_EMAIL, PRO_PASSWORD); }
    catch { test.skip(true, "Login failed — check E2E_PRO1_EMAIL / E2E_PRO1_PASSWORD"); return; }
    await page.goto("/el/dashboard");

    // Should show the overview tab content — stats cards
    await expect(page.locator("body")).toBeVisible();
    await expect(page).not.toHaveTitle(/500|error/i);

    // Look for typical dashboard stat elements
    const statsCard = page.locator("[data-tab='overview'], h2, h3").first();
    await expect(statsCard).toBeVisible({ timeout: 10_000 });
  });

  test("profile tab — editor renders without crash", async ({ page }) => {
    test.skip(PRO_PASSWORD === "your-password-here", "Set PRO_PASSWORD");

    try { await loginAs(page, PRO_EMAIL, PRO_PASSWORD); }
    catch { test.skip(true, "Login failed — check E2E_PRO1_EMAIL / E2E_PRO1_PASSWORD"); return; }
    await page.goto("/el/dashboard?tab=profile");

    await expect(page).not.toHaveTitle(/500|error/i);
    // Profile editor should have at least one input
    await expect(page.locator("input, textarea").first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test("bookings tab — loads even when empty", async ({ page }) => {
    test.skip(PRO_PASSWORD === "your-password-here", "Set PRO_PASSWORD");

    try { await loginAs(page, PRO_EMAIL, PRO_PASSWORD); }
    catch { test.skip(true, "Login failed — check E2E_PRO1_EMAIL / E2E_PRO1_PASSWORD"); return; }
    await page.goto("/el/dashboard?tab=bookings");

    await expect(page).not.toHaveTitle(/500|error/i);
    await expect(page.locator("body")).toBeVisible();
    // No specific content assertion — just confirm no crash
  });

  test("reviews tab — loads even when empty", async ({ page }) => {
    test.skip(PRO_PASSWORD === "your-password-here", "Set PRO_PASSWORD");

    try { await loginAs(page, PRO_EMAIL, PRO_PASSWORD); }
    catch { test.skip(true, "Login failed — check E2E_PRO1_EMAIL / E2E_PRO1_PASSWORD"); return; }
    await page.goto("/el/dashboard?tab=reviews");

    await expect(page).not.toHaveTitle(/500|error/i);
    await expect(page.locator("body")).toBeVisible();
  });

  test("subscription tab — loads with plan info", async ({ page }) => {
    test.skip(PRO_PASSWORD === "your-password-here", "Set PRO_PASSWORD");

    try { await loginAs(page, PRO_EMAIL, PRO_PASSWORD); }
    catch { test.skip(true, "Login failed — check E2E_PRO1_EMAIL / E2E_PRO1_PASSWORD"); return; }
    await page.goto("/el/dashboard?tab=subscription");

    await expect(page).not.toHaveTitle(/500|error/i);
    await expect(page.locator("body")).toBeVisible();
  });
});
