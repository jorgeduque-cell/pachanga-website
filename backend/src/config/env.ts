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
  WHATSAPP_WELCOME_MEDIA_ID: z.string().optional().default('26670088032614801'),
  // Welcome header image on Supabase Storage (permanent — never expires, unlike Media IDs)
  WHATSAPP_WELCOME_IMAGE_URL: z.string().optional().default('https://egvgxitnbjhjflqivobm.supabase.co/storage/v1/object/public/media/whatsapp/bienvenida-pachanga.jpg'),
  WHATSAPP_SURVEY_VIDEO_URL: z.string().optional().default('https://egvgxitnbjhjflqivobm.supabase.co/storage/v1/object/public/media/whatsapp/encuesta-pachanga.mp4'),

  // ── Chatbot AI — motor OpenRouter (compatible OpenAI) ──────────────────
  OPENROUTER_API_KEY: z.string().optional().default(''),
  OPENROUTER_BASE_URL: z.string().url().optional().default('https://openrouter.ai/api/v1'),
  // Modelo respondedor (el "caro" del enrutamiento). Slug real de OpenRouter.
  CHATBOT_MODEL: z.string().optional().default('google/gemini-2.5-flash-lite'),
  // Modelo clasificador/triage (el "ultra-económico"). Mismo tier: Flash-Lite.
  CHATBOT_ROUTER_MODEL: z.string().optional().default('google/gemini-2.5-flash-lite'),
  CHATBOT_MAX_TOKENS: z.string().optional().default('500').transform(Number),
  CHATBOT_TEMPERATURE: z.string().optional().default('0.7').transform(Number),
  CHATBOT_CONTEXT_WINDOW: z.string().optional().default('15').transform(Number),
  CHATBOT_CONFIDENCE_THRESHOLD: z.string().optional().default('0.7').transform(Number),
  CHATBOT_ENABLED: z.string().optional().default('false'),
  CHATBOT_ADMIN_PHONE: z.string().optional().default('+573124183002'),
  // Kill-switch del flujo de compra automatizado (boletas + comprobante).
  // En 'false': el bot solo informa eventos/precios y redirige a CHATBOT_SALES_PHONE.
  CHATBOT_PURCHASE_ENABLED: z.string().optional().default('false'),
  CHATBOT_SALES_PHONE: z.string().optional().default('+573132891788'),

  // OpenAI — SOLO para visión (lectura de comprobantes con GPT-4o). Opcional.
  OPENAI_API_KEY: z.string().optional().default(''),

  // ── Economía de Tokens (CT(x)=c·x+k/x → x*=√(k/c)) ─────────────────────
  // Precios por 1M tokens (tómalos de la página del modelo en OpenRouter).
  TOKENECON_RESPONDER_COST_PER_MTOK: z.string().optional().default('0.10').transform(Number),      // c (entrada)
  TOKENECON_RESPONDER_OUT_COST_PER_MTOK: z.string().optional().default('0.40').transform(Number),  // salida
  TOKENECON_ROUTER_COST_PER_MTOK: z.string().optional().default('0.10').transform(Number),
  TOKENECON_ROUTER_OUT_COST_PER_MTOK: z.string().optional().default('0.40').transform(Number),
  // Parámetros de negocio para k = p_ref · x_ref · C_error.
  TOKENECON_ERROR_RATE: z.string().optional().default('0.15').transform(Number),                   // p_ref
  TOKENECON_REF_CONTEXT_TOKENS: z.string().optional().default('900').transform(Number),            // x_ref
  TOKENECON_ERROR_COST_USD: z.string().optional().default('0.50').transform(Number),               // C_error
  // Recorte del óptimo (protege el margen).
  TOKENECON_MIN_TOKENS: z.string().optional().default('300').transform(Number),
  TOKENECON_MAX_TOKENS: z.string().optional().default('2000').transform(Number),
  // Interruptor del pilar de enrutamiento (triage barato + deflexión).
  TOKENECON_ROUTER_ENABLED: z.string().optional().default('true'),

  // Frontend URL (for QR generation and CORS)
  FRONTEND_URL: z.string().url().optional().default('https://pachanga-website.vercel.app'),

  // Supabase Storage (for flyer uploads)
  SUPABASE_URL: z.string().url().optional().default(''),
  SUPABASE_SERVICE_KEY: z.string().optional().default(''),

  // Telegram Bot (for admin notifications + mobile management)
  TELEGRAM_BOT_TOKEN: z.string().optional().default(''),
  TELEGRAM_ADMIN_CHAT_ID: z.string().optional().default(''),

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
