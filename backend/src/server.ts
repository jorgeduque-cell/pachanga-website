import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { env } from './config/env.js';
import { ALLOWED_ORIGINS, CORS_MAX_AGE_SECONDS } from './config/cors.js';
import { prisma } from './lib/prisma.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';
import { globalLimiter } from './middleware/rate-limit.middleware.js';
import { tokenCleanupService } from './services/token-cleanup.service.js';
import { socketService } from './services/socket.service.js';
import { startCronJobs, stopCronJobs } from './lib/cron/index.js';
import authRoutes from './modules/auth/auth.routes.js';
import tableRoutes from './modules/tables/table.routes.js';
import reservationRoutes from './modules/reservations/reservation.routes.js';
import crmRoutes from './modules/crm/crm.routes.js';
import whatsappRoutes from './modules/whatsapp/whatsapp.routes.js';
import analyticsRoutes from './modules/analytics/analytics.routes.js';


// ─── Constants ───────────────────────────────────────────────
const JSON_BODY_LIMIT = '10kb';

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
      console.log('CORS bloqueado para origen:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: CORS_MAX_AGE_SECONDS,
}));
// WhatsApp webhook routes (MUST be before express.json() for raw body HMAC verification)
app.use('/api/whatsapp', whatsappRoutes);

app.use(express.json({ limit: JSON_BODY_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: JSON_BODY_LIMIT }));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.1' });
});

// DEBUG: Verificar conexión a base de datos
app.get('/api/debug/db', async (_req, res) => {
  try {
    const count = await prisma.reservation.count();
    const recent = await prisma.reservation.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, customerName: true, createdAt: true }
    });
    res.json({
      databaseUrl: env.DATABASE_URL?.replace(/:([^:@]+)@/, ':***@'), // Oculta password
      reservationCount: count,
      recentReservations: recent,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/crm', crmRoutes);
app.use('/api/analytics', analyticsRoutes);


// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

// ─── Server Lifecycle ────────────────────────────────────────
const startServer = async (): Promise<void> => {
  try {
    await prisma.$connect();

    tokenCleanupService.start();

    httpServer.listen(env.PORT, () => {
      console.log(`🚀 Server running on http://localhost:${env.PORT}`);
      startCronJobs();
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
};

const gracefulShutdown = async (signal: string): Promise<void> => {
  console.log(`${signal} received, shutting down gracefully`);
  tokenCleanupService.stop();
  stopCronJobs();
  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

startServer();
