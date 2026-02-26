import { z } from 'zod';
import { TableZone } from '@prisma/client';

export const CreateTableSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(50, 'El nombre no puede exceder 50 caracteres'),
  capacity: z.number().int().min(1, 'La capacidad debe ser al menos 1').max(50, 'La capacidad máxima es 50'),
  zone: z.nativeEnum(TableZone, { errorMap: () => ({ message: 'Zona inválida' }) }),
});

export const UpdateTableSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(50, 'El nombre no puede exceder 50 caracteres').optional(),
  capacity: z.number().int().min(1, 'La capacidad debe ser al menos 1').max(50, 'La capacidad máxima es 50').optional(),
  zone: z.nativeEnum(TableZone, { errorMap: () => ({ message: 'Zona inválida' }) }).optional(),
});

export const TableAvailabilityQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida (formato: YYYY-MM-DD)'),
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Hora inválida (formato: HH:MM)'),
  partySize: z.string().regex(/^\d+$/, 'Debe ser un número').optional().transform((val) => val ? parseInt(val, 10) : undefined),
});

export const TableIdParamSchema = z.object({
  id: z.string().uuid('ID de mesa inválido'),
});

export const TableMapQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida (formato: YYYY-MM-DD)').optional(),
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Hora inválida (formato: HH:MM)').optional(),
});

export type CreateTableInput = z.infer<typeof CreateTableSchema>;
export type UpdateTableInput = z.infer<typeof UpdateTableSchema>;
export type TableAvailabilityQuery = z.infer<typeof TableAvailabilityQuerySchema>;
export type TableMapQuery = z.infer<typeof TableMapQuerySchema>;
