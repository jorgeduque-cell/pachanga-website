import { z } from 'zod';

// ─── Rating Validation (Shared) ─────────────────────────────
const ratingField = z.number()
    .int('La calificación debe ser un número entero')
    .min(1, 'Calificación mínima es 1')
    .max(5, 'Calificación máxima es 5');

// ─── Submit Survey (Public — via token) ─────────────────────
export const SubmitSurveySchema = z.object({
    token: z.string().min(1, 'Token requerido'),
    musicRating: ratingField,
    serviceRating: ratingField,
    ambienceRating: ratingField,
    hygieneRating: ratingField,
});

// ─── Verify Token (Public — query param) ────────────────────
export const SurveyTokenQuerySchema = z.object({
    token: z.string().min(1, 'Token requerido'),
});

// ─── Generate Link (Admin) ──────────────────────────────────
export const GenerateSurveyLinkSchema = z.object({
    customerId: z.string().uuid('ID de cliente inválido'),
});

// ─── Survey Filters (Admin — list) ──────────────────────────
export const SurveyFiltersSchema = z.object({
    page: z.string().regex(/^\d+$/).optional().transform((val) => {
        const num = val ? parseInt(val, 10) : 1;
        return Math.max(num, 1);
    }),
    limit: z.string().regex(/^\d+$/).optional().transform((val) => {
        const num = val ? parseInt(val, 10) : 20;
        return Math.min(Math.max(num, 1), 100);
    }),
    customerId: z.string().uuid().optional(),
});

// ─── Types ──────────────────────────────────────────────────
export type SubmitSurveyInput = z.infer<typeof SubmitSurveySchema>;
export type SurveyTokenQuery = z.infer<typeof SurveyTokenQuerySchema>;
export type GenerateSurveyLinkInput = z.infer<typeof GenerateSurveyLinkSchema>;
export type SurveyFilters = z.infer<typeof SurveyFiltersSchema>;
