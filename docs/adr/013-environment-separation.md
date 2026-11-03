# ADR-013: Environment separation — dev and test never touch production

Date: 2026-11-03
Status: Accepted

## Context

Without strict environment boundaries, local development, E2E and contract tests
risk sharing credentials or endpoints with production services. If a local
`.env` holds production Supabase or Upstash URLs or runs with `REPLICATE_MOCK`
disabled, a local session or test suite can accidentally bill real model calls
or write synthetic test rows into production tables.

Separate configuration alone is not enough: nothing stopped a copied `.env`
from pointing at production again.

## Decision

1. **Separate services.** Local development, contract tests and the E2E
   release check use a dev Supabase project and a dev Upstash database. CI E2E
   keeps in-memory Redis (ADR-012).
2. **Refuse production targets.** Outside `NODE_ENV=production`, the api
   refuses to start if `SUPABASE_URL` or `UPSTASH_REDIS_REST_URL` points at a
   production host, and the web app refuses to start (`next dev`) if
   `NEXT_PUBLIC_SUPABASE_URL` does. The contract tests refuse a production
   `TEST_UPSTASH_REDIS_REST_URL` in every environment. The check lives in
   `@styleme/shared/env-guard`. Production hosts are stored as SHA-256
   fingerprints of their hostnames, so the public repo does not name them.
3. **Mock by default.** Outside production, `REPLICATE_MOCK` defaults to on;
   `0` or `false` opts out. Production still refuses the mock.
4. **Key namespaces.** The dev Upstash database is shared, so every key gets a
   prefix: `dev:` for local development, `test:<run-id>:` for a contract test
   run, which deletes exactly its own keys afterwards. Production keeps
   unprefixed keys, so no migration is needed.
5. **Cleanup of mock rows.** `supabase/scripts/delete-mock-generations.sql`
   removes generations written by the mock (inline `data:` URLs). It is run by
   hand and rolls back unless edited to commit.

## Consequences

- + A local process cannot reach production by accident; it stops at start-up
  with an error that names the variable.
- + Running the api locally costs nothing unless the mock is switched off.
- + Contract tests run against a real Upstash database without touching
  production or each other.
- − Adding or moving a production host requires updating the fingerprint list.
- − The guard matches exact hostnames; a production service reached through a
  different hostname (for example a custom domain) needs its own fingerprint.
- − Local auth needs dev Supabase keys; without them the api uses the dev-user
  fallback and the web app runs without auth.
