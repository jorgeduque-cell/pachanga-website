import { Router } from 'express';
import { surveyController } from './survey.controller.js';
import { authenticate, requireAdmin } from '../../middleware/auth.middleware.js';
import { validateBody, validateQuery } from '../../middleware/validate.middleware.js';
import {
    SubmitSurveySchema,
    SurveyTokenQuerySchema,
    GenerateSurveyLinkSchema,
    SurveyFiltersSchema,
} from '../../schemas/survey.schema.js';
import rateLimit from 'express-rate-limit';

// Rate limiter for public survey submission: 10 req/min per IP
const surveyLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Demasiadas solicitudes, intente más tarde' },
});

const router = Router();

// ─── Rutas Públicas ─────────────────────────────────────────
router.get(
    '/verify',
    surveyLimiter,
    validateQuery(SurveyTokenQuerySchema),
    surveyController.verify,
);

router.post(
    '/submit',
    surveyLimiter,
    validateBody(SubmitSurveySchema),
    surveyController.submit,
);

// ─── Rutas Admin ────────────────────────────────────────────
router.post(
    '/generate-link',
    authenticate, requireAdmin,
    validateBody(GenerateSurveyLinkSchema),
    surveyController.generateLink,
);

router.get(
    '/stats',
    authenticate, requireAdmin,
    surveyController.getStats,
);

router.get(
    '/',
    authenticate, requireAdmin,
    validateQuery(SurveyFiltersSchema),
    surveyController.getAll,
);

export default router;
