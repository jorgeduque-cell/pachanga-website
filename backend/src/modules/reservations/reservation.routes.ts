import { Router } from 'express';
import { reservationController } from './reservation.controller.js';
import { authenticate, requireAdmin } from '../../middleware/auth.middleware.js';
import { validateBody, validateQuery, validateParams } from '../../middleware/validate.middleware.js';
import { reservationLimiter } from '../../middleware/rate-limit.middleware.js';
import {
  CreateReservationSchema,
  UpdateReservationSchema,
  ReservationFiltersSchema,
  ReservationIdParamSchema
} from '../../schemas/reservation.schema.js';

const router = Router();

// Ruta pública con rate limiting (10 requests/min)
router.post('/', reservationLimiter, validateBody(CreateReservationSchema), reservationController.create);

// Rutas protegidas (Admin)
router.get('/', authenticate, requireAdmin, validateQuery(ReservationFiltersSchema), reservationController.getAll);
router.get('/stats', authenticate, requireAdmin, reservationController.getStats);
router.get('/:id', authenticate, requireAdmin, validateParams(ReservationIdParamSchema), reservationController.getById);
router.patch('/:id', authenticate, requireAdmin, validateParams(ReservationIdParamSchema), validateBody(UpdateReservationSchema), reservationController.update);
router.patch('/:id/cancel', authenticate, requireAdmin, validateParams(ReservationIdParamSchema), reservationController.cancel);
router.delete('/:id', authenticate, requireAdmin, validateParams(ReservationIdParamSchema), reservationController.remove);

export default router;
