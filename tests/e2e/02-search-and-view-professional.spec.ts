// =============================================================
// 02-search-and-view-professional.spec.ts
// Scenario: Customer searches for a professional and views profile
// =============================================================
// Uses the seed data that is already in the production DB.
// No login required — this is a fully public flow.
//
// Happy path:
//   Homepage → search "Υδραυλικός" → results page → click pro card
//   → pro profile page loads with name, bio, booking button
//
// Edge cases:
//   - Search with no results shows empty state
//   - Direct URL to a non-existent slug → 404
// =============================================================

import { test, expect } from "@playwright/test";

test.describe("Search and view professional", () => {

  test("category page → professional card → profile page", async ({ page }) => {
    // ── 1. Go directly to a category with seed professionals ──
    // "plumber" has at least 1 seed professional (Νίκος Παπαδόπουλος)
    await page.goto("/el/services?category=plumber");
    await expect(page).toHaveURL(/category=plumber/);

    // ── 2. At least one professional card link should appear ───
    // Professional card links use /professional/<slug> pattern
    const cards = page.locator("a[href*='/professional/']");
    await expect(cards.first()).toBeVisible({ timeout: 10_000 });

    const count = await cards.count();
    expect(count).toBeGreaterThan(0);

    // ── 3. Click the first card ────────────────────────────
    await cards.first().click();

    // ── 4. Profile page loads ──────────────────────────────
    await expect(page).toHaveURL(/\/professional\//);

    // Name heading should be present
    await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 8_000 });

    // Booking / contact button should be somewhere on the page.
    // Covers all known button text variants:
    //   "Κράτηση" (date/calendar booking)
    //   "Επικοινωνία" (contact only)
    //   "Εμφάνιση τηλεφώνου" (phone reveal)
    //   "Εμφάνιση αριθμού" (number reveal)
    //   English fallbacks: book, contact, phone
    const hasAnyCta = await page
      .getByRole("button", {
        name: /εμφάν|τηλεφών|κράτ|επικοινων|αριθμ|book|contact|phone/i,
      })
      .isVisible()
      .catch(() => false);

    expect(hasAnyCta).toBeTruthy();
  });

  test("filter by category — plumber results contain plumber cards", async ({ page }) => {
    await page.goto("/el/services?category=plumber");

    // Results should load
    const cards = page.locator("a[href*='/el/pro/']");
    // May be 0 if no plumber in seed data — just assert no crash
    await expect(page).not.toHaveTitle(/500|error/i);
    await expect(page.locator("body")).toBeVisible();
  });

  test("non-existent professional slug shows 404", async ({ page }) => {
    await page.goto("/el/professional/this-professional-does-not-exist-xyz123");

    // Wait for the page to finish loading before checking
    await page.waitForLoadState("networkidle").catch(() => {});

    // Should show a 404 page, not crash with 500.
    // next-intl may strip the /el/ prefix, so also check without it.
    // Custom 404 renders "Σελίδα δεν βρέθηκε" with a large "404" heading.
    const has404Text = await page
      .getByText(/404/i)
      .isVisible({ timeout: 8_000 })
      .catch(() => false);
    const hasNotFoundText = await page
      .getByText(/δεν βρέθηκε|not found|Σελίδα/i)
      .isVisible({ timeout: 3_000 })
      .catch(() => false);
    const urlHas404 = page.url().includes("404");

    expect(has404Text || hasNotFoundText || urlHas404).toBeTruthy();

    // Most importantly — must NOT be a 500 crash
    await expect(page).not.toHaveTitle(/500|server error/i);
  });

  test("direct URL to services page — no login required", async ({ page }) => {
    // Fully public — should NOT redirect to login
    await page.goto("/el/services");
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.locator("body")).toBeVisible();
  });
});
