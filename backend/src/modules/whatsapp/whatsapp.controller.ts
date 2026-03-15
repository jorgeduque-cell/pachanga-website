import { Request, Response, NextFunction } from 'express';
import { env } from '../../config/env.js';
import { whatsappService } from './whatsapp.service.js';
import { crmService } from '../crm/crm.service.js';
import { prisma } from '../../lib/prisma.js';
import { logger } from '../../lib/logger.js';

// ─── Types ───────────────────────────────────────────────────
interface WebhookStatus {
  id: string;
  status: string;
  timestamp: string;
}

interface WebhookMessage {
  from: string;
  type: string;
  text?: { body: string };
  timestamp: string;
}

// ─── Controller ─────────────────────────────────────────────
export class WhatsAppController {
  verify(req: Request, res: Response): void {
    const mode = req.query['hub.mode'] as string;
    const token = req.query['hub.verify_token'] as string;
    const challenge = req.query['hub.challenge'] as string;

    if (mode === 'subscribe' && token === env.WHATSAPP_VERIFY_TOKEN) {
      res.status(200).send(challenge);
    } else {
      res.status(403).json({ error: 'Forbidden' });
    }
  }

  async handleEvent(req: Request, res: Response, _next: NextFunction): Promise<void> {
    // Always reply 200 immediately (Meta requirement)
    res.status(200).send('OK');

    try {
      const entries = req.body?.entry ?? [];
      for (const entry of entries) {
        for (const change of entry.changes ?? []) {
          const value = change.value;
          await this.processStatuses(value?.statuses);
          await this.processMessages(value?.messages);
        }
      }
    } catch (error: unknown) {
      logger.error({ err: error }, 'Webhook processing error');
    }
  }

  // ─── Private ──────────────────────────────────────────────

  private async processStatuses(statuses?: WebhookStatus[]): Promise<void> {
    if (!statuses) return;
    for (const status of statuses) {
      await whatsappService.updateMessageStatus(
        status.id,
        status.status as 'delivered' | 'read' | 'failed',
      );
    }
  }

  private async processMessages(messages?: WebhookMessage[]): Promise<void> {
    if (!messages) return;
    for (const msg of messages) {
      const customer = await prisma.customer.findUnique({
        where: { phone: `+${msg.from}` },
      });
      if (customer) {
        await crmService.logCustomerReply(customer.id, msg.text?.body ?? '', msg.type);
      }
    }
  }
}

export const whatsappController = new WhatsAppController();
