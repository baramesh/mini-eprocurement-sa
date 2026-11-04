import { test, expect } from '@playwright/test';
import { contractErrors } from './helpers';

// Runs last (alphabetical): every response seen by acceptance.spec.ts was validated against api/openapi.yaml.
test('contract: all responses seen in this run match the OpenAPI response schemas', async () => {
  expect([...new Set(contractErrors)]).toEqual([]);
});
