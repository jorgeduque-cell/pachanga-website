import { apiClient, extractData } from '@/lib/api';
import type { Event, CreateEventDTO, UpdateEventDTO, UpdateTablesDTO } from '@/types/events.types';

// ─── Events Admin Service ────────────────────────────────────

export const eventsService = {
  // Public
  getUpcoming: () =>
    apiClient.get<{ data: Event[] }>('/events').then((r) => r.data),

  getById: (id: string) =>
    apiClient.get<{ data: Event }>(`/events/${id}`).then(extractData),

  // Admin
  getAll: (status?: Event['status']) =>
    apiClient
      .get<Event[]>('/events/admin/all', { params: status ? { status } : undefined })
      .then((r) => r.data),

  create: (data: CreateEventDTO) =>
    apiClient.post<Event>('/events', data).then((r) => r.data),

  update: (id: string, data: UpdateEventDTO) =>
    apiClient.patch<Event>(`/events/${id}`, data).then((r) => r.data),

  uploadFlyer: async (id: string, file: File): Promise<Event> => {
    const buffer = await file.arrayBuffer();
    const response = await apiClient.post<Event>(`/events/${id}/flyer`, buffer, {
      headers: {
        'Content-Type': file.type,
        'X-Filename': file.name,
      },
    });
    return response.data;
  },

  updateTables: (id: string, tables: UpdateTablesDTO[]) =>
    apiClient.put<Event>(`/events/${id}/tables`, tables).then((r) => r.data),

  delete: (id: string) =>
    apiClient.delete(`/events/${id}`).then((r) => r.data),
};
