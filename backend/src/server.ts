import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { env } from './config/env.js';
import { initSentry } from './lib/sentry.js';

// Initialize Sentry FIRST (before any other imports that might throw)
initSentry();

import { ALLOWED_ORIGINS, CORS_MAX_AGE_SECONDS } from './config/cors.js';
import { prisma } from './lib/prisma.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';
import { globalLimiter } from './middleware/rate-limit.middleware.js';
import { tokenCleanupService } from './services/token-cleanup.service.js';
import { socketService } from './services/socket.service.js';
import { startCronJobs, stopCronJobs } from './lib/cron/index.js';
import { logger } from './lib/logger.js';
import authRoutes from './modules/auth/auth.routes.js';
import tableRoutes from './modules/tables/table.routes.js';
import reservationRoutes from './modules/reservations/reservation.routes.js';
import crmRoutes from './modules/crm/crm.routes.js';
import whatsappRoutes from './modules/whatsapp/whatsapp.routes.js';
import analyticsRoutes from './modules/analytics/analytics.routes.js';
import surveyRoutes from './modules/survey/survey.routes.js';
import chatbotRoutes from './modules/chatbot/chatbot.routes.js';
import { eventsRouter } from './modules/events/events.controller.js';
import { startTelegramBot, stopTelegramBot } from './modules/telegram/telegram.bot.js';


// ─── Constants ───────────────────────────────────────────────
const JSON_BODY_LIMIT = '10kb';
const serverStartTime = Date.now();

// ─── App Setup ───────────────────────────────────────────────
const app = express();
const httpServer = createServer(app);

// Trust proxy - required for express-rate-limit behind Render's proxy
app.set('trust proxy', 1);

socketService.initialize(httpServer);

// Middlewares
app.use(helmet());
app.use(globalLimiter);
app.use(cors({
  origin: function (origin, callback) {
    // Permitir requests sin origin (como Postman) o desde orígenes permitidos
    if (!origin || ALLOWED_ORIGINS.includes(origin) || ALLOWED_ORIGINS.includes('*')) {
      callback(null, true);
    } else {
      logger.warn({ origin }, 'CORS blocked origin');
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Filename'],
  credentials: true,
  maxAge: CORS_MAX_AGE_SECONDS,
}));
// WhatsApp webhook routes (MUST be before express.json() for raw body HMAC verification)
app.use('/api/whatsapp', whatsappRoutes);

app.use(express.json({ limit: JSON_BODY_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: JSON_BODY_LIMIT }));

// ─── Health Checks ───────────────────────────────────────────
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
const pkgPath = resolve(dirname(__filename), '..', 'package.json');
const { version } = JSON.parse(readFileSync(pkgPath, 'utf-8'));

/** Basic health — status, version, uptime, memory */
app.get('/api/health', (_req, res) => {
  const mem = process.memoryUsage();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version,
    uptime: Math.floor((Date.now() - serverStartTime) / 1000),
    memory: {
      rss: `${Math.round(mem.rss / 1024 / 1024)}MB`,
      heap: `${Math.round(mem.heapUsed / 1024 / 1024)}MB`,
    },
  });
});

/** Readiness — verifies DB connection (use for Render health check) */
app.get('/api/health/ready', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ready', database: 'connected' });
  } catch {
    res.status(503).json({ status: 'not_ready', database: 'disconnected' });
  }
});

/** Liveness — always 200 (for restart detection only) */
app.get('/api/health/live', (_req, res) => {
  res.json({ status: 'alive' });
});



// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/crm', crmRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/surveys', surveyRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/events', eventsRouter);


// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

// ─── Server Lifecycle ────────────────────────────────────────
const startServer = async (): Promise<void> => {
  try {
    tokenCleanupService.start();

    httpServer.listen(env.PORT, () => {
      logger.info({ port: env.PORT }, 'Server running');
      startCronJobs();
      startTelegramBot();
    });
  } catch (error) {
    logger.fatal({ err: error }, 'Failed to start server');
    await prisma.$disconnect();
    process.exit(1);
  }
};

const gracefulShutdown = async (signal: string): Promise<void> => {
  logger.info({ signal }, 'Graceful shutdown initiated');
  tokenCleanupService.stop();
  stopCronJobs();
  stopTelegramBot();
  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

startServer();
