import { z } from 'zod';
import { ReservationStatus } from '@prisma/client';

export const CreateReservationSchema = z.object({
  customerName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100, 'El nombre no puede exceder 100 caracteres'),
  customerPhone: z.string().min(5, 'Teléfono inválido').max(20, 'Teléfono demasiado largo'),
  reservationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida (formato: YYYY-MM-DD)'),
  reservationTime: z.enum(['19:00', '20:00', '21:00', '22:00'], {
    errorMap: () => ({ message: 'Hora no disponible. Horarios: 7PM, 8PM, 9PM, 10PM' }),
  }),
  partySize: z.number().int().min(1, 'Debe haber al menos 1 persona').max(50, 'El grupo no puede exceder 50 personas'),
  tableId: z.string().uuid('ID de mesa inválido').optional(),
  message: z.string().max(500, 'El mensaje no puede exceder 500 caracteres').optional(),
});

export const UpdateReservationSchema = z.object({
  customerName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100).optional(),
  customerPhone: z.string().min(5, 'Teléfono inválido').max(20).optional(),
  reservationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida').optional(),
  reservationTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Hora inválida').optional(),
  partySize: z.number().int().min(1).max(50).optional(),
  tableId: z.string().uuid('ID de mesa inválido').optional().nullable(),
  status: z.nativeEnum(ReservationStatus).optional(),
  message: z.string().max(500).optional(),
});

export const ReservationFiltersSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida').optional(),
  status: z.nativeEnum(ReservationStatus).optional(),
  search: z.string().max(100).optional(),
  page: z.string().regex(/^\d+$/).optional().transform((val) => {
    const num = val ? parseInt(val, 10) : 1;
    return Math.max(num, 1); // Mínimo 1
  }),
  limit: z.string().regex(/^\d+$/).optional().transform((val) => {
    const num = val ? parseInt(val, 10) : 10;
    return Math.min(Math.max(num, 1), 100); // Mín 1, Máx 100
  }),
});

export const ReservationIdParamSchema = z.object({
  id: z.string().uuid('ID de reserva inválido'),
});

export type CreateReservationInput = z.infer<typeof CreateReservationSchema>;
export type UpdateReservationInput = z.infer<typeof UpdateReservationSchema>;
export type ReservationFilters = z.infer<typeof ReservationFiltersSchema>;
