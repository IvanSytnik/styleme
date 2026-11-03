/**
 * Environment parsing and policy, without side effects.
 *
 * env.ts loads .env and calls parseEnv(process.env) once at import. Tests call
 * parseEnv with plain objects, so they never read a developer's .env file.
 *
 * parseEnv throws on any invalid configuration, which stops the process at
 * import:
 *  - schema errors
 *  - production without full Supabase + Upstash config
 *  - production with the Replicate mock enabled (ADR-012): it would serve fake
 *    generations and write garbage billing rows
 *  - outside production, any URL that points at a production service (ADR-013)
 */

import { z } from 'zod';

import { assertNoProductionHosts } from '@styleme/shared/env-guard';

/**
 * Treats an empty string as "not set".
 *
 * Orchestrators substitute '' for an absent value rather than omitting the
 * key — GitHub Actions does it for a missing secret, and playwright.config's
 * webServer env does it via `process.env.X ?? ''`. Zod's `.optional()` admits
 * only `undefined`, so an absent secret reached `.url()` as an empty string
 * and hard-failed env parsing: the api exited at import, never bound its
 * port, and E2E surfaced it as an opaque "Timed out waiting 60000ms from
 * config.webServer" instead of "this env var is not configured".
 *
 * Absent must read as absent so the documented dev/test fallbacks (deterministic
 * dev user, in-memory Redis) engage. Production strictness is unaffected: the
 * production checks below still refuse to start on a missing value.
 */
const optionalEnv = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((v) => (v === '' ? undefined : v), schema.optional());

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3001),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  FRONTEND_URL: z.string().url().default('http://localhost:3000'),

  REPLICATE_API_TOKEN: z.string().min(1, 'REPLICATE_API_TOKEN is required'),

  /**
   * Replicate mock: transform endpoints return a canned image instead of
   * calling the model. Unset means ON outside production, so a local run never
   * bills by accident; set '0' or 'false' to call the real model. Forbidden in
   * production.
   */
  REPLICATE_MOCK: optionalEnv(z.enum(['0', '1', 'false', 'true'])),

  // Supabase — server-side
  SUPABASE_URL: optionalEnv(z.string().url()),
  SUPABASE_ANON_KEY: optionalEnv(z.string()),
  SUPABASE_SERVICE_ROLE_KEY: optionalEnv(z.string()),
  /**
   * Legacy HS256 JWT Secret. Required only for older Supabase projects
   * that still sign with HS256. Newer projects use asymmetric keys
   * (ES256/RS256) verified via the JWKS endpoint — for those this is unused.
   */
  SUPABASE_JWT_SECRET: optionalEnv(z.string()),

  // Upstash Redis
  UPSTASH_REDIS_REST_URL: optionalEnv(z.string().url()),
  UPSTASH_REDIS_REST_TOKEN: optionalEnv(z.string()),

  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
});

export type Env = z.infer<typeof envSchema>;

export interface LoadedEnv {
  env: Env;
  isProd: boolean;
  hasSupabase: boolean;
  hasUpstash: boolean;
  isReplicateMock: boolean;
  /** Prepended to every Redis key: none in production, `dev:` elsewhere. */
  redisKeyPrefix: string;
}

export interface ParseEnvOptions {
  /** Overrides the production host list; tests use synthetic hosts. */
  productionHostFingerprints?: readonly string[];
}

export function parseEnv(raw: NodeJS.ProcessEnv, options: ParseEnvOptions = {}): LoadedEnv {
  const parsed = envSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(
      `[env] Invalid environment configuration: ${JSON.stringify(parsed.error.flatten().fieldErrors)}`,
    );
  }
  const env = parsed.data;
  const isProd = env.NODE_ENV === 'production';
  const mockRequested = env.REPLICATE_MOCK === '1' || env.REPLICATE_MOCK === 'true';

  if (isProd) {
    // Production: full Supabase + Upstash required. JWT secret is OPTIONAL —
    // modern projects use JWKS-based verification with no shared secret.
    //
    // FRONTEND_URL carries a localhost default for dev convenience, so the parsed
    // value is never absent — check the RAW one. Without this, a prod deploy that
    // forgot the var starts happily and then rejects every browser request: CORS
    // is deliberately single-origin (app.ts), so the default pins the only
    // allowed origin to http://localhost:3000. Empty string reads as absent, per
    // the optionalEnv rationale above.
    const rawFrontendUrl = raw.FRONTEND_URL;
    const requiredInProd = [
      ['FRONTEND_URL', rawFrontendUrl === '' ? undefined : rawFrontendUrl],
      ['SUPABASE_URL', env.SUPABASE_URL],
      ['SUPABASE_ANON_KEY', env.SUPABASE_ANON_KEY],
      ['SUPABASE_SERVICE_ROLE_KEY', env.SUPABASE_SERVICE_ROLE_KEY],
      ['UPSTASH_REDIS_REST_URL', env.UPSTASH_REDIS_REST_URL],
      ['UPSTASH_REDIS_REST_TOKEN', env.UPSTASH_REDIS_REST_TOKEN],
    ] as const;
    const missing = requiredInProd.filter(([, v]) => !v).map(([k]) => k);
    if (missing.length > 0) {
      throw new Error(`[env] Production requires: ${missing.join(', ')}`);
    }
    if (mockRequested) {
      throw new Error(
        '[env] REPLICATE_MOCK is forbidden in production — it would serve fake generations and corrupt billing data.',
      );
    }
  } else {
    assertNoProductionHosts(
      { SUPABASE_URL: env.SUPABASE_URL, UPSTASH_REDIS_REST_URL: env.UPSTASH_REDIS_REST_URL },
      options.productionHostFingerprints,
    );
  }

  return {
    env,
    isProd,
    hasSupabase: Boolean(env.SUPABASE_URL),
    hasUpstash: Boolean(env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN),
    isReplicateMock: !isProd && (env.REPLICATE_MOCK === undefined || mockRequested),
    redisKeyPrefix: isProd ? '' : 'dev:',
  };
}
