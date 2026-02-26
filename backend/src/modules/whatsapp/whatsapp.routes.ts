import { Router, raw } from 'express';
import { whatsappController } from './whatsapp.controller.js';
import { verifyWebhookSignature } from '../../lib/webhook-signature.js';
import { Request, Response, NextFunction } from 'express';

const router = Router();

// Meta verification
router.get('/webhook', whatsappController.verify.bind(whatsappController));

// Webhook events — raw body for HMAC + verify signature
router.post(
  '/webhook',
  raw({ type: 'application/json' }),
  (req: Request, res: Response, next: NextFunction): void => {
    const signature = req.headers['x-hub-signature-256'] as string;

    if (!verifyWebhookSignature(req.body as Buffer, signature)) {
      res.status(401).json({ error: 'Invalid signature' });
      return;
    }

    // Parse raw body to JSON
    req.body = JSON.parse((req.body as Buffer).toString());
    next();
  },
  whatsappController.handleEvent.bind(whatsappController),
);

export default router;
