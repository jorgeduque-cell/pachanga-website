import { z } from 'zod';

export enum TableZone {
  SALON = 'SALON',
  TERRAZA = 'TERRAZA',
  VIP = 'VIP',
  BARRA = 'BARRA',
  PISTA = 'PISTA',
}

export const TableSchema = z.object({
  id: z.string(),
  name: z.string(),
  capacity: z.number(),
  zone: z.nativeEnum(TableZone),
  isActive: z.boolean(),
  createdAt: z.date().or(z.string()),
});

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
  partySize: z.string().regex(/^\d+$/).optional().transform((val) => val ? parseInt(val, 10) : undefined),
});

export const TableIdParamSchema = z.object({
  id: z.string().uuid('ID de mesa inválido'),
});

export type Table = z.infer<typeof TableSchema>;
export type CreateTableInput = z.infer<typeof CreateTableSchema>;
export type UpdateTableInput = z.infer<typeof UpdateTableSchema>;
