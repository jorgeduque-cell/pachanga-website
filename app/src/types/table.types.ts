export type TableZone = 'SALON' | 'TERRAZA' | 'VIP' | 'BARRA' | 'PISTA';

export interface TableSummary {
  id: string;
  name: string;
  capacity: number;
  zone: TableZone;
  floor: number;
  posX: number;
  posY: number;
  isAvailable: boolean;
}

export interface FloorMap {
  label: string;
  tables: TableSummary[];
}

export interface TableMapResponse {
  floor1: FloorMap;
  floor2: FloorMap;
  totalTables: number;
  availableTables: number;
}

export interface Table {
  id: string;
  name: string;
  capacity: number;
  zone: TableZone;
  floor: number;
  posX: number;
  posY: number;
  isActive: boolean;
  createdAt: string;
}
