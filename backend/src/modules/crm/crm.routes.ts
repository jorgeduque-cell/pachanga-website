import { Router } from 'express';
import { crmController } from './crm.controller.js';
import { authenticate, requireAdmin } from '../../middleware/auth.middleware.js';
import { validateBody, validateQuery, validateParams } from '../../middleware/validate.middleware.js';
import {
    CaptureSchema,
    UpdateCustomerSchema,
    CustomerFiltersSchema,
    CustomerIdParamSchema,
    SendMessageSchema,
    UpdateConfigSchema,
    MessageFiltersSchema,
} from '../../schemas/crm.schema.js';
import rateLimit from 'express-rate-limit';

// Rate limiter específico para captura QR: 5 req/min por IP
const captureLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Demasiadas solicitudes, intente más tarde' },
});

const router = Router();

// ─── Ruta Pública ───────────────────────────────────────────
router.post(
    '/capture',
    captureLimiter,
    validateBody(CaptureSchema),
    crmController.capture,
);

// ─── Rutas Admin ────────────────────────────────────────────
router.get(
    '/customers',
    authenticate, requireAdmin,
    validateQuery(CustomerFiltersSchema),
    crmController.getAll,
);

router.get(
    '/customers/:id',
    authenticate, requireAdmin,
    validateParams(CustomerIdParamSchema),
    crmController.getById,
);

router.patch(
    '/customers/:id',
    authenticate, requireAdmin,
    validateParams(CustomerIdParamSchema),
    validateBody(UpdateCustomerSchema),
    crmController.update,
);

router.get(
    '/messages',
    authenticate, requireAdmin,
    validateQuery(MessageFiltersSchema),
    crmController.getMessages,
);

router.post(
    '/send-message',
    authenticate, requireAdmin,
    validateBody(SendMessageSchema),
    crmController.sendMessage,
);

router.get(
    '/config',
    authenticate, requireAdmin,
    crmController.getConfig,
);

router.patch(
    '/config',
    authenticate, requireAdmin,
    validateBody(UpdateConfigSchema),
    crmController.updateConfig,
);

router.get(
    '/stats',
    authenticate, requireAdmin,
    crmController.getStats,
);

router.get(
    '/birthdays/today',
    authenticate, requireAdmin,
    crmController.getTodayBirthdays,
);

// ─── QR Generation ──────────────────────────────────────────
// IMPORTANTE: /qr/batch debe ir antes que /qr/:tableName
router.get(
    '/qr/batch',
    authenticate, requireAdmin,
    crmController.generateQRBatch,
);

router.get(
    '/qr/:tableName',
    authenticate, requireAdmin,
    crmController.generateQR,
);

export default router;
