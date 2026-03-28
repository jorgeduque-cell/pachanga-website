import { apiClient } from '@/lib/api';

// ─── Types ───────────────────────────────────────────────────
export interface WhatsAppMessageItem {
  id: string;
  customerId: string;
  type: string;
  templateName: string;
  status: string;
  waMessageId: string | null;
  sentAt: string | null;
  deliveredAt: string | null;
  readAt: string | null;
  errorCode: string | null;
  retryCount: number;
  createdAt: string;
  customer: {
    name: string;
    phone: string;
  };
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ─── Service ─────────────────────────────────────────────────
export const messagesService = {
  async getMessages(
    page = 1,
    limit = 30,
    type?: string,
    status?: string,
  ): Promise<PaginatedResponse<WhatsAppMessageItem>> {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (type) params.set('type', type);
    if (status) params.set('status', status);
    const { data } = await apiClient.get(`/crm/messages?${params.toString()}`);
    return data;
  },
};
