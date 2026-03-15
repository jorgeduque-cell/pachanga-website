import { birthdayEngine } from './birthday-engine.js';
import { startReservationCleanup, stopReservationCleanup } from './reservation-cleanup.js';
import { surveySender } from './survey-sender.js';
import { logger } from '../logger.js';

export function startCronJobs(): void {
  try {
    birthdayEngine.start();
    startReservationCleanup();
    surveySender.start();
    logger.info('All cron jobs initialized');
  } catch (error) {
    logger.error({ err: error }, 'Error starting cron jobs');
  }
}

export function stopCronJobs(): void {
  try {
    birthdayEngine.stop();
    stopReservationCleanup();
    surveySender.stop();
    logger.info('All cron jobs stopped');
  } catch (error) {
    logger.error({ err: error }, 'Error stopping cron jobs');
  }
}
