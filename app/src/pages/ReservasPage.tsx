import { useState } from 'react';
import { motion } from 'framer-motion';
import { useCreateReservation } from '@/hooks/useReservations';
import { ZoneSelector, type ZoneType } from '@/components/reservas/ZoneSelector';
import { ReservationForm } from '@/components/reservas/ReservationForm';
import { ReservationSuccessModal } from '@/components/reservas/ReservationSuccessModal';
import { Calendar, Clock, MapPin, ChevronDown, Crown, CheckCircle } from 'lucide-react';
import type { CreateReservationDTO } from '@/types';

// Horas disponibles para reservas: 7, 8, 9, 10 PM
const AVAILABLE_HOURS = [
  { value: '19:00', label: '7:00 PM' },
  { value: '20:00', label: '8:00 PM' },
  { value: '21:00', label: '9:00 PM' },
  { value: '22:00', label: '10:00 PM' },
];

const ZONE_LABELS: Record<ZoneType, string> = {
  PALCO: 'Palco VIP',
  VISITANTE: 'Mesa Visitante',
  BARRA: 'Mesa Barra',
};

export function ReservasPage() {
  const [date, setDate] = useState<string>('');
  const [time, setTime] = useState<string>('');
  const [selectedZone, setSelectedZone] = useState<ZoneType | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastReservation, setLastReservation] = useState<{
    tableName?: string;
    date: string;
    time: string;
    partySize: number;
    customerName: string;
  } | null>(null);

  const { mutate: createReservation, isPending: isCreating, error: createError } = useCreateReservation();

  // Static urgency counts (intencional — UX)
  const zoneAvailability: Record<ZoneType, number> = { PALCO: 5, VISITANTE: 15, BARRA: 15 };

  const handleSubmit = (data: CreateReservationDTO) => {
    setLastReservation({
      tableName: selectedZone ? ZONE_LABELS[selectedZone] : undefined,
      date: data.reservationDate,
      time: data.reservationTime,
      partySize: data.partySize,
      customerName: data.customerName,
    });

    createReservation(data, {
      onSuccess: () => {
        setSelectedZone(null);
        setShowSuccessModal(true);
      },
      onError: (error) => {
        alert('Error al crear la reserva: ' + error.message);
      },
    });
  };

  const handleCloseModal = () => {
    setShowSuccessModal(false);
    setDate('');
    setTime('');
    setLastReservation(null);
  };

  const showContent = date && time;

  return (
    <div className="min-h-screen bg-[var(--bg-base)] pt-28 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
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
            Selecciona fecha, hora y tipo de mesa para vivir la experiencia Pachanga
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
              <div className="relative">
                <select
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="glass-input w-full px-4 py-3 rounded-lg text-white appearance-none cursor-pointer"
                >
                  <option value="" className="bg-[#1a1a1a]">Seleccionar hora</option>
                  {AVAILABLE_HOURS.map((hour) => (
                    <option key={hour.value} value={hour.value} className="bg-[#1a1a1a]">
                      {hour.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50 pointer-events-none" />
              </div>
            </div>
          </div>

          {!date && !time && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 text-center text-white/40 flex items-center justify-center gap-2"
            >
              <MapPin className="w-4 h-4" />
              Selecciona fecha y hora para ver las zonas disponibles
            </motion.div>
          )}
        </motion.div>

        {/* Main Content: Zone Selector + Form */}
        {showContent && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          >
            {/* Zone Selector */}
            <div className="glass-card-heavy p-6">
              <ZoneSelector
                selectedZone={selectedZone}
                onSelectZone={setSelectedZone}
                availability={zoneAvailability}
              />
            </div>

            {/* Reservation Form */}
            <div>
              <ReservationForm
                selectedTableId={null}
                selectedTableName={selectedZone ? ZONE_LABELS[selectedZone] : undefined}
                selectedZone={selectedZone}
                selectedDate={date}
                selectedTime={time}
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
                icon: Crown,
                title: '2. Elige tu zona',
                desc: 'Palco VIP, Mesa Visitante o Barra',
              },
              {
                icon: CheckCircle,
                title: '3. Confirma tu reserva',
                desc: 'Llena tus datos y listo, ¡te esperamos!',
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
