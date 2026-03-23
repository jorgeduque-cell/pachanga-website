import { Request, Response, NextFunction } from 'express';
import { chatbotConversationService } from './chatbot.conversation.js';
import { chatbotKnowledgeService } from './chatbot.knowledge.js';
import { chatbotService } from './chatbot.service.js';
import { knowledgeCreateSchema, knowledgeUpdateSchema, adminReplySchema } from './chatbot.schemas.js';

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
}

export const chatbotController = new ChatbotController();
