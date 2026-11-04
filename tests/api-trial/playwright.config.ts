import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './specs',
  workers: 1,                       // one in-memory reference server shared by all tests (see GAP-18)
  fullyParallel: false,
  reporter: [['list'], ['json', { outputFile: 'results.json' }]],
  use: { baseURL: 'http://127.0.0.1:3100/api/v1/' },
  webServer: { command: 'node server.mjs', port: 3100, reuseExistingServer: false, timeout: 15000 },
});
