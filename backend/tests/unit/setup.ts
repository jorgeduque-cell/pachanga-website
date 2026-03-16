/**
 * Unit test setup — creates a deep mock of PrismaClient.
 * No real database connection is used.
 */
import { vi } from 'vitest';
import { mockDeep, mockReset, type DeepMockProxy } from 'vitest-mock-extended';
import { PrismaClient } from '@prisma/client';

// Create a deep mock of PrismaClient
export const prismaMock = mockDeep<PrismaClient>();

// Mock the prisma module so all imports get the mock
vi.mock('../../src/lib/prisma.js', () => ({
  prisma: prismaMock,
}));

// Mock socket service (fire-and-forget, not relevant for unit tests)
vi.mock('../../src/services/socket.service.js', () => ({
  socketService: {
    emitNewReservation: vi.fn(),
    emitReservationUpdated: vi.fn(),
    emitReservationCancelled: vi.fn(),
  },
}));

// Reset all mocks between tests
beforeEach(() => {
  mockReset(prismaMock);
});

export type PrismaMock = DeepMockProxy<PrismaClient>;
