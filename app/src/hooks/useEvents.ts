import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventsService } from '@/services/events.service';
import type { CreateEventDTO, UpdateEventDTO, UpdateTablesDTO, Event } from '@/types/events.types';

// ─── Query Keys ──────────────────────────────────────────────
const EVENTS_KEYS = {
  all: ['events'] as const,
  list: (status?: Event['status']) => [...EVENTS_KEYS.all, 'list', status] as const,
  detail: (id: string) => [...EVENTS_KEYS.all, 'detail', id] as const,
  upcoming: () => [...EVENTS_KEYS.all, 'upcoming'] as const,
};

// ─── Queries ─────────────────────────────────────────────────

/** Admin: all events with optional status filter */
export function useAdminEvents(status?: Event['status']) {
  return useQuery({
    queryKey: EVENTS_KEYS.list(status),
    queryFn: () => eventsService.getAll(status),
  });
}

/** Public: upcoming active events */
export function useUpcomingEvents() {
  return useQuery({
    queryKey: EVENTS_KEYS.upcoming(),
    queryFn: () => eventsService.getUpcoming(),
    staleTime: 10 * 60 * 1000,  // 10 min cache
    gcTime: 30 * 60 * 1000,     // 30 min garbage collection
  });
}

/** Single event detail */
export function useEvent(id: string) {
  return useQuery({
    queryKey: EVENTS_KEYS.detail(id),
    queryFn: () => eventsService.getById(id),
    enabled: !!id,
  });
}

// ─── Mutations ───────────────────────────────────────────────

export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateEventDTO) => eventsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EVENTS_KEYS.all });
    },
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEventDTO }) =>
      eventsService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: EVENTS_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: EVENTS_KEYS.all });
    },
  });
}

export function useUploadFlyer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      eventsService.uploadFlyer(id, file),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: EVENTS_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: EVENTS_KEYS.all });
    },
  });
}

export function useUpdateEventTables() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, tables }: { id: string; tables: UpdateTablesDTO[] }) =>
      eventsService.updateTables(id, tables),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: EVENTS_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: EVENTS_KEYS.all });
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => eventsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EVENTS_KEYS.all });
    },
  });
}
