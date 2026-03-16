import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../../src/lib/prisma.js';
import analyticsRoutes from '../../src/modules/analytics/analytics.routes.js';
import authRoutes from '../../src/modules/auth/auth.routes.js';
import { errorHandler } from '../../src/middleware/error.middleware.js';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use(errorHandler);

// ─── Test Data ───────────────────────────────────────────
const ADMIN_EMAIL = 'analytics-test-admin@pachanga.test';
const ADMIN_PASSWORD = 'AdminPassword123!';
let adminToken = '';

describe('Analytics API', () => {
  beforeAll(async () => {
    await prisma.user.deleteMany({ where: { email: ADMIN_EMAIL } });

    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    await prisma.user.create({
      data: { email: ADMIN_EMAIL, passwordHash, name: 'Analytics Admin', role: 'ADMIN' },
    });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
    adminToken = loginRes.body.data?.accessToken ?? '';
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: ADMIN_EMAIL } });
  });

  // ─── Auth check ────────────────────────────────────────
  it('should return 401 without auth on all endpoints', async () => {
    const endpoints = [
      '/api/analytics/charts/new-customers',
      '/api/analytics/charts/messages-by-status',
      '/api/analytics/charts/rating-distribution',
      '/api/analytics/charts/visits-trend',
    ];

    for (const url of endpoints) {
      const res = await request(app).get(url);
      expect(res.status).toBe(401);
    }
  });

  // ─── GET /charts/new-customers ─────────────────────────
  describe('GET /charts/new-customers', () => {
    it('should return new customer chart data', async () => {
      const res = await request(app)
        .get('/api/analytics/charts/new-customers')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  // ─── GET /charts/messages-by-status ────────────────────
  describe('GET /charts/messages-by-status', () => {
    it('should return message status chart data', async () => {
      const res = await request(app)
        .get('/api/analytics/charts/messages-by-status')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
    });
  });

  // ─── GET /charts/rating-distribution ───────────────────
  describe('GET /charts/rating-distribution', () => {
    it('should return rating distribution', async () => {
      const res = await request(app)
        .get('/api/analytics/charts/rating-distribution')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
    });
  });

  // ─── GET /charts/visits-trend ──────────────────────────
  describe('GET /charts/visits-trend', () => {
    it('should return visits trend with default months', async () => {
      const res = await request(app)
        .get('/api/analytics/charts/visits-trend')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should accept custom months parameter', async () => {
      const res = await request(app)
        .get('/api/analytics/charts/visits-trend?months=3')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });
  });
});
