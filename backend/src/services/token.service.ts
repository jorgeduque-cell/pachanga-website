import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';

// ─── Constants ───────────────────────────────────────────────
const ACCESS_TOKEN_EXPIRES_IN = '15m';
const REFRESH_TOKEN_EXPIRES_IN = '7d';
const REFRESH_TOKEN_DAYS = 7;
const BEARER_PREFIX = 'Bearer ';

// ─── Types ───────────────────────────────────────────────────
interface TokenPayload {
  userId: string;
  email: string;
  type: 'access' | 'refresh';
  jti: string;
  exp?: number;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

// ─── Service ─────────────────────────────────────────────────
export class TokenService {
  generateAccessToken(userId: string, email: string): string {
    const jti = crypto.randomUUID();
    return jwt.sign(
      { userId, email, type: 'access', jti },
      env.JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
    );
  }

  async generateRefreshToken(userId: string, email: string): Promise<string> {
    const jti = crypto.randomUUID();
    const token = jwt.sign(
      { userId, email, type: 'refresh', jti },
      env.JWT_SECRET,
      { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
    );

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_DAYS);

    await prisma.refreshToken.create({
      data: { id: jti, token, userId, expiresAt },
    });

    return token;
  }

  async revokeAccessToken(token: string): Promise<void> {
    const decoded = this.decodeTokenSafe(token);
    if (!decoded?.jti || !decoded.exp) return;

    await prisma.tokenBlacklist.create({
      data: {
        tokenId: decoded.jti,
        expiresAt: new Date(decoded.exp * 1000),
      },
    });
  }

  async revokeRefreshToken(token: string): Promise<void> {
    const decoded = this.decodeTokenSafe(token);
    if (!decoded?.jti) return;

    await prisma.refreshToken.deleteMany({
      where: { id: decoded.jti },
    });
  }

  async revokeAllUserRefreshTokens(userId: string): Promise<void> {
    await prisma.refreshToken.deleteMany({ where: { userId } });
  }

  async isTokenBlacklisted(jti: string): Promise<boolean> {
    const blacklisted = await prisma.tokenBlacklist.findUnique({
      where: { tokenId: jti },
    });
    return !!blacklisted;
  }

  async rotateRefreshToken(oldToken: string): Promise<TokenPair | null> {
    try {
      const decoded = jwt.verify(oldToken, env.JWT_SECRET) as TokenPayload;

      if (decoded.type !== 'refresh') return null;

      const storedToken = await prisma.refreshToken.findUnique({
        where: { id: decoded.jti },
      });

      if (!storedToken) {
        await this.revokeAllUserRefreshTokens(decoded.userId);
        return null;
      }

      await prisma.refreshToken.delete({ where: { id: decoded.jti } });

      const accessToken = this.generateAccessToken(decoded.userId, decoded.email);
      const refreshToken = await this.generateRefreshToken(decoded.userId, decoded.email);

      return { accessToken, refreshToken };
    } catch {
      return null;
    }
  }

  verifyAccessToken(token: string): TokenPayload | null {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
      return decoded.type === 'access' ? decoded : null;
    } catch {
      return null;
    }
  }

  /**
   * Strips 'Bearer ' prefix if present and returns the raw JWT token.
   */
  static extractBearerToken(rawToken: string): string {
    return rawToken.startsWith(BEARER_PREFIX)
      ? rawToken.substring(BEARER_PREFIX.length)
      : rawToken;
  }

  async cleanupExpiredTokens(): Promise<void> {
    const now = new Date();
    await Promise.all([
      prisma.tokenBlacklist.deleteMany({ where: { expiresAt: { lt: now } } }),
      prisma.refreshToken.deleteMany({ where: { expiresAt: { lt: now } } }),
    ]);
  }

  // ─── Private Helpers ─────────────────────────────────────────

  private decodeTokenSafe(token: string): TokenPayload | null {
    try {
      return jwt.decode(token) as TokenPayload;
    } catch {
      return null;
    }
  }
}

export const tokenService = new TokenService();
