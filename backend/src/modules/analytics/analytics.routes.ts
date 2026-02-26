import { Router } from 'express';
import { analyticsController } from './analytics.controller.js';
import { authenticate, requireAdmin } from '../../middleware/auth.middleware.js';

const router = Router();

router.get('/charts/new-customers', authenticate, requireAdmin, analyticsController.getNewCustomers);
router.get('/charts/messages-by-status', authenticate, requireAdmin, analyticsController.getMessagesByStatus);
router.get('/charts/rating-distribution', authenticate, requireAdmin, analyticsController.getRatingDistribution);
router.get('/charts/visits-trend', authenticate, requireAdmin, analyticsController.getVisitsTrend);

export default router;
