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
import { prisma } from '../../lib/prisma.js';
import bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';

const router = Router();

router.post('/login', authLimiter, validateBody(LoginRequestSchema), authController.login);
router.post('/register', authenticate, requireAdmin, validateBody(RegisterRequestSchema), authController.register);
router.post('/refresh', authLimiter, validateBody(RefreshTokenRequestSchema), authController.refresh);
router.post('/logout', authenticate, validateBody(LogoutRequestSchema), authController.logout);
router.post('/logout-all', authenticate, authController.logoutAll);
router.get('/me', authenticate, authController.me);

// Endpoint temporal para inicializar usuario admin
// Solo funciona si no hay usuarios admin en la base de datos
router.post('/setup', async (_req, res) => {
  try {
    // Verificar si ya existe un admin
    const existingAdmin = await prisma.user.findFirst({
      where: { role: UserRole.ADMIN }
    });

    if (existingAdmin) {
      res.status(400).json({ 
        error: 'Ya existe un usuario admin',
        email: existingAdmin.email 
      });
      return;
    }

    // Crear usuario admin
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@pachanga.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';
    const passwordHash = await bcrypt.hash(adminPassword, 12);

    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'Dueño Pachanga',
        passwordHash,
        role: UserRole.ADMIN,
      },
    });

    res.json({
      message: 'Usuario admin creado exitosamente',
      email: admin.email,
      password: adminPassword
    });
  } catch (error) {
    console.error('Error en setup:', error);
    res.status(500).json({ error: 'Error al crear usuario admin' });
  }
});

export default router;
