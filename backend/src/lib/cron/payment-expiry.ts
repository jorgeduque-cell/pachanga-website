import { chatbotPaymentService } from '../../modules/chatbot/chatbot.payment.js';
import { logger } from '../logger.js';

// ─── Payment Expiry Cron ────────────────────────────────────
// Runs every hour to expire stale PENDING payments (> 48 hours)

let intervalId: NodeJS.Timeout | null = null;
const INTERVAL_MS = 60 * 60 * 1000; // 1 hour

export function startPaymentExpiry(): void {
    // Run immediately on startup
    runExpiryCheck();

    // Then run every hour
    intervalId = setInterval(runExpiryCheck, INTERVAL_MS);
    logger.info('[Cron] Payment expiry job started (every 1h)');
}

export function stopPaymentExpiry(): void {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
        logger.info('[Cron] Payment expiry job stopped');
    }
}

async function runExpiryCheck(): Promise<void> {
    try {
        const count = await chatbotPaymentService.expireStalePayments();
        if (count > 0) {
            logger.info({ count }, '[Cron] Expired stale payments');
        }
    } catch (error) {
        logger.error({ err: error }, '[Cron] Payment expiry check failed');
    }
}
