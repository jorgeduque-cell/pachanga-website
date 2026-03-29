import { apiClient } from '@/lib/api';

// ─── Types ───────────────────────────────────────────────────
export interface PaymentVerification {
  id: string;
  reference: string;
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'EXPIRED';
  ticketType: string;
  quantity: number;
  expectedAmount: number;
  detectedAmount: number | null;
  receiptUrl: string | null;
  visionAnalysis: {
    isPaymentReceipt?: boolean;
    amount?: number | null;
    bank?: string | null;
    date?: string | null;
    reference?: string | null;
    confidence?: number;
  } | null;
  adminNotes: string | null;
  confirmedBy: string | null;
  confirmedAt: string | null;
  rejectedAt: string | null;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  customer: {
    id: string;
    name: string;
    phone: string;
  };
  event: {
    id: string;
    name: string;
    eventDate: string;
    eventTime: string;
  };
}

export interface PaymentFilters {
  status?: 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'EXPIRED';
  eventId?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedPayments {
  data: PaymentVerification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ─── Service ─────────────────────────────────────────────────
export const paymentService = {
  async getPayments(filters?: PaymentFilters): Promise<PaginatedPayments> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.eventId) params.append('eventId', filters.eventId);
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.limit) params.append('limit', String(filters.limit));

    const response = await apiClient.get<PaginatedPayments>(`/chatbot/payments?${params}`);
    return response.data;
  },

  async getPaymentDetail(id: string): Promise<PaymentVerification> {
    const response = await apiClient.get<{ data: PaymentVerification }>(`/chatbot/payments/${id}`);
    return response.data.data;
  },

  async confirmPayment(id: string, notes?: string): Promise<void> {
    await apiClient.patch(`/chatbot/payments/${id}/confirm`, { notes });
  },

  async rejectPayment(id: string, reason?: string): Promise<void> {
    await apiClient.patch(`/chatbot/payments/${id}/reject`, { reason });
  },
};
