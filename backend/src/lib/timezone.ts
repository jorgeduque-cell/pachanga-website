// ─── Shared Timezone Constants ───────────────────────────────
// Colombia (Bogotá) — UTC-5, no DST transitions since 1993.
// Single source of truth used by reservation.service.ts and reservation-cleanup.ts.

export const BOGOTA_TIMEZONE = 'America/Bogota';
export const BOGOTA_UTC_OFFSET_HOURS = -5;
export const BOGOTA_UTC_OFFSET_MS = BOGOTA_UTC_OFFSET_HOURS * 60 * 60 * 1000;
