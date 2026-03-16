import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prismaMock } from './setup.js';
import type { Customer, CustomerSource } from '@prisma/client';

// Mock WhatsApp + CRM dependencies
vi.mock('../../src/modules/whatsapp/whatsapp.service.js', () => ({
  whatsappService: {
    sendWelcome: vi.fn().mockResolvedValue('msg-1'),
    sendTemplate: vi.fn().mockResolvedValue('msg-2'),
    sendBirthday: vi.fn().mockResolvedValue('msg-3'),
  },
}));

const { CrmService } = await import('../../src/modules/crm/crm.service.js');

// ─── Helpers ─────────────────────────────────────────────
function mockCustomer(overrides: Partial<Customer> = {}): Customer {
  return {
    id: 'cust-1',
    name: 'Juan Pérez',
    phone: '+573001234567',
    birthDate: new Date('1990-05-15'),
    rating: 5,
    source: 'QR_SCAN' as CustomerSource,
    totalVisits: 1,
    lastVisitAt: new Date(),
    optIn: true,
    notes: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('CrmService', () => {
  let crmService: InstanceType<typeof CrmService>;

  beforeEach(() => {
    crmService = new CrmService();
  });

  // ─── capture ───────────────────────────────────────────
  describe('capture', () => {
    const captureData = {
      name: 'Juan Pérez',
      phone: '3001234567',
      birthDate: '1990-05-15',
      rating: 5,
      qrTable: 'VIP-1',
      optIn: true,
    };

    it('should return isNew=true for a new customer (totalVisits=1)', async () => {
      prismaMock.customer.upsert.mockResolvedValue(mockCustomer({ totalVisits: 1 }));
      prismaMock.interaction.create.mockResolvedValue({} as any);

      const result = await crmService.capture(captureData);

      expect(result.isNew).toBe(true);
      expect(result.customer.name).toBe('Juan Pérez');
    });

    it('should return isNew=false for a returning customer', async () => {
      prismaMock.customer.upsert.mockResolvedValue(mockCustomer({ totalVisits: 3 }));
      prismaMock.interaction.create.mockResolvedValue({} as any);

      const result = await crmService.capture(captureData);

      expect(result.isNew).toBe(false);
    });
  });

  // ─── findById ──────────────────────────────────────────
  describe('findById', () => {
    it('should return customer with interactions', async () => {
      prismaMock.customer.findUnique.mockResolvedValue({
        ...mockCustomer(),
        interactions: [],
        messages: [],
      } as any);

      const result = await crmService.findById('cust-1');

      expect(result.name).toBe('Juan Pérez');
    });

    it('should throw 404 if customer not found', async () => {
      prismaMock.customer.findUnique.mockResolvedValue(null);

      await expect(crmService.findById('non-existent'))
        .rejects.toThrow('Cliente no encontrado');
    });
  });

  // ─── update ────────────────────────────────────────────
  describe('update', () => {
    it('should update customer fields', async () => {
      prismaMock.customer.findUnique.mockResolvedValue(mockCustomer());
      prismaMock.customer.update.mockResolvedValue(mockCustomer({ notes: 'VIP client' }));

      const result = await crmService.update('cust-1', { notes: 'VIP client' });

      expect(result.notes).toBe('VIP client');
    });
  });

  // ─── getStats ──────────────────────────────────────────
  describe('getStats', () => {
    it('should aggregate statistics correctly', async () => {
      prismaMock.customer.count
        .mockResolvedValueOnce(100)   // totalCustomers
        .mockResolvedValueOnce(15)    // newThisMonth
        .mockResolvedValueOnce(80);   // activeCustomers

      prismaMock.customer.aggregate.mockResolvedValue({
        _avg: { rating: 4.2 },
        _count: {},
        _sum: {},
        _min: {},
        _max: {},
      } as any);

      prismaMock.customer.groupBy.mockResolvedValue([
        { source: 'QR_SCAN', _count: { source: 60 } },
        { source: 'RESERVATION', _count: { source: 30 } },
      ] as any);

      const stats = await crmService.getStats();

      expect(stats.totalCustomers).toBe(100);
      expect(stats.newThisMonth).toBe(15);
      expect(stats.activeCustomers).toBe(80);
      expect(stats.avgRating).toBe(4.2);
      expect(stats.topSources).toHaveLength(2);
    });
  });

  // ─── config ────────────────────────────────────────────
  describe('getConfig / updateConfig', () => {
    it('should return config as key-value map', async () => {
      prismaMock.crmConfig.findMany.mockResolvedValue([
        { id: '1', key: 'birthday_cron_enabled', value: 'true', updatedAt: new Date() },
      ]);

      const config = await crmService.getConfig();

      expect(config.birthday_cron_enabled).toBe('true');
    });

    it('should upsert config value', async () => {
      prismaMock.crmConfig.upsert.mockResolvedValue({} as any);

      await crmService.updateConfig('birthday_cron_enabled', 'false');

      expect(prismaMock.crmConfig.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { key: 'birthday_cron_enabled' },
          update: { value: 'false' },
        }),
      );
    });
  });
});
