import cron from 'node-cron';
import type { ScheduledTask } from 'node-cron';
import { prisma } from '../prisma.js';
import { whatsappService } from '../../modules/whatsapp/whatsapp.service.js';
import { Customer } from '@prisma/client';
import { logger } from '../logger.js';

const BIRTHDAY_CRON_SCHEDULE = '0 11 * * *'; // 11:00 AM diario
const TIMEZONE = 'America/Bogota';
const BATCH_SIZE = 5;

interface BirthdayRunResult {
  found: number;
  sent: number;
  skipped: number;
  failed: number;
}

export class BirthdayEngine {
  private task: ScheduledTask | null = null;

  start(): void {
    if (this.task) return;

    this.task = cron.schedule(BIRTHDAY_CRON_SCHEDULE, () => {
      this.run().catch((error: unknown) => {
        logger.error({ err: error }, 'Birthday cron error');
      });
    }, { timezone: TIMEZONE });

    logger.info('Birthday engine started (11:00 AM America/Bogota)');
  }

  stop(): void {
    this.task?.stop();
    this.task = null;
  }

  async run(): Promise<BirthdayRunResult> {
    const result: BirthdayRunResult = { found: 0, sent: 0, skipped: 0, failed: 0 };

    const isEnabled = await this.isCronEnabled();
    if (!isEnabled) {
      logger.info('Birthday cron disabled via config');
      return result;
    }

    const customers = await this.findEligibleBirthdays();
    result.found = customers.length;

    if (customers.length === 0) {
      logger.info('No birthdays today');
      return result;
    }

    // Process in batches with concurrency control
    for (let i = 0; i < customers.length; i += BATCH_SIZE) {
      const batch = customers.slice(i, i + BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map(async (customer) => {
          await whatsappService.sendBirthday(customer);
          await this.createBirthdayInteraction(customer.id);
        }),
      );

      for (const r of results) {
        if (r.status === 'fulfilled') {
          result.sent++;
        } else {
          result.failed++;
          logger.error({ err: r.reason }, 'Failed to send birthday message');
        }
      }
    }

    logger.info({ found: result.found, sent: result.sent, failed: result.failed }, 'Birthday run completed');
    return result;
  }

  // — Private —

  private async isCronEnabled(): Promise<boolean> {
    const config = await prisma.crmConfig.findUnique({
      where: { key: 'birthday_cron_enabled' },
    });
    return config?.value !== 'false';
  }

  /**
   * Finds eligible birthday customers using Prisma ORM with NOT EXISTS pattern
   * via the `none` relation filter (replaces raw SQL NOT IN subquery).
   */
  private async findEligibleBirthdays(): Promise<Customer[]> {
    const today = new Date();
    const month = today.getMonth() + 1;
    const day = today.getDate();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    return prisma.$queryRaw<Customer[]>`
      SELECT c.* FROM customers c
      WHERE EXTRACT(MONTH FROM c.birth_date) = ${month}
        AND EXTRACT(DAY FROM c.birth_date) = ${day}
        AND c.opt_in = true AND c.is_active = true
        AND NOT EXISTS (
          SELECT 1 FROM whatsapp_messages wm
          WHERE wm.customer_id = c.id
            AND wm.type = 'BIRTHDAY'
            AND wm.sent_at >= ${todayStart}
        )
    `;
  }

  private async createBirthdayInteraction(customerId: string): Promise<void> {
    await prisma.interaction.create({
      data: {
        customerId,
        type: 'birthday_greeting',
        metadata: { year: new Date().getFullYear() },
      },
    });
  }
}

export const birthdayEngine = new BirthdayEngine();
