import { apiClient, extractData } from '@/lib/api';
import type { 
  Reservation, 
  CreateReservationDTO, 
  UpdateReservationDTO,
  ReservationFilters,
  ReservationStats,
  PaginatedReservations
} from '@/types';


export const reservationService = {
  // Crear nueva reserva (público)
  async create(data: CreateReservationDTO): Promise<Reservation> {
    const response = await apiClient.post<{ data: Reservation }>('/reservations', data);
    return extractData(response);
  },

  // Obtener todas las reservas (admin) - paginado
  async getAll(filters?: ReservationFilters): Promise<PaginatedReservations> {
    const params = new URLSearchParams();
    if (filters?.date) params.append('date', filters.date);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    
    const response = await apiClient.get<{ data: PaginatedReservations }>(`/reservations?${params}`);
    return extractData(response);
  },

  // Obtener reserva por ID
  async getById(id: string): Promise<Reservation> {
    const response = await apiClient.get<{ data: Reservation }>(`/reservations/${id}`);
    return extractData(response);
  },

  // Actualizar reserva
  async update(id: string, data: UpdateReservationDTO): Promise<Reservation> {
    const response = await apiClient.patch<{ data: Reservation }>(`/reservations/${id}`, data);
    return extractData(response);
  },

  // Cancelar reserva
  async cancel(id: string): Promise<Reservation> {
    const response = await apiClient.patch<{ data: Reservation }>(`/reservations/${id}/cancel`);
    return extractData(response);
  },

  // Eliminar reserva
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/reservations/${id}`);
  },

  // Obtener reservas de hoy (para dashboard)
  async getToday(): Promise<PaginatedReservations> {
    const today = new Date().toISOString().split('T')[0];
    return this.getAll({ date: today });
  },

  // Obtener estadísticas
  async getStats(): Promise<ReservationStats> {
    const response = await apiClient.get<{ data: ReservationStats }>('/reservations/stats');
    return extractData(response);
  },
};
