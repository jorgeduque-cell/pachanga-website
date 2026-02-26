import bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/error.middleware.js';
import { tokenService } from '../../services/token.service.js';
import { LoginRequest, RegisterRequest, LoginResponse } from '../../schemas/auth.schema.js';

// ─── Constants ───────────────────────────────────────────────
const BCRYPT_SALT_ROUNDS = 12;
const DEFAULT_REGISTER_ROLE: UserRole = 'STAFF';

// ─── Service ─────────────────────────────────────────────────
export class AuthService {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const user = await prisma.user.findUnique({
      where: { email: credentials.email },
    });

    if (!user) {
      throw new AppError('Email o contraseña incorrectos', 401);
    }

    const isValidPassword = await bcrypt.compare(credentials.password, user.passwordHash);

    if (!isValidPassword) {
      throw new AppError('Email o contraseña incorrectos', 401);
    }

    return this.buildAuthResponse(user.id, user.email, user.name, user.role);
  }

  async register(registration: RegisterRequest): Promise<LoginResponse> {
    const existingUser = await prisma.user.findUnique({
      where: { email: registration.email },
    });

    if (existingUser) {
      throw new AppError('El email ya está registrado', 409);
    }

    const passwordHash = await bcrypt.hash(registration.password, BCRYPT_SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        email: registration.email,
        name: registration.name,
        passwordHash,
        role: DEFAULT_REGISTER_ROLE,
      },
    });

    return this.buildAuthResponse(user.id, user.email, user.name, user.role);
  }

  async getCurrentUser(userId: string): Promise<{ id: string; email: string; name: string; role: UserRole }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true },
    });

    if (!user) {
      throw new AppError('Usuario no encontrado', 404);
    }

    return user;
  }

  // ─── Private Helpers ─────────────────────────────────────────

  private async buildAuthResponse(
    userId: string,
    email: string,
    name: string,
    role: UserRole,
  ): Promise<LoginResponse> {
    const accessToken = tokenService.generateAccessToken(userId, email);
    const refreshToken = await tokenService.generateRefreshToken(userId, email);

    return {
      user: { id: userId, email, name, role },
      accessToken,
      refreshToken,
    };
  }
}

export const authService = new AuthService();
