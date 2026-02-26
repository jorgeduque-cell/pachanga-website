import { apiClient, extractData } from '@/lib/api';
import type { TableMapResponse, Table } from '@/types';


export const tableService = {
  // Obtener todas las mesas activas
  async getAll(): Promise<Table[]> {
    const response = await apiClient.get<{ data: Table[] }>('/tables');
    return extractData(response);
  },

  // Obtener mapa de mesas con disponibilidad por fecha/hora
  async getMap(date: string, time: string): Promise<TableMapResponse> {
    const params = new URLSearchParams({ date, time });
    const response = await apiClient.get<{ data: TableMapResponse }>(`/tables/map?${params}`);
    return extractData(response);
  },

  // Obtener mesas disponibles para una fecha/hora específica
  async getAvailable(date: string, time: string, partySize?: number): Promise<Table[]> {
    const params = new URLSearchParams();
    params.append('date', date);
    params.append('time', time);
    if (partySize) params.append('partySize', partySize.toString());
    
    const response = await apiClient.get<{ data: Table[] }>(`/tables/available?${params}`);
    return extractData(response);
  },

  // Obtener mesa por ID
  async getById(id: string): Promise<Table> {
    const response = await apiClient.get<{ data: Table }>(`/tables/${id}`);
    return extractData(response);
  },
};
