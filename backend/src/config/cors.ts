import { env } from './env.js';

// ─── CORS Origins (single source of truth) ───────────────────
const CORS_ORIGINS: Record<string, string[]> = {
    development: ['http://localhost:3000', 'http://localhost:5173'],
    production: [
      'https://pachanga-frontend.vercel.app',
      'https://pachanga-website.vercel.app',
      'https://pachanga.com',
      'https://pachangaypocholapyp.com',
      'https://www.pachangaypocholapyp.com',
      // App Club PyP — lee la API pública de eventos para el banner del feed
      'https://y-beryl-tau.vercel.app',
      env.FRONTEND_URL
    ],
    test: ['http://localhost:3000'],
};

export const ALLOWED_ORIGINS = CORS_ORIGINS[env.NODE_ENV] ?? [];
export const CORS_MAX_AGE_SECONDS = 600;
