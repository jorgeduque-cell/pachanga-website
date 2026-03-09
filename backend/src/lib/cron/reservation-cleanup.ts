import { ReservationStatus } from '@prisma/client';
import cron from 'node-cron';
import type { ScheduledTask } from 'node-cron';
import { prisma } from '../prisma.js';

/**
 * Cron job para liberar todas las reservas activas los domingos a las 12:00 PM
 * 
 * Esto incluye:
 * - Reservas con estado PENDING (pendientes)
 * - Reservas con estado CONFIRMED (confirmadas)
 * 
 * Las reservas CANCELLED y COMPLETED no se modifican.
 */

const CLEANUP_SCHEDULE = '0 12 * * 0'; // Domingos a las 12:00 PM
const TIMEZONE = 'America/Bogota';

let task: ScheduledTask | null = null;

/**
 * Cancela todas las reservas activas (PENDING y CONFIRMED)
 */
async function cleanupReservations(): Promise<void> {
  const now = new Date();
  console.log(`[${now.toISOString()}] 🧹 Iniciando limpieza semanal de reservas...`);

  try {
    // Cancelar todas las reservas PENDING y CONFIRMED
    const result = await prisma.reservation.updateMany({
      where: {
        status: {
          in: ['PENDING', 'CONFIRMED'] as ReservationStatus[],
        },
      },
      data: {
        status: 'CANCELLED',
      },
    });

    console.log(`[${new Date().toISOString()}] ✅ Limpieza completada: ${result.count} reservas canceladas`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ❌ Error durante la limpieza de reservas:`, error);
  }
}

/**
 * Inicia el cron job de limpieza de reservas
 * Se ejecuta todos los domingos a las 12:00 PM (mediodía)
 * Formato cron: 0 12 * * 0
 * 
 * Minuto 0, Hora 12, Todos los días del mes, Todos los meses, Domingo (0)
 */
export function startReservationCleanup(): void {
  if (task) {
    console.log('⚠️ Reservation cleanup job already running');
    return;
  }

  // Ejecutar todos los domingos a las 12:00 PM
  task = cron.schedule(CLEANUP_SCHEDULE, () => {
    cleanupReservations().catch((error: unknown) => {
      console.error('❌ Reservation cleanup cron error:', error);
    });
  }, { timezone: TIMEZONE });

  console.log('✅ Reservation cleanup job started (Domingos 12:00 PM America/Bogota)');
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
  await cleanupReservations();
}
