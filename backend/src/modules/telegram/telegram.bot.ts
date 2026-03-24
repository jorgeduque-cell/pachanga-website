import { Bot } from 'grammy';
import { env } from '../../config/env.js';
import { logger } from '../../lib/logger.js';
import { eventsService } from '../events/events.service.js';
import { uploadToStorage } from '../../lib/storage.js';
import { prisma } from '../../lib/prisma.js';

// ─── Singleton ──────────────────────────────────────────────
let bot: Bot | null = null;

// ─── Event Creation State Machine ───────────────────────────
type CreationStep = 'NAME' | 'DATE' | 'TIME' | 'COVER' | 'DESCRIPTION' | 'FLYER' | 'CONFIRM';

interface EventDraft {
    step: CreationStep;
    name?: string;
    eventDate?: string;
    eventTime?: string;
    coverPrice?: number;
    description?: string;
}

const creationState = new Map<number, EventDraft>();

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

function buildDraftSummary(draft: EventDraft): string {
    return `📋 *Resumen del evento:*\n\n` +
        `🎉 Nombre: *${draft.name}*\n` +
        `📅 Fecha: *${draft.eventDate}*\n` +
        `🕐 Hora: *${draft.eventTime}*\n` +
        `💰 Cover: *${draft.coverPrice ? `$${draft.coverPrice.toLocaleString('es-CO')}` : 'Entrada libre'}*\n` +
        `📝 Descripción: ${draft.description || '_Sin descripción_'}`;
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
            `/nuevo\\_evento — Crear un evento nuevo\n` +
            `/stats — Estadísticas del bar\n` +
            `/reservas — Reservas de hoy\n` +
            `/cancelar — Cancelar creación en curso\n\n` +
            `_Solo usuarios admin pueden usar estos comandos._`,
            { parse_mode: 'Markdown' },
        );
    });

    // ─── /nuevo_evento — Start event creation ───────────
    bot.command('nuevo_evento', async (ctx) => {
        if (!isAdmin(ctx.chat.id)) {
            await ctx.reply('⛔ No tienes permisos de administrador.');
            return;
        }

        creationState.set(ctx.chat.id, { step: 'NAME' });
        await ctx.reply(
            `✨ *Vamos a crear un nuevo evento*\n\n` +
            `Puedes cancelar en cualquier momento con /cancelar\n\n` +
            `📝 *Paso 1/5:* ¿Cómo se llama el evento?`,
            { parse_mode: 'Markdown' },
        );
    });

    // ─── /cancelar — Cancel creation flow ───────────────
    bot.command('cancelar', async (ctx) => {
        if (creationState.has(ctx.chat.id)) {
            creationState.delete(ctx.chat.id);
            await ctx.reply('❌ Creación de evento cancelada.');
        } else {
            await ctx.reply('No hay ninguna creación en curso.');
        }
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
                await ctx.reply('📭 No hay eventos registrados.\n\nUsa /nuevo\\_evento para crear uno.', { parse_mode: 'Markdown' });
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

            const [totalCustomers, todayReservations, pendingReservations, activeEvents, chatConversations] = await Promise.all([
                prisma.customer.count(),
                prisma.reservation.count({ where: { reservationDate: { gte: today, lt: tomorrow } } }),
                prisma.reservation.count({ where: { status: 'PENDING' } }),
                prisma.event.count({ where: { status: 'ACTIVE', isActive: true } }),
                prisma.chatConversation.count({ where: { status: 'ACTIVE', updatedAt: { gte: today } } }),
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

    // ─── Photo Handler (for flyer upload) ───────────────
    bot.on('message:photo', async (ctx) => {
        if (!isAdmin(ctx.chat.id)) return;

        const draft = creationState.get(ctx.chat.id);
        if (!draft || draft.step !== 'FLYER') {
            await ctx.reply('📸 Para subir un flyer, primero inicia la creación con /nuevo\\_evento', { parse_mode: 'Markdown' });
            return;
        }

        try {
            await ctx.reply('⏳ Subiendo flyer...');

            // Get largest photo version
            const photos = ctx.message.photo;
            const largestPhoto = photos[photos.length - 1];
            const file = await ctx.api.getFile(largestPhoto.file_id);
            const fileUrl = `https://api.telegram.org/file/bot${env.TELEGRAM_BOT_TOKEN}/${file.file_path}`;

            // Download the file
            const response = await fetch(fileUrl);
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            // Create the event first
            const event = await eventsService.create({
                name: draft.name!,
                eventDate: draft.eventDate!,
                eventTime: draft.eventTime!,
                coverPrice: draft.coverPrice,
                description: draft.description,
            });

            // Upload flyer
            const extension = file.file_path?.split('.').pop() || 'jpg';
            const contentType = extension === 'png' ? 'image/png' : extension === 'webp' ? 'image/webp' : 'image/jpeg';
            await eventsService.uploadFlyer(event.id, buffer, `flyer.${extension}`, contentType);

            creationState.delete(ctx.chat.id);

            await ctx.reply(
                `✅ *Evento creado con flyer!*\n\n${buildDraftSummary(draft)}\n\n🖼️ Flyer subido exitosamente\n\n_Visible en /admin/eventos y para el chatbot_`,
                { parse_mode: 'Markdown' },
            );

            logger.info({ eventId: event.id, name: draft.name }, '[Telegram] Event created with flyer');
        } catch (error) {
            logger.error({ err: error }, '[Telegram] Flyer upload failed');
            await ctx.reply('❌ Error al subir el flyer. Intentando crear sin flyer...');

            // Try without flyer
            try {
                await eventsService.create({
                    name: draft.name!,
                    eventDate: draft.eventDate!,
                    eventTime: draft.eventTime!,
                    coverPrice: draft.coverPrice,
                    description: draft.description,
                });
                creationState.delete(ctx.chat.id);
                await ctx.reply('✅ Evento creado sin flyer. Puedes subir el flyer desde el panel admin.');
            } catch (err) {
                logger.error({ err }, '[Telegram] Event creation failed');
                await ctx.reply('❌ Error al crear el evento.');
                creationState.delete(ctx.chat.id);
            }
        }
    });

    // ─── Text Handler (for creation flow) ───────────────
    bot.on('message:text', async (ctx) => {
        if (!isAdmin(ctx.chat.id)) return;

        const draft = creationState.get(ctx.chat.id);
        if (!draft) return; // Not in creation flow — ignore

        const text = ctx.message.text.trim();

        switch (draft.step) {
            case 'NAME':
                if (text.length < 2 || text.length > 200) {
                    await ctx.reply('⚠️ El nombre debe tener entre 2 y 200 caracteres. Intenta de nuevo:');
                    return;
                }
                draft.name = text;
                draft.step = 'DATE';
                await ctx.reply(
                    `✅ Nombre: *${text}*\n\n📅 *Paso 2/5:* ¿Qué fecha? (formato: YYYY-MM-DD)\n\nEjemplo: \`2026-04-15\``,
                    { parse_mode: 'Markdown' },
                );
                break;

            case 'DATE':
                if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
                    await ctx.reply('⚠️ Formato inválido. Usa YYYY-MM-DD\n\nEjemplo: `2026-04-15`', { parse_mode: 'Markdown' });
                    return;
                }
                const date = new Date(text);
                if (isNaN(date.getTime())) {
                    await ctx.reply('⚠️ Fecha inválida. Intenta de nuevo:');
                    return;
                }
                draft.eventDate = text;
                draft.step = 'TIME';
                await ctx.reply(
                    `✅ Fecha: *${text}*\n\n🕐 *Paso 3/5:* ¿A qué hora? (formato: HH:MM)\n\nEjemplo: \`20:00\``,
                    { parse_mode: 'Markdown' },
                );
                break;

            case 'TIME':
                if (!/^\d{2}:\d{2}$/.test(text)) {
                    await ctx.reply('⚠️ Formato inválido. Usa HH:MM\n\nEjemplo: `20:00`', { parse_mode: 'Markdown' });
                    return;
                }
                draft.eventTime = text;
                draft.step = 'COVER';
                await ctx.reply(
                    `✅ Hora: *${text}*\n\n💰 *Paso 4/5:* ¿Precio del cover en COP? (solo el número)\n\nEscribe \`0\` para entrada libre.`,
                    { parse_mode: 'Markdown' },
                );
                break;

            case 'COVER':
                const price = parseInt(text.replace(/[^0-9]/g, ''), 10);
                if (isNaN(price) || price < 0) {
                    await ctx.reply('⚠️ Escribe un número válido. Ejemplo: `30000` o `0` para gratis.', { parse_mode: 'Markdown' });
                    return;
                }
                draft.coverPrice = price;
                draft.step = 'DESCRIPTION';
                await ctx.reply(
                    `✅ Cover: *$${price.toLocaleString('es-CO')}*\n\n📝 *Paso 5/5:* Escribe una descripción corta del evento.\n\nEscribe \`-\` para omitir.`,
                    { parse_mode: 'Markdown' },
                );
                break;

            case 'DESCRIPTION':
                draft.description = text === '-' ? undefined : text.slice(0, 2000);
                draft.step = 'FLYER';
                await ctx.reply(
                    `${buildDraftSummary(draft)}\n\n` +
                    `🖼️ *¿Quieres agregar un flyer?*\n\n` +
                    `📸 Envía una *foto* para usarla como flyer\n` +
                    `✅ Escribe \`listo\` para crear sin flyer`,
                    { parse_mode: 'Markdown' },
                );
                break;

            case 'FLYER':
                if (text.toLowerCase() === 'listo' || text.toLowerCase() === 'no') {
                    try {
                        const event = await eventsService.create({
                            name: draft.name!,
                            eventDate: draft.eventDate!,
                            eventTime: draft.eventTime!,
                            coverPrice: draft.coverPrice,
                            description: draft.description,
                        });
                        creationState.delete(ctx.chat.id);
                        await ctx.reply(
                            `✅ *Evento creado exitosamente!*\n\n${buildDraftSummary(draft)}\n\n_Puedes subir el flyer después desde /admin/eventos_`,
                            { parse_mode: 'Markdown' },
                        );
                        logger.info({ eventId: event.id, name: draft.name }, '[Telegram] Event created without flyer');
                    } catch (error) {
                        logger.error({ err: error }, '[Telegram] Event creation failed');
                        await ctx.reply('❌ Error al crear el evento. Intenta de nuevo con /nuevo\\_evento', { parse_mode: 'Markdown' });
                        creationState.delete(ctx.chat.id);
                    }
                } else {
                    await ctx.reply('📸 Envía una *foto* o escribe `listo` para crear sin flyer.', { parse_mode: 'Markdown' });
                }
                break;
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
