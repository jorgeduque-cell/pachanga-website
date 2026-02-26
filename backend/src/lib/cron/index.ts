import { birthdayEngine } from './birthday-engine.js';

export function startCronJobs(): void {
  birthdayEngine.start();
  console.log('⏰ All cron jobs initialized');
}

export function stopCronJobs(): void {
  birthdayEngine.stop();
}
