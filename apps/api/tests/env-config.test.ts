/**
 * parseEnv policy. Plain objects only: no .env file is read.
 */
import { describe, expect, it } from 'vitest';

import { ProductionTargetError, hostFingerprint } from '@styleme/shared/env-guard';

import { parseEnv } from '../src/env-config';

// Synthetic production hosts; the real ones are not named in this repo.
const PROD_SUPABASE = 'https://prod-fixture.supabase.co';
const PROD_UPSTASH = 'https://prod-fixture.upstash.io';
const DEV_SUPABASE = 'https://dev-fixture.supabase.co';
const DEV_UPSTASH = 'https://dev-fixture.upstash.io';
const options = {
  productionHostFingerprints: [
    hostFingerprint('prod-fixture.supabase.co'),
    hostFingerprint('prod-fixture.upstash.io'),
  ],
};

const base = { REPLICATE_API_TOKEN: 'stub' };
const fullProd = {
  ...base,
  NODE_ENV: 'production',
  FRONTEND_URL: 'https://app.example.com',
  SUPABASE_URL: PROD_SUPABASE,
  SUPABASE_ANON_KEY: 'stub',
  SUPABASE_SERVICE_ROLE_KEY: 'stub',
  UPSTASH_REDIS_REST_URL: PROD_UPSTASH,
  UPSTASH_REDIS_REST_TOKEN: 'stub',
};

describe('production targets outside production', () => {
  it.each(['development', 'test'])('NODE_ENV=%s refuses the production Supabase project', (nodeEnv) => {
    expect(() => parseEnv({ ...base, NODE_ENV: nodeEnv, SUPABASE_URL: PROD_SUPABASE }, options)).toThrow(
      ProductionTargetError,
    );
  });

  it.each(['development', 'test'])('NODE_ENV=%s refuses the production Upstash database', (nodeEnv) => {
    expect(() =>
      parseEnv({ ...base, NODE_ENV: nodeEnv, UPSTASH_REDIS_REST_URL: PROD_UPSTASH }, options),
    ).toThrow(/UPSTASH_REDIS_REST_URL points at a production service/);
  });

  it('applies when NODE_ENV is unset (defaults to development)', () => {
    expect(() => parseEnv({ ...base, SUPABASE_URL: PROD_SUPABASE }, options)).toThrow(ProductionTargetError);
  });

  it('accepts dev services', () => {
    expect(() =>
      parseEnv({ ...base, SUPABASE_URL: DEV_SUPABASE, UPSTASH_REDIS_REST_URL: DEV_UPSTASH }, options),
    ).not.toThrow();
  });

  it('accepts production services in production', () => {
    expect(parseEnv(fullProd, options).isProd).toBe(true);
  });
});

describe('REPLICATE_MOCK', () => {
  it.each([
    ['development', undefined, true],
    ['development', '', true],
    ['test', undefined, true],
    ['development', '1', true],
    ['development', 'true', true],
    ['development', '0', false],
    ['development', 'false', false],
    ['production', undefined, false],
    ['production', '0', false],
  ])('NODE_ENV=%s, REPLICATE_MOCK=%s → mock %s', (nodeEnv, mock, expected) => {
    const raw = nodeEnv === 'production' ? { ...fullProd } : { ...base, NODE_ENV: nodeEnv };
    expect(parseEnv({ ...raw, REPLICATE_MOCK: mock }, options).isReplicateMock).toBe(expected);
  });

  it.each(['1', 'true'])('production refuses REPLICATE_MOCK=%s', (mock) => {
    expect(() => parseEnv({ ...fullProd, REPLICATE_MOCK: mock }, options)).toThrow(/forbidden in production/);
  });
});

describe('other policy', () => {
  it('prefixes Redis keys with dev: outside production and not in production', () => {
    expect(parseEnv({ ...base, NODE_ENV: 'development' }, options).redisKeyPrefix).toBe('dev:');
    expect(parseEnv(fullProd, options).redisKeyPrefix).toBe('');
  });

  it('production still requires Supabase and Upstash', () => {
    const { UPSTASH_REDIS_REST_TOKEN: _omit, ...partial } = fullProd;
    expect(() => parseEnv(partial, options)).toThrow(/Production requires: UPSTASH_REDIS_REST_TOKEN/);
  });

  it('rejects a malformed configuration', () => {
    expect(() => parseEnv({ NODE_ENV: 'development' }, options)).toThrow(/REPLICATE_API_TOKEN/);
  });
});
