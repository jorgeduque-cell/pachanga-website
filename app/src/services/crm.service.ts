import { apiClient } from '@/lib/api';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  birthDate: string;
  source: 'QR_SCAN' | 'RESERVATION' | 'MANUAL';
  totalVisits: number;
  lastVisitAt: string | null;
  rating: number | null;
  optIn: boolean;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
}

export interface CustomerInteraction {
  id: string;
  type: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface CustomerFilters {
  search?: string;
  source?: 'QR_SCAN' | 'RESERVATION' | 'MANUAL';
  optIn?: boolean;
  page?: number;
  limit?: number;
}

export interface PaginatedCustomers {
  data: Customer[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CustomerStats {
  totalCustomers: number;
  newThisMonth: number;
  activeCustomers: number;
  avgRating: number;
  topSources: { source: string; count: number }[];
}

export interface SendMessageInput {
  customerId: string;
  templateName: string;
}

export interface MessageFilters {
  type?: 'WELCOME' | 'BIRTHDAY' | 'PROMO' | 'REACTIVATION' | 'SURVEY' | 'MANUAL';
  status?: 'PENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
  page?: number;
  limit?: number;
}

export interface WhatsAppMessage {
  id: string;
  type: string;
  status: string;
  content: string;
  createdAt: string;
  customer: {
    name: string;
    phone: string;
  };
}

export const crmService = {
  // Obtener lista de clientes
  async getCustomers(filters?: CustomerFilters): Promise<PaginatedCustomers> {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.source) params.append('source', filters.source);
    if (filters?.optIn !== undefined) params.append('optIn', String(filters.optIn));
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.limit) params.append('limit', String(filters.limit));

    const response = await apiClient.get<PaginatedCustomers>(`/crm/customers?${params}`);
    return response.data;
  },

  // Obtener un cliente por ID
  async getCustomer(id: string): Promise<Customer & { interactions: CustomerInteraction[] }> {
    const response = await apiClient.get<{ data: Customer & { interactions: CustomerInteraction[] } }>(`/crm/customers/${id}`);
    return response.data.data;
  },

  // Actualizar cliente
  async updateCustomer(id: string, data: Partial<Customer>): Promise<Customer> {
    const response = await apiClient.patch<{ data: Customer }>(`/crm/customers/${id}`, data);
    return response.data.data;
  },

  // Obtener estadísticas
  async getStats(): Promise<CustomerStats> {
    const response = await apiClient.get<{ data: CustomerStats }>('/crm/stats');
    return response.data.data;
  },

  // Obtener cumpleañeros de hoy
  async getTodayBirthdays(): Promise<Customer[]> {
    const response = await apiClient.get<{ data: Customer[] }>('/crm/birthdays/today');
    return response.data.data;
  },

  // Enviar mensaje de WhatsApp
  async sendMessage(data: SendMessageInput): Promise<void> {
    await apiClient.post('/crm/send-message', data);
  },

  // Obtener log de mensajes
  async getMessages(filters?: MessageFilters): Promise<{ data: WhatsAppMessage[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.limit) params.append('limit', String(filters.limit));

    const response = await apiClient.get(`/crm/messages?${params}`);
    return response.data;
  },
};
