import { beforeAll, afterAll } from 'vitest';
import { prisma } from '../src/lib/prisma.js';

beforeAll(async () => {
  // Connect to test database
  await prisma.$connect();
});

afterAll(async () => {
  // Disconnect from test database
  await prisma.$disconnect();
});
