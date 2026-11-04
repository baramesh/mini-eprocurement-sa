# API trial: tests written from the design documents

A trial of the hand-off: an API test suite and a small reference server built **only from the published design documents**
(runtime views, OpenAPI, business rules, acceptance criteria, `sql/sample-data.sql`). Every question the documents could not
answer was recorded as a finding (FND-19) and then resolved in the documents.

| File | What it is |
|---|---|
| `specs/acceptance.spec.ts` | one test per acceptance criterion (AC-01-01 … AC-14-01), titled with the AC id |
| `specs/decisions.spec.ts` | rules stated in runtime views and conventions that no acceptance criterion covers |
| `specs/contract.spec.ts` | every response seen during the run is validated against `api/openapi.yaml` |
| `server.mjs` | in-memory reference implementation (Node, no framework), test profile per CNV-10 |

```bash
npm install
npx playwright test
```

Limits: the server is in-memory, so database transactions, row locks and unique indexes are not exercised;
`AC-13-02` (audit table rejects UPDATE/DELETE) is a database-level check and is marked `fixme` here.
