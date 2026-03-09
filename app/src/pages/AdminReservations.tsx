import { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Clock,
  MoreHorizontal,
  Calendar,
  RefreshCw,
  ChevronDown,
  Eye,
  User,
  Phone,
  Users,
  MessageSquare,
  MapPin
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
import { useReservations, useUpdateReservation, useCancelReservation, useCreateReservation } from '@/hooks/useReservations';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';
import type { ReservationStatus, CreateReservationDTO } from '@/types';

const STATUS_LABELS: Record<ReservationStatus, string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmada',
  CANCELLED: 'Cancelada',
  COMPLETED: 'Completada',
};

// Horas disponibles para reservas: 7, 8, 9, 10 PM
const AVAILABLE_HOURS = [
  { value: '19:00', label: '7:00 PM' },
  { value: '20:00', label: '8:00 PM' },
  { value: '21:00', label: '9:00 PM' },
  { value: '22:00', label: '10:00 PM' },
];

export function AdminReservations() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | 'todos'>('todos');
  const [isNewReservationOpen, setIsNewReservationOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);
  
  // Form state for new reservation
  const [newReservation, setNewReservation] = useState<CreateReservationDTO>({
    customerName: '',
    customerPhone: '',
    reservationDate: '',
    reservationTime: '',
    partySize: 2,
  });
  
  const { data: reservationsData, isLoading, refetch } = useReservations({
    search: search || undefined,
    status: statusFilter !== 'todos' ? statusFilter : undefined,
  });

  const createReservation = useCreateReservation();

  // Recargar automáticamente cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 30000);
    return () => clearInterval(interval);
  }, [refetch]);

  const updateMutation = useUpdateReservation();
  const cancelMutation = useCancelReservation();

  const handleConfirm = async (id: string) => {
    await updateMutation.mutateAsync({ id, data: { status: 'CONFIRMED' } });
  };

  const handleCancel = async (id: string) => {
    await cancelMutation.mutateAsync(id);
  };

  const handleCreateReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    
    try {
      await createReservation.mutateAsync(newReservation);
      toast.success('Reserva creada exitosamente');
      setIsNewReservationOpen(false);
      setNewReservation({
        customerName: '',
        customerPhone: '',
        reservationDate: '',
        reservationTime: '',
        partySize: 2,
      });
      refetch();
    } catch (error) {
      toast.error('Error al crear la reserva');
    } finally {
      setIsCreating(false);
    }
  };

  const handleManualRefresh = async () => {
    try {
      await refetch();
      toast.success('Reservas actualizadas');
    } catch (error) {
      toast.error('Error al recargar las reservas');
    }
  };

  const getStatusColor = (status: ReservationStatus) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-500/20 text-green-500';
      case 'PENDING':
        return 'bg-orange-500/20 text-orange-500';
      case 'CANCELLED':
        return 'bg-red-500/20 text-red-500';
      case 'COMPLETED':
        return 'bg-blue-500/20 text-blue-500';
      default:
        return 'bg-gray-500/20 text-gray-500';
    }
  };

  const reservations = reservationsData?.data || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading text-white uppercase tracking-wider">
            Reservas
          </h1>
          <p className="text-white/60 mt-1">
            Gestiona todas las reservas del bar
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleManualRefresh}
            disabled={isLoading}
            className="border-[#333] bg-[#1a1a1a] text-white hover:bg-[#333]"
          >
            <RefreshCw className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} size={18} />
            Recargar
          </Button>
          <Button 
            className="btn-primary"
            onClick={() => setIsNewReservationOpen(true)}
          >
            <Calendar className="mr-2" size={18} />
            Nueva Reserva
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
                placeholder="Buscar por nombre o celular..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-[#0a0a0a] border-[#333] text-white placeholder:text-white/40"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ReservationStatus | 'todos')}>
              <SelectTrigger className="w-full sm:w-[200px] bg-[#0a0a0a] border-[#333] text-white">
                <Filter className="mr-2" size={16} />
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-[#333]">
                <SelectItem value="todos" className="text-white">Todos</SelectItem>
                <SelectItem value="PENDING" className="text-white">Pendientes</SelectItem>
                <SelectItem value="CONFIRMED" className="text-white">Confirmadas</SelectItem>
                <SelectItem value="CANCELLED" className="text-white">Canceladas</SelectItem>
                <SelectItem value="COMPLETED" className="text-white">Completadas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reservations Table */}
      <Card className="bg-[#1a1a1a] border-[#333]">
        <CardHeader>
          <CardTitle className="text-white font-heading uppercase">
            Lista de Reservas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Spinner className="w-12 h-12" />
            </div>
          ) : reservations.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#333]">
                    <th className="text-left py-3 px-4 text-white/60 font-heading uppercase text-sm">Cliente</th>
                    <th className="text-left py-3 px-4 text-white/60 font-heading uppercase text-sm">Fecha</th>
                    <th className="text-left py-3 px-4 text-white/60 font-heading uppercase text-sm">Personas</th>
                    <th className="text-left py-3 px-4 text-white/60 font-heading uppercase text-sm">Estado</th>
                    <th className="text-right py-3 px-4 text-white/60 font-heading uppercase text-sm">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {reservations.map((reservation) => (
                    <tr key={reservation.id} className="border-b border-[#333] hover:bg-[#0a0a0a]/50">
                      <td className="py-4 px-4">
                        <div>
                          <p className="text-white font-heading">{reservation.customerName}</p>
                          <p className="text-white/60 text-sm">{reservation.customerPhone}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-white/80">
                        {new Date(reservation.reservationDate).toLocaleDateString('es-CO')} {reservation.reservationTime}
                      </td>
                      <td className="py-4 px-4 text-white/80">
                        {reservation.partySize}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-heading uppercase ${getStatusColor(reservation.status)}`}>
                          {STATUS_LABELS[reservation.status]}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-white/60 hover:text-white">
                              <MoreHorizontal size={18} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="bg-[#1a1a1a] border-[#333]">
                            {reservation.status === 'PENDING' && (
                              <DropdownMenuItem 
                                onClick={() => handleConfirm(reservation.id)}
                                className="text-green-500 focus:text-green-500 focus:bg-[#0a0a0a]"
                              >
                                <CheckCircle className="mr-2" size={16} />
                                Confirmar
                              </DropdownMenuItem>
                            )}
                            {reservation.status !== 'CANCELLED' && (
                              <DropdownMenuItem 
                                onClick={() => handleCancel(reservation.id)}
                                className="text-red-500 focus:text-red-500 focus:bg-[#0a0a0a]"
                              >
                                <XCircle className="mr-2" size={16} />
                                Cancelar
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem 
                              onClick={() => setSelectedReservation(reservation)}
                              className="text-white/60 focus:text-white focus:bg-[#0a0a0a]"
                            >
                              <Eye className="mr-2" size={16} />
                              Ver detalles
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 space-y-4">
              <p className="text-white/60 text-lg">No se encontraron reservas</p>
              <p className="text-white/40 text-sm max-w-md mx-auto">
                Si acabas de crear una reserva y no aparece, espera unos segundos y recarga la página. 
                El servidor puede estar despertando del modo sleep.
              </p>
              <Button 
                variant="outline" 
                onClick={handleManualRefresh}
                disabled={isLoading}
                className="border-[#333] bg-[#1a1a1a] text-white hover:bg-[#333] mt-4"
              >
                <RefreshCw className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} size={18} />
                {isLoading ? 'Cargando...' : 'Recargar reservas'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Reservation Modal */}
      <Dialog open={isNewReservationOpen} onOpenChange={setIsNewReservationOpen}>
        <DialogContent className="bg-[#1a1a1a] border-[#333] text-white max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-heading uppercase text-white">
              Nueva Reserva
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleCreateReservation} className="space-y-4 mt-4">
            <div>
              <label className="block text-white/80 mb-2 text-sm">Nombre del cliente</label>
              <Input
                value={newReservation.customerName}
                onChange={(e) => setNewReservation({...newReservation, customerName: e.target.value})}
                placeholder="Juan Pérez"
                required
                className="bg-[#0a0a0a] border-[#333] text-white placeholder:text-white/40"
              />
            </div>
            
            <div>
              <label className="block text-white/80 mb-2 text-sm">Teléfono</label>
              <Input
                value={newReservation.customerPhone}
                onChange={(e) => setNewReservation({...newReservation, customerPhone: e.target.value})}
                placeholder="300 123 4567"
                required
                className="bg-[#0a0a0a] border-[#333] text-white placeholder:text-white/40"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-white/80 mb-2 text-sm">Fecha</label>
                <Input
                  type="date"
                  value={newReservation.reservationDate}
                  onChange={(e) => setNewReservation({...newReservation, reservationDate: e.target.value})}
                  min={new Date().toISOString().split('T')[0]}
                  required
                  className="bg-[#0a0a0a] border-[#333] text-white"
                />
              </div>
              
              <div>
                <label className="block text-white/80 mb-2 text-sm">Hora</label>
                <div className="relative">
                  <select
                    value={newReservation.reservationTime}
                    onChange={(e) => setNewReservation({...newReservation, reservationTime: e.target.value})}
                    required
                    className="w-full h-10 px-3 rounded-md bg-[#0a0a0a] border border-[#333] text-white appearance-none cursor-pointer"
                  >
                    <option value="">Seleccionar</option>
                    {AVAILABLE_HOURS.map((hour) => (
                      <option key={hour.value} value={hour.value}>
                        {hour.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 pointer-events-none" />
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-white/80 mb-2 text-sm">Número de personas</label>
              <Input
                type="number"
                min={1}
                max={50}
                value={newReservation.partySize}
                onChange={(e) => setNewReservation({...newReservation, partySize: parseInt(e.target.value) || 1})}
                required
                className="bg-[#0a0a0a] border-[#333] text-white"
              />
            </div>
            
            <div>
              <label className="block text-white/80 mb-2 text-sm">Mensaje (opcional)</label>
              <textarea
                value={newReservation.message || ''}
                onChange={(e) => setNewReservation({...newReservation, message: e.target.value})}
                placeholder="Notas adicionales..."
                rows={3}
                className="w-full px-3 py-2 rounded-md bg-[#0a0a0a] border border-[#333] text-white placeholder:text-white/40 resize-none"
              />
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsNewReservationOpen(false)}
                className="flex-1 border-[#333] bg-transparent text-white hover:bg-[#333]"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isCreating}
                className="flex-1 btn-primary"
              >
                {isCreating ? (
                  <span className="flex items-center gap-2">
                    <Spinner className="w-4 h-4" />
                    Creando...
                  </span>
                ) : (
                  'Crear Reserva'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reservation Detail Modal */}
      <Dialog open={!!selectedReservation} onOpenChange={(open) => !open && setSelectedReservation(null)}>
        <DialogContent className="bg-[#1a1a1a] border-[#333] text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-heading uppercase text-white">
              Detalle de Reserva
            </DialogTitle>
          </DialogHeader>

          {selectedReservation && (
            <div className="space-y-4 mt-2">
              {/* Status Badge */}
              <div className="flex justify-center">
                <span className={`px-4 py-1.5 rounded-full text-sm font-heading uppercase ${getStatusColor(selectedReservation.status)}`}>
                  {STATUS_LABELS[selectedReservation.status]}
                </span>
              </div>

              {/* Info Grid */}
              <div className="space-y-3 bg-[#0a0a0a] rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <User size={16} className="text-white/40 flex-shrink-0" />
                  <div>
                    <p className="text-white/40 text-xs uppercase">Cliente</p>
                    <p className="text-white font-heading">{selectedReservation.customerName}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Phone size={16} className="text-white/40 flex-shrink-0" />
                  <div>
                    <p className="text-white/40 text-xs uppercase">Teléfono</p>
                    <p className="text-white">{selectedReservation.customerPhone}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar size={16} className="text-white/40 flex-shrink-0" />
                  <div>
                    <p className="text-white/40 text-xs uppercase">Fecha y Hora</p>
                    <p className="text-white">
                      {new Date(selectedReservation.reservationDate).toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      {' — '}{selectedReservation.reservationTime}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Users size={16} className="text-white/40 flex-shrink-0" />
                  <div>
                    <p className="text-white/40 text-xs uppercase">Personas</p>
                    <p className="text-white">{selectedReservation.partySize}</p>
                  </div>
                </div>

                {selectedReservation.table && (
                  <div className="flex items-center gap-3">
                    <MapPin size={16} className="text-white/40 flex-shrink-0" />
                    <div>
                      <p className="text-white/40 text-xs uppercase">Mesa Asignada</p>
                      <p className="text-white">{selectedReservation.table.label || `Mesa ${selectedReservation.table.number}`}</p>
                    </div>
                  </div>
                )}

                {selectedReservation.message && (
                  <div className="flex items-start gap-3">
                    <MessageSquare size={16} className="text-white/40 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-white/40 text-xs uppercase">Mensaje</p>
                      <p className="text-white/80 text-sm">{selectedReservation.message}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Timestamps */}
              <div className="text-white/30 text-xs text-center space-y-1">
                <p>Creada: {new Date(selectedReservation.createdAt).toLocaleString('es-CO')}</p>
                {selectedReservation.updatedAt !== selectedReservation.createdAt && (
                  <p>Actualizada: {new Date(selectedReservation.updatedAt).toLocaleString('es-CO')}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                {selectedReservation.status === 'PENDING' && (
                  <Button
                    onClick={() => { handleConfirm(selectedReservation.id); setSelectedReservation(null); }}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    <CheckCircle className="mr-2" size={16} />
                    Confirmar
                  </Button>
                )}
                {selectedReservation.status !== 'CANCELLED' && (
                  <Button
                    onClick={() => { handleCancel(selectedReservation.id); setSelectedReservation(null); }}
                    variant="outline"
                    className="flex-1 border-red-500/50 text-red-500 hover:bg-red-500/10"
                  >
                    <XCircle className="mr-2" size={16} />
                    Cancelar
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
