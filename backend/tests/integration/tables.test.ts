import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import { prisma } from '../../src/lib/prisma.js';
import tableRoutes from '../../src/modules/tables/table.routes.js';
import { errorHandler } from '../../src/middleware/error.middleware.js';

const app = express();
app.use(express.json());
app.use('/api/tables', tableRoutes);
app.use(errorHandler);

describe('Tables API', () => {
  beforeAll(async () => {
    // Ensure we have test tables
    const count = await prisma.table.count();
    if (count === 0) {
      // Create test tables if none exist
      await prisma.table.createMany({
        data: [
          { name: 'Test Table 1', capacity: 4, zone: 'SALON', isActive: true },
          { name: 'Test Table 2', capacity: 6, zone: 'VIP', isActive: true },
        ],
      });
    }
  });

  describe('GET /api/tables', () => {
    it('should return all active tables', async () => {
      const response = await request(app).get('/api/tables');

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /api/tables/:id', () => {
    it('should return a table by id', async () => {
      // First get all tables
      const tablesResponse = await request(app).get('/api/tables');
      const tableId = tablesResponse.body.data[0]?.id;

      if (!tableId) {
        console.log('No tables found, skipping test');
        return;
      }

      const response = await request(app).get(`/api/tables/${tableId}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe(tableId);
    });

    it('should return 400 for invalid UUID', async () => {
      const response = await request(app).get('/api/tables/invalid-uuid');

      expect(response.status).toBe(400);
    });

    it('should return 404 for non-existent table', async () => {
      const response = await request(app).get('/api/tables/00000000-0000-0000-0000-000000000000');

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/tables/available', () => {
    it('should return available tables for a date/time', async () => {
      const response = await request(app)
        .get('/api/tables/available')
        .query({
          date: '2026-12-31',
          time: '20:00',
        });

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should return 400 for missing date', async () => {
      const response = await request(app)
        .get('/api/tables/available')
        .query({
          time: '20:00',
        });

      expect(response.status).toBe(400);
    });
  });
});
