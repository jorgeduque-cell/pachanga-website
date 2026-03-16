import { describe, it, expect, beforeEach } from 'vitest';
import { prismaMock } from './setup.js';
import type { Table, TableZone } from '@prisma/client';

const { TableService } = await import('../../src/modules/tables/table.service.js');

// ─── Helpers ─────────────────────────────────────────────
function mockTable(overrides: Partial<Table> = {}): Table {
  return {
    id: 'table-1',
    name: 'VIP-1',
    capacity: 6,
    zone: 'VIP' as TableZone,
    floor: 1,
    posX: 0,
    posY: 0,
    isActive: true,
    createdAt: new Date(),
    ...overrides,
  };
}

describe('TableService', () => {
  let tableService: InstanceType<typeof TableService>;

  beforeEach(() => {
    tableService = new TableService();
  });

  // ─── getAll ────────────────────────────────────────────
  describe('getAll', () => {
    it('should return active tables sorted by floor and name', async () => {
      const tables = [mockTable(), mockTable({ id: 'table-2', name: 'VIP-2' })];
      prismaMock.table.findMany.mockResolvedValue(tables);

      const result = await tableService.getAll();

      expect(result).toHaveLength(2);
      expect(prismaMock.table.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isActive: true },
        }),
      );
    });
  });

  // ─── getById ───────────────────────────────────────────
  describe('getById', () => {
    it('should return the table if found', async () => {
      prismaMock.table.findUnique.mockResolvedValue(mockTable());

      const result = await tableService.getById('table-1');

      expect(result.name).toBe('VIP-1');
    });

    it('should throw 404 if table not found', async () => {
      prismaMock.table.findUnique.mockResolvedValue(null);

      await expect(tableService.getById('non-existent'))
        .rejects.toThrow('Mesa no encontrada');
    });
  });

  // ─── create ────────────────────────────────────────────
  describe('create', () => {
    it('should create a new table', async () => {
      prismaMock.table.findUnique.mockResolvedValue(null); // ensureNameAvailable
      prismaMock.table.create.mockResolvedValue(mockTable());

      const result = await tableService.create({
        name: 'VIP-1',
        capacity: 6,
        zone: 'VIP' as TableZone,
      });

      expect(result.name).toBe('VIP-1');
      expect(prismaMock.table.create).toHaveBeenCalled();
    });

    it('should throw 409 for duplicate name', async () => {
      prismaMock.table.findUnique.mockResolvedValue(mockTable()); // name exists

      await expect(
        tableService.create({ name: 'VIP-1', capacity: 6, zone: 'VIP' as TableZone }),
      ).rejects.toThrow('Ya existe una mesa con ese nombre');
    });
  });

  // ─── update ────────────────────────────────────────────
  describe('update', () => {
    it('should update an existing table', async () => {
      const existing = mockTable();
      // First call: findTableOrThrow, Second call: ensureNameAvailable
      prismaMock.table.findUnique
        .mockResolvedValueOnce(existing) // findTableOrThrow
        .mockResolvedValueOnce(null);    // ensureNameAvailable (new name not taken)
      prismaMock.table.update.mockResolvedValue({ ...existing, name: 'VIP-2' });

      const result = await tableService.update('table-1', { name: 'VIP-2' });

      expect(result.name).toBe('VIP-2');
    });
  });

  // ─── deactivate ────────────────────────────────────────
  describe('deactivate', () => {
    it('should soft-delete by setting isActive to false', async () => {
      prismaMock.table.findUnique.mockResolvedValue(mockTable());
      prismaMock.table.update.mockResolvedValue(mockTable({ isActive: false }));

      const result = await tableService.deactivate('table-1');

      expect(result.isActive).toBe(false);
      expect(prismaMock.table.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { isActive: false },
        }),
      );
    });

    it('should throw 404 if table not found', async () => {
      prismaMock.table.findUnique.mockResolvedValue(null);

      await expect(tableService.deactivate('non-existent'))
        .rejects.toThrow('Mesa no encontrada');
    });
  });
});
