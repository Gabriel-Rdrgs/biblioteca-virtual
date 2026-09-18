import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end smoke tests against the production build. Browsers are not
 * installed with `npm install` — run `npx playwright install chromium` once.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run build && npm start",
    // The gate test needs a known password; it is skipped when unset.
    env: { ...process.env, ATLAS_SENHA_TURMA: process.env.ATLAS_SENHA_TURMA ?? "" },
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 240_000,
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 5"] } },
  ],
});
