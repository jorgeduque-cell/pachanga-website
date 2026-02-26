import { Router } from 'express';
import { authController } from './auth.controller.js';
import { authenticate, requireAdmin } from '../../middleware/auth.middleware.js';
import { validateBody } from '../../middleware/validate.middleware.js';
import {
  LoginRequestSchema,
  RegisterRequestSchema,
  RefreshTokenRequestSchema,
  LogoutRequestSchema
} from '../../schemas/auth.schema.js';
import { authLimiter } from '../../middleware/rate-limit.middleware.js';

const router = Router();

router.post('/login', authLimiter, validateBody(LoginRequestSchema), authController.login);
router.post('/register', authenticate, requireAdmin, validateBody(RegisterRequestSchema), authController.register);
router.post('/refresh', authLimiter, validateBody(RefreshTokenRequestSchema), authController.refresh);
router.post('/logout', authenticate, validateBody(LogoutRequestSchema), authController.logout);
router.post('/logout-all', authenticate, authController.logoutAll);
router.get('/me', authenticate, authController.me);

export default router;
