import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle,
  Bot,
  AlertTriangle,
  CheckCircle,
  Send,
  ArrowLeft,
  Phone,
  Clock,
  User,
  Zap,
  Shield,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import {
  useChatConversations,
  useChatConversation,
  useChatbotStats,
  useSendChatReply,
  useResolveConversation,
} from '@/hooks/useChatbot';
import type { ChatConversation } from '@/services/chatbot.service';

// ─── Status Badge ───────────────────────────────────────────
function StatusBadge({ status }: { status: ChatConversation['status'] }) {
  const configs = {
    ACTIVE: { icon: Zap, label: 'Activa', color: 'bg-green-500/20 text-green-400' },
    ESCALATED: { icon: AlertTriangle, label: 'Escalada', color: 'bg-amber-500/20 text-amber-400' },
    RESOLVED: { icon: CheckCircle, label: 'Resuelta', color: 'bg-gray-500/20 text-gray-400' },
  };
  const config = configs[status] || configs.ACTIVE;
  const Icon = config.icon;
  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}>
      <Icon size={12} />
      {config.label}
    </div>
  );
}

// ─── Role Badge ─────────────────────────────────────────────
function RoleBadge({ role }: { role: 'CUSTOMER' | 'BOT' | 'ADMIN' }) {
  const configs = {
    CUSTOMER: { icon: User, color: 'bg-blue-500/20 text-blue-400' },
    BOT: { icon: Bot, color: 'bg-purple-500/20 text-purple-400' },
    ADMIN: { icon: Shield, color: 'bg-[#E31B23]/20 text-[#E31B23]' },
  };
  const config = configs[role];
  const Icon = config.icon;
  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${config.color}`}>
      <Icon size={14} />
    </div>
  );
}

// ─── Conversation Detail ────────────────────────────────────
function ConversationDetail({
  conversationId,
  onBack,
}: {
  conversationId: string;
  onBack: () => void;
}) {
  const [replyText, setReplyText] = useState('');
  const { data: conversation, isLoading } = useChatConversation(conversationId);
  const sendReply = useSendChatReply();
  const resolve = useResolveConversation();

  const handleSendReply = () => {
    if (!replyText.trim()) return;
    sendReply.mutate(
      { conversationId, message: replyText.trim() },
      { onSuccess: () => setReplyText('') },
    );
  };

  const handleResolve = () => {
    resolve.mutate(conversationId, { onSuccess: onBack });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner className="w-12 h-12" />
      </div>
    );
  }

  if (!conversation) {
    return <p className="text-white/50 text-center py-8">Conversación no encontrada</p>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="text-white">
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h2 className="text-white font-heading text-lg">{conversation.customer.name}</h2>
            <div className="flex items-center gap-2 text-white/50 text-sm">
              <Phone size={12} />
              {conversation.customer.phone}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={conversation.status} />
          {conversation.status !== 'RESOLVED' && (
            <Button
              size="sm"
              variant="outline"
              className="border-green-500/50 text-green-400 hover:bg-green-500/20"
              onClick={handleResolve}
              disabled={resolve.isPending}
            >
              <CheckCircle size={14} className="mr-1" />
              Resolver
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <Card className="bg-[#1a1a1a] border-[#333]">
        <CardContent className="p-0">
          <div className="max-h-[500px] overflow-y-auto p-4 space-y-3">
            <AnimatePresence>
              {conversation.messages?.map((msg, index) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className={`flex gap-3 ${msg.role === 'CUSTOMER' ? '' : 'flex-row-reverse'}`}
                >
                  <RoleBadge role={msg.role} />
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                      msg.role === 'CUSTOMER'
                        ? 'bg-[#0a0a0a] border border-[#333] text-white'
                        : msg.role === 'ADMIN'
                        ? 'bg-[#E31B23]/20 border border-[#E31B23]/30 text-white'
                        : 'bg-purple-500/10 border border-purple-500/20 text-white'
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-white/30">
                        {new Date(msg.createdAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {msg.intent && (
                        <span className="text-[10px] text-purple-400/50">{msg.intent}</span>
                      )}
                      {msg.confidence !== null && msg.confidence !== undefined && (
                        <span className="text-[10px] text-green-400/50">{(msg.confidence * 100).toFixed(0)}%</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Reply input */}
          {conversation.status !== 'RESOLVED' && (
            <div className="border-t border-[#333] p-3 flex gap-2">
              <Input
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Escribe una respuesta como admin..."
                className="bg-[#0a0a0a] border-[#333] text-white placeholder:text-white/30"
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendReply()}
              />
              <Button
                onClick={handleSendReply}
                disabled={sendReply.isPending || !replyText.trim()}
                className="bg-[#E31B23] hover:bg-[#c5171f]"
              >
                <Send size={16} />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────
export function AdminChatbot() {
  const [statusFilter, setStatusFilter] = useState<'ACTIVE' | 'ESCALATED' | 'RESOLVED' | undefined>(undefined);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);

  const { data: conversationsData, isLoading } = useChatConversations({
    status: statusFilter,
    limit: 50,
  });
  const { data: stats } = useChatbotStats();

  if (selectedConversation) {
    return (
      <div className="space-y-6">
        <ConversationDetail
          conversationId={selectedConversation}
          onBack={() => setSelectedConversation(null)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Bot className="text-[#E31B23]" />
          Chatbot IA
        </h1>
        <p className="text-white/60 mt-1">
          Conversaciones del chatbot de WhatsApp
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border-[#333]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Total</p>
                <p className="text-2xl font-heading text-white">{stats?.totalConversations || 0}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#E31B23]/20 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-[#E31B23]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border-[#333]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Activas</p>
                <p className="text-2xl font-heading text-green-400">{stats?.activeConversations || 0}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border-[#333]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Escaladas</p>
                <p className="text-2xl font-heading text-amber-400">{stats?.escalatedConversations || 0}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border-[#333]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Mensajes</p>
                <p className="text-2xl font-heading text-purple-400">{stats?.totalMessages || 0}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                <Bot className="w-5 h-5 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {[
          { value: undefined, label: 'Todas' },
          { value: 'ACTIVE' as const, label: 'Activas' },
          { value: 'ESCALATED' as const, label: 'Escaladas' },
          { value: 'RESOLVED' as const, label: 'Resueltas' },
        ].map((tab) => (
          <Button
            key={tab.label}
            variant={statusFilter === tab.value ? 'default' : 'outline'}
            size="sm"
            className={
              statusFilter === tab.value
                ? 'bg-[#E31B23] text-white'
                : 'border-[#333] text-white/60 hover:text-white hover:bg-[#1a1a1a]'
            }
            onClick={() => setStatusFilter(tab.value)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Conversations List */}
      <Card className="bg-[#1a1a1a] border-[#333]">
        <CardHeader>
          <CardTitle className="text-white font-semibold text-lg flex items-center gap-2">
            <MessageCircle className="text-[#E31B23]" />
            Conversaciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Spinner className="w-12 h-12" />
            </div>
          ) : conversationsData?.data && conversationsData.data.length > 0 ? (
            <div className="space-y-2">
              <AnimatePresence>
                {conversationsData.data.map((conv, index) => (
                  <motion.div
                    key={conv.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`group flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all ${
                      conv.status === 'ESCALATED'
                        ? 'bg-amber-500/5 border-amber-500/30 hover:border-amber-500/60'
                        : 'bg-[#0a0a0a] border-[#333] hover:border-[#E31B23]/50'
                    }`}
                    onClick={() => setSelectedConversation(conv.id)}
                  >
                    {/* Avatar */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      conv.status === 'ESCALATED' ? 'bg-amber-500/20' : 'bg-green-500/20'
                    }`}>
                      <MessageCircle size={18} className={
                        conv.status === 'ESCALATED' ? 'text-amber-400' : 'text-green-400'
                      } />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-white font-medium truncate">{conv.customer.name}</h3>
                        <StatusBadge status={conv.status} />
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-white/50 text-sm">
                        <span className="flex items-center gap-1">
                          <Phone size={12} />
                          {conv.customer.phone}
                        </span>
                        {conv.intent && (
                          <Badge variant="outline" className="text-[10px] border-purple-500/30 text-purple-400">
                            {conv.intent}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Meta */}
                    <div className="text-right hidden sm:block">
                      <div className="text-white/50 text-xs max-w-[200px] truncate">
                        {conv.messages?.[0]?.content || 'Sin mensajes'}
                      </div>
                      <div className="text-white/30 text-xs flex items-center gap-1 justify-end mt-1">
                        <Clock size={10} />
                        {new Date(conv.updatedAt).toLocaleString('es-CO', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="text-center py-12">
              <Bot className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <p className="text-white/60">No hay conversaciones</p>
              <p className="text-white/40 text-sm mt-1">
                Las conversaciones aparecerán cuando los clientes escriban por WhatsApp
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
