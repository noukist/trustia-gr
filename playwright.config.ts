// =============================================================
// playwright.config.ts — Trustia.gr E2E Test Configuration
// =============================================================
// Runs against the local dev server (localhost:3000).
// For CI, set BASE_URL env var to the Vercel preview URL.
//
// Run all tests:    npx playwright test
// Run one file:     npx playwright test tests/e2e/01-register.spec.ts
// Open UI mode:     npx playwright test --ui
// Show report:      npx playwright show-report
// =============================================================

import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  // Test files location
  testDir: "./tests/e2e",

  // Run tests in parallel across files; sequential within a file
  fullyParallel: false,

  // Fail the build if any test.only() was left in
  forbidOnly: !!process.env.CI,

  // Retry failed tests once in CI
  retries: process.env.CI ? 1 : 0,

  // 1 worker in CI (avoids Supabase rate limits); 1 locally too for now
  workers: 1,

  // HTML report (open automatically after run in non-CI)
  reporter: process.env.CI ? "github" : [["html", { open: "on-failure" }]],

  // Shared settings for every test
  use: {
    // Dev server or Vercel preview URL
    baseURL: process.env.BASE_URL ?? "http://localhost:3000",

    // Greek locale to match the app default
    locale: "el-GR",

    // Keep traces on first retry so you can inspect failures
    trace: "on-first-retry",

    // Screenshot only on failure
    screenshot: "only-on-failure",

    // Slow down actions slightly so flaky clicks are avoided
    actionTimeout: 10_000,

    // Overall per-test timeout
  },

  // Per-test timeout
  timeout: 60_000,

  // ── Dev server ─────────────────────────────────────────────
  // In CI: Playwright starts `next dev` automatically and waits
  //        for it to be ready before running any tests.
  // Locally: if the server is already running on :3000 it reuses
  //          it, so your `npm run dev` session is not disrupted.
  webServer: {
    command: "npm run dev",
    url:     "http://localhost:3000",
    // Reuse the running server locally; always start fresh in CI
    reuseExistingServer: !process.env.CI,
    // Next.js can take a while on first start (type-checking etc.)
    timeout: 120_000,
    // Pipe dev-server output to the terminal only on failure
    stdout: "pipe",
    stderr: "pipe",
  },

  // Only test Chromium for now — add firefox/webkit when ready
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
