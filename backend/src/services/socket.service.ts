import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { Reservation, Table } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';
import { ALLOWED_ORIGINS } from '../config/cors.js';

// ─── Constants ───────────────────────────────────────────────
const ADMIN_ROOM = 'admin-room';
const BEARER_PREFIX = 'Bearer ';

// ─── Types ───────────────────────────────────────────────────
interface JwtPayload {
  userId: string;
  email: string;
  type: string;
  jti: string;
}

export type ReservationWithTable = Reservation & { table: Table | null };

interface ServerToClientEvents {
  'new-reservation': (data: { reservation: ReservationWithTable }) => void;
  'reservation-updated': (data: { reservation: ReservationWithTable }) => void;
  'reservation-cancelled': (data: { reservationId: string }) => void;
  'connect-error': (error: string) => void;
}

interface ClientToServerEvents {
  'join-admin-room': () => void;
  'leave-admin-room': () => void;
}

interface InterServerEvents {
  ping: () => void;
}

interface SocketData {
  userId: string;
  email: string;
}

type TypedIO = SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
export type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

// ─── Service ─────────────────────────────────────────────────
class SocketService {
  private io: TypedIO | null = null;

  initialize(httpServer: HttpServer): void {
    this.io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(httpServer, {
      cors: {
        origin: ALLOWED_ORIGINS,
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    this.setupAuthMiddleware();
    this.setupEventHandlers();
  }

  emitNewReservation(reservation: ReservationWithTable): void {
    this.io?.to(ADMIN_ROOM).emit('new-reservation', { reservation });
  }

  emitReservationUpdated(reservation: ReservationWithTable): void {
    this.io?.to(ADMIN_ROOM).emit('reservation-updated', { reservation });
  }

  emitReservationCancelled(reservationId: string): void {
    this.io?.to(ADMIN_ROOM).emit('reservation-cancelled', { reservationId });
  }

  getIO(): TypedIO | null {
    return this.io;
  }

  // ─── Private ─────────────────────────────────────────────────

  private setupAuthMiddleware(): void {
    if (!this.io) return;

    this.io.use((socket, next) => {
      try {
        const rawToken = socket.handshake.auth?.token;

        if (!rawToken || typeof rawToken !== 'string') {
          return next(new Error('Authentication required'));
        }

        const jwtToken = rawToken.startsWith(BEARER_PREFIX)
          ? rawToken.substring(BEARER_PREFIX.length)
          : rawToken;

        const decoded = jwt.verify(jwtToken, env.JWT_SECRET) as JwtPayload;

        if (decoded.type !== 'access') {
          return next(new Error('Invalid token type'));
        }

        socket.data.userId = decoded.userId;
        socket.data.email = decoded.email;
        next();
      } catch {
        next(new Error('Invalid token'));
      }
    });
  }

  private setupEventHandlers(): void {
    if (!this.io) return;

    this.io.on('connection', (socket: TypedSocket) => {
      socket.on('join-admin-room', async () => {
        try {
          const user = await prisma.user.findUnique({
            where: { id: socket.data.userId },
            select: { role: true },
          });

          if (user?.role !== 'ADMIN') {
            socket.emit('connect-error', 'Authorization error — requires ADMIN');
            return;
          }

          socket.join(ADMIN_ROOM);
        } catch {
          socket.emit('connect-error', 'Internal server error');
        }
      });

      socket.on('leave-admin-room', () => {
        socket.leave(ADMIN_ROOM);
      });
    });
  }
}

export const socketService = new SocketService();
