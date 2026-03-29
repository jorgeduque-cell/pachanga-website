import { Request, Response, NextFunction } from 'express';
import { chatbotConversationService } from './chatbot.conversation.js';
import { chatbotKnowledgeService } from './chatbot.knowledge.js';
import { chatbotService } from './chatbot.service.js';
import { chatbotPaymentService } from './chatbot.payment.js';
import { whatsappService } from '../whatsapp/whatsapp.service.js';
import {
    knowledgeCreateSchema,
    knowledgeUpdateSchema,
    adminReplySchema,
    paymentListQuerySchema,
    paymentConfirmSchema,
    paymentRejectSchema,
} from './chatbot.schemas.js';

// ─── Controller ─────────────────────────────────────────────
export class ChatbotController {

    // ─── Conversations ──────────────────────────────────────

    async listConversations(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const status = req.query.status as 'ACTIVE' | 'ESCALATED' | 'RESOLVED' | undefined;
            const page = req.query.page ? Number(req.query.page) : 1;
            const limit = req.query.limit ? Number(req.query.limit) : 20;

            const result = await chatbotConversationService.listConversations({ status, page, limit });
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    async getConversation(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const conversation = await chatbotConversationService.getConversationDetail(req.params.id);
            if (!conversation) {
                res.status(404).json({ error: 'Conversación no encontrada' });
                return;
            }
            res.json(conversation);
        } catch (error) {
            next(error);
        }
    }

    async replyToConversation(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const parsed = adminReplySchema.safeParse(req.body);
            if (!parsed.success) {
                res.status(400).json({ error: 'Datos inválidos', details: parsed.error.issues });
                return;
            }

            await chatbotService.sendAdminReply(req.params.id, parsed.data.message);
            res.json({ success: true, message: 'Respuesta enviada' });
        } catch (error) {
            next(error);
        }
    }

    async resolveConversation(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            await chatbotConversationService.resolveConversation(req.params.id);
            res.json({ success: true, message: 'Conversación resuelta' });
        } catch (error) {
            next(error);
        }
    }

    // ─── Knowledge Base ─────────────────────────────────────

    async listKnowledge(_req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const entries = await chatbotKnowledgeService.getAll();
            res.json(entries);
        } catch (error) {
            next(error);
        }
    }

    async createKnowledge(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const parsed = knowledgeCreateSchema.safeParse(req.body);
            if (!parsed.success) {
                res.status(400).json({ error: 'Datos inválidos', details: parsed.error.issues });
                return;
            }

            const entry = await chatbotKnowledgeService.create(parsed.data);
            res.status(201).json(entry);
        } catch (error) {
            next(error);
        }
    }

    async updateKnowledge(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const parsed = knowledgeUpdateSchema.safeParse(req.body);
            if (!parsed.success) {
                res.status(400).json({ error: 'Datos inválidos', details: parsed.error.issues });
                return;
            }

            const entry = await chatbotKnowledgeService.update(req.params.id, parsed.data);
            res.json(entry);
        } catch (error) {
            next(error);
        }
    }

    async deleteKnowledge(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            await chatbotKnowledgeService.deactivate(req.params.id);
            res.json({ success: true, message: 'Entrada desactivada' });
        } catch (error) {
            next(error);
        }
    }

    // ─── Stats ──────────────────────────────────────────────

    async getStats(_req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { prisma } = await import('../../lib/prisma.js');

            const [totalConversations, activeConversations, escalatedConversations, totalMessages] = await Promise.all([
                prisma.chatConversation.count(),
                prisma.chatConversation.count({ where: { status: 'ACTIVE' } }),
                prisma.chatConversation.count({ where: { status: 'ESCALATED' } }),
                prisma.chatMessage.count(),
            ]);

            res.json({
                totalConversations,
                activeConversations,
                escalatedConversations,
                totalMessages,
            });
        } catch (error) {
            next(error);
        }
    }
    // ─── Payments ────────────────────────────────────────────

    async listPayments(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const parsed = paymentListQuerySchema.safeParse(req.query);
            if (!parsed.success) {
                res.status(400).json({ error: 'Parámetros inválidos', details: parsed.error.issues });
                return;
            }

            const result = await chatbotPaymentService.listPayments(parsed.data);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    async getPaymentDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const payment = await chatbotPaymentService.getPaymentDetail(req.params.id);
            res.json({ data: payment });
        } catch (error) {
            next(error);
        }
    }

    async confirmPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const parsed = paymentConfirmSchema.safeParse(req.body);
            if (!parsed.success) {
                res.status(400).json({ error: 'Datos inválidos', details: parsed.error.issues });
                return;
            }

            const adminUserId = (req as unknown as { user: { id: string } }).user.id;
            await chatbotPaymentService.confirmPayment(req.params.id, adminUserId, parsed.data.notes);

            // Notify customer via WhatsApp
            const payment = await chatbotPaymentService.getPaymentDetail(req.params.id);
            await whatsappService.sendFreeformMessage(
                payment.customer.phone,
                `🎉 *¡Tu pago ha sido confirmado!*\n\n🔖 Referencia: *${payment.reference}*\n🎫 ${payment.quantity} boleta(s) — *${payment.event.name}*\n\n¡Te esperamos! 🎶`,
            );

            res.json({ success: true, message: 'Pago confirmado' });
        } catch (error) {
            next(error);
        }
    }

    async rejectPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const parsed = paymentRejectSchema.safeParse(req.body);
            if (!parsed.success) {
                res.status(400).json({ error: 'Datos inválidos', details: parsed.error.issues });
                return;
            }

            const adminUserId = (req as unknown as { user: { id: string } }).user.id;
            await chatbotPaymentService.rejectPayment(req.params.id, adminUserId, parsed.data.reason);

            // Notify customer via WhatsApp
            const payment = await chatbotPaymentService.getPaymentDetail(req.params.id);
            const reasonText = parsed.data.reason ? `\n📝 Motivo: ${parsed.data.reason}` : '';
            await whatsappService.sendFreeformMessage(
                payment.customer.phone,
                `❌ *Tu pago no pudo ser verificado*\n\n🔖 Referencia: *${payment.reference}*${reasonText}\n\nPor favor revisa los datos y envía de nuevo el comprobante, o contáctanos si tienes dudas.`,
            );

            res.json({ success: true, message: 'Pago rechazado' });
        } catch (error) {
            next(error);
        }
    }
}

export const chatbotController = new ChatbotController();
