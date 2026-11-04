import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './specs',
  globalSetup: './global-setup.ts',
  workers: 1,                       // one in-memory reference server shared by all tests (see GAP-18)
  fullyParallel: false,
  reporter: [['list'], ['json', { outputFile: 'results.json' }]],
  // BASE_URL points at the deployed stack (reference/compose.yml, default http://localhost:8080/api/v1/)
  use: { baseURL: process.env.BASE_URL ?? 'http://localhost:8080/api/v1/' },
});
