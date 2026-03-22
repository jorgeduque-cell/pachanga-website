import jwt from 'jsonwebtoken';
import { prisma } from '../../lib/prisma.js';
import { env } from '../../config/env.js';
import { AppError } from '../../middleware/error.middleware.js';
import { logger } from '../../lib/logger.js';
import { buildPagination, paginatedResponse, type PaginatedResult } from '../../lib/pagination.js';
import type { SurveyFilters } from '../../schemas/survey.schema.js';
import type { SatisfactionSurvey } from '@prisma/client';

// ─── Constants ───────────────────────────────────────────────
const SURVEY_TOKEN_EXPIRY = '7d';
const SURVEY_TOKEN_ISSUER = 'pachanga-survey';

// ─── Types ───────────────────────────────────────────────────
interface SurveyTokenPayload {
    customerId: string;
    purpose: 'survey';
}

interface SurveyRatings {
    musicRating: number;
    serviceRating: number;
    ambienceRating: number;
    hygieneRating: number;
    comments?: string;
}

interface SurveyAverages {
    totalSurveys: number;
    averages: {
        music: number;
        service: number;
        ambience: number;
        hygiene: number;
    };
    overallAverage: number;
}

// ─── Service ─────────────────────────────────────────────────
export class SurveyService {

    /**
     * Generates a signed survey link for a customer (admin endpoint).
     * Returns the full URL including the frontend base.
     */
    generateSurveyLink(customerId: string): string {
        const token = this.generateSurveyToken(customerId);
        return `${env.FRONTEND_URL}/encuesta?token=${token}`;
    }

    /**
     * Generates a signed JWT survey token for a customer.
     * Used by the cron job to pass as a CTA button dynamic URL suffix.
     */
    generateSurveyToken(customerId: string): string {
        const payload: SurveyTokenPayload = {
            customerId,
            purpose: 'survey',
        };

        return jwt.sign(payload, env.JWT_SECRET, {
            expiresIn: SURVEY_TOKEN_EXPIRY,
            issuer: SURVEY_TOKEN_ISSUER,
        });
    }

    /**
     * Verifies a survey token and returns the customer's name.
     * Throws if token is invalid, expired, or customer not found.
     */
    async verifyToken(token: string): Promise<{ valid: boolean; customerName: string }> {
        try {
            const decoded = jwt.verify(token, env.JWT_SECRET, {
                issuer: SURVEY_TOKEN_ISSUER,
            }) as SurveyTokenPayload;

            if (decoded.purpose !== 'survey') {
                return { valid: false, customerName: '' };
            }

            const customer = await prisma.customer.findUnique({
                where: { id: decoded.customerId },
                select: { name: true, isActive: true },
            });

            if (!customer || !customer.isActive) {
                return { valid: false, customerName: '' };
            }

            return { valid: true, customerName: customer.name };
        } catch (err) {
            logger.debug({ err }, 'Survey token verification failed');
            return { valid: false, customerName: '' };
        }
    }

    /**
     * Submits a satisfaction survey. Decodes token to get customerId,
     * saves the 4 ratings, and creates a CRM interaction.
     */
    async submitSurvey(token: string, ratings: SurveyRatings): Promise<void> {
        // Verify and decode token
        let decoded: SurveyTokenPayload;
        try {
            decoded = jwt.verify(token, env.JWT_SECRET, {
                issuer: SURVEY_TOKEN_ISSUER,
            }) as SurveyTokenPayload;
        } catch {
            throw new AppError('Token inválido o expirado', 401);
        }

        if (decoded.purpose !== 'survey') {
            throw new AppError('Token inválido', 401);
        }

        // Verify customer exists
        const customer = await prisma.customer.findUnique({
            where: { id: decoded.customerId },
            select: { id: true, isActive: true },
        });

        if (!customer || !customer.isActive) {
            throw new AppError('Cliente no encontrado o inactivo', 404);
        }

        // Find the customer's last QR scan to get table info
        const lastQrScan = await prisma.interaction.findFirst({
            where: { customerId: customer.id, type: 'qr_scan' },
            orderBy: { createdAt: 'desc' },
            select: { metadata: true },
        });
        const qrTable = (lastQrScan?.metadata as Record<string, string> | null)?.table ?? null;

        // Use transaction to ensure atomicity
        await prisma.$transaction(async (tx) => {
            // Create satisfaction survey with table info
            await tx.satisfactionSurvey.create({
                data: {
                    customerId: customer.id,
                    musicRating: ratings.musicRating,
                    serviceRating: ratings.serviceRating,
                    ambienceRating: ratings.ambienceRating,
                    hygieneRating: ratings.hygieneRating,
                    comments: ratings.comments || null,
                    qrTable,
                },
            });

            // Log CRM interaction
            await tx.interaction.create({
                data: {
                    customerId: customer.id,
                    type: 'survey_completed',
                    metadata: {
                        musicRating: ratings.musicRating,
                        serviceRating: ratings.serviceRating,
                        ambienceRating: ratings.ambienceRating,
                        hygieneRating: ratings.hygieneRating,
                        ...(ratings.comments ? { comments: ratings.comments } : {}),
                    },
                },
            });
        });

        logger.info({ customerId: customer.id }, 'Survey submitted successfully');
    }

    /**
     * Returns paginated list of surveys for admin dashboard.
     */
    async findAll(filters: SurveyFilters): Promise<PaginatedResult<SatisfactionSurvey>> {
        const { page, limit, skip, take } = buildPagination(filters);

        const where = filters.customerId
            ? { customerId: filters.customerId }
            : {};

        const [surveys, total] = await Promise.all([
            prisma.satisfactionSurvey.findMany({
                where,
                include: {
                    customer: { select: { name: true, phone: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take,
            }),
            prisma.satisfactionSurvey.count({ where }),
        ]);

        return paginatedResponse(surveys, total, page, limit);
    }

    /**
     * Returns average ratings per category for admin dashboard.
     */
    async getAverages(): Promise<SurveyAverages> {
        const [aggregation, totalSurveys] = await Promise.all([
            prisma.satisfactionSurvey.aggregate({
                _avg: {
                    musicRating: true,
                    serviceRating: true,
                    ambienceRating: true,
                    hygieneRating: true,
                },
            }),
            prisma.satisfactionSurvey.count(),
        ]);

        const avg = aggregation._avg;
        const music = this.roundAvg(avg.musicRating);
        const service = this.roundAvg(avg.serviceRating);
        const ambience = this.roundAvg(avg.ambienceRating);
        const hygiene = this.roundAvg(avg.hygieneRating);

        return {
            totalSurveys,
            averages: { music, service, ambience, hygiene },
            overallAverage: this.roundAvg(
                (music + service + ambience + hygiene) / 4 || null,
            ),
        };
    }

    // ─── Private Helpers ─────────────────────────────────────────

    /** Rounds a nullable average to 2 decimal places, defaulting to 0 */
    private roundAvg(value: number | null): number {
        return value ? Math.round(value * 100) / 100 : 0;
    }
}

export const surveyService = new SurveyService();
