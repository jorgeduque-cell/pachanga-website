import { createHash } from 'node:crypto';
import cron from 'node-cron';
import type { ScheduledTask } from 'node-cron';
import { prisma } from '../prisma.js';
import { whatsappService } from '../../modules/whatsapp/whatsapp.service.js';
import { surveyService } from '../../modules/survey/survey.service.js';
import { logger } from '../logger.js';

const SURVEY_CRON_SCHEDULE = '0 11 * * *'; // 11:00 AM diario
const TIMEZONE = 'America/Bogota';

interface SurveySendResult {
    found: number;
    sent: number;
    skipped: number;
    failed: number;
}

const BATCH_SIZE = 5;

export class SurveySender {
    private task: ScheduledTask | null = null;

    start(): void {
        if (this.task) return;

        this.task = cron.schedule(SURVEY_CRON_SCHEDULE, () => {
            this.run().catch((error: unknown) => {
                logger.error({ err: error }, 'Survey sender cron error');
            });
        }, { timezone: TIMEZONE });

        logger.info('Survey sender started (11:00 AM America/Bogota)');
    }

    stop(): void {
        this.task?.stop();
        this.task = null;
    }

    async run(): Promise<SurveySendResult> {
        const result: SurveySendResult = { found: 0, sent: 0, skipped: 0, failed: 0 };

        const isEnabled = await this.isCronEnabled();
        if (!isEnabled) {
            logger.info('Survey sender cron disabled via config');
            return result;
        }

        const customers = await this.findEligibleCustomers();
        result.found = customers.length;

        if (customers.length === 0) {
            logger.info('No customers eligible for survey today');
            return result;
        }

        // Process in batches with concurrency control
        for (let i = 0; i < customers.length; i += BATCH_SIZE) {
            const batch = customers.slice(i, i + BATCH_SIZE);
            const results = await Promise.allSettled(
                batch.map(async (customer) => {
                    const surveyToken = surveyService.generateSurveyToken(customer.id);

                    await whatsappService.sendSurvey(customer, surveyToken);

                    await prisma.interaction.create({
                        data: {
                            customerId: customer.id,
                            type: 'survey_sent',
                            metadata: { surveyTokenHash: createHash('sha256').update(surveyToken).digest('hex').slice(0, 16) },
                        },
                    });
                }),
            );

            for (const r of results) {
                if (r.status === 'fulfilled') {
                    result.sent++;
                } else {
                    logger.error({ err: r.reason }, 'Failed to send survey');
                    result.failed++;
                }
            }
        }

        logger.info(
            { found: result.found, sent: result.sent, failed: result.failed },
            'Survey sender run completed',
        );
        return result;
    }

    // ─── Private Helpers ─────────────────────────────────────────

    private async isCronEnabled(): Promise<boolean> {
        const config = await prisma.crmConfig.findUnique({
            where: { key: 'survey_cron_enabled' },
        });
        // Enabled by default if config doesn't exist
        return config?.value !== 'false';
    }

    /**
     * Finds customers who registered (via QR) yesterday,
     * have optIn = true, and have NOT received a SURVEY message today.
     */
    private async findEligibleCustomers() {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterdayStart = new Date(todayStart);
        yesterdayStart.setDate(yesterdayStart.getDate() - 1);

        return prisma.customer.findMany({
            where: {
                isActive: true,
                optIn: true,
                createdAt: {
                    gte: yesterdayStart,
                    lt: todayStart,
                },
                // Exclude customers who already received a survey message
                messages: {
                    none: {
                        type: 'SURVEY',
                        sentAt: { gte: todayStart },
                    },
                },
                // Exclude customers who already completed a survey
                surveys: {
                    none: {},
                },
            },
            select: {
                id: true,
                name: true,
                phone: true,
            },
        });
    }
}

export const surveySender = new SurveySender();
