import { Request, Response } from 'express';
import { authService } from './auth.service.js';
import { tokenService } from '../../services/token.service.js';
import { asyncHandler } from '../../middleware/async-handler.js';

export class AuthController {
  login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const result = await authService.login(req.body);
    res.json({ data: result });
  });

  register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const result = await authService.register(req.body);
    res.status(201).json({ data: result });
  });

  me = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'No autenticado' });
      return;
    }

    const user = await authService.getCurrentUser(req.user.id);
    res.json({ data: user });
  });

  refresh = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { refreshToken } = req.body;
    const result = await tokenService.rotateRefreshToken(refreshToken);

    if (!result) {
      res.status(401).json({ error: 'Refresh token inválido o revocado' });
      return;
    }

    res.json({ data: result });
  });

  logout = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { refreshToken } = req.body;

    await this.revokeCurrentAccessToken(req);
    await tokenService.revokeRefreshToken(refreshToken);

    res.json({ message: 'Sesión cerrada exitosamente' });
  });

  logoutAll = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'No autenticado' });
      return;
    }

    await this.revokeCurrentAccessToken(req);
    await tokenService.revokeAllUserRefreshTokens(req.user.id);

    res.json({ message: 'Todas las sesiones cerradas exitosamente' });
  });

  // ─── Private Helpers ─────────────────────────────────────────

  private async revokeCurrentAccessToken(req: Request): Promise<void> {
    const authHeader = req.headers.authorization;

    if (authHeader?.startsWith('Bearer ')) {
      const accessToken = authHeader.substring(7);
      await tokenService.revokeAccessToken(accessToken);
    }
  }
}

export const authController = new AuthController();
