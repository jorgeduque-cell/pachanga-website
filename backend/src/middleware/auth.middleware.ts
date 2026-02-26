import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';
import { tokenService } from '../services/token.service.js';

interface JwtPayload {
  userId: string;
  email: string;
  type: 'access' | 'refresh';
  jti: string;
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Token no proporcionado' });
      return;
    }

    const token = authHeader.substring(7);

    if (!token) {
      res.status(401).json({ error: 'Token inválido' });
      return;
    }

    // Verificar el token y extraer payload
    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    } catch {
      res.status(401).json({ error: 'Token inválido o expirado' });
      return;
    }

    // Verificar que sea un access token
    if (decoded.type !== 'access') {
      res.status(401).json({ error: 'Tipo de token inválido' });
      return;
    }

    // Verificar si el token está en la blacklist (revocado)
    const isBlacklisted = await tokenService.isTokenBlacklisted(decoded.jti);
    if (isBlacklisted) {
      res.status(401).json({ error: 'Token revocado' });
      return;
    }

    // Obtener información del usuario
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    if (!user) {
      res.status(401).json({ error: 'Usuario no encontrado' });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Token inválido o expirado' });
      return;
    }
    next(error); // Delegar a errorHandler para errores no-JWT (DB, red, etc)
  }
};

export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ error: 'No autenticado' });
    return;
  }

  if (req.user.role !== 'ADMIN') {
    res.status(403).json({ error: 'Acceso denegado. Se requiere rol de administrador' });
    return;
  }

  next();
};
