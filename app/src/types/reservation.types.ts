import type { TableSummary } from './table.types';

export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

export interface Reservation {
  id: string;
  customerName: string;
  customerPhone: string;
  reservationDate: string;
  reservationTime: string;
  partySize: number;
  tableId: string | null;
  message?: string;
  status: ReservationStatus;
  table: TableSummary | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReservationDTO {
  customerName: string;
  customerPhone: string;
  reservationDate: string;
  reservationTime: string;
  partySize: number;
  tableId?: string;
  message?: string;
}

export interface UpdateReservationDTO {
  status?: ReservationStatus;
  tableId?: string | null;
  customerName?: string;
  customerPhone?: string;
  reservationDate?: string;
  reservationTime?: string;
  partySize?: number;
  message?: string;
}

export interface ReservationFilters {
  date?: string;
  status?: ReservationStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ReservationStats {
  today: {
    total: number;
    pending: number;
    confirmed: number;
    cancelled: number;
    completed: number;
  };
  upcoming: number;
}

export interface PaginatedReservations {
  data: Reservation[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
