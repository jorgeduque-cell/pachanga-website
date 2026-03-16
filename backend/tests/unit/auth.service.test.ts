import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prismaMock } from './setup.js';
import bcrypt from 'bcryptjs';

// Must import AFTER mock setup
const { AuthService } = await import('../../src/modules/auth/auth.service.js');

// Mock tokenService
vi.mock('../../src/services/token.service.js', () => ({
  tokenService: {
    generateAccessToken: vi.fn().mockReturnValue('mock-access-token'),
    generateRefreshToken: vi.fn().mockResolvedValue('mock-refresh-token'),
  },
}));

describe('AuthService', () => {
  let authService: InstanceType<typeof AuthService>;

  beforeEach(() => {
    authService = new AuthService();
  });

  // ─── Login ─────────────────────────────────────────────
  describe('login', () => {
    const validCredentials = { email: 'admin@pachanga.com', password: 'Password123!' };

    it('should return tokens for valid credentials', async () => {
      const hashedPassword = await bcrypt.hash(validCredentials.password, 10);

      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: validCredentials.email,
        name: 'Admin',
        passwordHash: hashedPassword,
        role: 'ADMIN',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await authService.login(validCredentials);

      expect(result.user.email).toBe(validCredentials.email);
      expect(result.accessToken).toBe('mock-access-token');
      expect(result.refreshToken).toBe('mock-refresh-token');
    });

    it('should throw 401 for non-existent email', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(authService.login(validCredentials))
        .rejects.toThrow('Email o contraseña incorrectos');
    });

    it('should throw 401 for wrong password', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: validCredentials.email,
        name: 'Admin',
        passwordHash: await bcrypt.hash('DifferentPassword!', 10),
        role: 'ADMIN',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(authService.login(validCredentials))
        .rejects.toThrow('Email o contraseña incorrectos');
    });
  });

  // ─── Register ──────────────────────────────────────────
  describe('register', () => {
    const newUser = { email: 'new@example.com', password: 'Password123!', name: 'New User' };

    it('should create a new user with hashed password', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.user.create.mockResolvedValue({
        id: 'user-2',
        email: newUser.email,
        name: newUser.name,
        passwordHash: 'hashed',
        role: 'STAFF',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await authService.register(newUser);

      expect(result.user.email).toBe(newUser.email);
      expect(result.user.role).toBe('STAFF');
      // Verify bcrypt was used (password is NOT stored as plain text)
      const createCall = prismaMock.user.create.mock.calls[0][0];
      expect(createCall.data.passwordHash).not.toBe(newUser.password);
    });

    it('should throw 409 for duplicate email', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: newUser.email,
        name: 'Existing',
        passwordHash: 'hashed',
        role: 'STAFF',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(authService.register(newUser))
        .rejects.toThrow('El email ya está registrado');
    });
  });

  // ─── GetCurrentUser ────────────────────────────────────
  describe('getCurrentUser', () => {
    it('should return user by ID', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'admin@pachanga.com',
        name: 'Admin',
        role: 'ADMIN',
      } as any);

      const user = await authService.getCurrentUser('user-1');

      expect(user.email).toBe('admin@pachanga.com');
    });

    it('should throw 404 for non-existent user', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(authService.getCurrentUser('non-existent'))
        .rejects.toThrow('Usuario no encontrado');
    });
  });
});
