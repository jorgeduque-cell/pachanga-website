import { birthdayEngine } from './birthday-engine.js';
import { startReservationCleanup, stopReservationCleanup } from './reservation-cleanup.js';

export function startCronJobs(): void {
  birthdayEngine.start();
  startReservationCleanup();
  console.log('⏰ All cron jobs initialized');
}

export function stopCronJobs(): void {
  birthdayEngine.stop();
  stopReservationCleanup();
}
