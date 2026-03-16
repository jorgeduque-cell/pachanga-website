import { CustomerSource, MessageType, MessageStatus, Prisma, Customer } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/error.middleware.js';
import { normalizePhone, normalizePhoneSafe } from '../../lib/phone-utils.js';
import type { CaptureInput, UpdateCustomerInput, CustomerFilters, MessageFilters } from '../../schemas/crm.schema.js';
import { logger } from '../../lib/logger.js';
import { buildPagination, paginatedResponse, type PaginatedResult } from '../../lib/pagination.js';





interface CaptureResult {
    customer: Customer;
    isNew: boolean;
}

// ─── Service ─────────────────────────────────────────────────
export class CrmService {

    /**
     * Captures a new customer from QR form or updates an existing one.
     * Returns the customer and whether it was newly created.
     * Uses atomic upsert to prevent race conditions.
     */
    async capture(data: CaptureInput): Promise<CaptureResult> {
        const phone = normalizePhone(data.phone);
        const birthDate = new Date(data.birthDate);

        const customer = await prisma.customer.upsert({
            where: { phone },
            update: {
                name: data.name, // Always update name (fix typos, accents)
                totalVisits: { increment: 1 },
                lastVisitAt: new Date(),
                rating: data.rating,
            },
            create: {
                name: data.name,
                phone,
                birthDate,
                rating: data.rating,
                source: 'QR_SCAN',
                totalVisits: 1,
                lastVisitAt: new Date(),
                optIn: data.optIn ?? true,
            },
        });

        // Detect if created or updated via totalVisits
        const isNew = customer.totalVisits === 1;

        await this.createInteraction(customer.id, 'qr_scan', {
            table: data.qrTable,
            rating: data.rating,
            revisit: !isNew,
        });

        return { customer, isNew };
    }

    /**
     * Links a reservation phone to the CRM customer table.
     * Creates customer if not found, increments visits if found.
     */
    async linkToReservation(
        phone: string,
        customerName: string,
        reservationId: string,
    ): Promise<void> {
        try {
            // Normalize phone with fallback for international numbers
            const normalizedPhone = normalizePhoneSafe(phone);

            // Atomic upsert prevents race condition duplicates
            const customer = await prisma.customer.upsert({
                where: { phone: normalizedPhone },
                update: {
                    name: customerName,
                    totalVisits: { increment: 1 },
                    lastVisitAt: new Date(),
                },
                create: {
                    name: customerName,
                    phone: normalizedPhone,
                    source: 'RESERVATION',
                    totalVisits: 1,
                    lastVisitAt: new Date(),
                },
            });

            await this.createInteraction(customer.id, 'reservation', { reservationId });
        } catch (err) {
            // Non-critical: CRM link failure should NOT block reservation creation
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error({ phone, err: errorMessage }, 'CRM link failed for phone');
        }
    }

    /**
     * Returns paginated, filterable list of customers.
     */
    async findAll(filters: CustomerFilters): Promise<PaginatedResult<Customer>> {
        const { page, limit, skip, take } = buildPagination(filters);
        const where = this.buildCustomerWhereClause(filters);

        const [customers, total] = await Promise.all([
            prisma.customer.findMany({
                where,
                orderBy: [{ lastVisitAt: 'desc' }],
                skip,
                take,
            }),
            prisma.customer.count({ where }),
        ]);

        return paginatedResponse(customers, total, page, limit);
    }

    /**
     * Returns a single customer with their interaction history.
     */
    async findById(id: string): Promise<Customer & { interactions: unknown[] }> {
        const customer = await prisma.customer.findUnique({
            where: { id },
            include: {
                interactions: { orderBy: { createdAt: 'desc' }, take: 50 },
                messages: { orderBy: { createdAt: 'desc' }, take: 20 },
            },
        });

        if (!customer) {
            throw new AppError('Cliente no encontrado', 404);
        }

        return customer;
    }

    /**
     * Updates a customer's editable fields (admin).
     */
    async update(id: string, data: UpdateCustomerInput): Promise<Customer> {
        await this.findCustomerOrThrow(id);

        return prisma.customer.update({ where: { id }, data });
    }

    /**
     * Returns today's birthday customers (active + opt-in).
     */
    async getTodayBirthdays(): Promise<Customer[]> {
        const today = new Date();
        const month = today.getMonth() + 1;
        const day = today.getDate();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

        return prisma.$queryRaw<Customer[]>`
      SELECT * FROM customers
      WHERE EXTRACT(MONTH FROM birth_date) = ${month}
        AND EXTRACT(DAY FROM birth_date) = ${day}
        AND opt_in = true
        AND is_active = true
    `;
    }

    /**
     * Returns paginated message log with filters.
     */
    async getMessages(filters: MessageFilters) {
        const { page, limit, skip, take } = buildPagination(filters);

        const where: Prisma.WhatsAppMessageWhereInput = {};
        if (filters.type) where.type = filters.type as MessageType;
        if (filters.status) where.status = filters.status as MessageStatus;

        const [messages, total] = await Promise.all([
            prisma.whatsAppMessage.findMany({
                where,
                include: { customer: { select: { name: true, phone: true } } },
                orderBy: { createdAt: 'desc' },
                skip,
                take,
            }),
            prisma.whatsAppMessage.count({ where }),
        ]);

        return paginatedResponse(messages, total, page, limit);
    }

    /**
     * Get / Update CRM config key-value pairs.
     */
    async getConfig(): Promise<Record<string, string>> {
        const configs = await prisma.crmConfig.findMany();
        return Object.fromEntries(configs.map((c) => [c.key, c.value]));
    }

    async updateConfig(key: string, value: string): Promise<void> {
        await prisma.crmConfig.upsert({
            where: { key },
            update: { value },
            create: { key, value },
        });
    }

    /**
     * Returns CRM statistics.
     */
    async getStats(): Promise<{
        totalCustomers: number;
        newThisMonth: number;
        activeCustomers: number;
        avgRating: number;
        topSources: { source: string; count: number }[];
    }> {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const [
            totalCustomers,
            newThisMonth,
            activeCustomers,
            avgRating,
            sources,
        ] = await Promise.all([
            prisma.customer.count(),
            prisma.customer.count({
                where: { createdAt: { gte: startOfMonth } },
            }),
            prisma.customer.count({
                where: { isActive: true, optIn: true },
            }),
            prisma.customer.aggregate({
                _avg: { rating: true },
                where: { rating: { not: null } },
            }),
            prisma.customer.groupBy({
                by: ['source'],
                _count: { source: true },
                orderBy: { _count: { source: 'desc' } },
                take: 3,
            }),
        ]);

        return {
            totalCustomers,
            newThisMonth,
            activeCustomers,
            avgRating: avgRating._avg.rating || 0,
            topSources: sources.map(s => ({
                source: s.source,
                count: s._count.source,
            })),
        };
    }

    /**
     * Logs a customer reply from WhatsApp webhook.
     */
    async logCustomerReply(customerId: string, text: string, messageType: string): Promise<void> {
        await this.createInteraction(customerId, 'customer_reply', { text, type: messageType });
    }

    // ─── Private Helpers ─────────────────────────────────────────

    private async findCustomerOrThrow(id: string): Promise<Customer> {
        const customer = await prisma.customer.findUnique({ where: { id } });
        if (!customer) throw new AppError('Cliente no encontrado', 404);
        return customer;
    }

    private async createInteraction(
        customerId: string,
        type: string,
        metadata?: Record<string, unknown>,
    ): Promise<void> {
        await prisma.interaction.create({
            data: { customerId, type, metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : Prisma.JsonNull },
        });
    }

    private buildCustomerWhereClause(filters: CustomerFilters): Prisma.CustomerWhereInput {
        const where: Prisma.CustomerWhereInput = {};

        if (filters.search) {
            where.OR = [
                { name: { contains: filters.search, mode: 'insensitive' } },
                { phone: { contains: filters.search, mode: 'insensitive' } },
            ];
        }
        if (filters.source) where.source = filters.source as CustomerSource;
        if (filters.optIn !== undefined) where.optIn = filters.optIn;

        return where;
    }
}

export const crmService = new CrmService();
