import { env } from './env.js';

// ─── CORS Origins (single source of truth) ───────────────────
const CORS_ORIGINS: Record<string, string[]> = {
    development: ['http://localhost:3000', 'http://localhost:5173'],
    production: ['https://pachanga-website.vercel.app', 'https://pachanga.com', env.FRONTEND_URL],
    test: ['http://localhost:3000'],
};

export const ALLOWED_ORIGINS = CORS_ORIGINS[env.NODE_ENV] ?? [];
export const CORS_MAX_AGE_SECONDS = 600;
