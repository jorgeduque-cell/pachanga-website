import { prisma } from '../../lib/prisma.js';
import { env } from '../../config/env.js';
import { logger } from '../../lib/logger.js';
import type { ChatConversation, ChatMessage } from '@prisma/client';

// ─── Constants ───────────────────────────────────────────────
const STALE_CONVERSATION_HOURS = 24;

// ─── Service ────────────────────────────────────────────────
export class ChatbotConversationService {

    /**
     * Gets or creates an ACTIVE conversation for a customer.
     * If the latest conversation is older than 24h, creates a new one.
     */
    async getOrCreateConversation(customerId: string): Promise<ChatConversation> {
        const cutoff = new Date(Date.now() - STALE_CONVERSATION_HOURS * 60 * 60 * 1000);

        // Find existing active conversation that's not stale
        const existing = await prisma.chatConversation.findFirst({
            where: {
                customerId,
                status: 'ACTIVE',
                updatedAt: { gte: cutoff },
            },
            orderBy: { updatedAt: 'desc' },
        });

        if (existing) {
            return existing;
        }

        // Close any stale active conversations
        await prisma.chatConversation.updateMany({
            where: {
                customerId,
                status: 'ACTIVE',
                updatedAt: { lt: cutoff },
            },
            data: {
                status: 'RESOLVED',
                resolvedAt: new Date(),
            },
        });

        // Create fresh conversation
        const conversation = await prisma.chatConversation.create({
            data: { customerId },
        });

        logger.info({ customerId, conversationId: conversation.id }, '[Conversation] New conversation started');
        return conversation;
    }

    /**
     * Returns the last N messages of a conversation for AI context.
     */
    async getConversationContext(
        conversationId: string,
        limit?: number,
    ): Promise<Array<{ role: 'user' | 'model'; content: string }>> {
        const contextWindow = limit ?? env.CHATBOT_CONTEXT_WINDOW;

        const messages = await prisma.chatMessage.findMany({
            where: { conversationId },
            orderBy: { createdAt: 'desc' },
            take: contextWindow,
        });

        // Reverse to chronological order and map to Gemini format
        return messages.reverse().map((msg: ChatMessage) => ({
            role: msg.role === 'CUSTOMER' ? 'user' as const : 'model' as const,
            content: msg.content,
        }));
    }

    /**
     * Saves a message to a conversation.
     */
    async saveMessage(data: {
        conversationId: string;
        role: 'CUSTOMER' | 'BOT' | 'ADMIN';
        content: string;
        intent?: string;
        confidence?: number;
        waMessageId?: string;
    }): Promise<ChatMessage> {
        const message = await prisma.chatMessage.create({ data });

        // Update conversation's updatedAt and intent
        await prisma.chatConversation.update({
            where: { id: data.conversationId },
            data: {
                ...(data.intent ? { intent: data.intent } : {}),
            },
        });

        return message;
    }

    /**
     * Marks a conversation as escalated.
     */
    async escalateConversation(conversationId: string): Promise<void> {
        await prisma.chatConversation.update({
            where: { id: conversationId },
            data: {
                status: 'ESCALATED',
                escalatedAt: new Date(),
            },
        });

        logger.warn({ conversationId }, '[Conversation] Escalated to human');
    }

    /**
     * Marks a conversation as resolved.
     */
    async resolveConversation(conversationId: string): Promise<void> {
        await prisma.chatConversation.update({
            where: { id: conversationId },
            data: {
                status: 'RESOLVED',
                resolvedAt: new Date(),
            },
        });
    }

    /**
     * Closes all stale active conversations (for cron job).
     */
    async closeStaleConversations(): Promise<number> {
        const cutoff = new Date(Date.now() - STALE_CONVERSATION_HOURS * 60 * 60 * 1000);

        const result = await prisma.chatConversation.updateMany({
            where: {
                status: 'ACTIVE',
                updatedAt: { lt: cutoff },
            },
            data: {
                status: 'RESOLVED',
                resolvedAt: new Date(),
            },
        });

        if (result.count > 0) {
            logger.info({ count: result.count }, '[Conversation] Closed stale conversations');
        }

        return result.count;
    }

    /**
     * Lists conversations with pagination (for admin dashboard).
     */
    async listConversations(params: {
        status?: 'ACTIVE' | 'ESCALATED' | 'RESOLVED';
        page?: number;
        limit?: number;
    }) {
        const page = params.page ?? 1;
        const limit = params.limit ?? 20;
        const skip = (page - 1) * limit;

        const where = params.status ? { status: params.status } : {};

        const [conversations, total] = await Promise.all([
            prisma.chatConversation.findMany({
                where,
                include: {
                    customer: { select: { id: true, name: true, phone: true } },
                    messages: {
                        orderBy: { createdAt: 'desc' },
                        take: 1,
                        select: { content: true, role: true, createdAt: true },
                    },
                },
                orderBy: { updatedAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.chatConversation.count({ where }),
        ]);

        return {
            data: conversations,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Gets a single conversation with full message history.
     */
    async getConversationDetail(conversationId: string) {
        return prisma.chatConversation.findUnique({
            where: { id: conversationId },
            include: {
                customer: { select: { id: true, name: true, phone: true } },
                messages: { orderBy: { createdAt: 'asc' } },
            },
        });
    }
}

export const chatbotConversationService = new ChatbotConversationService();
