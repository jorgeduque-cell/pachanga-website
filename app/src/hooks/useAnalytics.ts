import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '@/services/analytics.service';

const ANALYTICS_KEYS = {
  all: ['analytics'] as const,
  newCustomers: (months?: number) => [...ANALYTICS_KEYS.all, 'new-customers', months] as const,
  messagesByStatus: () => [...ANALYTICS_KEYS.all, 'messages-by-status'] as const,
  ratingDistribution: () => [...ANALYTICS_KEYS.all, 'rating-distribution'] as const,
  visitsTrend: (months?: number) => [...ANALYTICS_KEYS.all, 'visits-trend', months] as const,
};

// Hook para obtener nuevos clientes por mes (gráfico de barras)
export function useNewCustomers(months = 6) {
  return useQuery({
    queryKey: ANALYTICS_KEYS.newCustomers(months),
    queryFn: () => analyticsService.getNewCustomers(months),
  });
}

// Hook para obtener distribución de mensajes por estado (gráfico pie)
export function useMessagesByStatus() {
  return useQuery({
    queryKey: ANALYTICS_KEYS.messagesByStatus(),
    queryFn: () => analyticsService.getMessagesByStatus(),
  });
}

// Hook para obtener distribución de ratings (gráfico pie)
export function useRatingDistribution() {
  return useQuery({
    queryKey: ANALYTICS_KEYS.ratingDistribution(),
    queryFn: () => analyticsService.getRatingDistribution(),
  });
}

// Hook para obtener tendencia de visitas
export function useVisitsTrend(months = 6) {
  return useQuery({
    queryKey: ANALYTICS_KEYS.visitsTrend(months),
    queryFn: () => analyticsService.getVisitsTrend(months),
  });
}
