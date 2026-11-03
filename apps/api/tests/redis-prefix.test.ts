import { describe, expect, it, vi } from 'vitest';

import type { RedisLike } from '../src/lib/redis';
import { withKeyPrefix } from '../src/lib/redis-prefix';

const recorder = (): RedisLike & { keys: string[] } => {
  const keys: string[] = [];
  const touch = (key: string): void => {
    keys.push(key);
  };
  return {
    keys,
    get: vi.fn(async (key: string) => (touch(key), null)),
    set: vi.fn(async (key: string) => (touch(key), 'OK')),
    incr: vi.fn(async (key: string) => (touch(key), 1)),
    expire: vi.fn(async (key: string) => (touch(key), 1)),
    ttl: vi.fn(async (key: string) => (touch(key), 60)),
    del: vi.fn(async (key: string) => (touch(key), 1)),
  };
};

describe('withKeyPrefix', () => {
  it('prefixes the key of every operation', async () => {
    const inner = recorder();
    const redis = withKeyPrefix(inner, 'dev:');

    await redis.get('a');
    await redis.set('b', 'v', { ex: 5 });
    await redis.incr('c');
    await redis.expire('d', 5);
    await redis.ttl('e');
    await redis.del('f');

    expect(inner.keys).toEqual(['dev:a', 'dev:b', 'dev:c', 'dev:d', 'dev:e', 'dev:f']);
    expect(inner.set).toHaveBeenCalledWith('dev:b', 'v', { ex: 5 });
  });

  it('returns the inner client unchanged for an empty prefix (production)', () => {
    const inner = recorder();
    expect(withKeyPrefix(inner, '')).toBe(inner);
  });
});
