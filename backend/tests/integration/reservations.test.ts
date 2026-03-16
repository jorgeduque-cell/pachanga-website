import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import { prisma } from '../../src/lib/prisma.js';
import reservationRoutes from '../../src/modules/reservations/reservation.routes.js';
import { errorHandler } from '../../src/middleware/error.middleware.js';

const app = express();
app.use(express.json());
app.use('/api/reservations', reservationRoutes);
app.use(errorHandler);

describe('Reservations API', () => {
  let testTableId: string;

  beforeAll(async () => {
    // Create a test table for reservations
    const table = await prisma.table.create({
      data: {
        name: 'Test Reservation Table',
        capacity: 4,
        zone: 'SALON',
        isActive: true,
      },
    });
    testTableId = table.id;
  });

  afterAll(async () => {
    // Clean up test reservations
    await prisma.reservation.deleteMany({
      where: {
        customerPhone: '555-TEST-01',
      },
    });

    // Clean up test table
    await prisma.table.deleteMany({
      where: {
        id: testTableId,
      },
    });
  });

  describe('POST /api/reservations', () => {
    it('should create a new reservation', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      const dateStr = futureDate.toISOString().split('T')[0];

      const response = await request(app)
        .post('/api/reservations')
        .send({
          customerName: 'Test Customer',
          customerPhone: '555-TEST-01',
          reservationDate: dateStr,
          reservationTime: '20:00',
          partySize: 2,
          tableId: testTableId,
          message: 'Test reservation',
        });

      expect(response.status).toBe(201);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.status).toBe('PENDING');
      expect(response.body.data.customerName).toBe('Test Customer');
    });

    it('should return 400 for past date', async () => {
      // Use a date far in the past to avoid timezone edge cases
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 7);
      const dateStr = pastDate.toISOString().split('T')[0];

      const response = await request(app)
        .post('/api/reservations')
        .send({
          customerName: 'Test Customer',
          customerPhone: '555-TEST-01',
          reservationDate: dateStr,
          reservationTime: '20:00',
          partySize: 2,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('fechas pasadas');
    });

    it('should return 400 for invalid data', async () => {
      const response = await request(app)
        .post('/api/reservations')
        .send({
          customerName: '', // Empty name
          customerPhone: '123',
          reservationDate: 'invalid-date',
          reservationTime: '25:00', // Invalid time
          partySize: 0,
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/reservations', () => {
    it('should require authentication', async () => {
      const response = await request(app).get('/api/reservations');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/reservations/stats', () => {
    it('should require authentication', async () => {
      const response = await request(app).get('/api/reservations/stats');

      expect(response.status).toBe(401);
    });
  });
});
