import { randomBytes } from 'node:crypto';
import { prisma } from './prisma.js';
import { env } from '../config/env.js';

/**
 * Acortador de links propio (sin servicios externos tipo bit.ly, que WhatsApp
 * a veces marca como spam). Guarda el destino en la tabla key-value existente
 * `crm_config` bajo `shortlink:<code>` — cero migraciones. La ruta pública
 * GET /r/:code (server.ts) hace el redirect 302.
 */

const KEY_PREFIX = 'shortlink:';
const CODE_LENGTH = 6;
// Base58-like: sin 0/O/1/l/I para que el código sea legible si se dicta.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
const CLEANUP_AGE_DAYS = 60;

function randomCode(): string {
    const bytes = randomBytes(CODE_LENGTH);
    let out = '';
    for (let i = 0; i < CODE_LENGTH; i++) {
        out += ALPHABET[bytes[i] % ALPHABET.length];
    }
    return out;
}

/**
 * Crea un link corto `${PUBLIC_BASE_URL}/r/<code>` que redirige a `targetUrl`.
 * Lanza si la BD falla: el llamador decide el fallback (usar el link largo).
 */
export async function createShortLink(targetUrl: string): Promise<string> {
    let lastError: unknown;

    // Reintento por colisión de código (probabilidad ínfima con 56^6 ≈ 30 mil millones).
    for (let attempt = 0; attempt < 3; attempt++) {
        const code = randomCode();
        try {
            await prisma.crmConfig.create({
                data: { key: KEY_PREFIX + code, value: targetUrl },
            });

            // Limpieza oportunista de links viejos (fire-and-forget).
            const cutoff = new Date(Date.now() - CLEANUP_AGE_DAYS * 24 * 60 * 60 * 1000);
            prisma.crmConfig.deleteMany({
                where: { key: { startsWith: KEY_PREFIX }, updatedAt: { lt: cutoff } },
            }).catch(() => {});

            return `${env.PUBLIC_BASE_URL}/r/${code}`;
        } catch (error) {
            lastError = error;
        }
    }

    throw lastError;
}

/** Resuelve un código a su URL destino, o null si no existe/es inválido. */
export async function resolveShortLink(code: string): Promise<string | null> {
    if (!/^[A-Za-z0-9]{4,12}$/.test(code)) return null;

    const row = await prisma.crmConfig.findUnique({
        where: { key: KEY_PREFIX + code },
        select: { value: true },
    });
    return row?.value ?? null;
}
