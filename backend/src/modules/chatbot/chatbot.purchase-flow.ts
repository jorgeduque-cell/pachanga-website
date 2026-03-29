import { prisma } from '../../lib/prisma.js';

// ─── Types ───────────────────────────────────────────────────
export type PurchaseFlowState =
    | 'IDLE'
    | 'COLLECTING_EVENT'
    | 'COLLECTING_TICKET_TYPE'
    | 'COLLECTING_QUANTITY'
    | 'AWAITING_PAYMENT'
    | 'VERIFYING_PAYMENT'
    | 'CONFIRMED';

export interface PurchaseFlowMetadata {
    purchaseFlow: {
        state: PurchaseFlowState;
        eventId?: string;
        eventName?: string;
        eventType?: string;
        ticketType?: string;
        ticketTypeLabel?: string;
        quantity?: number;
        unitPrice?: number;
        totalAmount?: number;
        reference?: string;
        paymentVerificationId?: string;
        updatedAt: string;
    };
}

interface ActiveEvent {
    id: string;
    name: string;
    eventType: string;
    eventDate: Date;
    eventTime: string;
    coverPrice: number | null;
    ticketPrices: unknown;
    tables?: Array<{ zone: string; total: number; reserved: number }>;
}

// ─── Constants ───────────────────────────────────────────────
const FLOW_EXPIRY_MS = 2 * 60 * 60 * 1000; // 2 hours
const PAYMENT_EXPIRY_HOURS = 48;
const BANK_INFO_CATEGORY = 'payment_info';

const TICKET_LABELS: Record<string, string> = {
    palco_8: 'Palco 8 Personas',
    palco_4: 'Palco 4 Personas',
    palco_2: 'Palco 2 Personas',
    vip_primer_piso: 'VIP Primer Piso (4P)',
    vip_segundo_piso: 'VIP Segundo Piso (4P)',
    barras: 'Barras (Pareja)',
};

const TICKET_CAPACITY: Record<string, number> = {
    palco_8: 8,
    palco_4: 4,
    palco_2: 2,
    vip_primer_piso: 4,
    vip_segundo_piso: 4,
    barras: 2,
};

// ─── Service ────────────────────────────────────────────────
export class PurchaseFlowService {

    /**
     * Checks if a conversation has an active purchase flow.
     */
    async getFlowState(conversationId: string): Promise<PurchaseFlowMetadata['purchaseFlow'] | null> {
        const conversation = await prisma.chatConversation.findUnique({
            where: { id: conversationId },
            select: { metadata: true },
        });

        const metadata = conversation?.metadata as PurchaseFlowMetadata | null;
        if (!metadata?.purchaseFlow) return null;

        if (this.isFlowExpired(metadata.purchaseFlow)) {
            await this.resetFlow(conversationId);
            return null;
        }

        return metadata.purchaseFlow;
    }

    /**
     * Starts a new purchase flow — lists active events.
     */
    async startPurchaseFlow(conversationId: string): Promise<string> {
        const events = await this.getActiveEvents();

        if (events.length === 0) {
            return '😔 ¡Lo siento! No tenemos eventos disponibles para compra en este momento. Pero estate pendiente, ¡pronto tendremos algo bueno! 🎶';
        }

        await this.updateFlowState(conversationId, {
            state: 'COLLECTING_EVENT',
            updatedAt: new Date().toISOString(),
        });

        let message = '🎉 *¡Genial! Estos son los eventos disponibles:*\n\n';
        events.forEach((event, index) => {
            const dateStr = event.eventDate.toLocaleDateString('es-CO', {
                weekday: 'long', day: 'numeric', month: 'long',
            });

            // Show pricing summary
            let priceInfo = '';
            const tp = event.ticketPrices as Record<string, number> | null;
            if (tp && Object.values(tp).some(v => v > 0)) {
                const minPerPerson = Math.min(
                    ...Object.entries(tp)
                        .filter(([, v]) => v > 0)
                        .map(([key, price]) => Math.round(price / (TICKET_CAPACITY[key] || 1)))
                );
                priceInfo = `Desde $${minPerPerson.toLocaleString('es-CO')}/persona`;
            } else if (event.coverPrice && event.coverPrice > 0) {
                priceInfo = `Cover: $${event.coverPrice.toLocaleString('es-CO')}`;
            } else {
                priceInfo = 'Entrada libre';
            }

            message += `*${index + 1}.* ${event.name}\n   📅 ${dateStr} — 🕕 ${event.eventTime}\n   💰 ${priceInfo}\n\n`;
        });
        message += '👉 Escribe el *número* del evento que te interesa.';

        return message;
    }

    /**
     * Handles event selection by number.
     */
    async handleEventSelection(conversationId: string, userMessage: string): Promise<string> {
        const events = await this.getActiveEvents();
        const selection = parseInt(userMessage.trim(), 10);

        if (isNaN(selection) || selection < 1 || selection > events.length) {
            return `🤔 No entendí esa selección. Por favor escribe un número del *1* al *${events.length}*.`;
        }

        const selectedEvent = events[selection - 1];
        const tp = selectedEvent.ticketPrices as Record<string, number> | null;
        const isConcert = selectedEvent.eventType === 'CONCERT' && tp && Object.values(tp).some(v => v > 0);

        if (isConcert) {
            // Concert → ask for ticket type / location
            await this.updateFlowState(conversationId, {
                state: 'COLLECTING_TICKET_TYPE',
                eventId: selectedEvent.id,
                eventName: selectedEvent.name,
                eventType: selectedEvent.eventType,
                updatedAt: new Date().toISOString(),
            });

            let message = `✅ Seleccionaste: *${selectedEvent.name}*\n\n📍 *Elige tu ubicación:*\n\n`;
            const entries = Object.entries(tp!).filter(([, v]) => v > 0);
            entries.forEach(([key, price], idx) => {
                const capacity = TICKET_CAPACITY[key] || 1;
                const perPerson = Math.round(price / capacity);
                message += `*${idx + 1}.* ${TICKET_LABELS[key] || key}\n   💰 $${price.toLocaleString('es-CO')} total (${capacity}P = $${perPerson.toLocaleString('es-CO')}/persona)\n\n`;
            });
            message += '👉 Escribe el *número* de la ubicación que deseas.';
            return message;
        } else {
            // Quick Event → go straight to quantity
            await this.updateFlowState(conversationId, {
                state: 'COLLECTING_QUANTITY',
                eventId: selectedEvent.id,
                eventName: selectedEvent.name,
                eventType: selectedEvent.eventType,
                ticketType: 'cover',
                ticketTypeLabel: 'Cover',
                unitPrice: selectedEvent.coverPrice ?? 0,
                updatedAt: new Date().toISOString(),
            });

            const price = selectedEvent.coverPrice
                ? `$${selectedEvent.coverPrice.toLocaleString('es-CO')}`
                : 'Entrada libre';

            return `✅ Seleccionaste: *${selectedEvent.name}*\n💰 Precio por persona: ${price}\n\n¿Cuántas boletas necesitas? (Escribe el número, por ejemplo: *2*)`;
        }
    }

    /**
     * Handles ticket type / location selection for concerts.
     */
    async handleTicketTypeSelection(conversationId: string, userMessage: string): Promise<string> {
        const flowState = await this.getFlowState(conversationId);
        if (!flowState || !flowState.eventId) {
            await this.resetFlow(conversationId);
            return '⚠️ Hubo un problema. Escribe "comprar boletas" para iniciar de nuevo.';
        }

        const event = await prisma.event.findUnique({ where: { id: flowState.eventId } });
        if (!event) {
            await this.resetFlow(conversationId);
            return '⚠️ El evento ya no está disponible. Escribe "comprar boletas" para ver los eventos activos.';
        }

        const tp = event.ticketPrices as Record<string, number> | null;
        if (!tp) {
            await this.resetFlow(conversationId);
            return '⚠️ No hay ubicaciones configuradas para este evento.';
        }

        const entries = Object.entries(tp).filter(([, v]) => v > 0);
        const selection = parseInt(userMessage.trim(), 10);

        if (isNaN(selection) || selection < 1 || selection > entries.length) {
            return `🤔 Por favor escribe un número del *1* al *${entries.length}*.`;
        }

        const [ticketKey, ticketPrice] = entries[selection - 1];
        const capacity = TICKET_CAPACITY[ticketKey] || 1;
        const label = TICKET_LABELS[ticketKey] || ticketKey;

        await this.updateFlowState(conversationId, {
            ...flowState,
            state: 'COLLECTING_QUANTITY',
            ticketType: ticketKey,
            ticketTypeLabel: label,
            unitPrice: ticketPrice,
            updatedAt: new Date().toISOString(),
        });

        return `✅ Ubicación: *${label}*\n💰 Precio: *$${ticketPrice.toLocaleString('es-CO')}* (${capacity} personas incluidas)\n\n¿Cuántas *${label}* necesitas? (Escribe el número, por ejemplo: *1*)`;
    }

    /**
     * Handles quantity selection and transitions to AWAITING_PAYMENT.
     */
    async handleQuantitySelection(
        conversationId: string,
        customerId: string,
        userMessage: string,
    ): Promise<string> {
        const flowState = await this.getFlowState(conversationId);
        if (!flowState || !flowState.eventId || flowState.unitPrice === undefined) {
            await this.resetFlow(conversationId);
            return '⚠️ Hubo un problema con tu selección. Por favor escribe "comprar boletas" para iniciar de nuevo.';
        }

        const quantity = parseInt(userMessage.trim(), 10);
        if (isNaN(quantity) || quantity < 1 || quantity > 10) {
            return '🤔 Por favor escribe un número entre *1* y *10*.';
        }

        const totalAmount = flowState.unitPrice * quantity;
        const reference = this.generatePaymentReference();

        const expiresAt = new Date(Date.now() + PAYMENT_EXPIRY_HOURS * 60 * 60 * 1000);
        const paymentVerification = await prisma.paymentVerification.create({
            data: {
                reference,
                customerId,
                eventId: flowState.eventId,
                conversationId,
                ticketType: flowState.ticketType || 'general',
                quantity,
                expectedAmount: totalAmount,
                status: 'PENDING',
                expiresAt,
            },
        });

        await this.updateFlowState(conversationId, {
            ...flowState,
            state: 'AWAITING_PAYMENT',
            quantity,
            totalAmount,
            reference,
            paymentVerificationId: paymentVerification.id,
            updatedAt: new Date().toISOString(),
        });

        const bankInfo = await this.getBankInfo();
        const ticketLabel = flowState.ticketTypeLabel || 'General';

        return `🧾 *Resumen de tu compra:*\n\n` +
            `🎉 Evento: *${flowState.eventName}*\n` +
            `📍 Ubicación: *${ticketLabel}*\n` +
            `🎫 Cantidad: *${quantity}*\n` +
            `💰 Total: *$${totalAmount.toLocaleString('es-CO')}*\n` +
            `🔖 Referencia: *${reference}*\n\n` +
            `${bankInfo}\n\n` +
            `📸 Una vez realices el pago, *envía la foto del comprobante* por este chat.\n` +
            `⏰ Tienes 48 horas para completar el pago.\n\n` +
            `⚠️ *IMPORTANTE:* Incluye la referencia *${reference}* en la descripción del pago.`;
    }

    /**
     * Marks flow as VERIFYING_PAYMENT when receipt is received.
     */
    async markReceiptReceived(conversationId: string): Promise<void> {
        const flowState = await this.getFlowState(conversationId);
        if (!flowState) return;

        await this.updateFlowState(conversationId, {
            ...flowState,
            state: 'VERIFYING_PAYMENT',
            updatedAt: new Date().toISOString(),
        });
    }

    /**
     * Resets the purchase flow to IDLE.
     */
    async resetFlow(conversationId: string): Promise<void> {
        await prisma.chatConversation.update({
            where: { id: conversationId },
            data: { metadata: { purchaseFlow: null } },
        });
    }

    // ─── Private Helpers ────────────────────────────────────

    private async updateFlowState(
        conversationId: string,
        flowState: PurchaseFlowMetadata['purchaseFlow'],
    ): Promise<void> {
        await prisma.chatConversation.update({
            where: { id: conversationId },
            data: { metadata: { purchaseFlow: flowState } },
        });
    }

    private isFlowExpired(flow: PurchaseFlowMetadata['purchaseFlow']): boolean {
        const lastUpdate = new Date(flow.updatedAt).getTime();
        return Date.now() - lastUpdate > FLOW_EXPIRY_MS;
    }

    private async getActiveEvents(): Promise<ActiveEvent[]> {
        const events = await prisma.event.findMany({
            where: {
                isActive: true,
                status: 'ACTIVE',
                eventDate: { gte: new Date() },
            },
            include: { tables: true },
            orderBy: { eventDate: 'asc' },
            take: 5,
        });

        // Filter: must have either coverPrice > 0 OR ticketPrices with values > 0
        return events.filter(event => {
            const tp = event.ticketPrices as Record<string, number> | null;
            const hasTicketPrices = tp && Object.values(tp).some(v => v > 0);
            const hasCoverPrice = event.coverPrice !== null && event.coverPrice > 0;
            return hasTicketPrices || hasCoverPrice;
        });
    }

    private generatePaymentReference(): string {
        const now = new Date();
        const dd = String(now.getDate()).padStart(2, '0');
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const yy = String(now.getFullYear()).slice(-2);
        const randomDigit = Math.floor(Math.random() * 10);
        const randomLetter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
        return `PACH-${dd}${mm}${yy}-${randomDigit}${randomLetter}`;
    }

    private async getBankInfo(): Promise<string> {
        const entries = await prisma.chatbotKnowledge.findMany({
            where: { category: BANK_INFO_CATEGORY, isActive: true },
            orderBy: { key: 'asc' },
        });

        if (entries.length === 0) {
            return '💳 *Datos de pago:*\nContacta al administrador para obtener los datos bancarios.';
        }

        let info = '💳 *Datos de pago:*\n';
        for (const entry of entries) {
            info += `• *${entry.key}:* ${entry.value}\n`;
        }
        return info;
    }
}

export const purchaseFlowService = new PurchaseFlowService();
