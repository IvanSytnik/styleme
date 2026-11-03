import { describe, expect, it } from 'vitest';

import {
  PRODUCTION_HOST_FINGERPRINTS,
  ProductionTargetError,
  assertNoProductionHosts,
  findProductionHosts,
  hostFingerprint,
} from '../src/env-guard';

// Synthetic production hosts; the real ones are not named in this repo.
const PROD_DB = 'prod-fixture.supabase.co';
const PROD_REDIS = 'prod-fixture.upstash.io';
const FIXTURE = [hostFingerprint(PROD_DB), hostFingerprint(PROD_REDIS)];

describe('env guard', () => {
  it('flags every variable that points at a production host', () => {
    const vars = {
      SUPABASE_URL: `https://${PROD_DB}`,
      UPSTASH_REDIS_REST_URL: `https://${PROD_REDIS}/`,
      OTHER_URL: 'https://dev-fixture.upstash.io',
    };

    expect(findProductionHosts(vars, FIXTURE)).toEqual(['SUPABASE_URL', 'UPSTASH_REDIS_REST_URL']);
  });

  it('throws a ProductionTargetError that names the variables, not the hosts', () => {
    const run = (): void =>
      assertNoProductionHosts({ NEXT_PUBLIC_SUPABASE_URL: `https://${PROD_DB}/auth/v1` }, FIXTURE);

    expect(run).toThrow(ProductionTargetError);
    expect(run).toThrow(/NEXT_PUBLIC_SUPABASE_URL points at a production service/);
    expect(run).not.toThrow(new RegExp(PROD_DB.replace(/\./g, '\\.')));
  });

  it('matches hostnames case-insensitively', () => {
    expect(findProductionHosts({ U: `https://${PROD_REDIS.toUpperCase()}` }, FIXTURE)).toEqual(['U']);
  });

  it('passes dev hosts, empty values and non-URLs', () => {
    expect(() =>
      assertNoProductionHosts(
        { A: 'https://dev-fixture.supabase.co', B: undefined, C: '', D: 'not a url' },
        FIXTURE,
      ),
    ).not.toThrow();
  });

  it('ships one fingerprint per production service', () => {
    expect(PRODUCTION_HOST_FINGERPRINTS).toHaveLength(2);
    for (const f of PRODUCTION_HOST_FINGERPRINTS) expect(f).toMatch(/^[0-9a-f]{64}$/);
  });
});
