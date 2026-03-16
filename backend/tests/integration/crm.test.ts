import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../../src/lib/prisma.js';
import crmRoutes from '../../src/modules/crm/crm.routes.js';
import authRoutes from '../../src/modules/auth/auth.routes.js';
import { errorHandler } from '../../src/middleware/error.middleware.js';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/crm', crmRoutes);
app.use(errorHandler);

// ─── Test Data ───────────────────────────────────────────
const ADMIN_EMAIL = 'crm-test-admin@pachanga.test';
const ADMIN_PASSWORD = 'AdminPassword123!';
const TEST_PHONE = '3009999999';

let adminToken = '';
let capturedCustomerId = '';

describe('CRM API', () => {
  beforeAll(async () => {
    // Cleanup
    await prisma.interaction.deleteMany({ where: { customer: { phone: { contains: '3009999' } } } });
    await prisma.whatsAppMessage.deleteMany({ where: { customer: { phone: { contains: '3009999' } } } });
    await prisma.satisfactionSurvey.deleteMany({ where: { customer: { phone: { contains: '3009999' } } } });
    await prisma.customer.deleteMany({ where: { phone: { contains: '3009999' } } });
    await prisma.user.deleteMany({ where: { email: ADMIN_EMAIL } });

    // Seed admin
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    await prisma.user.create({
      data: { email: ADMIN_EMAIL, passwordHash, name: 'CRM Test Admin', role: 'ADMIN' },
    });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
    adminToken = loginRes.body.data?.accessToken ?? '';
  });

  afterAll(async () => {
    await prisma.interaction.deleteMany({ where: { customer: { phone: { contains: '3009999' } } } });
    await prisma.whatsAppMessage.deleteMany({ where: { customer: { phone: { contains: '3009999' } } } });
    await prisma.satisfactionSurvey.deleteMany({ where: { customer: { phone: { contains: '3009999' } } } });
    await prisma.customer.deleteMany({ where: { phone: { contains: '3009999' } } });
    await prisma.user.deleteMany({ where: { email: ADMIN_EMAIL } });
  });

  // ─── POST /api/crm/capture (Public) ───────────────────
  describe('POST /api/crm/capture', () => {
    it('should capture a new customer via QR', async () => {
      const res = await request(app)
        .post('/api/crm/capture')
        .send({
          name: 'Cliente QR Test',
          phone: TEST_PHONE,
          birthDate: '1995-06-15',
          rating: 5,
          qrTable: 'VIP-1',
          optIn: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      // First visit message
      expect(res.body.message).toContain('Gracias');
    });

    it('should increment visits for returning customer', async () => {
      const res = await request(app)
        .post('/api/crm/capture')
        .send({
          name: 'Cliente QR Test',
          phone: TEST_PHONE,
          birthDate: '1995-06-15',
          rating: 4,
          qrTable: 'VIP-1',
          optIn: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      // Returning visit message
      expect(res.body.message).toContain('verte de nuevo');
    });

    it('should return 400 for missing phone', async () => {
      const res = await request(app)
        .post('/api/crm/capture')
        .send({ name: 'No Phone' });

      expect(res.status).toBe(400);
    });
  });

  // ─── GET /api/crm/customers (Admin) ───────────────────
  describe('GET /api/crm/customers', () => {
    it('should return 401 without auth', async () => {
      const res = await request(app).get('/api/crm/customers');
      expect(res.status).toBe(401);
    });

    it('should return paginated customer list', async () => {
      const res = await request(app)
        .get('/api/crm/customers')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  // ─── GET /api/crm/stats (Admin) ───────────────────────
  describe('GET /api/crm/stats', () => {
    it('should return CRM statistics', async () => {
      const res = await request(app)
        .get('/api/crm/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.totalCustomers).toBeDefined();
      expect(res.body.data.newThisMonth).toBeDefined();
      expect(res.body.data.avgRating).toBeDefined();
    });
  });

  // ─── GET /api/crm/config (Admin) ──────────────────────
  describe('GET /api/crm/config', () => {
    it('should return CRM config', async () => {
      const res = await request(app)
        .get('/api/crm/config')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
    });
  });
});
