import { MapPin, Clock, Users, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function UbicacionSection() {
  return (
    <section id="ubicacion" className="py-20 md:py-32 px-4 bg-dark-gradient">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-4">
            <MapPin className="text-[#E31B23]" size={32} />
            <span className="text-[#FFD700] uppercase tracking-wider text-sm font-heading">Encuéntranos</span>
          </div>
          <h2 className="section-title mb-4">
            NUESTRA <span className="text-[#E31B23]">UBICACIÓN</span>
          </h2>
          <p className="section-subtitle">
            En el corazón de Galerías, donde la tradición sigue viva
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Location Info */}
          <div className="bg-[#1a1a1a] border border-[#333] p-8">
            <div className="mb-8">
              <img 
                src="/logo-rojo.jpg" 
                alt="Pachanga y Pochola" 
                className="h-20 w-auto mb-4"
              />
              <h3 className="text-2xl font-heading text-white">
                PACHANGA Y POCHOLA
              </h3>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <MapPin className="text-[#E31B23] mt-1 flex-shrink-0" size={24} />
                <div>
                  <p className="text-white font-heading">DIRECCIÓN</p>
                  <p className="text-white/60 font-body">Calle 73 # 14-53</p>
                  <p className="text-white/60 font-body">Galerías, Teusaquillo</p>
                  <p className="text-white/60 font-body">Bogotá, Colombia</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <Clock className="text-[#FFD700] mt-1 flex-shrink-0" size={24} />
                <div>
                  <p className="text-white font-heading">HORARIO</p>
                  <p className="text-white/60 font-body">Jueves a Sábado: 6:00 PM - 3:00 AM</p>
                  <p className="text-white/60 font-body">Domingo a Miércoles: Cerrado</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <Phone className="text-[#E31B23] mt-1 flex-shrink-0" size={24} />
                <div>
                  <p className="text-white font-heading">RESERVAS</p>
                  <p className="text-white/60 font-body">+57 321 999 27 19</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Users className="text-[#FFD700] mt-1 flex-shrink-0" size={24} />
                <div>
                  <p className="text-white font-heading">CAPACIDAD</p>
                  <p className="text-white/60 font-body">2 pisos de rumba</p>
                  <p className="text-white/60 font-body">Pista principal + balcones</p>
                </div>
              </div>
            </div>

            <Button className="btn-primary w-full mt-8">
              <a href="https://wa.me/573219992719" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2">
                ESCRÍBENOS POR WHATSAPP
              </a>
            </Button>
          </div>

          {/* Map */}
          <div className="relative h-[400px] lg:h-auto border border-[#333]">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3976.5!2d-74.066!3d4.658!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNMKwMzknMjguOCJOIDc0wrAwMycyOC44Ilc!5e0!3m2!1ses!2sco!4v1600000000000!5m2!1ses!2sco"
              width="100%"
              height="100%"
              style={{ border: 0, filter: 'grayscale(100%) invert(92%) contrast(83%) hue-rotate(180deg)' }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Ubicación Pachanga y Pochola"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
