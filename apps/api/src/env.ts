/**
 * Runtime-validated environment.
 *
 * Loads .env, then validates it with parseEnv (env-config.ts). Throws on
 * import if the configuration is invalid, if production lacks Supabase or
 * Upstash, or if a non-production process points at a production service.
 * Development allows in-memory fallbacks when Upstash/Supabase are absent.
 */

import * as dotenv from 'dotenv';

import { parseEnv } from './env-config';

dotenv.config();

const loaded = parseEnv(process.env);

export const env = loaded.env;
export const isProd = loaded.isProd;
export const hasSupabase = loaded.hasSupabase;
export const hasUpstash = loaded.hasUpstash;
export const isReplicateMock = loaded.isReplicateMock;
export const redisKeyPrefix = loaded.redisKeyPrefix;
