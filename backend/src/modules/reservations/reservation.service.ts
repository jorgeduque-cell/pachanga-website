import { ReservationStatus, Prisma, Reservation, Table } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/error.middleware.js';
import { socketService } from '../../services/socket.service.js';
import { crmService } from '../crm/crm.service.js';

// ─── Constants ───────────────────────────────────────────────
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;

// ─── Public Interfaces ──────────────────────────────────────
type ReservationWithTable = Reservation & { table: Table | null };

export interface CreateReservationData {
  customerName: string;
  customerPhone: string;
  reservationDate: string;
  reservationTime: string;
  partySize: number;
  tableId?: string;
  message?: string;
}

export interface UpdateReservationData {
  customerName?: string;
  customerPhone?: string;
  reservationDate?: string;
  reservationTime?: string;
  partySize?: number;
  tableId?: string | null;
  status?: ReservationStatus;
  message?: string;
}

export interface ReservationFilters {
  date?: string;
  status?: ReservationStatus;
  search?: string;
  page?: number;
  limit?: number;
}

interface PaginatedResult {
  data: ReservationWithTable[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ─── Service ─────────────────────────────────────────────────
export class ReservationService {
  async create(data: CreateReservationData): Promise<ReservationWithTable> {
    console.log(`[ReservationService] Creating reservation for: ${data.customerName}, date: ${data.reservationDate}, time: ${data.reservationTime}`);
    
    const reservationDate = new Date(data.reservationDate);
    this.validateFutureDate(reservationDate);

    try {
      // Count before
      const countBefore = await prisma.reservation.count();
      console.log(`[ReservationService] Count before: ${countBefore}`);
      
      const reservation = await prisma.$transaction(async (tx) => {
        if (data.tableId) {
          await this.validateTableForReservation(tx, data.tableId, data.partySize, reservationDate, data.reservationTime);
        }

        const created = await tx.reservation.create({
          data: {
            customerName: data.customerName,
            customerPhone: data.customerPhone,
            reservationDate,
            reservationTime: data.reservationTime,
            partySize: data.partySize,
            tableId: data.tableId ?? null,
            message: data.message,
            status: 'PENDING',
          },
          include: { table: true },
        });
        
        console.log(`[ReservationService] Reservation created with ID: ${created.id}`);
        return created;
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
      
      // Count after and verify
      const countAfter = await prisma.reservation.count();
      console.log(`[ReservationService] Count after: ${countAfter}`);
      
      // Try to read it back
      const verify = await prisma.reservation.findUnique({ where: { id: reservation.id } });
      console.log(`[ReservationService] Verified in DB: ${verify ? 'YES' : 'NO'}`);

      socketService.emitNewReservation(reservation);

      // CRM: link reservation to customer (fire-and-forget, non-blocking)
      crmService.linkToReservation(
        data.customerPhone,
        data.customerName,
        reservation.id,
      ).catch((err) => {
        console.error('[ReservationService] CRM link failed:', err instanceof Error ? err.message : err);
      });

      return reservation;
    } catch (error) {
      console.error(`[ReservationService] Error creating reservation:`, error);
      throw error;
    }
  }

  async getAll(filters: ReservationFilters): Promise<PaginatedResult> {
    const page = filters.page ?? DEFAULT_PAGE;
    const limit = filters.limit ?? DEFAULT_LIMIT;
    const skip = (page - 1) * limit;
    const where = this.buildFiltersWhereClause(filters);

    const [reservations, total] = await Promise.all([
      prisma.reservation.findMany({
        where,
        include: { table: true },
        orderBy: [{ reservationDate: 'asc' }, { reservationTime: 'asc' }],
        skip,
        take: limit,
      }),
      prisma.reservation.count({ where }),
    ]);

    return {
      data: reservations,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getById(id: string): Promise<ReservationWithTable> {
    return this.findReservationOrThrow(id);
  }

  async update(id: string, data: UpdateReservationData): Promise<ReservationWithTable> {
    const existingReservation = await this.findReservationOrThrow(id);

    const updatedReservation = await prisma.$transaction(async (tx) => {
      if (this.requiresConflictCheck(data)) {
        await this.validateNoConflict(tx, id, data, existingReservation);
      }

      const updatePayload = this.buildUpdatePayload(data);

      return tx.reservation.update({
        where: { id },
        data: updatePayload,
        include: { table: true },
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    socketService.emitReservationUpdated(updatedReservation);
    return updatedReservation;
  }

  async cancel(id: string): Promise<ReservationWithTable> {
    const reservation = await this.findReservationOrThrow(id);

    if (reservation.status === 'CANCELLED') {
      throw new AppError('La reserva ya está cancelada', 400);
    }

    const cancelledReservation = await prisma.reservation.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: { table: true },
    });

    socketService.emitReservationUpdated(cancelledReservation);
    return cancelledReservation;
  }

  async remove(id: string): Promise<{ message: string }> {
    await this.findReservationOrThrow(id);

    await prisma.reservation.delete({ where: { id } });
    return { message: 'Reserva eliminada exitosamente' };
  }

  async getStats(): Promise<{ today: Record<string, number>; upcoming: number }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [todayStats, upcoming] = await Promise.all([
      prisma.reservation.groupBy({
        by: ['status'],
        where: { reservationDate: { gte: today, lt: tomorrow } },
        _count: { status: true },
      }),
      prisma.reservation.count({
        where: {
          reservationDate: { gte: tomorrow },
          status: { in: ['PENDING', 'CONFIRMED'] },
        },
      }),
    ]);

    return {
      today: this.aggregateStatusCounts(todayStats),
      upcoming,
    };
  }

  // ─── Private Helpers ─────────────────────────────────────────

  private validateFutureDate(date: Date): void {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    if (date < startOfToday) {
      throw new AppError('No se pueden crear reservas para fechas pasadas', 400);
    }
  }

  private async findReservationOrThrow(id: string): Promise<ReservationWithTable> {
    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: { table: true },
    });

    if (!reservation) {
      throw new AppError('Reserva no encontrada', 404);
    }

    return reservation;
  }

  private async validateTableForReservation(
    tx: Prisma.TransactionClient,
    tableId: string,
    partySize: number,
    reservationDate: Date,
    _reservationTime: string,
  ): Promise<void> {
    const table = await tx.table.findUnique({ where: { id: tableId } });

    if (!table) {
      throw new AppError('La mesa especificada no existe', 404);
    }
    if (!table.isActive) {
      throw new AppError('La mesa especificada no está disponible', 400);
    }
    if (table.capacity < partySize) {
      throw new AppError(`La capacidad de la mesa (${table.capacity}) es menor que el grupo (${partySize})`, 400);
    }

    // Verificar si la mesa ya está reservada para TODA LA NOCHE (cualquier hora)
    const existingReservation = await tx.reservation.findFirst({
      where: { 
        tableId, 
        reservationDate, 
        status: { in: ['CONFIRMED', 'PENDING'] } 
      },
    });

    if (existingReservation) {
      throw new AppError('Esta mesa ya está reservada para esta fecha. Elige otra', 409);
    }
  }

  private requiresConflictCheck(data: UpdateReservationData): boolean {
    return data.status === 'CONFIRMED' && (
      data.tableId !== undefined || !!data.reservationDate || !!data.reservationTime
    );
  }

  private async validateNoConflict(
    tx: Prisma.TransactionClient,
    reservationId: string,
    data: UpdateReservationData,
    existing: ReservationWithTable,
  ): Promise<void> {
    const tableId = data.tableId ?? existing.tableId;
    const reservationDate = data.reservationDate ? new Date(data.reservationDate) : existing.reservationDate;

    if (!tableId) return;

    const conflict = await tx.reservation.findFirst({
      where: {
        id: { not: reservationId },
        tableId,
        reservationDate,
        status: { in: ['CONFIRMED', 'PENDING'] },
      },
    });

    if (conflict) {
      throw new AppError('La mesa ya está reservada para esa fecha', 409);
    }
  }

  private buildUpdatePayload(data: UpdateReservationData): Prisma.ReservationUpdateInput {
    const payload: Prisma.ReservationUpdateInput = {};

    if (data.customerName) payload.customerName = data.customerName;
    if (data.customerPhone) payload.customerPhone = data.customerPhone;
    if (data.reservationDate) payload.reservationDate = new Date(data.reservationDate);
    if (data.reservationTime) payload.reservationTime = data.reservationTime;
    if (data.partySize) payload.partySize = data.partySize;
    if (data.tableId !== undefined) {
      payload.table = data.tableId ? { connect: { id: data.tableId } } : { disconnect: true };
    }
    if (data.status) payload.status = data.status;
    if (data.message !== undefined) payload.message = data.message;

    return payload;
  }

  private buildFiltersWhereClause(filters: ReservationFilters): Prisma.ReservationWhereInput {
    const where: Prisma.ReservationWhereInput = {};

    if (filters.date) {
      where.reservationDate = new Date(filters.date);
    }
    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.search) {
      where.OR = [
        { customerName: { contains: filters.search, mode: 'insensitive' } },
        { customerPhone: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return where;
  }

  private aggregateStatusCounts(
    stats: Array<{ status: ReservationStatus; _count: { status: number } }>
  ): Record<string, number> {
    const result: Record<string, number> = {
      total: 0, pending: 0, confirmed: 0, cancelled: 0, completed: 0,
    };

    for (const stat of stats) {
      const count = stat._count.status;
      result.total += count;
      result[stat.status.toLowerCase()] = count;
    }

    return result;
  }
}

export const reservationService = new ReservationService();
