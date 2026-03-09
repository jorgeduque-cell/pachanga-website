import { ReservationStatus } from '@prisma/client';
import cron from 'node-cron';
import type { ScheduledTask } from 'node-cron';
import { prisma } from '../prisma.js';

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
  console.log(`[${now.toISOString()}] 🧹 Iniciando limpieza nocturna de reservas...`);

  try {
    // Calculate "yesterday" in Bogota timezone
    const bogotaNow = new Date(now.toLocaleString('en-US', { timeZone: TIMEZONE }));
    const yesterday = new Date(bogotaNow);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

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

    console.log(
      `[${new Date().toISOString()}] ✅ Limpieza nocturna completada: ${result.count} reservas completadas ` +
      `(fecha: ${yesterday.toISOString().split('T')[0]})`
    );
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ❌ Error durante la limpieza nocturna:`, error);
  }
}

/**
 * Inicia el cron job de limpieza nocturna.
 * Se ejecuta a las 3:00 AM los Viernes, Sábados y Domingos.
 * Limpia las reservas de Jueves, Viernes y Sábado respectivamente.
 */
export function startReservationCleanup(): void {
  if (task) {
    console.log('⚠️ Reservation cleanup job already running');
    return;
  }

  task = cron.schedule(CLEANUP_SCHEDULE, () => {
    cleanupNightReservations().catch((error: unknown) => {
      console.error('❌ Reservation cleanup cron error:', error);
    });
  }, { timezone: TIMEZONE });

  console.log('✅ Reservation cleanup job started (Vie/Sáb/Dom 3:00 AM America/Bogota)');
}

/**
 * Detiene el cron job de limpieza de reservas
 */
export function stopReservationCleanup(): void {
  if (task) {
    task.stop();
    task = null;
    console.log('✅ Reservation cleanup job stopped');
  }
}

/**
 * Ejecuta la limpieza manualmente (para pruebas)
 */
export async function runCleanupNow(): Promise<void> {
  console.log('🧹 Ejecutando limpieza manual...');
  await cleanupNightReservations();
}
