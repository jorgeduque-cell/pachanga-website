import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTableMap } from '@/hooks/useTableMap';
import { useCreateReservation } from '@/hooks/useReservations';
import { TableMap } from '@/components/reservas/TableMap';
import { ReservationForm } from '@/components/reservas/ReservationForm';
import { ReservationSuccessModal } from '@/components/reservas/ReservationSuccessModal';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, Loader2 } from 'lucide-react';
import type { CreateReservationDTO } from '@/types';

export function ReservasPage() {
  const [date, setDate] = useState<string>('');
  const [time, setTime] = useState<string>('');
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastReservation, setLastReservation] = useState<{
    tableName?: string;
    date: string;
    time: string;
    partySize: number;
    customerName: string;
  } | null>(null);

  const { data: mapData, isLoading: isLoadingMap, error: mapError } = useTableMap(date, time);
  const { mutate: createReservation, isPending: isCreating, error: createError } = useCreateReservation();

  const handleSelectTable = (id: string) => {
    setSelectedTableId(id);
  };

  const handleSubmit = (data: CreateReservationDTO) => {
    const tableName = selectedTableId
      ? mapData?.floor1.tables.find((t) => t.id === selectedTableId)?.name ||
        mapData?.floor2.tables.find((t) => t.id === selectedTableId)?.name
      : undefined;

    setLastReservation({
      tableName,
      date: data.reservationDate,
      time: data.reservationTime,
      partySize: data.partySize,
      customerName: data.customerName,
    });

    createReservation(data, {
      onSuccess: () => {
        setSelectedTableId(null);
        setShowSuccessModal(true);
      },
    });
  };

  const handleCloseModal = () => {
    setShowSuccessModal(false);
    setDate('');
    setTime('');
    setLastReservation(null);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)] pt-28 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading text-[var(--accent-gold)] uppercase tracking-wider">
            Reserva tu Mesa
          </h1>
          <p className="mt-4 text-white/60 text-lg max-w-2xl mx-auto">
            Selecciona una fecha y hora, elige una mesa del mapa y completa tu reserva
          </p>
        </motion.div>

        {/* Date & Time Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card-heavy p-6 mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md mx-auto">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-[var(--accent-gold)]">
                <Calendar className="w-4 h-4" />
                Fecha
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="glass-input w-full px-4 py-3 rounded-lg text-white [color-scheme:dark]"
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-[var(--accent-gold)]">
                <Clock className="w-4 h-4" />
                Hora
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="glass-input w-full px-4 py-3 rounded-lg text-white [color-scheme:dark]"
              />
            </div>
          </div>

          {!date && !time && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 text-center text-white/40 flex items-center justify-center gap-2"
            >
              <MapPin className="w-4 h-4" />
              Selecciona fecha y hora para ver el mapa de disponibilidad
            </motion.div>
          )}
        </motion.div>

        {/* Main Content */}
        {date && time && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          >
            {/* Table Map */}
            <div>
              {isLoadingMap ? (
                <div className="glass-card-heavy p-12 flex flex-col items-center justify-center min-h-[400px]">
                  <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-red)] mb-4" />
                  <p className="text-white/60">Cargando mapa de mesas...</p>
                </div>
              ) : mapError ? (
                <div className="glass-card-heavy p-12 text-center min-h-[400px] flex flex-col items-center justify-center">
                  <p className="text-[var(--accent-red)]">Error al cargar el mapa</p>
                  <Button
                    onClick={() => window.location.reload()}
                    className="mt-4 btn-primary"
                  >
                    Reintentar
                  </Button>
                </div>
              ) : mapData ? (
                <TableMap
                  floor1={mapData.floor1}
                  floor2={mapData.floor2}
                  selectedTableId={selectedTableId}
                  onSelectTable={handleSelectTable}
                  totalTables={mapData.totalTables}
                  availableTables={mapData.availableTables}
                />
              ) : null}
            </div>

            {/* Reservation Form */}
            <div>
              <ReservationForm
                selectedTableId={selectedTableId}
                selectedTableName={selectedTableId
                  ? mapData?.floor1.tables.find((t) => t.id === selectedTableId)?.name ||
                    mapData?.floor2.tables.find((t) => t.id === selectedTableId)?.name
                  : undefined
                }
                onSubmit={handleSubmit}
                isLoading={isCreating}
                error={createError}
              />
            </div>
          </motion.div>
        )}

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-12 glass-card-heavy p-8"
        >
          <h2 className="text-2xl font-heading text-[var(--accent-gold)] uppercase tracking-wider mb-8 text-center">
            ¿Cómo funciona?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Calendar,
                title: '1. Elige fecha y hora',
                desc: 'Selecciona cuándo quieres visitarnos',
              },
              {
                icon: MapPin,
                title: '2. Selecciona tu mesa',
                desc: 'Haz clic en una mesa disponible del mapa',
              },
              {
                icon: Clock,
                title: '3. Completa tu reserva',
                desc: 'Llena tus datos y confirma la reserva',
              },
            ].map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="flex flex-col items-center text-center group"
              >
                <div className="w-16 h-16 rounded-2xl glass-card flex items-center justify-center mb-4 group-hover:border-[var(--accent-gold)]/50 transition-colors">
                  <step.icon className="w-8 h-8 text-[var(--accent-gold)]" />
                </div>
                <h3 className="font-heading text-white uppercase tracking-wider text-sm mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-white/50">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Success Modal */}
      <ReservationSuccessModal
        isOpen={showSuccessModal}
        onClose={handleCloseModal}
        reservationData={lastReservation}
      />
    </div>
  );
}
