import { motion, AnimatePresence } from 'framer-motion';
import { Check, Calendar, Clock, Users, Armchair, Home, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';

interface ReservationSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservationData: {
    tableName?: string;
    date: string;
    time: string;
    partySize: number;
    customerName: string;
  } | null;
}

// Confetti particle component
const ConfettiParticle = ({ delay }: { delay: number }) => {
  const colors = ['#FFD700', '#E31B23', '#FF4500', '#10B981', '#06B6D4'];
  const color = colors[Math.floor(Math.random() * colors.length)];
  const x = Math.random() * 100 - 50;
  const rotation = Math.random() * 360;
  
  return (
    <motion.div
      initial={{ 
        opacity: 1, 
        y: -20, 
        x: 0, 
        rotate: 0,
        scale: 1 
      }}
      animate={{ 
        opacity: [1, 1, 0],
        y: [0, 300, 500],
        x: [0, x * 2, x * 4],
        rotate: [0, rotation, rotation * 2],
        scale: [1, 0.8, 0.5],
      }}
      transition={{ 
        duration: 3,
        delay,
        ease: 'easeOut',
      }}
      className="absolute w-3 h-3 rounded-sm"
      style={{ backgroundColor: color, left: '50%' }}
    />
  );
};

export function ReservationSuccessModal({ 
  isOpen, 
  onClose, 
  reservationData 
}: ReservationSuccessModalProps) {
  const [particles] = useState(() => 
    Array.from({ length: 50 }, (_, i) => i)
  );

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-CO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && reservationData && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/90 backdrop-blur-xl"
            onClick={onClose}
          />

          {/* Confetti container */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {particles.map((i) => (
              <ConfettiParticle key={i} delay={i * 0.02} />
            ))}
          </div>

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="relative z-10 w-full max-w-md"
          >
            <div 
              className="glass-card-heavy p-8 text-center overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(255,215,0,0.1), rgba(227,27,35,0.05))',
                borderColor: 'rgba(255,215,0,0.3)',
              }}
            >
              {/* Success Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-[var(--accent-gold)] to-[var(--accent-gold-dark)] flex items-center justify-center shadow-[0_0_40px_rgba(255,215,0,0.4)]"
              >
                <Check size={48} className="text-black" />
              </motion.div>

              {/* Title */}
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-3xl font-heading text-[var(--accent-gold)] mb-2"
              >
                ¡Reserva Exitosa!
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-white/70 mb-6"
              >
                Hola {reservationData.customerName}, te contactaremos para confirmar tu reserva.
              </motion.p>

              {/* Reservation Details */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="glass-card p-4 mb-6 text-left space-y-3"
              >
                {reservationData.tableName && (
                  <div className="flex items-center gap-3 text-white">
                    <Armchair size={18} className="text-[var(--accent-gold)]" />
                    <span>Mesa {reservationData.tableName}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-white">
                  <Calendar size={18} className="text-[var(--accent-gold)]" />
                  <span className="capitalize">{formatDate(reservationData.date)}</span>
                </div>
                <div className="flex items-center gap-3 text-white">
                  <Clock size={18} className="text-[var(--accent-gold)]" />
                  <span>{reservationData.time}</span>
                </div>
                <div className="flex items-center gap-3 text-white">
                  <Users size={18} className="text-[var(--accent-gold)]" />
                  <span>{reservationData.partySize} personas</span>
                </div>
              </motion.div>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="space-y-3"
              >
                <Button
                  onClick={onClose}
                  className="w-full btn-gold"
                >
                  <RotateCcw size={18} className="mr-2" />
                  Hacer otra reserva
                </Button>
                
                <Link to="/" className="block">
                  <Button
                    variant="outline"
                    className="w-full border-white/20 text-white hover:bg-white/10"
                  >
                    <Home size={18} className="mr-2" />
                    Volver al inicio
                  </Button>
                </Link>
              </motion.div>

              {/* Decorative glow */}
              <div 
                className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-30"
                style={{ background: 'var(--accent-gold)' }}
              />
              <div 
                className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full blur-3xl opacity-20"
                style={{ background: 'var(--accent-red)' }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
