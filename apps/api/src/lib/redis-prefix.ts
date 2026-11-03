/**
 * Key namespacing for a shared Redis database.
 *
 * Local development and contract tests share one dev Upstash database. Every
 * key gets an environment prefix (`dev:` locally, `test:<run-id>:` in contract
 * tests) so they never collide and a test run can delete exactly its own keys.
 * Production uses no prefix, which keeps its existing keys valid.
 *
 * No env import, so tests can use it without loading .env.
 */

import type { RedisLike } from './redis';

export function withKeyPrefix(inner: RedisLike, prefix: string): RedisLike {
  if (prefix === '') return inner;
  const k = (key: string): string => `${prefix}${key}`;
  return {
    get: (key) => inner.get(k(key)),
    set: (key, value, opts) => inner.set(k(key), value, opts),
    incr: (key) => inner.incr(k(key)),
    expire: (key, seconds) => inner.expire(k(key), seconds),
    ttl: (key) => inner.ttl(k(key)),
    del: (key) => inner.del(k(key)),
  };
}
