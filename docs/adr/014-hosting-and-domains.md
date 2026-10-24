# ADR-014: Hosting and domains — Vercel + Render behind DNS-only Cloudflare

Date: 2026-10-25
Status: Accepted
Supersedes: the hosting parts of ADR-002 (Railway build via `railway.json`),
ADR-004 (Railway as API host, "Vercel + Railway split") and ADR-005
(the Vercel↔Railway cross-domain note). Those ADRs are left unedited as
historical records; the README ADR index marks the supersession.

## Context

ADR-002, ADR-004 and ADR-005 assumed the API would run on Railway. The
Railway trial ended before launch, and the API was deployed to Render
instead. The web app went to Vercel as planned. Both first ran on platform
hostnames (`*.onrender.com`, `*.vercel.app`), and the apps now also serve on
a custom domain, `sytnik-studio.com`, whose DNS is managed in Cloudflare.

Constraints that shaped the setup:

- The API holds long requests open. A generation calls Replicate
  synchronously (typically 15–30 s, with up to 3 attempts and retry waits
  capped at 10 s in `apps/api/src/lib/replicate-retry.ts`). After idling, a
  Render free-tier instance adds a cold start; one was measured at 32 s in the
  2026-10-11 audit.
- CORS is deliberately single-origin (`apps/api/src/server.ts`). Uploads are
  face photos, so the allowlist stays as narrow as possible.

## Decision

| Component | Provider | Location (as observed) |
| --- | --- | --- |
| Web (`apps/web`) | Vercel, project root `apps/web`, build from `apps/web/vercel.json` | `x-vercel-id` showed edge `fra1`, function region `iad1` |
| API (`apps/api`) | Render web service | GCP `us-west1`: the custom-domain CNAME resolves to `gcp-us-west1-1.origin.onrender.com` |
| Auth + Postgres | Supabase (anonymous sign-in, RLS) | Frankfurt, per the project settings. Not observable from public DNS, because the project host sits behind Cloudflare |
| Quota / rate limits | Upstash Redis (REST) | not recorded here |
| DNS | Cloudflare, zone `sytnik-studio.com` | — |

**Domains**

- `styleme.sytnik-studio.com`: CNAME to Vercel (`*.vercel-dns-017.com`).
  The old `styleme-second-v-web.vercel.app` returns 308 to it.
- `styleme-api.sytnik-studio.com`: CNAME to `styleme-second-v.onrender.com`.
  The `onrender.com` hostname still serves directly.

**DNS-only (unproxied) records.** Both CNAMEs are grey-cloud: they resolve to
the provider targets, not to Cloudflare proxy IPs. Reasons:

1. **Vercel.** Vercel runs its own edge network and issues its own
   certificates. Putting Cloudflare's proxy in front adds a second CDN layer
   and interferes with Vercel's certificate issuance and edge behaviour, for
   no gain.
2. **Proxy timeout vs. long requests.** Cloudflare's proxy ends a request
   with HTTP 524 if the origin doesn't respond within about 100 s. A
   generation on a cold API (cold start, then a 15–30 s model call, plus up to
   two retry waits) can get close to that. With DNS-only, the browser talks to
   Render directly, and Render's own edge applies its limits.
3. Nothing would be gained. Both providers already terminate TLS and absorb
   traffic at their edges, and per-IP rate limiting happens in the API
   (`trust proxy = 1`).

**CORS.** The API allows exactly one origin, read from `FRONTEND_URL`. In
production it is `https://styleme.sytnik-studio.com` (confirmed by a
preflight returning that `Access-Control-Allow-Origin`).
`apps/api/src/env.ts` refuses to start in production if `FRONTEND_URL` is
missing, because its localhost default would otherwise reject every browser
request.

## Consequences

### Positive
- Stable, branded URLs, independent of provider hostnames. The provider can
  change later by repointing one CNAME, without touching the web bundle's
  origin or the CORS configuration.
- Long-lived Express process, with no serverless execution-time limit on the
  generation request (the reason for the split in ADR-004 still holds).
- No proxy-timeout failure mode on slow generations.

### Negative / known tradeoffs
- **Region mismatch.** The API runs in US-West, while Supabase (Frankfurt)
  and the intended users are in the EU. Every request pays transatlantic
  round trips: browser to API, and API to Upstash and Supabase (the
  generations insert and the JWKS fetch, which `jose` caches). The privacy
  policy (wave W2) must list the US processing location. Photos already go to
  Replicate in the US.
- **Cold starts** on the Render free tier (32 s measured). They are visible
  on the first request after idle. Tracked as wave W12.
- **No Cloudflare-layer protection** (WAF, bot rules, DDoS proxying) in
  front of the API. Abuse resistance relies on the API's own rate limits and
  quota, whose gaps are tracked as wave W3b.

### Follow-ups
- The production web bundle still calls the API at
  `https://styleme-second-v.onrender.com`. Set Vercel's `NEXT_PUBLIC_API_URL`
  to `https://styleme-api.sytnik-studio.com` and redeploy (`NEXT_PUBLIC_*`
  values are inlined at build time).
- `railway.json` is obsolete and should be removed in a separate change.
- Re-evaluate the API region (Render offers an EU region; moving means
  recreating the service) together with the paid-plan decision in W12.

## Alternatives considered

- **Railway for the API** (ADR-004's original choice). Abandoned when the
  trial ended. No functional reason to return.
- **API as Vercel Functions.** Rejected for the same reason as in ADR-004:
  execution-time limits and the serverless model don't suit 15–60 s
  synchronous generations.
- **Cloudflare-proxied records.** Rejected: see the DNS-only rationale above.
- **Keeping platform hostnames only.** Workable for an MVP, but they couple
  the public URL and the CORS origin to the provider, and they look
  unfinished for a beta.
