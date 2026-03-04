import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(64, 'JWT_SECRET must be at least 64 characters'),
  PORT: z.string().default('3001').transform(Number),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // WhatsApp Cloud API (optional — dry-run if not set)
  WHATSAPP_TOKEN: z.string().optional().default(''),
  WHATSAPP_PHONE_ID: z.string().optional().default(''),
  WHATSAPP_BUSINESS_ID: z.string().optional().default(''),
  WHATSAPP_VERIFY_TOKEN: z.string().optional().default('pachanga_webhook_2026'),
  WHATSAPP_API_VERSION: z.string().optional().default('v21.0'),
  WHATSAPP_DRY_RUN: z.string().optional().default('true'),
  WHATSAPP_APP_SECRET: z.string().optional().default(''),

  // Frontend URL (for QR generation and CORS)
  FRONTEND_URL: z.string().url().optional().default('https://pachanga-frontend.vercel.app'),
  CORS_ORIGIN: z.string().optional().default('*'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Invalid environment variables:');
  parsedEnv.error.issues.forEach((issue) => {
    console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
  });
  process.exit(1);
}

export const env = parsedEnv.data;
