# API tests written from the design documents

Playwright API tests, written **only from the published design documents** (runtime views, OpenAPI, business rules,
acceptance criteria, `sql/sample-data.sql`), and run against the reference stack in `../../reference`
(ASP.NET Core 8, SQL Server 2022, Redis, nginx - the stack of ADR-01). Every question the documents could not answer
was recorded as a finding (FND-19, FND-20) and then resolved in the documents.

| File | What it is |
|---|---|
| `specs/acceptance.spec.ts` | one test per acceptance criterion, titled with the AC id |
| `specs/decisions.spec.ts` | rules stated in runtime views and conventions that no acceptance criterion covers |
| `specs/database.spec.ts` | checks that need the real database: account permissions, history rows, concurrent requests |
| `specs/contract.spec.ts` | every response seen during the run is validated against `api/openapi.yaml` |
| `global-setup.ts` | resets the data to the delivered seed before a run (test profile, CNV-10) |

```bash
(cd ../../reference && docker compose up -d --build)   # API on http://localhost:8080/api/v1
npm install
npx playwright test                                    # BASE_URL overrides the target
```

`specs/database.spec.ts` calls `docker exec` on the SQL Server container (`eproc-db-1`).
