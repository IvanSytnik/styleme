/**
 * A Redis failure must never kill the process. Reads fail open,
 * transforms fail closed.
 *
 * Fully stubbed. env.ts is mocked so dotenv never loads a local .env, Redis is a
 * RedisLike stub, and Replicate throws if reached. The only sockets are loopback
 * ones to the Express app under test.
 */
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';

import type { NextFunction, Request, Response } from 'express';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const stubs = vi.hoisted(() => ({
  env: {
    REPLICATE_API_TOKEN: 'stub',
    FRONTEND_URL: 'http://localhost:3000',
    SUPABASE_URL: undefined as string | undefined,
    SUPABASE_JWT_SECRET: undefined as string | undefined,
  },
  hasSupabase: false,
  redis: {
    get: vi.fn(),
    set: vi.fn(),
    incr: vi.fn(),
    expire: vi.fn(),
    ttl: vi.fn(),
    del: vi.fn(),
  },
  replicateRun: vi.fn(),
  listGenerations: vi.fn(),
}));

vi.mock('../src/env', () => ({
  env: stubs.env,
  get hasSupabase() {
    return stubs.hasSupabase;
  },
  hasUpstash: false,
  isProd: false,
  isReplicateMock: false,
}));
// A real silent pino: pino-http in createApp() needs the full logger API.
vi.mock('../src/logger', async () => {
  const { default: pino } = await import('pino');
  return { logger: pino({ level: 'silent' }) };
});
vi.mock('../src/lib/redis', () => ({ redis: stubs.redis }));
vi.mock('../src/db/generations', () => ({
  insertGeneration: vi.fn(),
  listGenerations: stubs.listGenerations,
  softDeleteGeneration: vi.fn(),
}));
vi.mock('replicate', () => ({
  default: class {
    run = stubs.replicateRun;
  },
}));

import { createApp } from '../src/app';
import { createUnhandledRejectionHandler, installProcessGuards } from '../src/lib/process-guards';
import { logger } from '../src/logger';
import { optionalAuth } from '../src/middleware/auth';
import { ipRateLimit, transformRateLimit } from '../src/middleware/rate-limit';

/** A broken handler never responds; fail fast instead of at the 30 s default. */
const REQUEST_TIMEOUT_MS = 2_000;

const redisDown = (): void => {
  const failure = new Error('stub: Upstash unreachable');
  stubs.redis.get.mockRejectedValue(failure);
  stubs.redis.set.mockRejectedValue(failure);
  stubs.redis.incr.mockRejectedValue(failure);
  stubs.redis.expire.mockRejectedValue(failure);
  stubs.redis.ttl.mockRejectedValue(failure);
  stubs.redis.del.mockRejectedValue(failure);
};

let server: Server;
let baseUrl: string;
const unhandled: unknown[] = [];
const onUnhandled = (reason: unknown): void => {
  unhandled.push(reason);
};

const call = (method: string, path: string): Promise<globalThis.Response> =>
  fetch(`${baseUrl}${path}`, { method, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });

/** Unhandled rejections surface after the microtask queue drains. */
const expectNoUnhandledRejections = async (): Promise<void> => {
  await new Promise((resolve) => setImmediate(resolve));
  expect(unhandled).toEqual([]);
};

beforeAll(async () => {
  process.on('unhandledRejection', onUnhandled);
  await new Promise<void>((resolve) => {
    server = createApp().listen(0, '127.0.0.1', resolve);
  });
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(async () => {
  process.off('unhandledRejection', onUnhandled);
  await new Promise((resolve) => server.close(resolve));
});

beforeEach(() => {
  vi.resetAllMocks();
  unhandled.length = 0;
  stubs.hasSupabase = false;
  stubs.env.SUPABASE_URL = undefined;
  stubs.listGenerations.mockResolvedValue({ items: [], nextCursor: null });
});

afterEach(expectNoUnhandledRejections);

describe('Redis down: read routes fail open', () => {
  beforeEach(redisDown);

  it('passes a route that does not use Redis, and logs a warning with the request id', async () => {
    const warn = vi.spyOn(logger, 'warn');

    const res = await call('GET', '/api/hairstyles');

    expect(res.status).toBe(200);
    expect(warn).toHaveBeenCalledWith(
      expect.objectContaining({ reqId: res.headers.get('x-request-id'), err: expect.any(Error) }),
      expect.stringContaining('fail open'),
    );
  });

  it('passes an authenticated read backed by Postgres', async () => {
    const res = await call('GET', '/api/generations');

    expect(res.status).toBe(200);
    expect(stubs.listGenerations).toHaveBeenCalledOnce();
  });

  it('returns an enveloped 500 from a read that needs Redis itself', async () => {
    const res = await call('GET', '/api/billing/balance');

    expect(res.status).toBe(500);
    expect(await res.json()).toMatchObject({ success: false, error: { code: 'INTERNAL_ERROR' } });
  });
});

describe('Redis down: transform routes fail closed', () => {
  beforeEach(redisDown);

  it.each(['/api/transform', '/api/transform/custom', '/api/transform/reference'])(
    'POST %s returns 503 and never reaches Replicate',
    async (path) => {
      const res = await call('POST', path);

      expect(res.status).toBe(503);
      expect(await res.json()).toMatchObject({
        success: false,
        error: { code: 'SERVICE_UNAVAILABLE' },
      });
      expect(stubs.replicateRun).not.toHaveBeenCalled();
    },
  );

  it('still fails closed when only the per-user limiter fails', async () => {
    stubs.redis.incr.mockResolvedValueOnce(1);
    stubs.redis.expire.mockResolvedValueOnce(1);
    stubs.redis.ttl.mockResolvedValueOnce(60);

    const res = await call('POST', '/api/transform');

    expect(res.status).toBe(503);
    expect(stubs.replicateRun).not.toHaveBeenCalled();
  });
});

describe('Redis healthy: limits are still enforced', () => {
  it('returns 429 once over the limit', async () => {
    stubs.redis.incr.mockResolvedValue(Number.MAX_SAFE_INTEGER);
    stubs.redis.ttl.mockResolvedValue(30);

    const res = await call('GET', '/api/hairstyles');

    expect(res.status).toBe(429);
    expect(await res.json()).toMatchObject({ error: { code: 'RATE_LIMITED' } });
  });

  it('passes under the limit', async () => {
    stubs.redis.incr.mockResolvedValue(1);
    stubs.redis.expire.mockResolvedValue(1);
    stubs.redis.ttl.mockResolvedValue(30);

    const res = await call('GET', '/api/hairstyles');

    expect(res.status).toBe(200);
    expect(res.headers.get('x-ratelimit-limit')).not.toBeNull();
  });
});

describe('unexpected errors are forwarded to next(err)', () => {
  const boom = new Error('stub: setHeader failed');
  const throwingRes = {
    setHeader: () => {
      throw boom;
    },
  } as unknown as Response;
  const healthyRedis = (): void => {
    stubs.redis.incr.mockResolvedValue(1);
    stubs.redis.expire.mockResolvedValue(1);
    stubs.redis.ttl.mockResolvedValue(30);
  };

  it('ipRateLimit', async () => {
    healthyRedis();
    const next = vi.fn();

    await ipRateLimit({ ip: '127.0.0.1' } as Request, throwingRes, next as NextFunction);

    expect(next.mock.calls).toEqual([[boom]]);
  });

  it('transformRateLimit', async () => {
    healthyRedis();
    const next = vi.fn();
    const req = { user: { id: 'u1', isAnonymous: true } } as Request;

    await transformRateLimit(req, throwingRes, next as NextFunction);

    expect(next.mock.calls).toEqual([[boom]]);
  });
});

describe('auth rejections are forwarded to next(err)', () => {
  // `new URL` in getJwks throws outside verifyToken's inner try blocks.
  const breakJwks = (): void => {
    stubs.hasSupabase = true;
    stubs.env.SUPABASE_URL = 'not a url';
    stubs.redis.incr.mockResolvedValue(1);
    stubs.redis.expire.mockResolvedValue(1);
    stubs.redis.ttl.mockResolvedValue(30);
  };

  it('requireAuth returns an enveloped 500', async () => {
    breakJwks();

    const res = await fetch(`${baseUrl}/api/generations`, {
      headers: { authorization: 'Bearer stub-token' },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    expect(res.status).toBe(500);
    expect(await res.json()).toMatchObject({ success: false, error: { code: 'INTERNAL_ERROR' } });
  });

  it('optionalAuth calls next with the error', async () => {
    breakJwks();
    const failed = new Promise((resolve) => {
      const req = { header: () => 'Bearer stub-token' } as unknown as Request;
      optionalAuth(req, {} as Response, resolve as NextFunction);
    });

    await expect(failed).resolves.toBeInstanceOf(TypeError);
  });
});

describe('process guard', () => {
  it('logs the rejection reason', () => {
    const log = { error: vi.fn() };
    const reason = new Error('stub: stray rejection');

    createUnhandledRejectionHandler(log)(reason);

    expect(log.error.mock.calls).toEqual([[{ err: reason }, expect.stringContaining('unhandled')]]);
  });

  it('registers on unhandledRejection', () => {
    const before = process.listeners('unhandledRejection');

    installProcessGuards({ error: vi.fn() });

    const added = process.listeners('unhandledRejection').filter((l) => !before.includes(l));
    expect(added).toHaveLength(1);
    process.off('unhandledRejection', added[0]!);
  });
});
