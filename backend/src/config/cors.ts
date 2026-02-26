import { env } from './env.js';

// ─── CORS Origins (single source of truth) ───────────────────
const parseOrigins = (originString: string | undefined): string[] => {
  if (!originString || originString === '*') return ['*'];
  // Soporta múltiples orígenes separados por comas
  return originString.split(',').map(o => o.trim());
};

const CORS_ORIGINS: Record<string, string[]> = {
    development: ['http://localhost:3000', 'http://localhost:5173'],
    production: env.CORS_ORIGIN ? parseOrigins(env.CORS_ORIGIN) : [env.FRONTEND_URL],
    test: ['http://localhost:3000'],
};

export const ALLOWED_ORIGINS = CORS_ORIGINS[env.NODE_ENV] ?? [];
export const CORS_MAX_AGE_SECONDS = 600;
