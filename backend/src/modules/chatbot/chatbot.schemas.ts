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

// ─── Types ──────────────────────────────────────────────────
export type KnowledgeCreateInput = z.infer<typeof knowledgeCreateSchema>;
export type KnowledgeUpdateInput = z.infer<typeof knowledgeUpdateSchema>;
export type AdminReplyInput = z.infer<typeof adminReplySchema>;
