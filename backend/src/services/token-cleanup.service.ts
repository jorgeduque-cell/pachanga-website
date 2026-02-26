import { tokenService } from './token.service.js';

// Intervalo de limpieza: cada hora
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // 1 hora

export class TokenCleanupService {
  private intervalId: NodeJS.Timeout | null = null;

  start(): void {
    if (this.intervalId) {
      console.log('⚠️ Token cleanup service ya está corriendo');
      return;
    }

    // Ejecutar limpieza inmediatamente al iniciar
    this.cleanup();

    // Programar ejecución periódica
    this.intervalId = setInterval(() => {
      this.cleanup();
    }, CLEANUP_INTERVAL_MS);

    console.log('🧹 Token cleanup service iniciado (cada 1 hora)');
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('🛑 Token cleanup service detenido');
    }
  }

  private async cleanup(): Promise<void> {
    try {
      await tokenService.cleanupExpiredTokens();
      console.log('🧹 Limpieza de tokens expirados completada');
    } catch (error) {
      console.error('❌ Error durante limpieza de tokens:', error);
    }
  }
}

export const tokenCleanupService = new TokenCleanupService();
