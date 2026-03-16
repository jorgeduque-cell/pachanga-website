import { AppError } from '../middleware/error.middleware.js';

// ─── Constants ───────────────────────────────────────────────
const COLOMBIA_COUNTRY_CODE = '+57';
const E164_REGEX = /^\+[1-9]\d{6,14}$/;
const COLOMBIA_MOBILE_DIGITS = 10; // 3XX XXX XXXX

/**
 * Normalizes a Colombian phone number to E.164 format (+57XXXXXXXXXX).
 * Accepts: "321 999 2719", "3219992719", "+573219992719", "57 321 999 2719"
 */
export function normalizePhone(rawPhone: string): string {
    // Strip all non-digit characters except leading +
    const cleaned = rawPhone.replace(/[^\d+]/g, '');

    // Already in E.164 format
    if (cleaned.startsWith('+')) {
        if (!E164_REGEX.test(cleaned)) {
            throw new AppError(`Número de teléfono inválido: ${rawPhone}`, 400);
        }
        return cleaned;
    }

    // Has country code without +
    if (cleaned.startsWith('57') && cleaned.length === COLOMBIA_MOBILE_DIGITS + 2) {
        return `+${cleaned}`;
    }

    // Local number (10 digits: 3XX XXX XXXX)
    if (cleaned.length === COLOMBIA_MOBILE_DIGITS && cleaned.startsWith('3')) {
        return `${COLOMBIA_COUNTRY_CODE}${cleaned}`;
    }

    throw new AppError(
        `No se pudo normalizar el teléfono "${rawPhone}". Use formato: 3XX XXX XXXX o +57XXXXXXXXXX`,
        400,
    );
}

/**
 * Validates that a phone number is in E.164 format.
 */
export function validateE164(phone: string): boolean {
    return E164_REGEX.test(phone);
}

/**
 * Safe wrapper around normalizePhone(). Falls back to basic cleanup
 * (strip whitespace, dashes, parens) for international numbers that
 * don't match Colombian format.
 */
export function normalizePhoneSafe(rawPhone: string): string {
    try {
        return normalizePhone(rawPhone);
    } catch {
        return rawPhone.replace(/[\s-()]/g, '');
    }
}
