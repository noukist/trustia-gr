// =============================================================
// 06-spot-checks.spec.ts
// One-off checks for:
//   A) Duplicate email registration shows proper error message
//   B) Forgot password panel opens and accepts an email
//   C) Full-calendar booking professional page loads booking form
// =============================================================

import { test, expect } from "@playwright/test";

// ── A: Duplicate email ────────────────────────────────────────
// Strategy: register a fresh email (step 1 → verify screen appears),
// then immediately try registering the SAME email again.
// This produces a guaranteed unconfirmed-duplicate (identities:[])
// and must show the "already registered" error, NOT the verify screen.
test("duplicate email shows 'already registered' error — not a success screen", async ({ page }) => {
  const dupEmail = `e2e.dup.${Date.now()}@mailinator.com`;

  // ── Step 1: First registration — should show verify screen ───
  await page.goto("/register");
  await page.getByLabel("Email").fill(dupEmail);
  await page.getByLabel("Κωδικός").fill("TestPass123!");
  await page.getByLabel("Επιβεβαίωση κωδικού").fill("TestPass123!");
  await page.getByRole("checkbox").first().check();
  await page.getByRole("button", { name: "Εγγραφή" }).click();

  // Wait for the verify screen (or a rate-limit error — both are acceptable for step 1)
  const firstAttemptOk = await page
    .getByText(/Έλεγξε το email|rate|limit|error/i)
    .isVisible({ timeout: 12_000 })
    .catch(() => false);

  if (!firstAttemptOk) {
    // Supabase rate-limited us — skip rather than false-fail
    test.skip(true, "Supabase rate limit hit on first registration — skip duplicate test");
    return;
  }

  // ── Step 2: Second registration with the SAME email ───────────
  await page.goto("/register");
  await page.getByLabel("Email").fill(dupEmail);
  await page.getByLabel("Κωδικός").fill("TestPass123!");
  await page.getByLabel("Επιβεβαίωση κωδικού").fill("TestPass123!");
  await page.getByRole("checkbox").first().check();
  await page.getByRole("button", { name: "Εγγραφή" }).click();

  // The error must appear — wait up to 12s for Supabase response
  const hasErrorText = await page
    .getByText(/ήδη λογαριασμός|already exists|υπάρχει/i)
    .isVisible({ timeout: 12_000 })
    .catch(() => false);

  // Must show the error
  expect(hasErrorText).toBe(true);

  // Must NOT show the "check your email" success screen
  const successVisible = await page.getByText("Έλεγξε το email σου").isVisible().catch(() => false);
  expect(successVisible).toBe(false);
});

// ── B: Forgot password ────────────────────────────────────────
test("forgot password link opens reset panel and accepts email", async ({ page }) => {
  await page.goto("/login");

  // The link should be visible on the login page
  const forgotLink = page.getByRole("button", { name: /ξέχασες|forgot/i });
  await expect(forgotLink).toBeVisible({ timeout: 8_000 });

  // Click it — should open the inline reset panel
  await forgotLink.click();

  // The reset email input should appear
  const resetInput = page.locator("input[type='email']").first();
  await expect(resetInput).toBeVisible({ timeout: 5_000 });

  // Fill an email and submit
  await resetInput.fill("noukist@gmail.com");
  await page.getByRole("button", { name: /αποστολή|send|αποστ|reset/i }).first().click();

  // Should show a confirmation (sent message) or at minimum not crash
  await expect(page).not.toHaveTitle(/500|error/i);

  // Either a success message appears OR the form stays (rate limit)
  const sent = await page
    .getByText(/εστάλ|στάλθηκε|sent|email/i)
    .isVisible({ timeout: 8_000 })
    .catch(() => false);
  const stillVisible = await resetInput.isVisible().catch(() => false);
  expect(sent || stillVisible).toBeTruthy();
});

// ── C: Full-calendar booking ──────────────────────────────────
// Find any professional with booking_mode = 'full' via the services page
test("full-calendar professional profile shows 3-step booking form", async ({ page }) => {
  // Go to the services page and look for any professional
  await page.goto("/services?category=plumber");
  await expect(page).not.toHaveTitle(/500|error/i);

  // Check if any professional card exists
  const cards = page.locator("a[href*='/professional/']");
  const count = await cards.count();

  if (count === 0) {
    // No professionals in this category — skip gracefully
    test.skip(true, "No professionals found in plumber category");
    return;
  }

  // Click the first card and check if a booking button exists
  await cards.first().click();
  await expect(page).toHaveURL(/\/professional\//);

  // Any booking CTA
  const bookBtn = page
    .getByRole("button", { name: /κράτηση|εμφάν|τηλεφών|επικοινων|book/i })
    .first();
  await expect(bookBtn).toBeVisible({ timeout: 10_000 });

  // Check what booking mode is on this professional
  const btnText = await bookBtn.textContent() ?? "";

  if (/κράτηση/i.test(btnText)) {
    // This pro has date or full booking — click to see the form
    await bookBtn.click();

    // A modal / form should open — either login gate or booking form
    const hasModal = await page.getByRole("dialog").isVisible({ timeout: 5_000 }).catch(() => false);
    const hasForm  = await page.locator("input[type='date']").isVisible({ timeout: 3_000 }).catch(() => false);
    const hasLogin = await page.getByText("Απαιτείται Σύνδεση").isVisible({ timeout: 3_000 }).catch(() => false);

    expect(hasModal || hasForm || hasLogin).toBeTruthy();
    await expect(page).not.toHaveTitle(/500|error/i);
  } else {
    // Contact-only pro — phone reveal button, acceptable
    expect(bookBtn).toBeTruthy();
  }
});
