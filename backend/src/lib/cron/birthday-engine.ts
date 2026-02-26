import cron from 'node-cron';
import type { ScheduledTask } from 'node-cron';
import { prisma } from '../prisma.js';
import { whatsappService } from '../../modules/whatsapp/whatsapp.service.js';
import { Customer } from '@prisma/client';

const BIRTHDAY_CRON_SCHEDULE = '0 11 * * *'; // 11:00 AM diario
const TIMEZONE = 'America/Bogota';

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
        console.error('❌ Birthday cron error:', error);
      });
    }, { timezone: TIMEZONE });

    console.log('🎂 Birthday engine started (11:00 AM America/Bogota)');
  }

  stop(): void {
    this.task?.stop();
    this.task = null;
  }

  async run(): Promise<BirthdayRunResult> {
    const result: BirthdayRunResult = { found: 0, sent: 0, skipped: 0, failed: 0 };

    const isEnabled = await this.isCronEnabled();
    if (!isEnabled) {
      console.log('🎂 Birthday cron disabled via config');
      return result;
    }

    const customers = await this.findEligibleBirthdays();
    result.found = customers.length;

    if (customers.length === 0) {
      console.log('🎂 No birthdays today');
      return result;
    }

    for (const customer of customers) {
      try {
        await whatsappService.sendBirthday(customer);
        await this.createBirthdayInteraction(customer.id);
        result.sent++;
      } catch {
        result.failed++;
      }
    }

    console.log(`🎂 Birthday run: found=${result.found} sent=${result.sent} failed=${result.failed}`);
    return result;
  }

  // — Private —

  private async isCronEnabled(): Promise<boolean> {
    const config = await prisma.crmConfig.findUnique({
      where: { key: 'birthday_cron_enabled' },
    });
    return config?.value !== 'false';
  }

  private async findEligibleBirthdays(): Promise<Customer[]> {
    const today = new Date();
    const month = today.getMonth() + 1;
    const day = today.getDate();
    const todayStr = today.toISOString().split('T')[0];

    return prisma.$queryRaw<Customer[]>`
      SELECT c.* FROM customers c
      WHERE EXTRACT(MONTH FROM c.birth_date) = ${month}
        AND EXTRACT(DAY FROM c.birth_date) = ${day}
        AND c.opt_in = true AND c.is_active = true
        AND c.id NOT IN (
          SELECT wm.customer_id FROM whatsapp_messages wm
          WHERE wm.type = 'BIRTHDAY'
            AND wm.sent_at::date = ${todayStr}::date
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
