// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

/**
 * Opt-in only — not wired into `npm test` / `make test` / CI. Run with:
 *   npm run test:e2e
 *
 * Currently exercises the Hardware & Sensors Lab (tests/e2e/) as the
 * validation step for that feature: confirms every UI state the SIMULATED
 * DATA promise depends on is actually reachable, and captures reference
 * screenshots of both device cards fully expanded.
 */
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  fullyParallel: false,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:5173',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run dev -- --port 5173 --strictPort',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
