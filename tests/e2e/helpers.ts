// =============================================================
// tests/e2e/helpers.ts — Shared test utilities
// =============================================================
// Reusable credentials, page-action helpers, and assertions
// used across all Trustia E2E scenarios.
// =============================================================

import { Page, expect } from "@playwright/test";

// ── Test credentials ────────────────────────────────────────
// Credentials are read from environment variables first, so they
// can be injected as GitHub Actions secrets without touching code.
//
// Local override: create a file called `.env.test.local` (gitignored)
// and set E2E_CUSTOMER_EMAIL, E2E_CUSTOMER_PASSWORD, etc.
// Next.js loads this file automatically when running `next dev`.
//
// GitHub Actions: add the same names as repository secrets and
// pass them to the workflow env block (see .github/workflows/e2e.yml).

export const TEST_CUSTOMER = {
  email:       process.env.E2E_CUSTOMER_EMAIL    ?? "e2e.customer@trustia.test",
  password:    process.env.E2E_CUSTOMER_PASSWORD ?? "your-password-here",
  displayName: "Test Customer",
};

export const TEST_PRO_1 = {
  email:     process.env.E2E_PRO1_EMAIL    ?? "e2e.pro1@trustia.test",
  password:  process.env.E2E_PRO1_PASSWORD ?? "your-password-here",
  firstName: "Νίκος",
  lastName:  "Παπαδόπουλος",
  phone:     "6944000001",
  city:      "Αθήνα",
  category:  "plumber",
  tier:      "trades",
};

export const TEST_PRO_2 = {
  email:     process.env.E2E_PRO2_EMAIL    ?? "e2e.pro2@trustia.test",
  password:  process.env.E2E_PRO2_PASSWORD ?? "your-password-here",
  firstName: "Μαρία",
  lastName:  "Γεωργίου",
  phone:     "6944000002",
  city:      "Αθήνα",
  category:  "electrician",
  tier:      "light",
};

// ── Page helpers ────────────────────────────────────────────

/**
 * Fill the customer registration form and submit it.
 * Returns after the success screen appears.
 */
export async function registerCustomer(
  page: Page,
  email: string,
  password: string
) {
  await page.goto("/register");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Κωδικός").fill(password);
  await page.getByLabel("Επιβεβαίωση κωδικού").fill(password);
  // Accept terms (required)
  await page.getByRole("checkbox").first().check();
  await page.getByRole("button", { name: "Εγγραφή" }).click();
}

/**
 * Sign in with email + password.
 * Waits for a redirect away from /login.
 */
export async function loginAs(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Κωδικός").fill(password);
  await page.getByRole("button", { name: "Σύνδεση" }).click();
  // Wait until we leave the login page
  await page.waitForURL((url) => !url.pathname.includes("/login"), {
    timeout: 15_000,
  });
}

/**
 * Sign out from the navbar.
 */
export async function logout(page: Page) {
  // Open the user menu (hamburger / avatar)
  await page.getByRole("button", { name: /menu|logout|αποσύνδεση/i })
    .first()
    .click();
  const signOutBtn = page.getByRole("button", { name: /αποσύνδεση|sign out/i });
  if (await signOutBtn.isVisible()) {
    await signOutBtn.click();
    await page.waitForURL("/el");
  }
}

/**
 * Assert that an error banner (role=alert) is visible with the
 * given text fragment.
 */
export async function expectError(page: Page, textFragment: string) {
  await expect(
    page.getByRole("alert").filter({ hasText: textFragment })
  ).toBeVisible({ timeout: 8_000 });
}

/**
 * Wait for a toast / success message anywhere on the page.
 */
export async function expectSuccess(page: Page, textFragment: string) {
  await expect(page.getByText(textFragment, { exact: false })).toBeVisible({
    timeout: 8_000,
  });
}
