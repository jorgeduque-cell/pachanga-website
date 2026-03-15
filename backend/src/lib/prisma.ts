import { PrismaClient } from '@prisma/client';

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
  .then(() => console.log('[Prisma] Connected to database'))
  .catch((err) => {
    console.error('[Prisma] Connection error:', err);
    process.exit(1);
  });
