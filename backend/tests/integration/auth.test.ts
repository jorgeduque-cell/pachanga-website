import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../../src/lib/prisma.js';
import authRoutes from '../../src/modules/auth/auth.routes.js';
import { errorHandler } from '../../src/middleware/error.middleware.js';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use(errorHandler);

// ─── Seed admin credentials ────────────────────────────────
const ADMIN_EMAIL = 'admin-test@pachanga.test';
const ADMIN_PASSWORD = 'AdminPassword123!';
const NEW_USER_EMAIL = 'newuser@example.com';

let adminToken = '';

describe('Auth API', () => {
  beforeAll(async () => {
    // Clean up test users
    await prisma.user.deleteMany({
      where: { email: { in: [ADMIN_EMAIL, NEW_USER_EMAIL, 'test@example.com'] } },
    });

    // Seed an ADMIN user directly in the database
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    await prisma.user.create({
      data: {
        email: ADMIN_EMAIL,
        passwordHash,
        name: 'Test Admin',
        role: 'ADMIN',
      },
    });

    // Login as admin to get a valid JWT
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });

    adminToken = loginRes.body.data?.accessToken ?? '';
  });

  afterAll(async () => {
    // Clean up test users
    await prisma.user.deleteMany({
      where: { email: { in: [ADMIN_EMAIL, NEW_USER_EMAIL, 'test@example.com'] } },
    });
  });

  describe('POST /api/auth/register (Admin only)', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: NEW_USER_EMAIL,
          password: 'Password123!',
          name: 'Test User',
        });

      expect(response.status).toBe(401);
    });

    it('should register a new user with admin token', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: NEW_USER_EMAIL,
          password: 'Password123!',
          name: 'Test User',
        });

      expect(response.status).toBe(201);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.user.email).toBe(NEW_USER_EMAIL);
    });

    it('should return 409 for duplicate email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: NEW_USER_EMAIL,
          password: 'Password123!',
          name: 'Test User 2',
        });

      expect(response.status).toBe(409);
      expect(response.body.error).toContain('ya está registrado');
    });

    it('should return 400 for invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'another@example.com',
          password: '123', // Too short
          name: 'Test User',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
        });

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
    });

    it('should return 401 for invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: ADMIN_EMAIL,
          password: 'WrongPassword123!',
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('incorrectos');
    });
  });
});
