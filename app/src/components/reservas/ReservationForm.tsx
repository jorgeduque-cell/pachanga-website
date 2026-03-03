import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  Clock, 
  Users, 
  User, 
  Phone, 
  MessageSquare, 
  CheckCircle, 
  AlertCircle,
  Armchair,
  Info,
  ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CreateReservationDTO } from '@/types';

// Horas disponibles para reservas: 7, 8, 9, 10 PM
const AVAILABLE_HOURS = [
  { value: '19:00', label: '7:00 PM' },
  { value: '20:00', label: '8:00 PM' },
  { value: '21:00', label: '9:00 PM' },
  { value: '22:00', label: '10:00 PM' },
];

const reservationSchema = z.object({
  customerName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  customerPhone: z.string().min(5, 'Teléfono inválido'),
  reservationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida'),
  reservationTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Hora inválida'),
  partySize: z.number().int().min(1, 'Mínimo 1 persona').max(50, 'Máximo 50 personas'),
  message: z.string().optional(),
});

type ReservationFormData = z.infer<typeof reservationSchema>;

interface ReservationFormProps {
  selectedTableId: string | null;
  selectedTableName?: string;
  onSubmit: (data: CreateReservationDTO) => void;
  isLoading: boolean;
  error: Error | null;
}

export function ReservationForm({
  selectedTableId,
  selectedTableName,
  onSubmit,
  isLoading,
  error,
}: ReservationFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ReservationFormData>({
    resolver: zodResolver(reservationSchema),
    defaultValues: {
      partySize: 2,
    },
  });

  useEffect(() => {
    if (error) {
      let errorMessage = 'Error al crear la reserva';

      if (error.message.includes('409')) {
        errorMessage = 'Esta mesa ya está reservada para esa fecha y hora';
      } else if (error.message.includes('429')) {
        errorMessage = 'Demasiadas reservas, intente más tarde';
      } else if (error.message.includes('400')) {
        errorMessage = 'No se pueden crear reservas para fechas pasadas';
      }

      setSubmitError(errorMessage);
    }
  }, [error]);

  const handleFormSubmit = (data: ReservationFormData) => {
    setSubmitError(null);

    const reservationData: CreateReservationDTO = {
      ...data,
      tableId: selectedTableId ?? undefined,
    };

    onSubmit(reservationData);
  };

  // Form field component with glass style
  const FormField = ({
    label,
    icon: Icon,
    error,
    children,
  }: {
    label: string;
    icon: React.ElementType;
    error?: string;
    children: React.ReactNode;
  }) => (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm font-medium text-[var(--accent-gold)]">
        <Icon className="w-4 h-4" />
        {label}
      </label>
      {children}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-sm text-[var(--accent-red)] flex items-center gap-1"
          >
            <AlertCircle className="w-3 h-3" />
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <div className="glass-card-heavy p-6">
      <h3 className="text-2xl font-heading text-[var(--accent-gold)] uppercase tracking-wider mb-6">
        Hacer Reserva
      </h3>

      {/* Error message */}
      <AnimatePresence>
        {submitError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 p-4 rounded-xl overflow-hidden"
            style={{
              background: 'rgba(227, 27, 35, 0.1)',
              border: '1px solid rgba(227, 27, 35, 0.3)',
            }}
          >
            <div className="flex items-center gap-2 text-[var(--accent-red)]">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{submitError}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table selection indicator */}
      <AnimatePresence mode="wait">
        {selectedTableId ? (
          <motion.div
            key="selected"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 p-4 rounded-xl"
            style={{
              background: 'linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,215,0,0.05))',
              border: '1px solid rgba(255,215,0,0.3)',
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--accent-gold)] flex items-center justify-center">
                <Armchair className="w-5 h-5 text-black" />
              </div>
              <div>
                <p className="text-[var(--accent-gold)] font-heading text-lg">
                  Mesa {selectedTableName}
                </p>
                <p className="text-white/60 text-sm">Seleccionada</p>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="no-selection"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 p-4 rounded-xl glass-card"
          >
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-white/50 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-white/80 text-sm font-medium">
                  Sin mesa seleccionada
                </p>
                <p className="text-white/50 text-sm">
                  Puede hacer una reserva general o seleccionar una mesa del mapa
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
        {/* Name & Phone */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <FormField label="Nombre completo" icon={User} error={errors.customerName?.message}>
            <input
              {...register('customerName')}
              placeholder="Juan Pérez"
              className={cn(
                'glass-input w-full px-4 py-3 rounded-lg text-white placeholder-white/30',
                errors.customerName && 'border-[var(--accent-red)]'
              )}
            />
          </FormField>

          <FormField label="Teléfono" icon={Phone} error={errors.customerPhone?.message}>
            <input
              {...register('customerPhone')}
              placeholder="555-0101"
              className={cn(
                'glass-input w-full px-4 py-3 rounded-lg text-white placeholder-white/30',
                errors.customerPhone && 'border-[var(--accent-red)]'
              )}
            />
          </FormField>
        </div>

        {/* Date, Time & Party Size */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <FormField label="Fecha" icon={Calendar} error={errors.reservationDate?.message}>
            <input
              type="date"
              {...register('reservationDate')}
              className={cn(
                'glass-input w-full px-4 py-3 rounded-lg text-white [color-scheme:dark]',
                errors.reservationDate && 'border-[var(--accent-red)]'
              )}
            />
          </FormField>

          <FormField label="Hora" icon={Clock} error={errors.reservationTime?.message}>
            <div className="relative">
              <select
                {...register('reservationTime')}
                className={cn(
                  'glass-input w-full px-4 py-3 rounded-lg text-white appearance-none cursor-pointer',
                  errors.reservationTime && 'border-[var(--accent-red)]'
                )}
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
          </FormField>

          <FormField label="Personas" icon={Users} error={errors.partySize?.message}>
            <input
              type="number"
              min={1}
              max={50}
              {...register('partySize', { valueAsNumber: true })}
              className={cn(
                'glass-input w-full px-4 py-3 rounded-lg text-white [color-scheme:dark]',
                errors.partySize && 'border-[var(--accent-red)]'
              )}
            />
          </FormField>
        </div>

        {/* Message */}
        <FormField label="Mensaje (opcional)" icon={MessageSquare}>
          <textarea
            {...register('message')}
            placeholder="¿Alguna ocasión especial? Cumpleaños, aniversario..."
            rows={3}
            className="glass-input w-full px-4 py-3 rounded-lg text-white placeholder-white/30 resize-none"
          />
        </FormField>

        {/* Submit Button */}
        <motion.div
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full btn-primary py-6 text-base relative overflow-hidden group"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <motion.svg
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </motion.svg>
                Creando reserva...
              </span>
            ) : (
              <span className="relative z-10 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                Confirmar Reserva
              </span>
            )}
            
            {/* Shine effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full"
              animate={{ translateX: ['0%', '200%'] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            />
          </Button>
        </motion.div>
      </form>
    </div>
  );
}
