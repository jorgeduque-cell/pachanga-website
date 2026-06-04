import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockDeep, mockReset, type DeepMockProxy } from 'vitest-mock-extended';
import { PrismaClient } from '@prisma/client';

// ─── Create mocks BEFORE importing modules that use them ────
const prismaMock = mockDeep<PrismaClient>();

vi.mock('../../src/lib/prisma.js', () => ({
  prisma: prismaMock,
}));

vi.mock('../../src/services/socket.service.js', () => ({
  socketService: {
    emitNewReservation: vi.fn(),
    emitReservationUpdated: vi.fn(),
    emitReservationCancelled: vi.fn(),
  },
}));

// NOW import the modules that depend on prisma
const { processRetryQueue } = await import('../../src/lib/cron/message-retry.js');
const { whatsappService } = await import('../../src/modules/whatsapp/whatsapp.service.js');

describe('MessageRetry — processRetryQueue', () => {
  beforeEach(() => {
    mockReset(prismaMock);
    vi.restoreAllMocks();
  });

  it('should skip messages where backoff has not elapsed', async () => {
    const recentMessage = {
      id: 'msg-1',
      customerId: 'cust-1',
      templateName: 'pachanga_bienvenida',
      status: 'FAILED',
      retryCount: 0,
      lastRetryAt: null,
      createdAt: new Date(), // Just created — backoff not elapsed
      customer: { id: 'cust-1', name: 'Test', phone: '+573001234567' },
    };

    prismaMock.whatsAppMessage.findMany.mockResolvedValue([recentMessage] as any);

    const result = await processRetryQueue();

    expect(result.retried).toBe(0);
    expect(result.deadLettered).toBe(0);
  });

  it('should retry a failed message after backoff time', async () => {
    const oldMessage = {
      id: 'msg-2',
      customerId: 'cust-2',
      templateName: 'pachanga_bienvenida',
      status: 'FAILED',
      retryCount: 0,
      lastRetryAt: null,
      createdAt: new Date(Date.now() - 5 * 60 * 1000), // 5 min ago
      customer: { id: 'cust-2', name: 'Retry Test', phone: '+573009876543' },
    };

    prismaMock.whatsAppMessage.findMany.mockResolvedValue([oldMessage] as any);

    // Mock sendTemplate to succeed (it internally uses prisma too)
    const sendSpy = vi.spyOn(whatsappService, 'sendTemplate').mockResolvedValue('new-msg-id');
    // The retry verifies the new row reached SENT before marking the old one retried.
    prismaMock.whatsAppMessage.findUnique.mockResolvedValue({ status: 'SENT', errorCode: null } as any);
    prismaMock.whatsAppMessage.update.mockResolvedValue({} as any);

    const result = await processRetryQueue();

    expect(result.retried).toBe(1);
    expect(sendSpy).toHaveBeenCalledWith(
      '+573009876543',
      'pachanga_bienvenida',
      ['Retry Test'],
      'cust-2',
      undefined,
      { type: 'image', url: expect.any(String) },
    );
    expect(prismaMock.whatsAppMessage.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'msg-2' },
        data: expect.objectContaining({ retryCount: 1, status: 'SENT' }),
      }),
    );
  });

  it('should move to DEAD_LETTER after max retries', async () => {
    const maxedMessage = {
      id: 'msg-3',
      customerId: 'cust-3',
      templateName: 'cumpleaos_pachanga',
      status: 'FAILED',
      retryCount: 2, // Next attempt = #3 = max
      lastRetryAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      customer: { id: 'cust-3', name: 'Max Retry', phone: '+573005555555' },
    };

    prismaMock.whatsAppMessage.findMany.mockResolvedValue([maxedMessage] as any);
    vi.spyOn(whatsappService, 'sendTemplate').mockRejectedValue(new Error('API down'));
    prismaMock.whatsAppMessage.update.mockResolvedValue({} as any);

    const result = await processRetryQueue();

    expect(result.deadLettered).toBe(1);
    expect(prismaMock.whatsAppMessage.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'msg-3' },
        data: expect.objectContaining({ retryCount: 3, status: 'DEAD_LETTER' }),
      }),
    );
  });

  it('should dead-letter a permanent error code (e.g. 131042 payment) without retrying', async () => {
    const permanentFail = {
      id: 'msg-perm',
      customerId: 'cust-perm',
      templateName: 'pachanga_bienvenida',
      status: 'FAILED',
      errorCode: '131042', // Business eligibility / payment issue — never recovers via retry
      retryCount: 0,
      lastRetryAt: null,
      createdAt: new Date(Date.now() - 10 * 60 * 1000), // backoff elapsed
      customer: { id: 'cust-perm', name: 'Payment Fail', phone: '+573007777777' },
    };

    prismaMock.whatsAppMessage.findMany.mockResolvedValue([permanentFail] as any);
    const sendSpy = vi.spyOn(whatsappService, 'sendTemplate');
    prismaMock.whatsAppMessage.update.mockResolvedValue({} as any);

    const result = await processRetryQueue();

    expect(result.deadLettered).toBe(1);
    expect(result.retried).toBe(0);
    // No new send attempt should be made for a permanent error.
    expect(sendSpy).not.toHaveBeenCalled();
    expect(prismaMock.whatsAppMessage.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'msg-perm' },
        data: expect.objectContaining({ status: 'DEAD_LETTER' }),
      }),
    );
  });

  it('should return zeros when no failed messages exist', async () => {
    prismaMock.whatsAppMessage.findMany.mockResolvedValue([]);

    const result = await processRetryQueue();

    expect(result.retried).toBe(0);
    expect(result.deadLettered).toBe(0);
  });
});
