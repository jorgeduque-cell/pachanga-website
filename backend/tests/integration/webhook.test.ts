import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import crypto from 'crypto';
import whatsappRoutes from '../../src/modules/whatsapp/whatsapp.routes.js';
import { errorHandler } from '../../src/middleware/error.middleware.js';
import { env } from '../../src/config/env.js';

const app = express();
// NOTE: WhatsApp routes mount their own raw() middleware, no express.json() here
app.use('/api/whatsapp', whatsappRoutes);
app.use(errorHandler);

// ─── Helpers ─────────────────────────────────────────────
function signPayload(payload: string): string {
  const secret = env.WHATSAPP_APP_SECRET || 'test-secret';
  const hmac = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return `sha256=${hmac}`;
}

describe('WhatsApp Webhook API', () => {
  // ─── GET /api/whatsapp/webhook (Verification) ────────
  describe('GET /api/whatsapp/webhook', () => {
    it('should return challenge for valid verify token', async () => {
      const res = await request(app)
        .get('/api/whatsapp/webhook')
        .query({
          'hub.mode': 'subscribe',
          'hub.verify_token': env.WHATSAPP_VERIFY_TOKEN,
          'hub.challenge': '1234567890',
        });

      expect(res.status).toBe(200);
      expect(res.text).toBe('1234567890');
    });

    it('should return 403 for invalid verify token', async () => {
      const res = await request(app)
        .get('/api/whatsapp/webhook')
        .query({
          'hub.mode': 'subscribe',
          'hub.verify_token': 'wrong-token',
          'hub.challenge': '1234567890',
        });

      expect(res.status).toBe(403);
    });
  });

  // ─── POST /api/whatsapp/webhook (Events) ─────────────
  describe('POST /api/whatsapp/webhook', () => {
    it('should reject request without signature', async () => {
      const payload = JSON.stringify({ object: 'whatsapp_business_account', entry: [] });

      const res = await request(app)
        .post('/api/whatsapp/webhook')
        .set('Content-Type', 'application/json')
        .send(payload);

      expect(res.status).toBe(401);
    });

    it('should reject request with invalid signature', async () => {
      const payload = JSON.stringify({ object: 'whatsapp_business_account', entry: [] });

      const res = await request(app)
        .post('/api/whatsapp/webhook')
        .set('Content-Type', 'application/json')
        .set('x-hub-signature-256', 'sha256=invalid')
        .send(payload);

      expect(res.status).toBe(401);
    });

    it('should accept request with valid HMAC signature (or skip if no secret)', async () => {
      // If WHATSAPP_APP_SECRET is not set, verifyWebhookSignature always returns false
      // In that case, test that we get 401 (expected behavior with no secret)
      if (!env.WHATSAPP_APP_SECRET) {
        const res = await request(app)
          .post('/api/whatsapp/webhook')
          .set('Content-Type', 'application/json')
          .set('x-hub-signature-256', 'sha256=fake')
          .send('{}');

        expect(res.status).toBe(401);
        return;
      }

      const body = '{"object":"whatsapp_business_account","entry":[]}';
      const signature = signPayload(body);

      const res = await request(app)
        .post('/api/whatsapp/webhook')
        .set('Content-Type', 'application/json')
        .set('x-hub-signature-256', signature)
        .send(body);

      expect(res.status).toBe(200);
    });
  });
});
