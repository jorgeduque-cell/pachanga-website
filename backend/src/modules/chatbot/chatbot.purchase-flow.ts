import { prisma } from '../../lib/prisma.js';
import { logger } from '../../lib/logger.js';

// ─── Types ───────────────────────────────────────────────────
export type PurchaseFlowState =
    | 'IDLE'
    | 'COLLECTING_EVENT'
    | 'COLLECTING_QUANTITY'
    | 'AWAITING_PAYMENT'
    | 'VERIFYING_PAYMENT'
    | 'CONFIRMED';

export interface PurchaseFlowMetadata {
    purchaseFlow: {
        state: PurchaseFlowState;
        eventId?: string;
        eventName?: string;
        ticketType?: string;
        quantity?: number;
        unitPrice?: number;
        totalAmount?: number;
        reference?: string;
        paymentVerificationId?: string;
        updatedAt: string; // ISO timestamp for expiry check
    };
}

interface ActiveEvent {
    id: string;
    name: string;
    eventDate: Date;
    eventTime: string;
    coverPrice: number | null;
    tables?: Array<{ zone: string; total: number; reserved: number }>;
}

// ─── Constants ───────────────────────────────────────────────
const FLOW_EXPIRY_MS = 2 * 60 * 60 * 1000; // 2 hours
const PAYMENT_EXPIRY_HOURS = 48;
const BANK_INFO_CATEGORY = 'payment_info';

// ─── Service ────────────────────────────────────────────────
export class PurchaseFlowService {

    /**
     * Checks if a conversation has an active purchase flow.
     * Returns the flow state or null if no active flow.
     */
    async getFlowState(conversationId: string): Promise<PurchaseFlowMetadata['purchaseFlow'] | null> {
        const conversation = await prisma.chatConversation.findUnique({
            where: { id: conversationId },
            select: { metadata: true },
        });

        const metadata = conversation?.metadata as PurchaseFlowMetadata | null;
        if (!metadata?.purchaseFlow) return null;

        // Check expiration
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

        // Update conversation metadata
        await this.updateFlowState(conversationId, {
            state: 'COLLECTING_EVENT',
            updatedAt: new Date().toISOString(),
        });

        // Build event list message
        let message = '🎉 *¡Genial! Estos son los eventos disponibles:*\n\n';
        events.forEach((event, index) => {
            const dateStr = event.eventDate.toLocaleDateString('es-CO', {
                weekday: 'long', day: 'numeric', month: 'long',
            });
            const price = event.coverPrice
                ? `$${event.coverPrice.toLocaleString('es-CO')}`
                : 'Entrada libre';
            message += `*${index + 1}.* ${event.name}\n   📅 ${dateStr} — 🕕 ${event.eventTime}\n   💰 ${price}\n\n`;
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

        await this.updateFlowState(conversationId, {
            state: 'COLLECTING_QUANTITY',
            eventId: selectedEvent.id,
            eventName: selectedEvent.name,
            unitPrice: selectedEvent.coverPrice ?? 0,
            updatedAt: new Date().toISOString(),
        });

        const price = selectedEvent.coverPrice
            ? `$${selectedEvent.coverPrice.toLocaleString('es-CO')}`
            : 'Entrada libre';

        return `✅ Seleccionaste: *${selectedEvent.name}*\n💰 Precio por persona: ${price}\n\n¿Cuántas boletas necesitas? (Escribe el número, por ejemplo: *2*)`;
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
        if (!flowState || !flowState.eventId || !flowState.unitPrice) {
            await this.resetFlow(conversationId);
            return '⚠️ Hubo un problema con tu selección. Por favor escribe "comprar boletas" para iniciar de nuevo.';
        }

        const quantity = parseInt(userMessage.trim(), 10);
        if (isNaN(quantity) || quantity < 1 || quantity > 10) {
            return '🤔 Por favor escribe un número de boletas entre *1* y *10*.';
        }

        const totalAmount = flowState.unitPrice * quantity;
        const reference = this.generatePaymentReference();

        // Create PaymentVerification in DB
        const expiresAt = new Date(Date.now() + PAYMENT_EXPIRY_HOURS * 60 * 60 * 1000);
        const paymentVerification = await prisma.paymentVerification.create({
            data: {
                reference,
                customerId,
                eventId: flowState.eventId,
                conversationId,
                ticketType: 'general',
                quantity,
                expectedAmount: totalAmount,
                status: 'PENDING',
                expiresAt,
            },
        });

        // Update flow state
        await this.updateFlowState(conversationId, {
            state: 'AWAITING_PAYMENT',
            eventId: flowState.eventId,
            eventName: flowState.eventName,
            unitPrice: flowState.unitPrice,
            ticketType: 'general',
            quantity,
            totalAmount,
            reference,
            paymentVerificationId: paymentVerification.id,
            updatedAt: new Date().toISOString(),
        });

        // Get bank info from knowledge base
        const bankInfo = await this.getBankInfo();

        return `🧾 *Resumen de tu compra:*\n\n` +
            `🎉 Evento: *${flowState.eventName}*\n` +
            `🎫 Boletas: *${quantity}* (general)\n` +
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
        return prisma.event.findMany({
            where: {
                isActive: true,
                status: 'ACTIVE',
                eventDate: { gte: new Date() },
                coverPrice: { not: null, gt: 0 },
            },
            include: { tables: true },
            orderBy: { eventDate: 'asc' },
            take: 5,
        });
    }

    /**
     * Generates a unique reference: PACH-DDMMYY-NX
     * Where N = random digit, X = random letter
     */
    private generatePaymentReference(): string {
        const now = new Date();
        const dd = String(now.getDate()).padStart(2, '0');
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const yy = String(now.getFullYear()).slice(-2);
        const randomDigit = Math.floor(Math.random() * 10);
        const randomLetter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
        return `PACH-${dd}${mm}${yy}-${randomDigit}${randomLetter}`;
    }

    /**
     * Gets bank info from chatbot knowledge base (category: payment_info).
     */
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
