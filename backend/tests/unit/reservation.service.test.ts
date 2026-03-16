import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prismaMock } from './setup.js';
import type { Reservation, ReservationStatus, TableZone } from '@prisma/client';

const { ReservationService } = await import('../../src/modules/reservations/reservation.service.js');

// Mock CRM linkToReservation
vi.mock('../../src/modules/crm/crm.service.js', () => ({
  crmService: {
    linkToReservation: vi.fn().mockResolvedValue(undefined),
  },
}));

// ─── Helpers ─────────────────────────────────────────────
function mockReservation(overrides: Partial<Reservation> = {}): Reservation {
  return {
    id: 'res-1',
    customerName: 'Juan Pérez',
    customerPhone: '+573001234567',
    reservationDate: new Date('2026-06-20'),
    reservationTime: '21:00',
    partySize: 4,
    message: null,
    status: 'PENDING' as ReservationStatus,
    tableId: 'table-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('ReservationService', () => {
  let reservationService: InstanceType<typeof ReservationService>;

  beforeEach(() => {
    reservationService = new ReservationService();
  });

  // ─── create ────────────────────────────────────────────
  describe('create', () => {
    const input = {
      customerName: 'Juan Pérez',
      customerPhone: '3001234567',
      reservationDate: '2026-06-20',
      reservationTime: '21:00' as const,
      partySize: 4,
      tableId: 'table-1',
    };

    it('should create a reservation with PENDING status', async () => {
      // Mock no conflict
      prismaMock.reservation.findFirst.mockResolvedValue(null);
      // Mock table exists
      prismaMock.table.findUnique.mockResolvedValue({
        id: 'table-1',
        name: 'VIP-1',
        capacity: 6,
        zone: 'VIP' as TableZone,
        floor: 1,
        posX: 0,
        posY: 0,
        isActive: true,
        createdAt: new Date(),
      });
      // Mock transaction
      const createdReservation = {
        ...mockReservation(),
        table: { id: 'table-1', name: 'VIP-1', zone: 'VIP', capacity: 6 },
      };
      prismaMock.$transaction.mockResolvedValue(createdReservation as any);

      const result = await reservationService.create(input);

      expect(result.status).toBe('PENDING');
      expect(result.customerName).toBe('Juan Pérez');
    });

    it('should throw 400 for past date', async () => {
      const pastInput = { ...input, reservationDate: '2020-01-01' };

      await expect(reservationService.create(pastInput))
        .rejects.toThrow('pasada');
    });

    it('should throw 409 for table conflict', async () => {
      // Mock table exists
      prismaMock.table.findUnique.mockResolvedValue({
        id: 'table-1',
        name: 'VIP-1',
        capacity: 6,
        zone: 'VIP' as TableZone,
        floor: 1,
        posX: 0,
        posY: 0,
        isActive: true,
        createdAt: new Date(),
      });
      // Mock conflict exists
      prismaMock.reservation.findFirst.mockResolvedValue(mockReservation());

      await expect(reservationService.create(input))
        .rejects.toThrow();
    });
  });

  // ─── cancel ────────────────────────────────────────────
  describe('cancel', () => {
    it('should cancel a PENDING reservation', async () => {
      prismaMock.reservation.findUnique.mockResolvedValue(
        { ...mockReservation(), table: null } as any,
      );
      prismaMock.reservation.update.mockResolvedValue(
        { ...mockReservation({ status: 'CANCELLED' }), table: null } as any,
      );

      const result = await reservationService.cancel('res-1');

      expect(result.status).toBe('CANCELLED');
    });

    it('should throw if already cancelled', async () => {
      prismaMock.reservation.findUnique.mockResolvedValue(
        { ...mockReservation({ status: 'CANCELLED' }), table: null } as any,
      );

      await expect(reservationService.cancel('res-1'))
        .rejects.toThrow('cancelada');
    });

    it('should throw if already completed', async () => {
      prismaMock.reservation.findUnique.mockResolvedValue(
        { ...mockReservation({ status: 'COMPLETED' }), table: null } as any,
      );

      await expect(reservationService.cancel('res-1'))
        .rejects.toThrow('completada');
    });
  });

  // ─── getById ───────────────────────────────────────────
  describe('getById', () => {
    it('should return reservation with table', async () => {
      prismaMock.reservation.findUnique.mockResolvedValue(
        { ...mockReservation(), table: { id: 'table-1', name: 'VIP-1' } } as any,
      );

      const result = await reservationService.getById('res-1');

      expect(result.id).toBe('res-1');
    });

    it('should throw 404 if not found', async () => {
      prismaMock.reservation.findUnique.mockResolvedValue(null);

      await expect(reservationService.getById('non-existent'))
        .rejects.toThrow('Reserva no encontrada');
    });
  });
});
