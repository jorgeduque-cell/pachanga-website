import { useQuery } from '@tanstack/react-query';
import { crmService, type MessageFilters } from '@/services/crm.service';

const MESSAGES_KEYS = {
  all: ['messages'] as const,
  list: (filters?: MessageFilters) => [...MESSAGES_KEYS.all, 'list', filters] as const,
};

// Hook para obtener el log de mensajes WhatsApp
export function useMessages(filters?: MessageFilters) {
  return useQuery({
    queryKey: MESSAGES_KEYS.list(filters),
    queryFn: () => crmService.getMessages(filters),
  });
}
