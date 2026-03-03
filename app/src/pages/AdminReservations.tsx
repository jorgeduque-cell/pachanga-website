import { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Clock,
  MoreHorizontal,
  Calendar,
  RefreshCw
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
import { useReservations, useUpdateReservation, useCancelReservation } from '@/hooks/useReservations';
import { Spinner } from '@/components/ui/spinner';
import type { ReservationStatus } from '@/types';

const STATUS_LABELS: Record<ReservationStatus, string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmada',
  CANCELLED: 'Cancelada',
  COMPLETED: 'Completada',
};

export function AdminReservations() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | 'todos'>('todos');
  
  const { data: reservationsData, isLoading, refetch } = useReservations({
    search: search || undefined,
    status: statusFilter !== 'todos' ? statusFilter : undefined,
  });

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
            onClick={() => refetch()}
            disabled={isLoading}
            className="border-[#333] bg-[#1a1a1a] text-white hover:bg-[#333]"
          >
            <RefreshCw className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} size={18} />
            Recargar
          </Button>
          <Button className="btn-primary">
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
                            <DropdownMenuItem className="text-white/60 focus:text-white focus:bg-[#0a0a0a]">
                              <Clock className="mr-2" size={16} />
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
                onClick={() => refetch()}
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
    </div>
  );
}
