import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatbotService, type ConversationFilters } from '@/services/chatbot.service';

const CHATBOT_KEYS = {
  all: ['chatbot'] as const,
  conversations: (filters?: ConversationFilters) => [...CHATBOT_KEYS.all, 'conversations', filters] as const,
  conversation: (id: string) => [...CHATBOT_KEYS.all, 'conversation', id] as const,
  stats: () => [...CHATBOT_KEYS.all, 'stats'] as const,
};

export function useChatConversations(filters?: ConversationFilters) {
  return useQuery({
    queryKey: CHATBOT_KEYS.conversations(filters),
    queryFn: () => chatbotService.getConversations(filters),
    refetchInterval: 15000, // Auto-refresh every 15s
  });
}

export function useChatConversation(id: string) {
  return useQuery({
    queryKey: CHATBOT_KEYS.conversation(id),
    queryFn: () => chatbotService.getConversation(id),
    enabled: !!id,
    refetchInterval: 5000, // Refresh every 5s when viewing a conversation
  });
}

export function useChatbotStats() {
  return useQuery({
    queryKey: CHATBOT_KEYS.stats(),
    queryFn: () => chatbotService.getStats(),
  });
}

export function useSendChatReply() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ conversationId, message }: { conversationId: string; message: string }) =>
      chatbotService.sendReply(conversationId, message),
    onSuccess: (_, { conversationId }) => {
      queryClient.invalidateQueries({ queryKey: CHATBOT_KEYS.conversation(conversationId) });
      queryClient.invalidateQueries({ queryKey: CHATBOT_KEYS.conversations() });
    },
  });
}

export function useResolveConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (conversationId: string) => chatbotService.resolveConversation(conversationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHATBOT_KEYS.all });
    },
  });
}
