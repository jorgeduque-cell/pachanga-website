import { useQuery } from '@tanstack/react-query';
import { tableService } from '@/services';

const TABLE_MAP_KEY = 'table-map';

export function useTableMap(date: string, time: string) {
  return useQuery({
    queryKey: [TABLE_MAP_KEY, date, time],
    queryFn: () => tableService.getMap(date, time),
    enabled: !!date && !!time, // Solo ejecutar si hay fecha y hora
    staleTime: 30000, // 30 segundos de cache fresca
    retry: (failureCount, error) => {
      // Reintentar hasta 3 veces si hay errores de red o timeout
      if (failureCount >= 3) return false;
      
      // Reintentar si es un error de red o timeout
      const errorMessage = error instanceof Error ? error.message : '';
      const shouldRetry = 
        errorMessage.includes('tardando') || 
        errorMessage.includes('No se pudo conectar') ||
        errorMessage.includes('timeout') ||
        errorMessage.includes('network');
      
      return shouldRetry;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * (attemptIndex + 1), 5000), // Delay incremental
  });
}

export function useTables() {
  return useQuery({
    queryKey: ['tables'],
    queryFn: () => tableService.getAll(),
  });
}

export function useAvailableTables(date: string, time: string, partySize?: number) {
  return useQuery({
    queryKey: ['tables-available', date, time, partySize],
    queryFn: () => tableService.getAvailable(date, time, partySize),
    enabled: !!date && !!time,
  });
}
