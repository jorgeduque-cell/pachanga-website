import cron from 'node-cron';
import { prisma } from '../prisma.js';
import { whatsappService } from '../../modules/whatsapp/whatsapp.service.js';
import { logger } from '../logger.js';

// ─── Constants ───────────────────────────────────────────────
const MAX_RETRIES = 3;
const CRON_SCHEDULE = '*/5 * * * *'; // Every 5 minutes
const BATCH_SIZE = 10;

/**
 * Backoff delays in minutes: retry 1 = 1min, retry 2 = 5min, retry 3 = 30min
 */
const BACKOFF_DELAYS_MS = [
  1 * 60 * 1000,   // 1 minute
  5 * 60 * 1000,   // 5 minutes
  30 * 60 * 1000,  // 30 minutes
];

let cronTask: ReturnType<typeof cron.schedule> | null = null;

// ─── Core Logic ──────────────────────────────────────────────

/**
 * Finds FAILED messages eligible for retry (backoff elapsed) and retries them.
 * After MAX_RETRIES, marks as DEAD_LETTER.
 */
export async function processRetryQueue(): Promise<{ retried: number; deadLettered: number }> {
  const now = new Date();
  let retried = 0;
  let deadLettered = 0;

  // Find FAILED messages that haven't exceeded max retries
  const failedMessages = await prisma.whatsAppMessage.findMany({
    where: {
      status: 'FAILED',
      retryCount: { lt: MAX_RETRIES },
    },
    include: { customer: true },
    take: BATCH_SIZE,
    orderBy: { createdAt: 'asc' },
  });

  for (const msg of failedMessages) {
    // Check backoff: enough time must have passed since last retry
    const backoffMs = BACKOFF_DELAYS_MS[msg.retryCount] ?? BACKOFF_DELAYS_MS[BACKOFF_DELAYS_MS.length - 1];
    const lastAttempt = msg.lastRetryAt ?? msg.createdAt;
    const nextRetryAt = new Date(lastAttempt.getTime() + backoffMs);

    if (now < nextRetryAt) {
      continue; // Not time yet, skip
    }

    // Increment retry count BEFORE attempting
    const newRetryCount = msg.retryCount + 1;

    try {
      logger.info(
        { messageId: msg.id, retryCount: newRetryCount, templateName: msg.templateName },
        '[MessageRetry] Retrying failed message',
      );

      // Re-send via WhatsApp service
      await whatsappService.sendTemplate(
        msg.customer.phone,
        msg.templateName,
        [msg.customer.name],
        msg.customerId,
      );

      // If send succeeded, the new message was created. Mark the old one as retried.
      await prisma.whatsAppMessage.update({
        where: { id: msg.id },
        data: {
          retryCount: newRetryCount,
          lastRetryAt: now,
          // Keep FAILED if the re-send created a new record; or mark as SENT
          status: 'SENT',
          sentAt: now,
        },
      });

      retried++;
    } catch (error) {
      // Update retry count even on failure
      const isMaxed = newRetryCount >= MAX_RETRIES;

      await prisma.whatsAppMessage.update({
        where: { id: msg.id },
        data: {
          retryCount: newRetryCount,
          lastRetryAt: now,
          status: isMaxed ? 'DEAD_LETTER' : 'FAILED',
        },
      });

      if (isMaxed) {
        deadLettered++;
        logger.warn(
          { messageId: msg.id, customerId: msg.customerId, templateName: msg.templateName },
          '[MessageRetry] Message moved to DEAD_LETTER after max retries',
        );
      } else {
        logger.warn(
          { messageId: msg.id, retryCount: newRetryCount, err: error },
          '[MessageRetry] Retry failed, will try again later',
        );
      }
    }
  }

  if (retried > 0 || deadLettered > 0) {
    logger.info({ retried, deadLettered }, '[MessageRetry] Retry cycle completed');
  }

  return { retried, deadLettered };
}

// ─── Cron Management ─────────────────────────────────────────

export function startMessageRetry(): void {
  if (cronTask) {
    logger.warn('[MessageRetry] Already running');
    return;
  }

  cronTask = cron.schedule(CRON_SCHEDULE, async () => {
    try {
      await processRetryQueue();
    } catch (error) {
      logger.error({ err: error }, '[MessageRetry] Cron execution failed');
    }
  });

  logger.info('[MessageRetry] Cron started (every 5 minutes)');
}

export function stopMessageRetry(): void {
  if (cronTask) {
    cronTask.stop();
    cronTask = null;
    logger.info('[MessageRetry] Cron stopped');
  }
}
