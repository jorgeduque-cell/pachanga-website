import { useState } from 'react';
import { Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useCreateReservation } from '@/hooks/useReservations';
import { Spinner } from '@/components/ui/spinner';

export function ReservasSection() {
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    reservationDate: '',
    reservationTime: '',
    partySize: '',
    message: '',
  });

  const createReservation = useCreateReservation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createReservation.mutateAsync({
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        reservationDate: formData.reservationDate,
        reservationTime: formData.reservationTime,
        partySize: parseInt(formData.partySize),
        message: formData.message || undefined,
      });

      // Reset form
      setFormData({
        customerName: '',
        customerPhone: '',
        reservationDate: '',
        reservationTime: '',
        partySize: '',
        message: '',
      });

      alert('¡Reserva enviada con éxito! Te contactaremos pronto.');
    } catch (error) {
      alert('Error al enviar la reserva. Por favor intenta de nuevo.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <section id="reservas" className="py-20 md:py-32 px-4 bg-[#111]">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Calendar className="text-[#E31B23]" size={32} />
            <span className="text-[#FFD700] uppercase tracking-wider text-sm font-heading">Reserva ahora</span>
          </div>
          <h2 className="section-title mb-4">
            RESERVA TU <span className="text-[#E31B23]">MESA</span>
          </h2>
          <p className="section-subtitle">
            No te quedes fuera de la mejor rumba de Bogotá
          </p>
        </div>

        <div className="bg-[#1a1a1a] border-neon-red p-8 md:p-12">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-white/80 mb-2 font-body text-sm">Nombre completo</label>
                <Input 
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleChange}
                  placeholder="Tu nombre" 
                  required
                  className="bg-[#0a0a0a] border-[#333] text-white placeholder:text-white/40 focus:border-[#E31B23]"
                />
              </div>
              <div>
                <label className="block text-white/80 mb-2 font-body text-sm">Celular</label>
                <Input 
                  name="customerPhone"
                  value={formData.customerPhone}
                  onChange={handleChange}
                  placeholder="300 123 4567" 
                  required
                  className="bg-[#0a0a0a] border-[#333] text-white placeholder:text-white/40 focus:border-[#E31B23]"
                />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-white/80 mb-2 font-body text-sm">Fecha</label>
                <Input 
                  name="reservationDate"
                  type="date"
                  value={formData.reservationDate}
                  onChange={handleChange}
                  required
                  className="bg-[#0a0a0a] border-[#333] text-white placeholder:text-white/40 focus:border-[#E31B23]"
                />
              </div>
              <div>
                <label className="block text-white/80 mb-2 font-body text-sm">Hora</label>
                <Input 
                  name="reservationTime"
                  type="time"
                  value={formData.reservationTime}
                  onChange={handleChange}
                  placeholder="20:00" 
                  required
                  className="bg-[#0a0a0a] border-[#333] text-white placeholder:text-white/40 focus:border-[#E31B23]"
                />
              </div>
            </div>
            <div>
              <label className="block text-white/80 mb-2 font-body text-sm">Número de personas</label>
              <Input 
                name="partySize"
                type="number"
                min="1"
                max="20"
                value={formData.partySize}
                onChange={handleChange}
                placeholder="4" 
                required
                className="bg-[#0a0a0a] border-[#333] text-white placeholder:text-white/40 focus:border-[#E31B23]"
              />
            </div>
            <div>
              <label className="block text-white/80 mb-2 font-body text-sm">Mensaje (opcional)</label>
              <Textarea 
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="¿Es cumpleaños? ¿Alguna solicitud especial?"
                className="bg-[#0a0a0a] border-[#333] text-white placeholder:text-white/40 focus:border-[#E31B23] min-h-[100px]"
              />
            </div>
            <Button 
              type="submit"
              className="btn-primary w-full"
              disabled={createReservation.isPending}
            >
              {createReservation.isPending ? (
                <span className="flex items-center gap-2">
                  <Spinner className="w-4 h-4" />
                  ENVIANDO...
                </span>
              ) : (
                'ENVIAR RESERVA'
              )}
            </Button>
          </form>

          <div className="mt-8 pt-8 border-t border-[#333] text-center">
            <p className="text-white/60 font-body">
              ¿Prefieres llamar? <a href="tel:+573219992719" className="text-[#FFD700] hover:underline">+57 321 999 27 19</a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
