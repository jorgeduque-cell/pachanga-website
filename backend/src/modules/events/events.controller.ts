import { Request, Response, Router } from 'express';
import { z } from 'zod';
import { eventsService } from './events.service.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';

const router = Router();

// ─── Constants ───────────────────────────────────────────
const MAX_FLYER_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

// ─── Validation Schemas ──────────────────────────────────
const UuidSchema = z.string().uuid();

const CreateEventSchema = z.object({
    name: z.string().min(1).max(200),
    eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    eventTime: z.string().regex(/^\d{2}:\d{2}$/),
    description: z.string().max(2000).optional(),
    coverPrice: z.number().int().min(0).optional(),
    tables: z.array(z.object({
        zone: z.enum(['SALON', 'TERRAZA', 'VIP', 'BARRA', 'PISTA']),
        total: z.number().int().min(0),
    })).optional(),
});

const UpdateEventSchema = z.object({
    name: z.string().min(1).max(200).optional(),
    eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    eventTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    description: z.string().max(2000).optional(),
    coverPrice: z.number().int().min(0).optional(),
    status: z.enum(['ACTIVE', 'SOLD_OUT', 'CANCELLED', 'PAST']).optional(),
    isActive: z.boolean().optional(),
});

const UpdateTablesSchema = z.array(z.object({
    zone: z.enum(['SALON', 'TERRAZA', 'VIP', 'BARRA', 'PISTA']),
    total: z.number().int().min(0),
    reserved: z.number().int().min(0),
}));

const EventStatusFilter = z.enum(['ACTIVE', 'SOLD_OUT', 'CANCELLED', 'PAST']).optional();

// ─── Shared Error Handler ────────────────────────────────
function handleValidationError(error: unknown, res: Response, fallbackMessage: string) {
    if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Datos inválidos', details: error.errors });
    }
    return res.status(500).json({ error: fallbackMessage });
}

// ─── Public Routes ───────────────────────────────────────

// GET /api/events — Public list of upcoming events
router.get('/', async (_req: Request, res: Response) => {
    try {
        const events = await eventsService.list({ upcoming: true });
        res.json(events);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener eventos' });
    }
});

// GET /api/events/:id — Public event details
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const id = UuidSchema.parse(req.params.id);
        const event = await eventsService.getById(id);
        if (!event) return res.status(404).json({ error: 'Evento no encontrado' });
        res.json(event);
    } catch (error) {
        return handleValidationError(error, res, 'Error al obtener evento');
    }
});

// ─── Admin Routes ────────────────────────────────────────

// GET /api/events/admin/all — All events (admin)
router.get('/admin/all', requireAuth, requireRole('ADMIN'), async (req: Request, res: Response) => {
    try {
        const status = EventStatusFilter.parse(req.query.status);
        const events = await eventsService.list(status ? { status } : undefined);
        res.json(events);
    } catch (error) {
        return handleValidationError(error, res, 'Error al obtener eventos');
    }
});

// POST /api/events — Create event (admin)
router.post('/', requireAuth, requireRole('ADMIN'), async (req: Request, res: Response) => {
    try {
        const input = CreateEventSchema.parse(req.body);
        const event = await eventsService.create(input);
        res.status(201).json(event);
    } catch (error) {
        return handleValidationError(error, res, 'Error al crear evento');
    }
});

// PATCH /api/events/:id — Update event (admin)
router.patch('/:id', requireAuth, requireRole('ADMIN'), async (req: Request, res: Response) => {
    try {
        const id = UuidSchema.parse(req.params.id);
        const input = UpdateEventSchema.parse(req.body);
        const event = await eventsService.update(id, input);
        res.json(event);
    } catch (error) {
        return handleValidationError(error, res, 'Error al actualizar evento');
    }
});

// POST /api/events/:id/flyer — Upload flyer image (admin)
router.post('/:id/flyer', requireAuth, requireRole('ADMIN'), async (req: Request, res: Response) => {
    try {
        const id = UuidSchema.parse(req.params.id);
        const contentType = (req.headers['content-type'] || 'image/jpeg') as string;

        // Validate MIME type
        if (!ALLOWED_MIME_TYPES.includes(contentType as typeof ALLOWED_MIME_TYPES[number])) {
            return res.status(400).json({
                error: 'Tipo de archivo no permitido. Solo se aceptan: JPEG, PNG, WebP',
            });
        }

        // Collect body with size limit enforcement
        const chunks: Buffer[] = [];
        let totalSize = 0;

        await new Promise<void>((resolve, reject) => {
            req.on('data', (chunk: Buffer) => {
                totalSize += chunk.length;
                if (totalSize > MAX_FLYER_SIZE) {
                    reject(new Error('FILE_TOO_LARGE'));
                    return;
                }
                chunks.push(chunk);
            });
            req.on('end', resolve);
            req.on('error', reject);
        });

        const buffer = Buffer.concat(chunks);
        const rawFileName = (req.headers['x-filename'] as string) || 'flyer.jpg';
        const safeFileName = rawFileName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100);

        const event = await eventsService.uploadFlyer(id, buffer, safeFileName, contentType);
        res.json(event);
    } catch (error) {
        if (error instanceof Error && error.message === 'FILE_TOO_LARGE') {
            return res.status(413).json({ error: 'El archivo excede el límite de 5MB' });
        }
        return handleValidationError(error, res, 'Error al subir flyer');
    }
});

// PUT /api/events/:id/tables — Update table availability (admin)
router.put('/:id/tables', requireAuth, requireRole('ADMIN'), async (req: Request, res: Response) => {
    try {
        const id = UuidSchema.parse(req.params.id);
        const tables = UpdateTablesSchema.parse(req.body);
        const event = await eventsService.updateTables(id, tables);
        res.json(event);
    } catch (error) {
        return handleValidationError(error, res, 'Error al actualizar mesas');
    }
});

// DELETE /api/events/:id — Delete event (admin)
router.delete('/:id', requireAuth, requireRole('ADMIN'), async (req: Request, res: Response) => {
    try {
        const id = UuidSchema.parse(req.params.id);
        await eventsService.delete(id);
        res.json({ message: 'Evento eliminado' });
    } catch (error) {
        return handleValidationError(error, res, 'Error al eliminar evento');
    }
});

export { router as eventsRouter };
