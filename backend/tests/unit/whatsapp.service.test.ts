import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prismaMock } from './setup.js';

// Mock axios for Cloud API calls
vi.mock('axios', () => ({
  default: {
    post: vi.fn().mockResolvedValue({
      data: { messages: [{ id: 'wa-msg-123' }] },
    }),
    isAxiosError: vi.fn().mockReturnValue(false),
  },
}));

const { WhatsAppService } = await import('../../src/modules/whatsapp/whatsapp.service.js');

describe('WhatsAppService', () => {
  let waService: InstanceType<typeof WhatsAppService>;

  beforeEach(() => {
    waService = new WhatsAppService();
  });

  // ─── sendTemplate (dry-run) ────────────────────────────
  describe('sendTemplate (dry-run)', () => {
    it('should create a queued message and mark it as sent', async () => {
      prismaMock.whatsAppMessage.create.mockResolvedValue({
        id: 'msg-1',
        customerId: 'cust-1',
        type: 'WELCOME',
        templateName: 'bienvenida_pachanga',
        status: 'QUEUED',
        waMessageId: null,
        sentAt: null,
        deliveredAt: null,
        readAt: null,
        errorCode: null,
        createdAt: new Date(),
      });

      prismaMock.whatsAppMessage.update.mockResolvedValue({} as any);

      const messageId = await waService.sendTemplate(
        '+573001234567',
        'bienvenida_pachanga',
        ['Juan'],
        'cust-1',
      );

      expect(messageId).toBe('msg-1');
      expect(prismaMock.whatsAppMessage.create).toHaveBeenCalled();
      expect(prismaMock.whatsAppMessage.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'SENT' }),
        }),
      );
    });
  });

  // ─── sendWelcome ───────────────────────────────────────
  describe('sendWelcome', () => {
    it('should call sendTemplate with welcome template', async () => {
      prismaMock.whatsAppMessage.create.mockResolvedValue({
        id: 'msg-2',
        customerId: 'cust-1',
        type: 'WELCOME',
        templateName: 'bienvenida_pachanga',
        status: 'QUEUED',
        waMessageId: null,
        sentAt: null,
        deliveredAt: null,
        readAt: null,
        errorCode: null,
        createdAt: new Date(),
      });
      prismaMock.whatsAppMessage.update.mockResolvedValue({} as any);

      const customer = {
        id: 'cust-1',
        name: 'Juan',
        phone: '+573001234567',
      } as any;

      const result = await waService.sendWelcome(customer);

      expect(result).toBe('msg-2');
    });
  });

  // ─── updateMessageStatus ───────────────────────────────
  describe('updateMessageStatus', () => {
    it('should update status to DELIVERED with timestamp', async () => {
      prismaMock.whatsAppMessage.findFirst.mockResolvedValue({
        id: 'msg-1',
      } as any);
      prismaMock.whatsAppMessage.update.mockResolvedValue({} as any);

      await waService.updateMessageStatus('wa-msg-123', 'delivered');

      expect(prismaMock.whatsAppMessage.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'DELIVERED',
            deliveredAt: expect.any(Date),
          }),
        }),
      );
    });

    it('should update status to READ with timestamp', async () => {
      prismaMock.whatsAppMessage.findFirst.mockResolvedValue({
        id: 'msg-1',
      } as any);
      prismaMock.whatsAppMessage.update.mockResolvedValue({} as any);

      await waService.updateMessageStatus('wa-msg-123', 'read');

      expect(prismaMock.whatsAppMessage.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'READ' }),
        }),
      );
    });

    it('should skip if message not found', async () => {
      prismaMock.whatsAppMessage.findFirst.mockResolvedValue(null);

      await waService.updateMessageStatus('unknown-id', 'delivered');

      expect(prismaMock.whatsAppMessage.update).not.toHaveBeenCalled();
    });
  });
});
