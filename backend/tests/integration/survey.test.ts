import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../../src/lib/prisma.js';
import surveyRoutes from '../../src/modules/survey/survey.routes.js';
import authRoutes from '../../src/modules/auth/auth.routes.js';
import { errorHandler } from '../../src/middleware/error.middleware.js';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/surveys', surveyRoutes);
app.use(errorHandler);

// ─── Test Data ───────────────────────────────────────────
const ADMIN_EMAIL = 'survey-test-admin@pachanga.test';
const ADMIN_PASSWORD = 'AdminPassword123!';

let adminToken = '';
let testCustomerId = '';
let surveyToken = '';

describe('Survey API', () => {
  beforeAll(async () => {
    // Cleanup
    await prisma.satisfactionSurvey.deleteMany({ where: { customer: { phone: '3008888888' } } });
    await prisma.interaction.deleteMany({ where: { customer: { phone: '3008888888' } } });
    await prisma.customer.deleteMany({ where: { phone: { contains: '3008888' } } });
    await prisma.user.deleteMany({ where: { email: ADMIN_EMAIL } });

    // Seed admin
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    await prisma.user.create({
      data: { email: ADMIN_EMAIL, passwordHash, name: 'Survey Admin', role: 'ADMIN' },
    });

    // Seed a test customer
    const customer = await prisma.customer.create({
      data: {
        name: 'Survey Test Customer',
        phone: '+573008888888',
        optIn: true,
        source: 'QR_SCAN',
      },
    });
    testCustomerId = customer.id;

    // Login to get admin token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
    adminToken = loginRes.body.data?.accessToken ?? '';
  });

  afterAll(async () => {
    await prisma.satisfactionSurvey.deleteMany({ where: { customerId: testCustomerId } });
    await prisma.interaction.deleteMany({ where: { customerId: testCustomerId } });
    await prisma.customer.deleteMany({ where: { id: testCustomerId } });
    await prisma.user.deleteMany({ where: { email: ADMIN_EMAIL } });
  });

  // ─── POST /api/surveys/generate-link (Admin) ──────────
  describe('POST /api/surveys/generate-link', () => {
    it('should return 401 without auth', async () => {
      const res = await request(app)
        .post('/api/surveys/generate-link')
        .send({ customerId: testCustomerId });

      expect(res.status).toBe(401);
    });

    it('should generate a survey link for a customer', async () => {
      const res = await request(app)
        .post('/api/surveys/generate-link')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ customerId: testCustomerId });

      expect(res.status).toBe(200);
      expect(res.body.url).toContain('/encuesta?token=');

      // Extract token for next tests
      const url = new URL(res.body.url);
      surveyToken = url.searchParams.get('token') ?? '';
      expect(surveyToken.length).toBeGreaterThan(10);
    });
  });

  // ─── GET /api/surveys/verify (Public) ─────────────────
  describe('GET /api/surveys/verify', () => {
    it('should verify a valid survey token', async () => {
      const res = await request(app)
        .get(`/api/surveys/verify?token=${surveyToken}`);

      expect(res.status).toBe(200);
      expect(res.body.valid).toBe(true);
      expect(res.body.customerName).toBe('Survey Test Customer');
    });

    it('should reject an invalid token', async () => {
      const res = await request(app)
        .get('/api/surveys/verify?token=invalid-garbage-token');

      expect(res.status).toBe(200);
      expect(res.body.valid).toBe(false);
    });

    it('should return 400 without token', async () => {
      const res = await request(app).get('/api/surveys/verify');
      expect(res.status).toBe(400);
    });
  });

  // ─── POST /api/surveys/submit (Public) ────────────────
  describe('POST /api/surveys/submit', () => {
    it('should submit a survey successfully', async () => {
      const res = await request(app)
        .post('/api/surveys/submit')
        .send({
          token: surveyToken,
          musicRating: 5,
          serviceRating: 4,
          ambienceRating: 5,
          hygieneRating: 4,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('should return 400 for missing ratings', async () => {
      const res = await request(app)
        .post('/api/surveys/submit')
        .send({ token: surveyToken });

      expect(res.status).toBe(400);
    });
  });

  // ─── GET /api/surveys/stats (Admin) ───────────────────
  describe('GET /api/surveys/stats', () => {
    it('should return survey averages', async () => {
      const res = await request(app)
        .get('/api/surveys/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.totalSurveys).toBeGreaterThanOrEqual(1);
      expect(res.body.data.averages).toBeDefined();
    });
  });
});
