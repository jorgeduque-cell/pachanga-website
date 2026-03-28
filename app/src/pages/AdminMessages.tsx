import { useState, useEffect, useCallback } from 'react';
import {
  MessageSquare, Send, CheckCheck, Eye, AlertTriangle, Clock,
  RefreshCw, Filter, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';
import { messagesService, type WhatsAppMessageItem } from '@/services/messages.service';

// ─── Status Badge ────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
    QUEUED:    { label: 'En cola',    icon: <Clock size={12} />,          className: 'bg-white/10 text-white/60' },
    SENT:      { label: 'Enviado',    icon: <Send size={12} />,           className: 'bg-blue-500/20 text-blue-400' },
    DELIVERED: { label: 'Entregado',  icon: <CheckCheck size={12} />,     className: 'bg-green-500/20 text-green-400' },
    READ:      { label: 'Leído',      icon: <Eye size={12} />,            className: 'bg-emerald-500/20 text-emerald-400' },
    FAILED:    { label: 'Fallido',    icon: <AlertTriangle size={12} />,  className: 'bg-red-500/20 text-red-400' },
  };

  const c = config[status] ?? { label: status, icon: <MessageSquare size={12} />, className: 'bg-white/10 text-white/60' };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${c.className}`}>
      {c.icon}
      {c.label}
    </span>
  );
}

// ─── Type Badge ──────────────────────────────────────────────
function TypeBadge({ type }: { type: string }) {
  const config: Record<string, { label: string; className: string }> = {
    WELCOME:  { label: '👋 Bienvenida',   className: 'bg-purple-500/20 text-purple-400' },
    SURVEY:   { label: '📊 Encuesta',     className: 'bg-amber-500/20 text-amber-400' },
    BIRTHDAY: { label: '🎂 Cumpleaños',   className: 'bg-pink-500/20 text-pink-400' },
    PROMO:    { label: '🎉 Promoción',    className: 'bg-cyan-500/20 text-cyan-400' },
    CUSTOM:   { label: '💬 Personalizado', className: 'bg-white/10 text-white/60' },
  };

  const c = config[type] ?? { label: type, className: 'bg-white/10 text-white/60' };

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${c.className}`}>
      {c.label}
    </span>
  );
}

// ─── Stat Counter ────────────────────────────────────────────
function StatCounter({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`text-center px-4 py-3 rounded-lg ${color}`}>
      <p className="text-2xl font-heading text-white">{value}</p>
      <p className="text-white/50 text-xs uppercase">{label}</p>
    </div>
  );
}

// ─── Filter Select ───────────────────────────────────────────
function FilterSelect({ value, onChange, options, placeholder }: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-[#1a1a1a] border border-[#333] text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#E31B23]/50"
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

// ─── Main Component ──────────────────────────────────────────
export function AdminMessages() {
  const [messages, setMessages] = useState<WhatsAppMessageItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await messagesService.getMessages(page, 30, filterType || undefined, filterStatus || undefined);
      setMessages(res.data);
      setTotalPages(res.pagination.totalPages);
      setTotal(res.pagination.total);
    } catch {
      toast.error('Error al cargar mensajes');
    } finally {
      setIsLoading(false);
    }
  }, [page, filterType, filterStatus]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [filterType, filterStatus]);

  // Counts
  const sentCount = messages.filter((m) => m.status === 'SENT').length;
  const deliveredCount = messages.filter((m) => m.status === 'DELIVERED').length;
  const readCount = messages.filter((m) => m.status === 'READ').length;
  const failedCount = messages.filter((m) => m.status === 'FAILED').length;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('es-CO', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading text-white uppercase tracking-wider">
            Mensajes Enviados
          </h1>
          <p className="text-white/60 mt-1">
            Historial de mensajes WhatsApp · {total} total
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => fetchData()}
          disabled={isLoading}
          className="border-[#333] bg-[#1a1a1a] text-white hover:bg-[#333]"
        >
          <RefreshCw className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} size={18} />
          Recargar
        </Button>
      </div>

      {/* Status Counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCounter label="Enviados" value={sentCount} color="bg-blue-500/10" />
        <StatCounter label="Entregados" value={deliveredCount} color="bg-green-500/10" />
        <StatCounter label="Leídos" value={readCount} color="bg-emerald-500/10" />
        <StatCounter label="Fallidos" value={failedCount} color="bg-red-500/10" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Filter size={16} className="text-white/40" />
        <FilterSelect
          value={filterType}
          onChange={setFilterType}
          placeholder="Todos los tipos"
          options={[
            { value: 'WELCOME', label: '👋 Bienvenida' },
            { value: 'SURVEY', label: '📊 Encuesta' },
            { value: 'BIRTHDAY', label: '🎂 Cumpleaños' },
            { value: 'PROMO', label: '🎉 Promoción' },
            { value: 'CUSTOM', label: '💬 Personalizado' },
          ]}
        />
        <FilterSelect
          value={filterStatus}
          onChange={setFilterStatus}
          placeholder="Todos los estados"
          options={[
            { value: 'QUEUED', label: 'En cola' },
            { value: 'SENT', label: 'Enviado' },
            { value: 'DELIVERED', label: 'Entregado' },
            { value: 'READ', label: 'Leído' },
            { value: 'FAILED', label: 'Fallido' },
          ]}
        />
        {(filterType || filterStatus) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setFilterType(''); setFilterStatus(''); }}
            className="text-white/40 hover:text-white"
          >
            Limpiar filtros
          </Button>
        )}
      </div>

      {/* Messages Table */}
      <Card className="bg-[#1a1a1a] border-[#333]">
        <CardHeader>
          <CardTitle className="text-white font-heading uppercase">
            Historial de Mensajes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-20">
              <Spinner className="w-12 h-12" />
            </div>
          ) : messages.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#333]">
                      <th className="text-left py-3 px-4 text-white/60 font-heading uppercase text-sm">Cliente</th>
                      <th className="text-left py-3 px-4 text-white/60 font-heading uppercase text-sm">Tipo</th>
                      <th className="text-left py-3 px-4 text-white/60 font-heading uppercase text-sm">Plantilla</th>
                      <th className="text-center py-3 px-4 text-white/60 font-heading uppercase text-sm">Estado</th>
                      <th className="text-left py-3 px-4 text-white/60 font-heading uppercase text-sm">Enviado</th>
                      <th className="text-left py-3 px-4 text-white/60 font-heading uppercase text-sm">Entregado</th>
                      <th className="text-left py-3 px-4 text-white/60 font-heading uppercase text-sm">Leído</th>
                    </tr>
                  </thead>
                  <tbody>
                    {messages.map((msg) => (
                      <tr key={msg.id} className="border-b border-[#333] hover:bg-[#0a0a0a]/50 transition-colors">
                        <td className="py-4 px-4">
                          <div>
                            <p className="text-white font-heading">{msg.customer?.name ?? '—'}</p>
                            <p className="text-white/60 text-sm">{msg.customer?.phone ?? '—'}</p>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <TypeBadge type={msg.type} />
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-white/70 text-sm font-mono">{msg.templateName}</span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <StatusBadge status={msg.status} />
                        </td>
                        <td className="py-4 px-4 text-white/60 text-sm">{formatDate(msg.sentAt)}</td>
                        <td className="py-4 px-4 text-white/60 text-sm">{formatDate(msg.deliveredAt)}</td>
                        <td className="py-4 px-4 text-white/60 text-sm">{formatDate(msg.readAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="border-[#333] bg-[#0a0a0a] text-white hover:bg-[#333]"
                  >
                    <ChevronLeft size={16} className="mr-1" />
                    Anterior
                  </Button>
                  <span className="text-white/60 text-sm px-3">
                    {page} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="border-[#333] bg-[#0a0a0a] text-white hover:bg-[#333]"
                  >
                    Siguiente
                    <ChevronRight size={16} className="ml-1" />
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 space-y-4">
              <MessageSquare size={48} className="text-white/20 mx-auto" />
              <p className="text-white/60 text-lg">No hay mensajes</p>
              <p className="text-white/40 text-sm">
                {filterType || filterStatus
                  ? 'No se encontraron mensajes con estos filtros.'
                  : 'Los mensajes aparecerán aquí cuando se envíen.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
