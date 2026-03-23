import { z } from 'zod';
import { randomBytes } from 'node:crypto';
import dotenv from 'dotenv';

dotenv.config();

// Generate a random verify token for dev/test if not provided
const devFallbackToken = randomBytes(24).toString('hex');

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(64, 'JWT_SECRET must be at least 64 characters'),
  PORT: z.string().default('3001').transform(Number),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // WhatsApp Cloud API (optional — dry-run if not set)
  WHATSAPP_TOKEN: z.string().optional().default(''),
  WHATSAPP_PHONE_ID: z.string().optional().default(''),
  WHATSAPP_BUSINESS_ID: z.string().optional().default(''),
  WHATSAPP_VERIFY_TOKEN: z.string().optional().default(''),
  WHATSAPP_API_VERSION: z.string().optional().default('v21.0'),
  WHATSAPP_DRY_RUN: z.string().optional().default('true'),
  WHATSAPP_APP_SECRET: z.string().optional().default(''),

  // Chatbot AI (OpenAI)
  OPENAI_API_KEY: z.string().optional().default(''),
  CHATBOT_MODEL: z.string().optional().default('gpt-4o-mini'),
  CHATBOT_MAX_TOKENS: z.string().optional().default('500').transform(Number),
  CHATBOT_TEMPERATURE: z.string().optional().default('0.7').transform(Number),
  CHATBOT_CONTEXT_WINDOW: z.string().optional().default('5').transform(Number),
  CHATBOT_CONFIDENCE_THRESHOLD: z.string().optional().default('0.7').transform(Number),
  CHATBOT_ENABLED: z.string().optional().default('false'),

  // Frontend URL (for QR generation and CORS)
  FRONTEND_URL: z.string().url().optional().default('https://pachanga-website.vercel.app'),

  // Sentry (optional — error tracking)
  SENTRY_DSN: z.string().url().optional(),
}).superRefine((data, ctx) => {
  // In production, WHATSAPP_VERIFY_TOKEN MUST be explicitly set and strong
  if (data.NODE_ENV === 'production' && (!data.WHATSAPP_VERIFY_TOKEN || data.WHATSAPP_VERIFY_TOKEN.length < 16)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['WHATSAPP_VERIFY_TOKEN'],
      message: 'WHATSAPP_VERIFY_TOKEN must be at least 16 characters in production',
    });
  }
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Invalid environment variables:');
  parsedEnv.error.issues.forEach((issue) => {
    console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
  });
  process.exit(1);
}

// In dev/test: if token is empty, use random fallback and warn
if (parsedEnv.data.NODE_ENV !== 'production' && !parsedEnv.data.WHATSAPP_VERIFY_TOKEN) {
  parsedEnv.data.WHATSAPP_VERIFY_TOKEN = devFallbackToken;
}

export const env = parsedEnv.data;
