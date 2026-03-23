import { useState, useRef } from 'react';
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Calendar,
  RefreshCw,
  Edit,
  Trash2,
  Upload,
  Image,
  Eye,
  DollarSign,
  Users,
  Clock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  useAdminEvents,
  useCreateEvent,
  useUpdateEvent,
  useUploadFlyer,
  useDeleteEvent,
  useUpdateEventTables,
} from '@/hooks/useEvents';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';
import type { Event, CreateEventDTO, UpdateEventDTO, UpdateTablesDTO } from '@/types/events.types';

// ─── Constants ───────────────────────────────────────────
const STATUS_LABELS: Record<Event['status'], string> = {
  ACTIVE: 'Activo',
  SOLD_OUT: 'Agotado',
  CANCELLED: 'Cancelado',
  PAST: 'Pasado',
};

const STATUS_COLORS: Record<Event['status'], string> = {
  ACTIVE: 'bg-green-500/20 text-green-500',
  SOLD_OUT: 'bg-orange-500/20 text-orange-500',
  CANCELLED: 'bg-red-500/20 text-red-500',
  PAST: 'bg-gray-500/20 text-gray-400',
};

const ZONES = ['SALON', 'TERRAZA', 'VIP', 'BARRA', 'PISTA'] as const;

const ZONE_LABELS: Record<string, string> = {
  SALON: 'Salón',
  TERRAZA: 'Terraza',
  VIP: 'VIP',
  BARRA: 'Barra',
  PISTA: 'Pista',
};

// ─── Component ───────────────────────────────────────────
export function AdminEvents() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<Event['status'] | 'todos'>('todos');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isFlyerOpen, setIsFlyerOpen] = useState(false);
  const [isTablesOpen, setIsTablesOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [form, setForm] = useState<CreateEventDTO>({
    name: '',
    eventDate: '',
    eventTime: '',
    description: '',
    coverPrice: 0,
  });

  const [editForm, setEditForm] = useState<UpdateEventDTO>({});
  const [tablesForm, setTablesForm] = useState<UpdateTablesDTO[]>([]);

  // Queries & Mutations
  const { data: events, isLoading, refetch } = useAdminEvents(
    statusFilter !== 'todos' ? statusFilter : undefined
  );
  const createMutation = useCreateEvent();
  const updateMutation = useUpdateEvent();
  const uploadFlyerMutation = useUploadFlyer();
  const deleteMutation = useDeleteEvent();
  const updateTablesMutation = useUpdateEventTables();

  // ─── Handlers ─────────────────────────────────────────

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMutation.mutateAsync(form);
      toast.success('Evento creado exitosamente');
      setIsCreateOpen(false);
      setForm({ name: '', eventDate: '', eventTime: '', description: '', coverPrice: 0 });
    } catch {
      toast.error('Error al crear el evento');
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;
    try {
      await updateMutation.mutateAsync({ id: selectedEvent.id, data: editForm });
      toast.success('Evento actualizado');
      setIsEditOpen(false);
      setSelectedEvent(null);
    } catch {
      toast.error('Error al actualizar el evento');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de eliminar este evento?')) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Evento eliminado');
    } catch {
      toast.error('Error al eliminar el evento');
    }
  };

  const handleFlyerUpload = async (file: File) => {
    if (!selectedEvent) return;
    try {
      await uploadFlyerMutation.mutateAsync({ id: selectedEvent.id, file });
      toast.success('Flyer subido exitosamente');
      setIsFlyerOpen(false);
    } catch {
      toast.error('Error al subir el flyer');
    }
  };

  const handleTablesUpdate = async () => {
    if (!selectedEvent) return;
    try {
      await updateTablesMutation.mutateAsync({ id: selectedEvent.id, tables: tablesForm });
      toast.success('Mesas actualizadas');
      setIsTablesOpen(false);
    } catch {
      toast.error('Error al actualizar mesas');
    }
  };

  const openEdit = (event: Event) => {
    setSelectedEvent(event);
    setEditForm({
      name: event.name,
      eventDate: event.eventDate.split('T')[0],
      eventTime: event.eventTime,
      description: event.description || '',
      coverPrice: event.coverPrice || 0,
      status: event.status,
    });
    setIsEditOpen(true);
  };

  const openTables = (event: Event) => {
    setSelectedEvent(event);
    setTablesForm(
      ZONES.map((zone) => {
        const existing = event.tables?.find((t) => t.zone === zone);
        return { zone, total: existing?.total || 0, reserved: existing?.reserved || 0 };
      })
    );
    setIsTablesOpen(true);
  };

  const openFlyerUpload = (event: Event) => {
    setSelectedEvent(event);
    setIsFlyerOpen(true);
  };

  // Filter by search
  const filteredEvents = (events || []).filter((e: Event) =>
    e.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading text-white uppercase tracking-wider">
            Eventos
          </h1>
          <p className="text-white/60 mt-1">
            Gestiona eventos, flyers y disponibilidad de mesas
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isLoading}
            className="border-[#333] bg-[#1a1a1a] text-white hover:bg-[#333]"
          >
            <RefreshCw className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} size={18} />
            Recargar
          </Button>
          <Button className="btn-primary" onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2" size={18} />
            Nuevo Evento
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-[#1a1a1a] border-[#333]">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
              <Input
                placeholder="Buscar por nombre..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-[#0a0a0a] border-[#333] text-white placeholder:text-white/40"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as Event['status'] | 'todos')}>
              <SelectTrigger className="w-full sm:w-[200px] bg-[#0a0a0a] border-[#333] text-white">
                <Filter className="mr-2" size={16} />
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-[#333]">
                <SelectItem value="todos" className="text-white">Todos</SelectItem>
                <SelectItem value="ACTIVE" className="text-white">Activos</SelectItem>
                <SelectItem value="SOLD_OUT" className="text-white">Agotados</SelectItem>
                <SelectItem value="CANCELLED" className="text-white">Cancelados</SelectItem>
                <SelectItem value="PAST" className="text-white">Pasados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Events Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner className="w-12 h-12" />
        </div>
      ) : filteredEvents.length > 0 ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredEvents.map((event: Event) => (
            <Card key={event.id} className="bg-[#1a1a1a] border-[#333] overflow-hidden group hover:border-[#E31B23]/50 transition-all">
              {/* Flyer Image */}
              <div className="aspect-video relative bg-[#0a0a0a]">
                {event.flyerUrl ? (
                  <img
                    src={event.flyerUrl}
                    alt={event.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Image size={48} className="text-white/20" />
                  </div>
                )}
                {/* Status Badge */}
                <div className="absolute top-3 left-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-heading uppercase ${STATUS_COLORS[event.status]}`}>
                    {STATUS_LABELS[event.status]}
                  </span>
                </div>
                {/* Actions Menu */}
                <div className="absolute top-3 right-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="bg-black/50 text-white hover:bg-black/80 w-8 h-8">
                        <MoreHorizontal size={16} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-[#1a1a1a] border-[#333]">
                      <DropdownMenuItem onClick={() => openEdit(event)} className="text-white focus:text-white focus:bg-[#0a0a0a]">
                        <Edit className="mr-2" size={16} /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openFlyerUpload(event)} className="text-white focus:text-white focus:bg-[#0a0a0a]">
                        <Upload className="mr-2" size={16} /> Subir Flyer
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openTables(event)} className="text-white focus:text-white focus:bg-[#0a0a0a]">
                        <Users className="mr-2" size={16} /> Gestionar Mesas
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(event.id)} className="text-red-500 focus:text-red-500 focus:bg-[#0a0a0a]">
                        <Trash2 className="mr-2" size={16} /> Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Event Info */}
              <CardContent className="p-5">
                <h3 className="text-lg font-heading text-white uppercase mb-2 group-hover:text-[var(--accent-gold)] transition-colors">
                  {event.name}
                </h3>
                <div className="space-y-2 text-sm text-white/60">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-[var(--accent-gold)]" />
                    {new Date(event.eventDate).toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-[var(--accent-gold)]" />
                    {event.eventTime}
                  </div>
                  {event.coverPrice != null && event.coverPrice > 0 && (
                    <div className="flex items-center gap-2">
                      <DollarSign size={14} className="text-green-400" />
                      ${event.coverPrice.toLocaleString('es-CO')} COP
                    </div>
                  )}
                </div>
                {/* Tables summary */}
                {event.tables && event.tables.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-[#333]">
                    <p className="text-xs text-white/40 uppercase font-heading mb-2">Mesas</p>
                    <div className="flex flex-wrap gap-1.5">
                      {event.tables.map((t) => (
                        <span key={t.zone} className="text-xs px-2 py-1 rounded bg-[#0a0a0a] text-white/70">
                          {ZONE_LABELS[t.zone]}: {t.total - t.reserved}/{t.total}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-[#1a1a1a] border-[#333]">
          <CardContent className="text-center py-16 space-y-4">
            <Calendar size={48} className="mx-auto text-white/20" />
            <p className="text-white/60 text-lg">No hay eventos</p>
            <p className="text-white/40 text-sm">Crea tu primer evento para empezar</p>
            <Button className="btn-primary mt-4" onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2" size={18} /> Crear Evento
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ─── CREATE MODAL ─────────────────────────────── */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="bg-[#1a1a1a] border-[#333] text-white max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-heading uppercase text-white">Nuevo Evento</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 mt-4">
            <div>
              <label className="block text-white/80 mb-2 text-sm">Nombre del evento</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Noche Salsera" required className="bg-[#0a0a0a] border-[#333] text-white placeholder:text-white/40" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-white/80 mb-2 text-sm">Fecha</label>
                <Input type="date" value={form.eventDate} onChange={(e) => setForm({ ...form, eventDate: e.target.value })} required className="bg-[#0a0a0a] border-[#333] text-white" />
              </div>
              <div>
                <label className="block text-white/80 mb-2 text-sm">Hora</label>
                <Input type="time" value={form.eventTime} onChange={(e) => setForm({ ...form, eventTime: e.target.value })} required className="bg-[#0a0a0a] border-[#333] text-white" />
              </div>
            </div>
            <div>
              <label className="block text-white/80 mb-2 text-sm">Descripción</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe el evento..." rows={3} className="w-full px-3 py-2 rounded-md bg-[#0a0a0a] border border-[#333] text-white placeholder:text-white/40 resize-none" />
            </div>
            <div>
              <label className="block text-white/80 mb-2 text-sm">Precio cover (COP)</label>
              <Input type="number" min={0} value={form.coverPrice} onChange={(e) => setForm({ ...form, coverPrice: parseInt(e.target.value) || 0 })} className="bg-[#0a0a0a] border-[#333] text-white" />
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} className="flex-1 border-[#333] bg-transparent text-white hover:bg-[#333]">Cancelar</Button>
              <Button type="submit" disabled={createMutation.isPending} className="flex-1 btn-primary">
                {createMutation.isPending ? <Spinner className="w-4 h-4" /> : 'Crear Evento'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── EDIT MODAL ───────────────────────────────── */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="bg-[#1a1a1a] border-[#333] text-white max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-heading uppercase text-white">Editar Evento</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4 mt-4">
            <div>
              <label className="block text-white/80 mb-2 text-sm">Nombre</label>
              <Input value={editForm.name || ''} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="bg-[#0a0a0a] border-[#333] text-white" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-white/80 mb-2 text-sm">Fecha</label>
                <Input type="date" value={editForm.eventDate || ''} onChange={(e) => setEditForm({ ...editForm, eventDate: e.target.value })} className="bg-[#0a0a0a] border-[#333] text-white" />
              </div>
              <div>
                <label className="block text-white/80 mb-2 text-sm">Hora</label>
                <Input type="time" value={editForm.eventTime || ''} onChange={(e) => setEditForm({ ...editForm, eventTime: e.target.value })} className="bg-[#0a0a0a] border-[#333] text-white" />
              </div>
            </div>
            <div>
              <label className="block text-white/80 mb-2 text-sm">Descripción</label>
              <textarea value={editForm.description || ''} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} rows={3} className="w-full px-3 py-2 rounded-md bg-[#0a0a0a] border border-[#333] text-white resize-none" />
            </div>
            <div>
              <label className="block text-white/80 mb-2 text-sm">Precio cover (COP)</label>
              <Input type="number" min={0} value={editForm.coverPrice || 0} onChange={(e) => setEditForm({ ...editForm, coverPrice: parseInt(e.target.value) || 0 })} className="bg-[#0a0a0a] border-[#333] text-white" />
            </div>
            <div>
              <label className="block text-white/80 mb-2 text-sm">Estado</label>
              <Select value={editForm.status || 'ACTIVE'} onValueChange={(v) => setEditForm({ ...editForm, status: v as Event['status'] })}>
                <SelectTrigger className="bg-[#0a0a0a] border-[#333] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-[#333]">
                  {Object.entries(STATUS_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key} className="text-white">{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)} className="flex-1 border-[#333] bg-transparent text-white hover:bg-[#333]">Cancelar</Button>
              <Button type="submit" disabled={updateMutation.isPending} className="flex-1 btn-primary">
                {updateMutation.isPending ? <Spinner className="w-4 h-4" /> : 'Guardar Cambios'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── FLYER UPLOAD MODAL ───────────────────────── */}
      <Dialog open={isFlyerOpen} onOpenChange={setIsFlyerOpen}>
        <DialogContent className="bg-[#1a1a1a] border-[#333] text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-heading uppercase text-white">Subir Flyer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {selectedEvent?.flyerUrl && (
              <div className="rounded-lg overflow-hidden">
                <img src={selectedEvent.flyerUrl} alt="Flyer actual" className="w-full" />
                <p className="text-xs text-white/40 mt-2 text-center">Flyer actual</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFlyerUpload(file);
              }}
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadFlyerMutation.isPending}
              className="w-full btn-primary py-6"
            >
              {uploadFlyerMutation.isPending ? (
                <span className="flex items-center gap-2"><Spinner className="w-4 h-4" /> Subiendo...</span>
              ) : (
                <span className="flex items-center gap-2"><Upload size={20} /> Seleccionar imagen (JPG, PNG, WebP — máx 5MB)</span>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── TABLES MODAL ─────────────────────────────── */}
      <Dialog open={isTablesOpen} onOpenChange={setIsTablesOpen}>
        <DialogContent className="bg-[#1a1a1a] border-[#333] text-white max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-heading uppercase text-white">
              Mesas — {selectedEvent?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {tablesForm.map((table, index) => (
              <div key={table.zone} className="bg-[#0a0a0a] rounded-lg p-4">
                <p className="text-white font-heading uppercase text-sm mb-3">{ZONE_LABELS[table.zone]}</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/60 text-xs mb-1">Total</label>
                    <Input
                      type="number"
                      min={0}
                      value={table.total}
                      onChange={(e) => {
                        const updated = [...tablesForm];
                        updated[index] = { ...table, total: parseInt(e.target.value) || 0 };
                        setTablesForm(updated);
                      }}
                      className="bg-[#111] border-[#333] text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-white/60 text-xs mb-1">Reservadas</label>
                    <Input
                      type="number"
                      min={0}
                      max={table.total}
                      value={table.reserved}
                      onChange={(e) => {
                        const updated = [...tablesForm];
                        updated[index] = { ...table, reserved: parseInt(e.target.value) || 0 };
                        setTablesForm(updated);
                      }}
                      className="bg-[#111] border-[#333] text-white"
                    />
                  </div>
                </div>
                {/* Visual bar */}
                <div className="mt-2 h-2 bg-[#333] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: table.total > 0 ? `${(table.reserved / table.total) * 100}%` : '0%',
                      background: table.reserved >= table.total ? '#ef4444' : table.reserved > table.total * 0.7 ? '#f59e0b' : '#22c55e',
                    }}
                  />
                </div>
                <p className="text-xs text-white/40 mt-1">
                  {table.total - table.reserved} disponibles de {table.total}
                </p>
              </div>
            ))}

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsTablesOpen(false)} className="flex-1 border-[#333] bg-transparent text-white hover:bg-[#333]">Cancelar</Button>
              <Button onClick={handleTablesUpdate} disabled={updateTablesMutation.isPending} className="flex-1 btn-primary">
                {updateTablesMutation.isPending ? <Spinner className="w-4 h-4" /> : 'Guardar Mesas'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
