import { apiClient, extractData } from '@/lib/api';

export interface ChartPoint {
  month: string;
  count: number;
}

export interface StatusPoint {
  status: string;
  count: number;
}

export interface RatingPoint {
  rating: number;
  count: number;
}

export const analyticsService = {
  // Gráfico de barras: nuevos clientes por mes
  async getNewCustomers(months = 6): Promise<ChartPoint[]> {
    const response = await apiClient.get<{ data: ChartPoint[] }>(`/analytics/charts/new-customers?months=${months}`);
    return extractData(response);
  },

  // Gráfico pie: distribución de mensajes por estado
  async getMessagesByStatus(): Promise<StatusPoint[]> {
    const response = await apiClient.get<{ data: StatusPoint[] }>('/analytics/charts/messages-by-status');
    return extractData(response);
  },

  // Gráfico pie: distribución de ratings
  async getRatingDistribution(): Promise<RatingPoint[]> {
    const response = await apiClient.get<{ data: RatingPoint[] }>('/analytics/charts/rating-distribution');
    return extractData(response);
  },

  // Gráfico de tendencia de visitas
  async getVisitsTrend(months = 6): Promise<ChartPoint[]> {
    const response = await apiClient.get<{ data: ChartPoint[] }>(`/analytics/charts/visits-trend?months=${months}`);
    return extractData(response);
  },
};
