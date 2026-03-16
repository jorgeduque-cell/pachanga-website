import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { env } from '../../config/env.js';
import { whatsappService } from './whatsapp.service.js';
import { crmService } from '../crm/crm.service.js';
import { prisma } from '../../lib/prisma.js';
import { logger } from '../../lib/logger.js';

// ─── Webhook Payload Schema ─────────────────────────────────
const WebhookStatusSchema = z.object({
  id: z.string(),
  status: z.string(),
  timestamp: z.string(),
});

const WebhookMessageSchema = z.object({
  from: z.string(),
  type: z.string(),
  text: z.object({ body: z.string() }).optional(),
  timestamp: z.string(),
});

const WebhookPayloadSchema = z.object({
  entry: z.array(z.object({
    changes: z.array(z.object({
      value: z.object({
        statuses: z.array(WebhookStatusSchema).optional(),
        messages: z.array(WebhookMessageSchema).optional(),
      }).passthrough(),
    })).optional(),
  })).optional(),
});

// ─── Types ───────────────────────────────────────────────────
type WebhookStatus = z.infer<typeof WebhookStatusSchema>;
type WebhookMessage = z.infer<typeof WebhookMessageSchema>;

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
      const parsed = WebhookPayloadSchema.safeParse(req.body);
      if (!parsed.success) {
        logger.warn({ errors: parsed.error.issues }, 'Webhook payload validation failed — ignoring');
        return;
      }

      const entries = parsed.data.entry ?? [];
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
