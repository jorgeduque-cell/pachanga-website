import cron from 'node-cron';
import { prisma } from '../prisma.js';
import { whatsappService, type HeaderMedia } from '../../modules/whatsapp/whatsapp.service.js';
import { env } from '../../config/env.js';
import { logger } from '../logger.js';

// ─── Constants ───────────────────────────────────────────────
const MAX_RETRIES = 3;
const CRON_SCHEDULE = '*/5 * * * *'; // Every 5 minutes
const BATCH_SIZE = 10;

/**
 * Templates that need dynamic parameters (JWT tokens, video headers, etc.)
 * and cannot be safely retried without reconstructing those params.
 * These get immediately DEAD_LETTER'd on failure.
 */
const NON_RETRYABLE_TEMPLATES = new Set([
  'encuesta_pachanga',   // Needs survey JWT token in button + video header
]);

/**
 * Meta Cloud API error codes that are PERMANENT for a message — retrying will
 * never succeed (account/billing, auth, malformed template/params, or a
 * recipient that can't receive). These are dead-lettered immediately instead of
 * burning retries, Meta quota and quality rating on doomed sends.
 *
 * Transient codes (rate limits, temporary outages, network errors) are
 * intentionally NOT listed here, so they keep the normal backoff-retry path.
 */
const PERMANENT_ERROR_CODES = new Set<string>([
  // Account / billing / auth — need human intervention, never recover via retry
  '131042', // Business eligibility / payment issue
  '131031', // Account locked
  '131045', // Phone number not registered / certificate issue
  '190',    // Access token expired or invalid
  '200',    // Permissions error
  '10',     // Permission denied
  // Template / content / parameter errors — message is malformed, retry won't help
  '131008', // Required parameter missing
  '131009', // Parameter value invalid (e.g. expired media id)
  '132000', // Number of parameters does not match template
  '132001', // Template does not exist or wrong language
  '132005', // Translated text too long
  '132007', // Template format / content-policy violation
  '132012', // Template parameter format mismatch
  // Recipient errors — number can't receive, retry won't help
  '131026', // Message undeliverable (recipient not on WhatsApp / invalid)
  '131051', // Unsupported message type
]);

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
 * Templates in NON_RETRYABLE_TEMPLATES are immediately DEAD_LETTER'd.
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
    // Skip non-retryable templates — mark as DEAD_LETTER immediately
    if (NON_RETRYABLE_TEMPLATES.has(msg.templateName)) {
      await prisma.whatsAppMessage.update({
        where: { id: msg.id },
        data: { status: 'DEAD_LETTER', lastRetryAt: now },
      });
      deadLettered++;
      logger.info(
        { messageId: msg.id, templateName: msg.templateName },
        '[MessageRetry] Non-retryable template, moved to DEAD_LETTER',
      );
      continue;
    }

    // Permanent failure (payment/account, auth, malformed template, dead recipient):
    // retrying will never succeed, so dead-letter immediately without a new API call.
    if (msg.errorCode && PERMANENT_ERROR_CODES.has(msg.errorCode)) {
      await prisma.whatsAppMessage.update({
        where: { id: msg.id },
        data: { status: 'DEAD_LETTER', lastRetryAt: now },
      });
      deadLettered++;
      logger.warn(
        { messageId: msg.id, errorCode: msg.errorCode, templateName: msg.templateName },
        '[MessageRetry] Permanent error code — moved to DEAD_LETTER without retry',
      );
      continue;
    }

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

      // Build header media based on template type.
      // Use the permanent Supabase URL (Media IDs expire and break retries — see whatsapp.service.ts).
      let headerMedia: HeaderMedia | undefined;
      if (msg.templateName === 'pachanga_bienvenida') {
        headerMedia = { type: 'image', url: env.WHATSAPP_WELCOME_IMAGE_URL };
      }
      // Note: 'encuesta_pachanga' has video header but is in NON_RETRYABLE_TEMPLATES

      // Re-send via WhatsApp service. sendTemplate swallows API errors
      // internally and returns the new message ID regardless of outcome,
      // so we must inspect the new row's status to know if it actually worked.
      const newMessageId = await whatsappService.sendTemplate(
        msg.customer.phone,
        msg.templateName,
        [msg.customer.name],
        msg.customerId,
        undefined, // buttonParams - not needed for welcome retry
        headerMedia,
      );

      const newMessage = await prisma.whatsAppMessage.findUnique({
        where: { id: newMessageId },
        select: { status: true, errorCode: true },
      });

      if (newMessage?.status !== 'SENT') {
        throw new Error(
          `Retry send did not reach SENT (status=${newMessage?.status}, errorCode=${newMessage?.errorCode ?? 'none'})`,
        );
      }

      await prisma.whatsAppMessage.update({
        where: { id: msg.id },
        data: {
          retryCount: newRetryCount,
          lastRetryAt: now,
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

  if (process.env.MESSAGE_RETRY_DISABLED === 'true') {
    logger.warn('[MessageRetry] Cron DISABLED via MESSAGE_RETRY_DISABLED=true');
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
