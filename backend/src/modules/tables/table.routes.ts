import { Router } from 'express';
import { tableController } from './table.controller.js';
import { authenticate, requireAdmin } from '../../middleware/auth.middleware.js';
import { validateBody, validateQuery, validateParams } from '../../middleware/validate.middleware.js';
import { CreateTableSchema, UpdateTableSchema, TableAvailabilityQuerySchema, TableIdParamSchema, TableMapQuerySchema } from '../../schemas/table.schema.js';

const router = Router();

// Rutas públicas
router.get('/', tableController.getAll);
router.get('/map', validateQuery(TableMapQuerySchema), tableController.getMap);
router.get('/available', validateQuery(TableAvailabilityQuerySchema), tableController.getAvailable);
router.get('/:id', validateParams(TableIdParamSchema), tableController.getById);

// Rutas protegidas (Admin)
router.post('/', authenticate, requireAdmin, validateBody(CreateTableSchema), tableController.create);
router.patch('/:id', authenticate, requireAdmin, validateParams(TableIdParamSchema), validateBody(UpdateTableSchema), tableController.update);
router.delete('/:id', authenticate, requireAdmin, validateParams(TableIdParamSchema), tableController.deactivate);

export default router;
