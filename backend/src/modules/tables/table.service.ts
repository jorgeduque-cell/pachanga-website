import { Prisma, TableZone, ReservationStatus, Table } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/error.middleware.js';

// ─── Constants ───────────────────────────────────────────────
const FLOOR_LABELS: Record<number, string> = {
  1: 'Primer Piso',
  2: 'Segundo Piso',
};

// ─── Types ───────────────────────────────────────────────────
export interface CreateTableData {
  name: string;
  capacity: number;
  zone: TableZone;
}

export interface UpdateTableData {
  name?: string;
  capacity?: number;
  zone?: TableZone;
}

interface TableWithAvailability extends Table {
  isAvailable: boolean;
}

interface FloorMap {
  label: string;
  tables: TableWithAvailability[];
}

interface TableMapResponse {
  floor1: FloorMap;
  floor2: FloorMap;
  totalTables: number;
  availableTables: number;
}

// ─── Service ─────────────────────────────────────────────────
export class TableService {
  async getAll(): Promise<Table[]> {
    return prisma.table.findMany({
      where: { isActive: true },
      orderBy: [{ floor: 'asc' }, { name: 'asc' }],
    });
  }

  async getMap(date?: string, _time?: string): Promise<TableMapResponse> {
    const tables = await this.getAll();

    const reservedTableIds = date
      ? await this.getReservedTableIds(new Date(date), ['CONFIRMED', 'PENDING'])
      : [];

    const tablesWithAvailability = tables.map(table => ({
      ...table,
      isAvailable: !reservedTableIds.includes(table.id),
    }));

    return {
      floor1: this.buildFloorMap(1, tablesWithAvailability),
      floor2: this.buildFloorMap(2, tablesWithAvailability),
      totalTables: tables.length,
      availableTables: tables.length - reservedTableIds.length,
    };
  }

  async getAvailable(date: string, _time: string, partySize?: number): Promise<Table[]> {
    const reservedIds = await this.getReservedTableIds(new Date(date), ['CONFIRMED']);

    const where: Prisma.TableWhereInput = {
      isActive: true,
      id: { notIn: reservedIds },
    };

    if (partySize) {
      where.capacity = { gte: partySize };
    }

    return prisma.table.findMany({
      where,
      orderBy: [{ zone: 'asc' }, { capacity: 'asc' }],
    });
  }

  async getById(id: string): Promise<Table> {
    return this.findTableOrThrow(id);
  }

  async create(tableData: CreateTableData): Promise<Table> {
    await this.ensureNameAvailable(tableData.name);

    return prisma.table.create({
      data: {
        name: tableData.name,
        capacity: tableData.capacity,
        zone: tableData.zone,
        isActive: true,
      },
    });
  }

  async update(id: string, tableData: UpdateTableData): Promise<Table> {
    const existingTable = await this.findTableOrThrow(id);

    if (tableData.name && tableData.name !== existingTable.name) {
      await this.ensureNameAvailable(tableData.name);
    }

    return prisma.table.update({
      where: { id },
      data: tableData,
    });
  }

  async deactivate(id: string): Promise<Table> {
    await this.findTableOrThrow(id);

    return prisma.table.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // ─── Private Helpers ─────────────────────────────────────────

  private async getReservedTableIds(
    date: Date,
    statuses: ReservationStatus[],
  ): Promise<string[]> {
    // Block tables for the ENTIRE NIGHT — ignore time, match only by date
    const effectiveStatuses = statuses.length === 0 ? ['CONFIRMED', 'PENDING'] as ReservationStatus[] : statuses;
    
    const reserved = await prisma.reservation.findMany({
      where: {
        reservationDate: date,
        status: { in: effectiveStatuses },
        tableId: { not: null },
      },
      select: { tableId: true },
    });

    return reserved.map(r => r.tableId).filter(Boolean) as string[];
  }

  private buildFloorMap(floor: number, tables: TableWithAvailability[]): FloorMap {
    return {
      label: FLOOR_LABELS[floor] ?? `Piso ${floor}`,
      tables: tables.filter(t => t.floor === floor),
    };
  }

  private async findTableOrThrow(id: string): Promise<Table> {
    const table = await prisma.table.findUnique({ where: { id } });

    if (!table) {
      throw new AppError('Mesa no encontrada', 404);
    }

    return table;
  }

  private async ensureNameAvailable(name: string): Promise<void> {
    const existing = await prisma.table.findUnique({ where: { name } });

    if (existing) {
      throw new AppError('Ya existe una mesa con ese nombre', 409);
    }
  }
}

export const tableService = new TableService();
