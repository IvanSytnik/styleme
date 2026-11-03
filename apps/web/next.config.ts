import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

import { assertNoProductionHosts } from '@styleme/shared/env-guard';

// Outside production builds (next dev, E2E), refuse to start against the
// production Supabase project (ADR-013). `next build` runs with
// NODE_ENV=production, so deploys are unaffected.
if (process.env.NODE_ENV !== 'production') {
  assertNoProductionHosts({ NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL });
}

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  // Transpile workspace packages — shared types/constants live there.
  transpilePackages: ['@styleme/shared'],

  // We will tighten this in Phase 0 when CSP and security headers land.
  reactStrictMode: true,
};

export default withNextIntl(nextConfig);
