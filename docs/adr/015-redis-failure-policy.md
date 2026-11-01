# ADR-015: Redis failure policy — fail open on reads, closed on transforms

Date: 2026-11-01
Status: Accepted

## Context

The rate-limit middlewares were `async` with no error handling, and Express 4
ignores the promise a middleware returns. An Upstash error therefore became an
unhandled rejection, and Node exited with code 1.

Stopping the crash is not enough on its own. Each limiter also has to do
something when it cannot read its counter, and the two options cost different
things: a transform spends real money per call, while the other routes cost
almost nothing.

## Options

1. **Fail open everywhere.** Best availability, but transforms run without a
   per-user limit while Redis is down.
2. **Fail closed everywhere.** No unmetered spend, but a Redis outage takes down
   routes that do not otherwise need Redis, such as the catalog and history.
3. **Split.** Reads stay up, transforms stop.

## Decision

Option 3.

1. Reads fail open: `ipRateLimit` logs a warning with the request id and calls
   `next()`.
2. Transforms fail closed: `transformRateLimit` returns 503
   `SERVICE_UNAVAILABLE`, before upload parsing and any model call.
3. A process-level `unhandledRejection` handler logs and does not exit, as
   defense in depth. Request-path code still forwards its errors to `next(err)`
   and must not rely on this handler.

## Consequences

- IP limiting is off while Redis is down.
