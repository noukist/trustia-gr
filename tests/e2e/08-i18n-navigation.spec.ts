// i18n navigation regression — EN must stay on /en/* when searching
import { test, expect } from "@playwright/test";

test("EN homepage search stays under /en/", async ({ page }) => {
  await page.goto("/en");
  await page.getByRole("button", { name: /search/i }).click();
  await page.waitForURL(/\/services/, { timeout: 10_000 });
  expect(page.url()).toMatch(/\/en\/services/);
});

test("EN category card stays under /en/", async ({ page }) => {
  await page.goto("/en");
  const catLink = page.locator('a[href*="/services?category="]').first();
  await expect(catLink).toBeVisible({ timeout: 8_000 });
  const href = await catLink.getAttribute("href");
  expect(href).toMatch(/^\/en\//);
});
