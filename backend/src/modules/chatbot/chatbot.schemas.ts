import { z } from 'zod';

// ─── Knowledge CRUD ─────────────────────────────────────────
export const knowledgeCreateSchema = z.object({
    category: z.string().min(1).max(50),
    key: z.string().min(1).max(100),
    value: z.string().min(1).max(2000),
});

export const knowledgeUpdateSchema = z.object({
    value: z.string().min(1).max(2000).optional(),
    isActive: z.boolean().optional(),
});

// ─── Admin Reply ────────────────────────────────────────────
export const adminReplySchema = z.object({
    message: z.string().min(1).max(1000),
});

// ─── Conversation Queries ────────────────────────────────────
export const conversationListSchema = z.object({
    status: z.enum(['ACTIVE', 'ESCALATED', 'RESOLVED']).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const conversationIdParamSchema = z.object({
    id: z.string().uuid(),
});

// ─── Types ──────────────────────────────────────────────────
export type KnowledgeCreateInput = z.infer<typeof knowledgeCreateSchema>;
export type KnowledgeUpdateInput = z.infer<typeof knowledgeUpdateSchema>;
export type AdminReplyInput = z.infer<typeof adminReplySchema>;
export type ConversationListQuery = z.infer<typeof conversationListSchema>;

// ─── Payment Schemas ────────────────────────────────────────
export const paymentListQuerySchema = z.object({
    status: z.enum(['PENDING', 'CONFIRMED', 'REJECTED', 'EXPIRED']).optional(),
    eventId: z.string().uuid().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const paymentIdParamSchema = z.object({
    id: z.string().uuid(),
});

export const paymentConfirmSchema = z.object({
    notes: z.string().max(500).optional(),
});

export const paymentRejectSchema = z.object({
    reason: z.string().max(500).optional(),
});
