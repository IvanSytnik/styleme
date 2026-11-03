/**
 * Production-target guard.
 *
 * Local development, tests and E2E must never point at production services.
 * Callers run this check outside production (and always for test-only
 * variables) and it throws before anything connects.
 *
 * Production hosts are stored as SHA-256 fingerprints of their hostnames, so
 * this public repo does not name them. To add a host:
 *   node -e "console.log(require('crypto').createHash('sha256').update('<host>').digest('hex'))"
 *
 * Server and build-time code only: it uses node:crypto, so it is a subpath
 * export (`@styleme/shared/env-guard`) and is not re-exported from the root.
 */

import { createHash } from 'node:crypto';

export const PRODUCTION_HOST_FINGERPRINTS: readonly string[] = [
  // Supabase project (API, auth, JWKS)
  '12435e1a76c0927171eeb9f07bf293e00d6fe5e3501783b7eca7f21d73868701',
  // Upstash Redis
  '10b7108896ac8fbc4e8c9bd19c8cba1a5d0d2a4e0e07eb60b34c582e05bea30f',
];

export function hostFingerprint(hostname: string): string {
  return createHash('sha256').update(hostname.trim().toLowerCase()).digest('hex');
}

function hostnameOf(value: string): string | null {
  try {
    return new URL(value).hostname;
  } catch {
    return null;
  }
}

/** Names of the variables whose URL points at a production host. */
export function findProductionHosts(
  vars: Readonly<Record<string, string | undefined>>,
  fingerprints: readonly string[] = PRODUCTION_HOST_FINGERPRINTS,
): string[] {
  const known = new Set(fingerprints);
  return Object.entries(vars)
    .filter(([, value]) => {
      if (!value) return false;
      const host = hostnameOf(value);
      return host !== null && known.has(hostFingerprint(host));
    })
    .map(([name]) => name);
}

export class ProductionTargetError extends Error {
  constructor(public readonly variables: readonly string[]) {
    super(
      `Refusing to start: ${variables.join(', ')} ${variables.length === 1 ? 'points' : 'point'} at a ` +
        'production service. Local development and tests must use the dev Supabase project and ' +
        'the dev Upstash database (see apps/api/.env.example).',
    );
    this.name = 'ProductionTargetError';
  }
}

/** Throws ProductionTargetError if any variable points at a production host. */
export function assertNoProductionHosts(
  vars: Readonly<Record<string, string | undefined>>,
  fingerprints: readonly string[] = PRODUCTION_HOST_FINGERPRINTS,
): void {
  const offending = findProductionHosts(vars, fingerprints);
  if (offending.length > 0) {
    throw new ProductionTargetError(offending);
  }
}
