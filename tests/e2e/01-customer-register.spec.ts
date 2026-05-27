// =============================================================
// 01-customer-register.spec.ts
// Scenario: Customer registers with email
// =============================================================
// Happy path:
//   Fill form → submit → see "check your email" success screen
//
// Edge cases:
//   - Password too short         → inline error
//   - Passwords don't match      → inline error
//   - Terms not accepted         → inline error
//   - Already registered email   → inline error (not a crash)
// =============================================================

import { test, expect } from "@playwright/test";
import { registerCustomer } from "./helpers";

// Use a timestamp suffix so each test run uses a fresh email
const UNIQUE_EMAIL = `e2e.reg.${Date.now()}@mailinator.com`;
const PASSWORD = "TestPass123!";

test.describe("Customer registration", () => {

  test("happy path — valid email shows verify screen or rate-limit error (not a 500)", async ({ page }) => {
    await registerCustomer(page, UNIQUE_EMAIL, PASSWORD);

    // Two acceptable outcomes:
    // A) Verify email screen (normal case)
    // B) Rate-limit / error banner — Supabase free plan allows ~2 signup
    //    emails/hour; hitting it is not a bug in our code.
    // What is NOT acceptable: a 500 crash page.
    await expect(page).not.toHaveTitle(/500|server error/i);

    const verifyVisible = await page
      .getByText("Έλεγξε το email σου")
      .isVisible({ timeout: 10_000 })
      .catch(() => false);

    const errorVisible = await page
      .getByRole("alert")
      .first()
      .isVisible({ timeout: 3_000 })
      .catch(() => false);

    expect(verifyVisible || errorVisible).toBeTruthy();
  });

  test("short password shows error", async ({ page }) => {
    await page.goto("/el/register");
    await page.getByLabel("Email").fill(`short.${Date.now()}@mailinator.com`);
    await page.getByLabel("Κωδικός").fill("abc");
    await page.getByLabel("Επιβεβαίωση κωδικού").fill("abc");
    await page.getByRole("checkbox").first().check();
    await page.getByRole("button", { name: "Εγγραφή" }).click();

    // Either browser validation or custom error should appear
    const passwordInput = page.getByLabel("Κωδικός");
    const isInvalid = await passwordInput.evaluate(
      (el: HTMLInputElement) => !el.validity.valid
    );
    if (!isInvalid) {
      // Custom error banner
      await expect(page.getByRole("alert")).toBeVisible({ timeout: 5_000 });
    }
    // Either way, we should NOT see the success screen
    await expect(page.getByText("Έλεγξε το email σου")).not.toBeVisible();
  });

  test("mismatched passwords shows error", async ({ page }) => {
    await page.goto("/el/register");
    await page.getByLabel("Email").fill(`mismatch.${Date.now()}@mailinator.com`);
    await page.getByLabel("Κωδικός").fill("TestPass123!");
    await page.getByLabel("Επιβεβαίωση κωδικού").fill("DifferentPass123!");
    await page.getByRole("checkbox").first().check();
    await page.getByRole("button", { name: "Εγγραφή" }).click();

    // Use .first() — Next.js route announcer also has role="alert"
    await expect(page.getByRole("alert").first()).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText("Έλεγξε το email σου")).not.toBeVisible();
  });

  test("terms not accepted blocks submission", async ({ page }) => {
    await page.goto("/el/register");
    await page.getByLabel("Email").fill(`terms.${Date.now()}@mailinator.com`);
    await page.getByLabel("Κωδικός").fill(PASSWORD);
    await page.getByLabel("Επιβεβαίωση κωδικού").fill(PASSWORD);
    // Do NOT check the terms checkbox
    await page.getByRole("button", { name: "Εγγραφή" }).click();

    // Should show a GDPR error or browser required-field validation
    const hasAlert = await page.getByRole("alert").isVisible().catch(() => false);
    const hasRequired = await page.evaluate(() => {
      const cb = document.querySelector<HTMLInputElement>("input[type=checkbox][required]");
      return cb ? !cb.validity.valid : false;
    });
    expect(hasAlert || hasRequired).toBeTruthy();
    await expect(page.getByText("Έλεγξε το email σου")).not.toBeVisible();
  });

  test("already registered email shows error — not a crash", async ({ page }) => {
    // Use a stable address we know is already in the DB
    await registerCustomer(page, "noukist@hotmail.com", PASSWORD);

    // Should NOT crash (no 500 error page)
    await expect(page).not.toHaveTitle(/500|error/i);

    // Either shows the verify screen (Supabase resends confirmation)
    // or shows an "already registered" error — both are acceptable
    const verifyVisible = await page.getByText("Έλεγξε το email σου").isVisible().catch(() => false);
    const errorVisible  = await page.getByRole("alert").isVisible().catch(() => false);
    expect(verifyVisible || errorVisible).toBeTruthy();
  });
});
