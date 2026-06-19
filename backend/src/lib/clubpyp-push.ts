import { logger } from './logger.js';

// ============================================
// PACHANGA → CLUB PYP: disparar push a la app
// ============================================
// Llama a la Edge Function `send-push` del proyecto Club PyP para enviar una
// notificación a TODOS los usuarios de la app (broadcast). No bloquea ni rompe
// el flujo que la invoca: si falla, solo se loguea.
//
// Env requeridas (en Render, backend Pachanga):
//   CLUBPYP_PUSH_URL    = https://zbzcamdgmukqqamjqcuy.supabase.co/functions/v1/send-push
//   CLUBPYP_PUSH_SECRET = el mismo valor de PUSH_INTERNAL_SECRET de Club PyP

const PUSH_URL =
    process.env.CLUBPYP_PUSH_URL ||
    'https://zbzcamdgmukqqamjqcuy.supabase.co/functions/v1/send-push';
const PUSH_SECRET = process.env.CLUBPYP_PUSH_SECRET || '';

interface BroadcastInput {
    title: string;
    body?: string;
    url?: string;
    urgency?: 'high' | 'normal';
}

/**
 * Envía un push a TODOS los usuarios de la app Club PyP. Fire-and-forget.
 */
export async function broadcastToClubPyP(input: BroadcastInput): Promise<void> {
    if (!PUSH_SECRET) {
        logger.warn('[ClubPyP push] CLUBPYP_PUSH_SECRET no configurado, se omite el push');
        return;
    }
    try {
        const res = await fetch(PUSH_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-push-secret': PUSH_SECRET,
            },
            body: JSON.stringify({
                broadcast: true,
                title: input.title,
                body: input.body ?? '',
                url: input.url ?? '/',
                urgency: input.urgency ?? 'high',
            }),
        });
        const data = await res.json().catch(() => ({}));
        logger.info({ status: res.status, data }, '[ClubPyP push] broadcast enviado');
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        logger.error({ err: msg }, '[ClubPyP push] falló el broadcast');
    }
}
