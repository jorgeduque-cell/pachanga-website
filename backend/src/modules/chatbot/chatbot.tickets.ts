import QRCode from 'qrcode';
import { uploadTicketQr } from '../../lib/storage.js';
import { logger } from '../../lib/logger.js';
import { TICKET_LABELS } from './chatbot.purchase-flow.js';

export interface TicketPaymentInfo {
    reference: string;
    ticketType: string;
    quantity: number;
    customer: { name: string };
    event: { name: string; eventDate: Date; eventTime: string };
}

/**
 * Generates the entry QR for a confirmed payment and uploads it to Supabase.
 * The QR encodes a human-readable payload keyed by the unique payment
 * reference, so door staff can scan it with any reader and cross-check the
 * reference against the admin payments panel.
 * Returns the public PNG URL, or null if generation/upload fails (callers
 * must fall back to a text-only confirmation).
 */
export async function generateAndUploadTicketQr(payment: TicketPaymentInfo): Promise<string | null> {
    try {
        const dateStr = payment.event.eventDate.toISOString().slice(0, 10);
        const label = TICKET_LABELS[payment.ticketType] || payment.ticketType;

        const payload = [
            'PACHANGA Y POCHOLA — ENTRADA OFICIAL',
            `REF: ${payment.reference}`,
            `EVENTO: ${payment.event.name}`,
            `FECHA: ${dateStr} ${payment.event.eventTime}`,
            `UBICACION: ${label}`,
            `CANTIDAD: ${payment.quantity}`,
            `CLIENTE: ${payment.customer.name}`,
        ].join('\n');

        const buffer = await QRCode.toBuffer(payload, {
            width: 600,
            margin: 2,
            errorCorrectionLevel: 'M',
        });

        return await uploadTicketQr(buffer, payment.reference);
    } catch (error) {
        logger.error({ err: error, reference: payment.reference }, '[Tickets] QR generation failed');
        return null;
    }
}
