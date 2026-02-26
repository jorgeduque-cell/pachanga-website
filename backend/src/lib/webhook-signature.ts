import crypto from 'crypto';
import { env } from '../config/env.js';

export function verifyWebhookSignature(
  rawBody: Buffer,
  signature: string,
): boolean {
  const appSecret = env.WHATSAPP_TOKEN;
  if (!appSecret || !signature) return false;

  const expectedSig = `sha256=${crypto
    .createHmac('sha256', appSecret)
    .update(rawBody)
    .digest('hex')}`;

  // Guard: different lengths = reject (prevents timingSafeEqual RangeError)
  if (expectedSig.length !== signature.length) return false;

  return crypto.timingSafeEqual(
    Buffer.from(expectedSig),
    Buffer.from(signature),
  );
}
