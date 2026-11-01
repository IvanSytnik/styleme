/**
 * Rate-limit middlewares.
 *
 * Two flavors:
 *  - ipRateLimit  — applies to all /api/* requests (defense in depth)
 *  - transformRateLimit — per authenticated user, applied only after auth
 *
 * Redis failure policy (ADR-015):
 *  - ipRateLimit fails OPEN: a Redis outage must not take down reads. Transform
 *    routes stay protected because they also pass through transformRateLimit.
 *  - transformRateLimit fails CLOSED with 503: every transform costs real money,
 *    so it never runs without its limiter.
 *
 * Both are async and Express 4 ignores returned promises, so nothing may reject
 * out of them: that would be an unhandled rejection, not an error response.
 */

import type { NextFunction, Request, Response } from 'express';

import { ERROR_CODES, type ApiResponse } from '@styleme/shared';

import { rateLimitByIp, rateLimitTransformByUser, type RateLimitResult } from '../lib/rate-limit';
import { logger } from '../logger';
import { HttpError } from './error-handler';

function send429(res: Response, retryAfter: number, remaining: number): void {
  res.setHeader('Retry-After', String(retryAfter));
  res.setHeader('X-RateLimit-Remaining', String(remaining));
  res.status(429).json({
    success: false,
    error: {
      code: ERROR_CODES.RATE_LIMITED,
      message: 'Too many requests',
      details: { retryAfterSeconds: retryAfter },
    },
  } satisfies ApiResponse);
}

function applyResult(res: Response, next: NextFunction, result: RateLimitResult): void {
  res.setHeader('X-RateLimit-Limit', String(result.limit));
  res.setHeader('X-RateLimit-Remaining', String(result.remaining));
  if (!result.ok) {
    send429(res, result.resetInSeconds, result.remaining);
    return;
  }
  next();
}

export async function ipRateLimit(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // `req.ip` respects `app.set('trust proxy', ...)` set in app.ts
    const ip = req.ip ?? 'unknown';
    let result: RateLimitResult;
    try {
      result = await rateLimitByIp(ip);
    } catch (err) {
      logger.warn({ err, reqId: req.id }, '[rate-limit] Redis failed, IP limit skipped (fail open)');
      next();
      return;
    }
    applyResult(res, next, result);
  } catch (err) {
    next(err);
  }
}

export async function transformRateLimit(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: ERROR_CODES.UNAUTHORIZED, message: 'Authentication required' },
      } satisfies ApiResponse);
      return;
    }
    let result: RateLimitResult;
    try {
      result = await rateLimitTransformByUser(req.user.id);
    } catch (err) {
      logger.error({ err, reqId: req.id }, '[rate-limit] Redis failed, transform rejected (fail closed)');
      next(
        new HttpError(
          503,
          ERROR_CODES.SERVICE_UNAVAILABLE,
          'Service temporarily unavailable. Please try again shortly.',
        ),
      );
      return;
    }
    applyResult(res, next, result);
  } catch (err) {
    next(err);
  }
}
