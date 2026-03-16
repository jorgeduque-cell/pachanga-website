import { PrismaClient } from '@prisma/client';
import { logger } from './logger.js';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'error', 'warn']
    : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Single connection point — called from server.ts startServer()
prisma.$connect()
  .then(() => logger.info('[Prisma] Connected to database'))
  .catch((err) => {
    logger.fatal({ err }, '[Prisma] Connection error');
    // Skip process.exit in test — vitest workers handle transient connection failures
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
  });
