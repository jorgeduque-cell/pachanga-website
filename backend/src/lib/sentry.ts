/**
 * Sentry SDK initialization.
 * Must be imported FIRST in server.ts, before any other modules.
 */
import * as Sentry from '@sentry/node';
import { env } from '../config/env.js';
import { logger } from './logger.js';

const IS_PRODUCTION = env.NODE_ENV === 'production';

export function initSentry(): void {
  if (!env.SENTRY_DSN) {
    if (IS_PRODUCTION) {
      logger.warn('SENTRY_DSN not configured — error tracking disabled in production');
    }
    return;
  }

  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    tracesSampleRate: IS_PRODUCTION ? 0.1 : 1.0, // 10% in prod, 100% in dev
    beforeSend(event: Sentry.ErrorEvent) {
      // Strip sensitive data from error reports
      if (event.request?.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
      }
      return event;
    },
  });

  logger.info('Sentry initialized for error tracking');
}

export { Sentry };
