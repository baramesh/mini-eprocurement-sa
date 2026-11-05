import { defineConfig } from '@playwright/test';

export default defineConfig({
  globalSetup: './global-setup.ts',
  workers: 1,                       // one in-memory reference server shared by all tests (see GAP-18)
  fullyParallel: false,
  reporter: [['list'], ['json', { outputFile: 'results.json' }]],
  // BASE_URL points at the API of the deployed stack, WEB_URL at its Web SPA (reference/compose.yml, default http://localhost:8080)
  projects: [
    { name: 'api', testDir: './specs' },
    { name: 'e2e', testDir: './e2e', use: { channel: 'chrome', baseURL: process.env.WEB_URL ?? 'http://localhost:8080', timezoneId: 'Asia/Bangkok', locale: 'th-TH' } },
  ],
});
