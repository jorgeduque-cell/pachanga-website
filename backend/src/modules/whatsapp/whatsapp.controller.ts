import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { env } from '../../config/env.js';
import { whatsappService } from './whatsapp.service.js';
import { crmService } from '../crm/crm.service.js';
import { chatbotService } from '../chatbot/chatbot.service.js';
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

const WebhookContactSchema = z.object({
  profile: z.object({ name: z.string() }).optional(),
  wa_id: z.string(),
});

const WebhookPayloadSchema = z.object({
  entry: z.array(z.object({
    changes: z.array(z.object({
      value: z.object({
        statuses: z.array(WebhookStatusSchema).optional(),
        messages: z.array(WebhookMessageSchema).optional(),
        contacts: z.array(WebhookContactSchema).optional(),
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
          await this.processMessages(value?.messages, value?.contacts);
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

  private async processMessages(
    messages?: WebhookMessage[],
    contacts?: z.infer<typeof WebhookContactSchema>[],
  ): Promise<void> {
    if (!messages) return;

    // Build phone → profile name lookup from contacts array
    const profileNames = new Map<string, string>();
    if (contacts) {
      for (const contact of contacts) {
        if (contact.profile?.name) {
          profileNames.set(contact.wa_id, contact.profile.name);
        }
      }
    }

    for (const msg of messages) {
      const phone = `+${msg.from}`;
      const textBody = msg.text?.body ?? '';
      const profileName = profileNames.get(msg.from);

      // 1. Log to CRM (backward compatible — existing behavior)
      const customer = await prisma.customer.findUnique({
        where: { phone },
      });
      if (customer) {
        await crmService.logCustomerReply(customer.id, textBody, msg.type);
      }

      // 2. Forward to chatbot for AI response (async, non-blocking)
      if (msg.type === 'text' && textBody) {
        chatbotService.processIncomingMessage(phone, textBody, profileName).catch((err) => {
          logger.error({ err, phone }, '[Webhook] Chatbot processing failed (non-blocking)');
        });
      }
    }
  }
}

export const whatsappController = new WhatsAppController();
