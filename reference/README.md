# Reference implementation

A small implementation of the Mini e-Procurement API written from the design documents, to prove the documents are
enough to build from. Stack per ADR-01: ASP.NET Core 8 (Dapper) on SQL Server 2022, Redis for the idempotency cache,
nginx as the reverse proxy.

```bash
docker compose up -d --build     # http://localhost:8080/api/v1
docker compose down -v           # remove containers and data
```

- `api/Program.cs` - all 21 operations; each handler follows the numbered steps of its runtime view
- `web/` - the Web SPA (React + TypeScript, Vite) and the nginx that serves it and proxies `/api/`; written from the screen, interaction and wireframe documents, plain on purpose
- `compose.yml`, `db/` - the stack; the database is built from `../sql/schema.sql` and `../sql/seed-data.sql`
- `APP_PROFILE=test` (the default here) enables the test profile of CNV-10; never enable it in production
- Single sign-on is not wired: the test profile accepts HS256 tokens signed with `TEST_JWT_SECRET`; the SPA reads the token from `localStorage` (key `token`) or from its sign-in page

The tests that run against it are in `../tests/api-trial`.
