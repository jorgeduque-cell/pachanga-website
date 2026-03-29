import { PaymentStatus, Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { logger } from '../../lib/logger.js';
import { AppError } from '../../middleware/error.middleware.js';
import { buildPagination, paginatedResponse, type PaginatedResult } from '../../lib/pagination.js';

// ─── Types ───────────────────────────────────────────────────
export interface PaymentFilters {
    status?: PaymentStatus;
    eventId?: string;
    page?: number;
    limit?: number;
}

// ─── Constants ───────────────────────────────────────────────
const PAYMENT_EXPIRY_HOURS = 48;

// ─── Service ────────────────────────────────────────────────
export class ChatbotPaymentService {

    /**
     * Updates a PaymentVerification with receipt data after Vision analysis.
     */
    async attachReceipt(
        paymentId: string,
        receiptUrl: string,
        visionAnalysis: Record<string, unknown>,
        detectedAmount: number | null,
    ): Promise<void> {
        await prisma.paymentVerification.update({
            where: { id: paymentId },
            data: {
                receiptUrl,
                visionAnalysis: visionAnalysis as Prisma.InputJsonValue,
                detectedAmount,
            },
        });

        logger.info({ paymentId, receiptUrl }, '[Payment] Receipt attached');
    }

    /**
     * Confirms a payment (admin action).
     */
    async confirmPayment(id: string, adminUserId: string, notes?: string): Promise<void> {
        const payment = await this.findOrThrow(id);

        if (payment.status !== 'PENDING') {
            throw new AppError(`No se puede confirmar un pago con estado "${payment.status}"`, 400);
        }

        await prisma.paymentVerification.update({
            where: { id },
            data: {
                status: 'CONFIRMED',
                confirmedBy: adminUserId,
                confirmedAt: new Date(),
                adminNotes: notes ?? null,
            },
        });

        logger.info({ paymentId: id, adminUserId }, '[Payment] Confirmed by admin');
    }

    /**
     * Rejects a payment (admin action).
     */
    async rejectPayment(id: string, adminUserId: string, reason?: string): Promise<void> {
        const payment = await this.findOrThrow(id);

        if (payment.status !== 'PENDING') {
            throw new AppError(`No se puede rechazar un pago con estado "${payment.status}"`, 400);
        }

        await prisma.paymentVerification.update({
            where: { id },
            data: {
                status: 'REJECTED',
                confirmedBy: adminUserId,
                rejectedAt: new Date(),
                adminNotes: reason ?? null,
            },
        });

        logger.info({ paymentId: id, adminUserId, reason }, '[Payment] Rejected by admin');
    }

    /**
     * Lists payments with filters and pagination.
     */
    async listPayments(filters: PaymentFilters): Promise<PaginatedResult<unknown>> {
        const { page, limit, skip, take } = buildPagination(filters);

        const where: Prisma.PaymentVerificationWhereInput = {};
        if (filters.status) where.status = filters.status;
        if (filters.eventId) where.eventId = filters.eventId;

        const [payments, total] = await Promise.all([
            prisma.paymentVerification.findMany({
                where,
                include: {
                    customer: { select: { id: true, name: true, phone: true } },
                    event: { select: { id: true, name: true, eventDate: true, eventTime: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take,
            }),
            prisma.paymentVerification.count({ where }),
        ]);

        return paginatedResponse(payments, total, page, limit);
    }

    /**
     * Gets a single payment with full details.
     */
    async getPaymentDetail(id: string) {
        const payment = await prisma.paymentVerification.findUnique({
            where: { id },
            include: {
                customer: { select: { id: true, name: true, phone: true } },
                event: { select: { id: true, name: true, eventDate: true, eventTime: true } },
                conversation: { select: { id: true, status: true } },
            },
        });

        if (!payment) {
            throw new AppError('Pago no encontrado', 404);
        }

        return payment;
    }

    /**
     * Finds a payment by its reference (used during image analysis).
     */
    async findByReference(reference: string) {
        return prisma.paymentVerification.findUnique({
            where: { reference },
            include: {
                customer: { select: { id: true, name: true, phone: true } },
                event: { select: { id: true, name: true } },
            },
        });
    }

    /**
     * Expires all PENDING payments older than 48 hours.
     * Called by the cron job.
     */
    async expireStalePayments(): Promise<number> {
        const cutoff = new Date(Date.now() - PAYMENT_EXPIRY_HOURS * 60 * 60 * 1000);

        const result = await prisma.paymentVerification.updateMany({
            where: {
                status: 'PENDING',
                createdAt: { lt: cutoff },
            },
            data: { status: 'EXPIRED' },
        });

        if (result.count > 0) {
            logger.info({ count: result.count }, '[Payment] Expired stale payments');
        }

        return result.count;
    }

    // ─── Private ────────────────────────────────────────────

    private async findOrThrow(id: string) {
        const payment = await prisma.paymentVerification.findUnique({
            where: { id },
        });

        if (!payment) {
            throw new AppError('Pago no encontrado', 404);
        }

        return payment;
    }
}

export const chatbotPaymentService = new ChatbotPaymentService();
