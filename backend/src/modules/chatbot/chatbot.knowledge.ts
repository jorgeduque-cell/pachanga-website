import { prisma } from '../../lib/prisma.js';
import { logger } from '../../lib/logger.js';
import type { ChatbotKnowledge } from '@prisma/client';

// ─── In-Memory Cache ────────────────────────────────────────
let cachedPrompt: string | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// ─── Service ────────────────────────────────────────────────
export class ChatbotKnowledgeService {

    /**
     * Builds the system prompt context from the knowledge base.
     * Uses in-memory cache to avoid querying DB on every message.
     */
    async buildSystemPromptContext(): Promise<string> {
        const now = Date.now();

        if (cachedPrompt && (now - cacheTimestamp) < CACHE_TTL_MS) {
            return cachedPrompt;
        }

        const entries = await prisma.chatbotKnowledge.findMany({
            where: { isActive: true },
            orderBy: [{ category: 'asc' }, { key: 'asc' }],
        });

        cachedPrompt = this.formatKnowledgeForPrompt(entries);
        cacheTimestamp = now;

        logger.info({ entryCount: entries.length }, '[Knowledge] System prompt context rebuilt');
        return cachedPrompt;
    }

    /**
     * Invalidates the cache (call after CRUD operations).
     */
    invalidateCache(): void {
        cachedPrompt = null;
        cacheTimestamp = 0;
    }

    // ─── CRUD ───────────────────────────────────────────────

    async getAll() {
        return prisma.chatbotKnowledge.findMany({
            orderBy: [{ category: 'asc' }, { key: 'asc' }],
        });
    }

    async create(data: { category: string; key: string; value: string }) {
        const entry = await prisma.chatbotKnowledge.create({ data });
        this.invalidateCache();
        return entry;
    }

    async update(id: string, data: { value?: string; isActive?: boolean }) {
        const entry = await prisma.chatbotKnowledge.update({
            where: { id },
            data,
        });
        this.invalidateCache();
        return entry;
    }

    async deactivate(id: string) {
        const entry = await prisma.chatbotKnowledge.update({
            where: { id },
            data: { isActive: false },
        });
        this.invalidateCache();
        return entry;
    }

    // ─── Private ────────────────────────────────────────────

    private formatKnowledgeForPrompt(entries: ChatbotKnowledge[]): string {
        if (entries.length === 0) {
            return 'No hay información disponible en este momento.';
        }

        // Group by category
        const grouped = new Map<string, Array<{ key: string; value: string }>>();

        for (const entry of entries) {
            const list = grouped.get(entry.category) ?? [];
            list.push({ key: entry.key, value: entry.value });
            grouped.set(entry.category, list);
        }

        const lines: string[] = [];
        for (const [category, items] of grouped) {
            lines.push(`### ${category.toUpperCase()}`);
            for (const item of items) {
                lines.push(`- **${item.key}:** ${item.value}`);
            }
            lines.push('');
        }

        return lines.join('\n');
    }
}

export const chatbotKnowledgeService = new ChatbotKnowledgeService();
