import { birthdayEngine } from './birthday-engine.js';
import { startReservationCleanup, stopReservationCleanup } from './reservation-cleanup.js';

export function startCronJobs(): void {
  try {
    birthdayEngine.start();
    console.log('🎂 Birthday engine started');
    
    startReservationCleanup();
    console.log('🧹 Reservation cleanup started');
    
    console.log('⏰ All cron jobs initialized');
  } catch (error) {
    console.error('❌ Error starting cron jobs:', error);
  }
}

export function stopCronJobs(): void {
  try {
    birthdayEngine.stop();
    stopReservationCleanup();
    console.log('⏰ All cron jobs stopped');
  } catch (error) {
    console.error('❌ Error stopping cron jobs:', error);
  }
}
