import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reservationService } from '@/services';
import type { CreateReservationDTO, UpdateReservationDTO, ReservationFilters } from '@/types';

const RESERVATIONS_KEY = 'reservations';
const TABLE_MAP_KEY = 'table-map';

export function useReservations(filters?: ReservationFilters) {
  return useQuery({
    queryKey: [RESERVATIONS_KEY, filters],
    queryFn: () => reservationService.getAll(filters),
  });
}

export function useReservation(id: string) {
  return useQuery({
    queryKey: [RESERVATIONS_KEY, id],
    queryFn: () => reservationService.getById(id),
    enabled: !!id,
  });
}

export function useCreateReservation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateReservationDTO) => {
      console.log('[useCreateReservation] Calling service with:', data);
      const result = await reservationService.create(data);
      console.log('[useCreateReservation] Service returned:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('[useCreateReservation] onSuccess:', data);
      // Invalidar reservas y mapa de mesas tras crear reserva
      queryClient.invalidateQueries({ queryKey: [RESERVATIONS_KEY] });
      queryClient.invalidateQueries({ queryKey: [TABLE_MAP_KEY] });
    },
    onError: (error) => {
      console.error('[useCreateReservation] onError:', error);
    },
  });
}

export function useUpdateReservation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateReservationDTO }) => 
      reservationService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [RESERVATIONS_KEY] });
      queryClient.invalidateQueries({ queryKey: [RESERVATIONS_KEY, variables.id] });
      queryClient.invalidateQueries({ queryKey: [TABLE_MAP_KEY] });
    },
  });
}

export function useCancelReservation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => reservationService.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [RESERVATIONS_KEY] });
      queryClient.invalidateQueries({ queryKey: [TABLE_MAP_KEY] });
    },
  });
}

export function useDeleteReservation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => reservationService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [RESERVATIONS_KEY] });
    },
  });
}

export function useTodayReservations() {
  return useQuery({
    queryKey: [RESERVATIONS_KEY, 'today'],
    queryFn: () => reservationService.getToday(),
  });
}

export function useReservationStats() {
  return useQuery({
    queryKey: [RESERVATIONS_KEY, 'stats'],
    queryFn: () => reservationService.getStats(),
  });
}
