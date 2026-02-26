import { PartyPopper, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EventosSectionProps {
  onScrollToSection: (id: string) => void;
}

export function EventosSection({ onScrollToSection }: EventosSectionProps) {
  const benefits = [
    'Globos blancos y decoración tradicional',
    'Cumpleañero entra GRATIS',
    'Botella de aguardiente para tu mesa',
    'Foto con el personaje Pochola',
    'La mejor música para bailar toda la noche'
  ];

  return (
    <section id="eventos" className="py-20 md:py-32 px-4 bg-dark-gradient">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="relative order-2 lg:order-1">
            <div className="relative overflow-hidden border-neon-red">
              <img 
                src="/cumpleanos.jpg" 
                alt="Celebración de cumpleaños" 
                className="w-full h-[500px] object-cover hover:scale-105 transition-transform duration-700"
              />
            </div>
            <div className="absolute -bottom-4 -right-4 w-32 h-32 border-2 border-[#FFD700] -z-10" />
          </div>
          <div className="order-1 lg:order-2">
            <div className="flex items-center gap-3 mb-4">
              <PartyPopper className="text-[#FFD700]" size={28} />
              <span className="text-[#E31B23] uppercase tracking-wider text-sm font-heading">Celebra con nosotros</span>
            </div>
            <h2 className="section-title text-left mb-6">
              EVENTOS Y<br/><span className="text-[#FFD700]">CUMPLEAÑOS</span>
            </h2>
            <div className="w-24 h-1 bg-[#FFD700] mb-8" />
            <p className="text-white/80 text-lg leading-relaxed mb-6 font-body">
              ¿Por qué celebrar tu cumpleaños en Pachanga y Pochola? Porque aquí la fiesta no es cualquier fiesta. 
              Es <strong className="text-[#E31B23]">la rumba de verdad</strong>, la que se baila con el alma.
            </p>
            <ul className="space-y-4 mb-8">
              {benefits.map((item, index) => (
                <li key={index} className="flex items-center gap-3 text-white/80 font-body">
                  <Sparkles className="text-[#FFD700] flex-shrink-0" size={18} />
                  {item}
                </li>
              ))}
            </ul>
            <Button 
              className="btn-gold"
              onClick={() => onScrollToSection('reservas')}
            >
              RESERVA TU CUMPLEAÑOS
            </Button>
          </div>
        </div>

        {/* Fiesta de Blanco */}
        <div className="mt-16 bg-[#1a1a1a] border border-[#333] p-8 md:p-12">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-shrink-0">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center">
                <span className="text-4xl">⚪</span>
              </div>
            </div>
            <div className="text-center md:text-left">
              <h3 className="text-3xl md:text-4xl font-heading text-white mb-2">
                FIESTA DE <span className="text-white">BLANCO</span>
              </h3>
              <p className="text-white/60 font-body mb-4">
                Nuestra tradición más icónica. Una noche al mes donde todo el mundo viste de blanco 
                y la pista se convierte en un mar de luz. Consulta la fecha del próximo evento.
              </p>
              <Button className="btn-outline-red">
                PRÓXIMA FECHA
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
