// ─── Event Types ─────────────────────────────────────────────

export interface EventTable {
  id: string;
  zone: 'SALON' | 'TERRAZA' | 'VIP' | 'BARRA' | 'PISTA';
  total: number;
  reserved: number;
}

export interface Event {
  id: string;
  name: string;
  eventDate: string;
  eventTime: string;
  description: string | null;
  coverPrice: number | null;
  flyerUrl: string | null;
  status: 'ACTIVE' | 'SOLD_OUT' | 'CANCELLED' | 'PAST';
  isActive: boolean;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
  tables: EventTable[];
}

export interface CreateEventDTO {
  name: string;
  eventDate: string;       // YYYY-MM-DD
  eventTime: string;       // HH:MM
  description?: string;
  coverPrice?: number;
  tables?: Array<{ zone: EventTable['zone']; total: number }>;
}

export interface UpdateEventDTO {
  name?: string;
  eventDate?: string;
  eventTime?: string;
  description?: string;
  coverPrice?: number;
  status?: Event['status'];
  isActive?: boolean;
}

export interface UpdateTablesDTO {
  zone: EventTable['zone'];
  total: number;
  reserved: number;
}
