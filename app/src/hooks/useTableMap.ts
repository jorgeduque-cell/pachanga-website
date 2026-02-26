import { useQuery } from '@tanstack/react-query';
import { tableService } from '@/services';

const TABLE_MAP_KEY = 'table-map';

export function useTableMap(date: string, time: string) {
  return useQuery({
    queryKey: [TABLE_MAP_KEY, date, time],
    queryFn: () => tableService.getMap(date, time),
    enabled: !!date && !!time, // Solo ejecutar si hay fecha y hora
    staleTime: 30000, // 30 segundos de cache fresca
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
