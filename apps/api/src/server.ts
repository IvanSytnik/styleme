/**
 * StyleMe API Server v3.1
 *
 * Process entry point: guards, app (see app.ts), listen.
 */

import { createApp } from './app';
import { env, hasSupabase, hasUpstash, isProd } from './env';
import { installProcessGuards } from './lib/process-guards';
import { logger } from './logger';

installProcessGuards(logger);

const app = createApp();

app.listen(env.PORT, () => {
  logger.info(
    {
      port: env.PORT,
      env: env.NODE_ENV,
      supabase: hasSupabase ? 'configured' : 'disabled (dev fallback)',
      upstash: hasUpstash ? 'configured' : 'in-memory (dev fallback)',
      prod: isProd,
    },
    '🚀 StyleMe API v3.1 ready',
  );
});

export default app;
