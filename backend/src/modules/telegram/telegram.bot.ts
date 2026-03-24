import { Bot, InputFile } from 'grammy';
import { env } from '../../config/env.js';
import { logger } from '../../lib/logger.js';
import { eventsService } from '../events/events.service.js';
import { prisma } from '../../lib/prisma.js';

// ─── Singleton ──────────────────────────────────────────────
let bot: Bot | null = null;

// ─── Helpers ────────────────────────────────────────────────
function isAdmin(chatId: number): boolean {
    const adminId = env.TELEGRAM_ADMIN_CHAT_ID;
    return adminId ? chatId.toString() === adminId : false;
}

function formatDate(date: Date): string {
    return date.toLocaleDateString('es-CO', {
        weekday: 'short', day: 'numeric', month: 'short',
    });
}

// ─── Bot Setup ──────────────────────────────────────────────
export function startTelegramBot(): void {
    if (!env.TELEGRAM_BOT_TOKEN) {
        logger.info('[Telegram] TELEGRAM_BOT_TOKEN not set — bot disabled');
        return;
    }

    bot = new Bot(env.TELEGRAM_BOT_TOKEN);

    // ─── /start ─────────────────────────────────────────
    bot.command('start', async (ctx) => {
        const chatId = ctx.chat.id;
        await ctx.reply(
            `🎉 *Pachanga y Pochola — Bot Admin*\n\n` +
            `Tu Chat ID: \`${chatId}\`\n\n` +
            `📋 *Comandos disponibles:*\n` +
            `/eventos — Ver todos los eventos\n` +
            `/proximos — Próximos eventos activos\n` +
            `/stats — Estadísticas del bar\n` +
            `/reservas — Reservas de hoy\n\n` +
            `_Solo usuarios admin pueden usar estos comandos._`,
            { parse_mode: 'Markdown' },
        );
    });

    // ─── /eventos ───────────────────────────────────────
    bot.command('eventos', async (ctx) => {
        if (!isAdmin(ctx.chat.id)) {
            await ctx.reply('⛔ No tienes permisos de administrador.');
            return;
        }

        try {
            const events = await eventsService.list();
            if (!events.length) {
                await ctx.reply('📭 No hay eventos registrados.');
                return;
            }

            const lines = events.map((e, i) => {
                const statusIcon = e.status === 'ACTIVE' ? '🟢' :
                    e.status === 'SOLD_OUT' ? '🟠' :
                    e.status === 'CANCELLED' ? '🔴' : '⚪';
                const tablesInfo = e.tables?.length
                    ? e.tables.map(t => `${t.zone}: ${t.total - t.reserved}/${t.total}`).join(', ')
                    : 'Sin mesas';
                return `${i + 1}. ${statusIcon} *${e.name}*\n   📅 ${formatDate(e.eventDate)} — ${e.eventTime}\n   🪑 ${tablesInfo}`;
            });

            await ctx.reply(`📋 *Eventos (${events.length}):*\n\n${lines.join('\n\n')}`, {
                parse_mode: 'Markdown',
            });
        } catch (error) {
            logger.error({ err: error }, '[Telegram] /eventos failed');
            await ctx.reply('❌ Error al cargar eventos.');
        }
    });

    // ─── /proximos ──────────────────────────────────────
    bot.command('proximos', async (ctx) => {
        if (!isAdmin(ctx.chat.id)) {
            await ctx.reply('⛔ No tienes permisos de administrador.');
            return;
        }

        try {
            const events = await eventsService.list({ upcoming: true });
            if (!events.length) {
                await ctx.reply('📭 No hay eventos próximos.');
                return;
            }

            for (const event of events.slice(0, 5)) {
                const cover = event.coverPrice
                    ? `💰 Cover: $${event.coverPrice.toLocaleString('es-CO')}`
                    : '🆓 Entrada libre';
                const tablesInfo = event.tables?.length
                    ? event.tables.map(t => `  • ${t.zone}: ${t.total - t.reserved}/${t.total}`).join('\n')
                    : '  Sin mesas configuradas';

                const msg = `🎉 *${event.name}*\n` +
                    `📅 ${formatDate(event.eventDate)} — ${event.eventTime}\n` +
                    `${cover}\n` +
                    `📊 Estado: ${event.status}\n` +
                    `${event.description ? `📝 ${event.description}\n` : ''}` +
                    `\n🪑 *Mesas:*\n${tablesInfo}`;

                await ctx.reply(msg, { parse_mode: 'Markdown' });

                // Send flyer if available
                if (event.flyerUrl) {
                    try {
                        await ctx.replyWithPhoto(event.flyerUrl);
                    } catch {
                        logger.warn({ flyerUrl: event.flyerUrl }, '[Telegram] Failed to send flyer');
                    }
                }
            }
        } catch (error) {
            logger.error({ err: error }, '[Telegram] /proximos failed');
            await ctx.reply('❌ Error al cargar eventos.');
        }
    });

    // ─── /stats ─────────────────────────────────────────
    bot.command('stats', async (ctx) => {
        if (!isAdmin(ctx.chat.id)) {
            await ctx.reply('⛔ No tienes permisos de administrador.');
            return;
        }

        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const [
                totalCustomers,
                todayReservations,
                pendingReservations,
                activeEvents,
                chatConversations,
            ] = await Promise.all([
                prisma.customer.count(),
                prisma.reservation.count({
                    where: { reservationDate: { gte: today, lt: tomorrow } },
                }),
                prisma.reservation.count({ where: { status: 'PENDING' } }),
                prisma.event.count({ where: { status: 'ACTIVE', isActive: true } }),
                prisma.chatConversation.count({
                    where: { status: 'ACTIVE', updatedAt: { gte: today } },
                }),
            ]);

            await ctx.reply(
                `📊 *Estadísticas — Pachanga y Pochola*\n\n` +
                `👥 Clientes total: *${totalCustomers}*\n` +
                `📅 Reservas hoy: *${todayReservations}*\n` +
                `⏳ Reservas pendientes: *${pendingReservations}*\n` +
                `🎉 Eventos activos: *${activeEvents}*\n` +
                `💬 Conversaciones hoy: *${chatConversations}*`,
                { parse_mode: 'Markdown' },
            );
        } catch (error) {
            logger.error({ err: error }, '[Telegram] /stats failed');
            await ctx.reply('❌ Error al cargar estadísticas.');
        }
    });

    // ─── /reservas ──────────────────────────────────────
    bot.command('reservas', async (ctx) => {
        if (!isAdmin(ctx.chat.id)) {
            await ctx.reply('⛔ No tienes permisos de administrador.');
            return;
        }

        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const reservations = await prisma.reservation.findMany({
                where: { reservationDate: { gte: today, lt: tomorrow } },
                orderBy: { reservationTime: 'asc' },
                take: 20,
            });

            if (!reservations.length) {
                await ctx.reply('📭 No hay reservas para hoy.');
                return;
            }

            const statusIcon = (s: string) => {
                switch (s) {
                    case 'CONFIRMED': return '✅';
                    case 'PENDING': return '⏳';
                    case 'CANCELLED': return '❌';
                    default: return '⚪';
                }
            };

            const lines = reservations.map((r, i) =>
                `${i + 1}. ${statusIcon(r.status)} *${r.customerName}*\n   📱 ${r.customerPhone} — 🕐 ${r.reservationTime} — 👥 ${r.partySize}p`
            );

            await ctx.reply(
                `📋 *Reservas de hoy (${reservations.length}):*\n\n${lines.join('\n\n')}`,
                { parse_mode: 'Markdown' },
            );
        } catch (error) {
            logger.error({ err: error }, '[Telegram] /reservas failed');
            await ctx.reply('❌ Error al cargar reservas.');
        }
    });

    // ─── Error Handler ──────────────────────────────────
    bot.catch((err) => {
        logger.error({ err: err.error, ctx: err.ctx?.update }, '[Telegram] Bot error');
    });

    // ─── Start Polling ──────────────────────────────────
    bot.start({
        onStart: () => {
            logger.info('[Telegram] Bot started (polling)');
        },
    });
}

/**
 * Send a notification to the admin Telegram chat.
 */
export async function notifyAdminTelegram(message: string): Promise<void> {
    if (!bot || !env.TELEGRAM_ADMIN_CHAT_ID) return;
    try {
        await bot.api.sendMessage(env.TELEGRAM_ADMIN_CHAT_ID, message, {
            parse_mode: 'Markdown',
        });
    } catch (error) {
        logger.error({ err: error }, '[Telegram] Failed to notify admin');
    }
}

/**
 * Gracefully stop the Telegram bot.
 */
export function stopTelegramBot(): void {
    if (bot) {
        bot.stop();
        logger.info('[Telegram] Bot stopped');
    }
}
