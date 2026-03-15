import { ReservationStatus } from '@prisma/client';
import cron from 'node-cron';
import type { ScheduledTask } from 'node-cron';
import { prisma } from '../prisma.js';
import { logger } from '../logger.js';

/**
 * Cron job para completar las reservas de la noche anterior.
 * 
 * Se ejecuta a las 3:00 AM los Viernes, Sábados y Domingos
 * (para limpiar las noches de Jueves, Viernes y Sábado respectivamente).
 * 
 * Marca como COMPLETED todas las reservas PENDING y CONFIRMED
 * cuya fecha sea el día anterior, liberando las mesas.
 */

// Viernes(5), Sábado(6), Domingo(0) a las 3:00 AM
const CLEANUP_SCHEDULE = '0 3 * * 0,5,6';
const TIMEZONE = 'America/Bogota';

let task: ScheduledTask | null = null;

/**
 * Completa las reservas activas de la noche anterior.
 * Solo afecta reservas con reservationDate = ayer.
 */
async function cleanupNightReservations(): Promise<void> {
  const now = new Date();
  logger.info('Starting nightly reservation cleanup...');

  try {
    // Calculate "yesterday" in Bogota timezone (UTC-5) using reliable UTC arithmetic
    const UTC_OFFSET_BOGOTA_HOURS = -5;
    const bogotaNow = new Date(now.getTime() + (UTC_OFFSET_BOGOTA_HOURS * 60 * 60 * 1000));
    const yesterday = new Date(Date.UTC(
      bogotaNow.getUTCFullYear(),
      bogotaNow.getUTCMonth(),
      bogotaNow.getUTCDate() - 1,
    ));

    const result = await prisma.reservation.updateMany({
      where: {
        reservationDate: yesterday,
        status: {
          in: ['PENDING', 'CONFIRMED'] as ReservationStatus[],
        },
      },
      data: {
        status: 'COMPLETED',
      },
    });

    logger.info(
      { count: result.count, date: yesterday.toISOString().split('T')[0] },
      'Nightly reservation cleanup completed',
    );
  } catch (error) {
    logger.error({ err: error }, 'Nightly reservation cleanup failed');
  }
}

/**
 * Inicia el cron job de limpieza nocturna.
 * Se ejecuta a las 3:00 AM los Viernes, Sábados y Domingos.
 * Limpia las reservas de Jueves, Viernes y Sábado respectivamente.
 */
export function startReservationCleanup(): void {
  if (task) {
    logger.warn('Reservation cleanup job already running');
    return;
  }

  task = cron.schedule(CLEANUP_SCHEDULE, () => {
    cleanupNightReservations().catch((error: unknown) => {
      logger.error({ err: error }, 'Reservation cleanup cron error');
    });
  }, { timezone: TIMEZONE });

  logger.info('Reservation cleanup job started (Fri/Sat/Sun 3:00 AM America/Bogota)');
}

/**
 * Detiene el cron job de limpieza de reservas
 */
export function stopReservationCleanup(): void {
  if (task) {
    task.stop();
    task = null;
    logger.info('Reservation cleanup job stopped');
  }
}

/**
 * Ejecuta la limpieza manualmente (para pruebas)
 */
export async function runCleanupNow(): Promise<void> {
  logger.info('Running manual reservation cleanup...');
  await cleanupNightReservations();
}
