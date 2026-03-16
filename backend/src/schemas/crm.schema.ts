import { z } from 'zod';

// ─── Capture (Public — QR Form) ─────────────────────────────
export const CaptureSchema = z.object({
    name: z.string()
        .min(2, 'El nombre debe tener al menos 2 caracteres')
        .max(100, 'El nombre no puede exceder 100 caracteres'),
    phone: z.string()
        .min(5, 'Teléfono inválido')
        .max(30, 'Teléfono demasiado largo'),
    birthDate: z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha de nacimiento inválida (YYYY-MM-DD)'),
    rating: z.number()
        .int()
        .min(1, 'Rating mínimo es 1')
        .max(5, 'Rating máximo es 5'),
    qrTable: z.string()
        .max(50, 'Nombre de mesa inválido')
        .optional(),
    optIn: z.boolean()
        .optional()
        .default(true),
});

// ─── Update Customer (Admin) ────────────────────────────────
export const UpdateCustomerSchema = z.object({
    name: z.string().min(2).max(100).optional(),
    notes: z.string().max(500).optional(),
    optIn: z.boolean().optional(),
    isActive: z.boolean().optional(),
});

// ─── Customer Filters (Admin) ───────────────────────────────
export const CustomerFiltersSchema = z.object({
    search: z.string().max(100).optional(),
    source: z.enum(['QR_SCAN', 'RESERVATION', 'MANUAL']).optional(),
    optIn: z.string().regex(/^(true|false)$/).optional().transform((val) =>
        val === undefined ? undefined : val === 'true'
    ),
    page: z.string().regex(/^\d+$/).optional().transform((val) => {
        const num = val ? parseInt(val, 10) : 1;
        return Math.max(num, 1);
    }),
    limit: z.string().regex(/^\d+$/).optional().transform((val) => {
        const num = val ? parseInt(val, 10) : 20;
        return Math.min(Math.max(num, 1), 100);
    }),
});

// ─── Customer ID Param ──────────────────────────────────────
export const CustomerIdParamSchema = z.object({
    id: z.string().uuid('ID de cliente inválido'),
});

// ─── Send Message (Admin) ───────────────────────────────────
export const SendMessageSchema = z.object({
    customerId: z.string().uuid('ID de cliente inválido'),
    templateName: z.string().min(1, 'Nombre de template requerido').max(100),
});

// ─── Config Update (Admin) ──────────────────────────────────
export const UpdateConfigSchema = z.object({
    key: z.string().min(1).max(100),
    value: z.string().min(1).max(1000),
});

// ─── Message Filters (Admin) ────────────────────────────────
export const MessageFiltersSchema = z.object({
    type: z.enum(['WELCOME', 'BIRTHDAY', 'PROMO', 'REACTIVATION', 'SURVEY']).optional(),
    status: z.enum(['QUEUED', 'SENT', 'DELIVERED', 'READ', 'FAILED']).optional(),
    page: z.string().regex(/^\d+$/).optional().transform((val) => {
        const num = val ? parseInt(val, 10) : 1;
        return Math.max(num, 1);
    }),
    limit: z.string().regex(/^\d+$/).optional().transform((val) => {
        const num = val ? parseInt(val, 10) : 20;
        return Math.min(Math.max(num, 1), 100);
    }),
});

// ─── Types ──────────────────────────────────────────────────
export type CaptureInput = z.infer<typeof CaptureSchema>;
export type UpdateCustomerInput = z.infer<typeof UpdateCustomerSchema>;
export type CustomerFilters = z.infer<typeof CustomerFiltersSchema>;
export type SendMessageInput = z.infer<typeof SendMessageSchema>;
export type UpdateConfigInput = z.infer<typeof UpdateConfigSchema>;
export type MessageFilters = z.infer<typeof MessageFiltersSchema>;
