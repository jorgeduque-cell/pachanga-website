import { EventStatus, EventType, TableZone, Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { uploadToStorage, deleteFromStorage } from '../../lib/storage.js';
import { logger } from '../../lib/logger.js';

// ─── Types ───────────────────────────────────────────────────
export interface CreateEventInput {
    name: string;
    eventType?: 'CONCERT' | 'QUICK_EVENT';
    eventDate: string;    // ISO date string
    eventTime: string;    // e.g. "18:00"
    description?: string;
    coverPrice?: number;
    ticketPrices?: Record<string, number>;  // e.g. { general: 60000, vip: 120000, palco: 200000 }
    tables?: Array<{ zone: TableZone; total: number }>;
}

export interface UpdateEventInput {
    name?: string;
    eventType?: 'CONCERT' | 'QUICK_EVENT';
    eventDate?: string;
    eventTime?: string;
    description?: string;
    coverPrice?: number;
    ticketPrices?: Record<string, number>;
    status?: EventStatus;
    isActive?: boolean;
}

// ─── Service ─────────────────────────────────────────────────
export class EventsService {

    /**
     * List events with optional filters.
     */
    async list(filters?: { status?: EventStatus; upcoming?: boolean }) {
        const where: Record<string, unknown> = {};

        if (filters?.status) {
            where.status = filters.status;
        }

        if (filters?.upcoming) {
            where.eventDate = { gte: new Date() };
            where.status = { in: ['ACTIVE', 'SOLD_OUT'] };
        }

        return prisma.event.findMany({
            where,
            include: { tables: true },
            orderBy: [
                { isFeatured: 'desc' },
                { eventDate: 'asc' },
            ],
        });
    }

    /**
     * Get a single event by ID.
     */
    async getById(id: string) {
        return prisma.event.findUnique({
            where: { id },
            include: { tables: true },
        });
    }

    /**
     * Set a single event as the featured one (only one at a time).
     */
    async setFeatured(id: string) {
        return prisma.$transaction([
            prisma.event.updateMany({ where: { isFeatured: true }, data: { isFeatured: false } }),
            prisma.event.update({ where: { id }, data: { isFeatured: true }, include: { tables: true } }),
        ]);
    }

    /**
     * Create a new event with optional table availability.
     */
    async create(input: CreateEventInput) {
        const event = await prisma.event.create({
            data: {
                name: input.name,
                eventType: (input.eventType as EventType) ?? 'QUICK_EVENT',
                eventDate: new Date(input.eventDate),
                eventTime: input.eventTime,
                description: input.description,
                coverPrice: input.coverPrice,
                ticketPrices: input.ticketPrices ? (input.ticketPrices as unknown as Prisma.InputJsonValue) : undefined,
                tables: input.tables?.length ? {
                    create: input.tables.map((t) => ({
                        zone: t.zone,
                        total: t.total,
                        reserved: 0,
                    })),
                } : undefined,
            },
            include: { tables: true },
        });

        // Auto-inject into chatbot knowledge
        await this.syncKnowledge(event);

        logger.info({ eventId: event.id, name: event.name }, '[Events] Created');
        return event;
    }

    /**
     * Update an event.
     */
    async update(id: string, input: UpdateEventInput) {
        const event = await prisma.event.update({
            where: { id },
            data: {
                ...(input.name && { name: input.name }),
                ...(input.eventType && { eventType: input.eventType as EventType }),
                ...(input.eventDate && { eventDate: new Date(input.eventDate) }),
                ...(input.eventTime && { eventTime: input.eventTime }),
                ...(input.description !== undefined && { description: input.description }),
                ...(input.coverPrice !== undefined && { coverPrice: input.coverPrice }),
                ...(input.ticketPrices !== undefined && { ticketPrices: input.ticketPrices as unknown as Prisma.InputJsonValue }),
                ...(input.status && { status: input.status }),
                ...(input.isActive !== undefined && { isActive: input.isActive }),
            },
            include: { tables: true },
        });

        await this.syncKnowledge(event);
        logger.info({ eventId: id }, '[Events] Updated');
        return event;
    }

    /**
     * Upload a flyer image for an event.
     */
    async uploadFlyer(id: string, buffer: Buffer, fileName: string, contentType: string) {
        const existing = await prisma.event.findUnique({ where: { id } });
        if (!existing) throw new Error('Event not found');

        // Delete old flyer if exists
        if (existing.flyerUrl) {
            await deleteFromStorage(existing.flyerUrl);
        }

        const flyerUrl = await uploadToStorage(buffer, fileName, contentType);
        if (!flyerUrl) throw new Error('Upload failed');

        const event = await prisma.event.update({
            where: { id },
            data: { flyerUrl },
            include: { tables: true },
        });

        logger.info({ eventId: id, flyerUrl }, '[Events] Flyer uploaded');
        return event;
    }

    /**
     * Update table availability for an event.
     */
    async updateTables(eventId: string, tables: Array<{ zone: TableZone; total: number; reserved: number }>) {
        for (const t of tables) {
            await prisma.eventTable.upsert({
                where: { eventId_zone: { eventId, zone: t.zone } },
                update: { total: t.total, reserved: t.reserved },
                create: { eventId, zone: t.zone, total: t.total, reserved: t.reserved },
            });
        }

        // Check sold out
        const allTables = await prisma.eventTable.findMany({ where: { eventId } });
        const totalAvailable = allTables.reduce((sum, t) => sum + (t.total - t.reserved), 0);

        if (totalAvailable <= 0) {
            await prisma.event.update({ where: { id: eventId }, data: { status: 'SOLD_OUT' } });
        }

        const event = await prisma.event.findUnique({
            where: { id: eventId },
            include: { tables: true },
        });

        if (event) await this.syncKnowledge(event);
        return event;
    }

    /**
     * Delete an event.
     */
    async delete(id: string) {
        const event = await prisma.event.findUnique({ where: { id } });
        if (!event) throw new Error('Event not found');

        if (event.flyerUrl) {
            await deleteFromStorage(event.flyerUrl);
        }

        await prisma.event.delete({ where: { id } });

        // Remove from knowledge base
        await prisma.chatbotKnowledge.deleteMany({
            where: { category: 'EVENTS', key: { startsWith: `event_${id}` } },
        });

        logger.info({ eventId: id }, '[Events] Deleted');
    }

    /**
     * Auto-sync event data to chatbot knowledge base.
     */
    private async syncKnowledge(event: { id: string; name: string; eventType?: string; eventDate: Date; eventTime: string; description?: string | null; coverPrice?: number | null; ticketPrices?: unknown; status: EventStatus; tables?: Array<{ zone: TableZone; total: number; reserved: number }> }) {
        const dateStr = event.eventDate.toLocaleDateString('es-CO', {
            weekday: 'long', day: 'numeric', month: 'long',
        });

        const tablesInfo = event.tables?.map((t) =>
            `${t.zone}: ${t.total - t.reserved} disponibles de ${t.total}`
        ).join(', ') || 'Sin info de mesas';

        // Ticket prices with per-person calculation
        const TICKET_LABELS: Record<string, string> = {
            palco_8: 'Palco 8 Personas',
            palco_4: 'Palco 4 Personas',
            palco_2: 'Palco 2 Personas',
            vip_primer_piso: 'VIP Primer Piso (4P)',
            vip_segundo_piso: 'VIP Segundo Piso (4P)',
            barras: 'Barras (Pareja)',
        };
        const TICKET_CAPACITY: Record<string, number> = {
            palco_8: 8, palco_4: 4, palco_2: 2,
            vip_primer_piso: 4, vip_segundo_piso: 4, barras: 2,
        };

        let pricingInfo = '';
        const tp = event.ticketPrices as Record<string, number> | null;
        if (tp && Object.values(tp).some(v => v > 0)) {
            const lines = Object.entries(tp)
                .filter(([, v]) => v > 0)
                .map(([key, price]) => {
                    const cap = TICKET_CAPACITY[key] || 1;
                    const pp = Math.round(price / cap);
                    return `  • ${TICKET_LABELS[key] || key}: $${price.toLocaleString('es-CO')} total ($${pp.toLocaleString('es-CO')}/persona)`;
                });
            pricingInfo = `💰 PRECIOS POR UBICACIÓN:\n${lines.join('\n')}`;
        } else if (event.coverPrice && event.coverPrice > 0) {
            pricingInfo = `💰 Cover: $${event.coverPrice.toLocaleString('es-CO')}`;
        } else {
            pricingInfo = '🆓 Entrada libre';
        }

        const eventTypeLabel = event.eventType === 'CONCERT' ? '🎵 Concierto' : '🎉 Evento Rápido';

        const value = `🎉 EVENTO: ${event.name}
🎫 Tipo: ${eventTypeLabel}
📅 Fecha: ${dateStr}
🕕 Hora: ${event.eventTime}
${event.description ? `📝 ${event.description}` : ''}
${pricingInfo}
📊 Estado: ${event.status === 'ACTIVE' ? 'Disponible' : event.status === 'SOLD_OUT' ? '¡AGOTADO!' : event.status}
🪑 Mesas: ${tablesInfo}`;

        await prisma.chatbotKnowledge.upsert({
            where: { category_key: { category: 'EVENTS', key: `event_${event.id}` } },
            update: { value, isActive: event.status !== 'CANCELLED' },
            create: { category: 'EVENTS', key: `event_${event.id}`, value, isActive: event.status !== 'CANCELLED' },
        });
    }

    /**
     * Get active events for chatbot context.
     */
    async getActiveForChatbot() {
        return prisma.event.findMany({
            where: {
                isActive: true,
                status: { in: ['ACTIVE', 'SOLD_OUT'] },
                eventDate: { gte: new Date() },
            },
            include: { tables: true },
            orderBy: { eventDate: 'asc' },
            take: 5,
        });
    }
}

export const eventsService = new EventsService();
