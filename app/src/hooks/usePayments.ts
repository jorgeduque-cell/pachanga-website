import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentService, type PaymentFilters } from '@/services/payment.service';

const PAYMENT_KEYS = {
  all: ['payments'] as const,
  list: (filters?: PaymentFilters) => [...PAYMENT_KEYS.all, 'list', filters] as const,
  detail: (id: string) => [...PAYMENT_KEYS.all, 'detail', id] as const,
};

export function usePayments(filters?: PaymentFilters) {
  return useQuery({
    queryKey: PAYMENT_KEYS.list(filters),
    queryFn: () => paymentService.getPayments(filters),
    refetchInterval: 15000,
  });
}

export function usePaymentDetail(id: string) {
  return useQuery({
    queryKey: PAYMENT_KEYS.detail(id),
    queryFn: () => paymentService.getPaymentDetail(id),
    enabled: !!id,
  });
}

export function useConfirmPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      paymentService.confirmPayment(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PAYMENT_KEYS.all });
    },
  });
}

export function useRejectPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      paymentService.rejectPayment(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PAYMENT_KEYS.all });
    },
  });
}
