import { logger } from '../lib/logger.js';
import { tokenService } from './token.service.js';

// Intervalo de limpieza: cada hora
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // 1 hora

export class TokenCleanupService {
  private intervalId: NodeJS.Timeout | null = null;

  start(): void {
    if (this.intervalId) {
      logger.warn('Token cleanup service already running');
      return;
    }

    // Ejecutar limpieza inmediatamente al iniciar
    this.cleanup();

    // Programar ejecución periódica
    this.intervalId = setInterval(() => {
      this.cleanup();
    }, CLEANUP_INTERVAL_MS);

    logger.info('Token cleanup service started (every 1 hour)');
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      logger.info('Token cleanup service stopped');
    }
  }

  private async cleanup(): Promise<void> {
    try {
      await tokenService.cleanupExpiredTokens();
      logger.debug('Expired token cleanup completed');
    } catch (error) {
      logger.error({ err: error }, 'Token cleanup failed');
    }
  }
}

export const tokenCleanupService = new TokenCleanupService();
