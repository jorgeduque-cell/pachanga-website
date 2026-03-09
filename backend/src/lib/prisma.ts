import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// DEBUG: Log database URL (hide password)
const dbUrl = process.env.DATABASE_URL || 'NOT SET';
const maskedUrl = dbUrl.replace(/:([^:@]+)@/, ':***@');
console.log('[Prisma] DATABASE_URL:', maskedUrl);

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'error', 'warn']
    : ['query', 'error'], // Enable query logging in production too for debug
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Test connection on startup
prisma.$connect()
  .then(() => console.log('[Prisma] Connected to database'))
  .catch((err) => console.error('[Prisma] Connection error:', err));
