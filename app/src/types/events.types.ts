// ─── Event Types ─────────────────────────────────────────────

export type EventType = 'CONCERT' | 'QUICK_EVENT';

export interface TicketPrices {
  palco_8?: number;
  palco_4?: number;
  palco_2?: number;
  vip_primer_piso?: number;
  vip_segundo_piso?: number;
  barras?: number;
  cover?: number;
}

export interface EventTable {
  id: string;
  zone: 'SALON' | 'TERRAZA' | 'VIP' | 'BARRA' | 'PISTA';
  total: number;
  reserved: number;
}

// Cupos por tipo de boleta. `sold` se descuenta automáticamente al confirmar pagos.
export interface EventTicketInventory {
  id: string;
  ticketType: string;
  total: number;
  sold: number;
}

// Mapa tipo de boleta → cupo total, usado en formularios admin
export type TicketInventoryInput = Record<string, number>;

export interface Event {
  id: string;
  name: string;
  eventType: EventType;
  eventDate: string;
  eventTime: string;
  description: string | null;
  coverPrice: number | null;
  ticketPrices: TicketPrices | null;
  flyerUrl: string | null;
  status: 'ACTIVE' | 'SOLD_OUT' | 'CANCELLED' | 'PAST';
  isActive: boolean;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
  tables: EventTable[];
  ticketInventory?: EventTicketInventory[];
}

export interface CreateEventDTO {
  name: string;
  eventType: EventType;
  eventDate: string;       // YYYY-MM-DD
  eventTime: string;       // HH:MM
  description?: string;
  coverPrice?: number;
  ticketPrices?: TicketPrices;
  ticketInventory?: TicketInventoryInput;
  tables?: Array<{ zone: EventTable['zone']; total: number }>;
}

export interface UpdateEventDTO {
  name?: string;
  eventType?: EventType;
  eventDate?: string;
  eventTime?: string;
  description?: string;
  coverPrice?: number;
  ticketPrices?: TicketPrices;
  ticketInventory?: TicketInventoryInput;
  status?: Event['status'];
  isActive?: boolean;
}

export interface UpdateTablesDTO {
  zone: EventTable['zone'];
  total: number;
  reserved: number;
}
