import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { crmService, type CustomerFilters, type SendMessageInput } from '@/services/crm.service';

const CRM_KEYS = {
  all: ['crm'] as const,
  customers: (filters?: CustomerFilters) => [...CRM_KEYS.all, 'customers', filters] as const,
  customer: (id: string) => [...CRM_KEYS.all, 'customer', id] as const,
  stats: () => [...CRM_KEYS.all, 'stats'] as const,
  birthdays: () => [...CRM_KEYS.all, 'birthdays'] as const,
};

// Hook para obtener clientes
export function useCustomers(filters?: CustomerFilters) {
  return useQuery({
    queryKey: CRM_KEYS.customers(filters),
    queryFn: () => crmService.getCustomers(filters),
  });
}

// Hook para obtener un cliente
export function useCustomer(id: string) {
  return useQuery({
    queryKey: CRM_KEYS.customer(id),
    queryFn: () => crmService.getCustomer(id),
    enabled: !!id,
  });
}

// Hook para obtener estadísticas
export function useCrmStats() {
  return useQuery({
    queryKey: CRM_KEYS.stats(),
    queryFn: () => crmService.getStats(),
  });
}

// Hook para obtener cumpleañeros de hoy
export function useTodayBirthdays() {
  return useQuery({
    queryKey: CRM_KEYS.birthdays(),
    queryFn: () => crmService.getTodayBirthdays(),
  });
}

// Hook para actualizar cliente
export function useUpdateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof crmService.updateCustomer>[1] }) =>
      crmService.updateCustomer(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: CRM_KEYS.customer(id) });
      queryClient.invalidateQueries({ queryKey: CRM_KEYS.customers() });
      queryClient.invalidateQueries({ queryKey: CRM_KEYS.stats() });
    },
  });
}

// Hook para enviar mensaje
export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SendMessageInput) => crmService.sendMessage(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CRM_KEYS.all });
    },
  });
}
