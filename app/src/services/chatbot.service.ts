import { apiClient } from '@/lib/api';

// ─── Types ───────────────────────────────────────────────────
export interface ChatConversation {
  id: string;
  status: 'ACTIVE' | 'ESCALATED' | 'RESOLVED';
  intent: string | null;
  createdAt: string;
  updatedAt: string;
  customer: {
    id: string;
    name: string;
    phone: string;
  };
  messages: Array<{
    content: string;
    role: string;
    createdAt: string;
  }>;
}

export interface ChatMessage {
  id: string;
  role: 'CUSTOMER' | 'BOT' | 'ADMIN';
  content: string;
  intent: string | null;
  confidence: number | null;
  createdAt: string;
}

export interface ChatConversationDetail extends ChatConversation {
  messages: ChatMessage[];
}

export interface ChatbotStats {
  totalConversations: number;
  activeConversations: number;
  escalatedConversations: number;
  totalMessages: number;
}

export interface ConversationFilters {
  status?: 'ACTIVE' | 'ESCALATED' | 'RESOLVED';
  page?: number;
  limit?: number;
}

// ─── Service ─────────────────────────────────────────────────
export const chatbotService = {
  async getConversations(filters?: ConversationFilters): Promise<{
    data: ChatConversation[];
    pagination: { page: number; limit: number; total: number };
  }> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.limit) params.append('limit', String(filters.limit));

    const response = await apiClient.get(`/chatbot/conversations?${params}`);
    return response.data;
  },

  async getConversation(id: string): Promise<ChatConversationDetail> {
    const response = await apiClient.get<ChatConversationDetail>(`/chatbot/conversations/${id}`);
    return response.data;
  },

  async sendReply(conversationId: string, message: string): Promise<void> {
    await apiClient.post(`/chatbot/conversations/${conversationId}/reply`, { message });
  },

  async resolveConversation(conversationId: string): Promise<void> {
    await apiClient.patch(`/chatbot/conversations/${conversationId}/resolve`);
  },

  async getStats(): Promise<ChatbotStats> {
    const response = await apiClient.get<ChatbotStats>('/chatbot/stats');
    return response.data;
  },
};
