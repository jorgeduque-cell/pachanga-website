import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Clock, Mail, ArrowRight, Calendar, Navigation } from 'lucide-react';
import { ScrollReveal } from '@/components/ScrollReveal';
import { Button } from '@/components/ui/button';

const contactInfo = [
  {
    icon: MapPin,
    title: 'Dirección',
    content: 'Calle 73 # 14-53\nGalerías, Bogotá',
    link: 'https://maps.google.com/?q=Calle+73+%23+14-53+Bogotá',
  },
  {
    icon: Phone,
    title: 'Teléfono',
    content: '+57 321 999 2719',
    link: 'tel:+573219992719',
  },
  {
    icon: Mail,
    title: 'Email',
    content: 'info@pachangaypochola.com',
    link: 'mailto:info@pachangaypochola.com',
  },
  {
    icon: Clock,
    title: 'Horario',
    content: 'Jueves - Sábado\n6:00 PM - 3:00 AM',
    link: null,
  },
];

export function ContactoPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-base)] pt-24">
      {/* Hero */}
      <section className="relative py-20 px-4 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--accent-red)]/10 to-transparent" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[var(--accent-red)]/10 rounded-full blur-[120px]" />
        
        <div className="max-w-6xl mx-auto relative z-10">
          <ScrollReveal>
            <div className="text-center mb-16">
              <span className="text-[var(--accent-red)] uppercase tracking-[0.3em] text-sm font-heading mb-4 block">
                Estamos Aquí
              </span>
              <h1 className="text-5xl md:text-7xl font-heading text-white mb-6">
                CONTACTO & <span className="text-gradient-gold">UBICACIÓN</span>
              </h1>
              <p className="text-white/60 max-w-xl mx-auto font-body text-lg">
                Visítanos y vive la experiencia de la salsa auténtica en Bogotá
              </p>
            </div>
          </ScrollReveal>

          {/* CTA Reserva */}
          <ScrollReveal delay={0.1}>
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="glass-card-heavy p-8 mb-12 text-center relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(227,27,35,0.15), rgba(227,27,35,0.05))',
                borderColor: 'rgba(227,27,35,0.3)',
              }}
            >
              <div className="relative z-10">
                <h2 className="text-2xl md:text-3xl font-heading text-white mb-4">
                  ¿QUIERES RESERVAR TU MESA?
                </h2>
                <p className="text-white/70 mb-6 max-w-lg mx-auto">
                  Haz tu reserva ahora y asegura tu lugar en la mejor rumba salsera de Bogotá
                </p>
                <Link to="/reservas">
                  <Button size="lg" className="btn-gold text-lg px-10 py-6">
                    <Calendar size={22} className="mr-2" />
                    RESERVAR MESA
                    <ArrowRight size={22} className="ml-2" />
                  </Button>
                </Link>
              </div>
              
              {/* Decorative glow */}
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-[var(--accent-gold)]/20 rounded-full blur-3xl" />
              <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-[var(--accent-red)]/20 rounded-full blur-3xl" />
            </motion.div>
          </ScrollReveal>

          {/* Contact Info Cards - Glass */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            {contactInfo.map((item, index) => {
              const Icon = item.icon;
              const CardContent = (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -5, scale: 1.02 }}
                  className="group glass-card p-6 h-full cursor-pointer"
                >
                  <div 
                    className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-all group-hover:scale-110"
                    style={{
                      background: 'linear-gradient(135deg, rgba(227,27,35,0.2), rgba(227,27,35,0.1))',
                      border: '1px solid rgba(227,27,35,0.3)',
                    }}
                  >
                    <Icon size={24} className="text-[var(--accent-red)]" />
                  </div>
                  <h3 className="text-white font-heading text-lg mb-2">{item.title}</h3>
                  <p className="text-white/60 font-body text-sm whitespace-pre-line">
                    {item.content}
                  </p>
                  
                  {/* Hover arrow */}
                  {item.link && (
                    <div className="mt-4 flex items-center text-[var(--accent-gold)] text-sm font-heading opacity-0 group-hover:opacity-100 transition-opacity">
                      <Navigation size={14} className="mr-1" />
                      <span>Ver más</span>
                    </div>
                  )}
                </motion.div>
              );

              return item.link ? (
                <a key={item.title} href={item.link} className="block">
                  {CardContent}
                </a>
              ) : (
                <div key={item.title}>{CardContent}</div>
              );
            })}
          </div>

          {/* Map - Dark Style */}
          <ScrollReveal delay={0.4}>
            <div className="glass-card-heavy p-2 rounded-2xl overflow-hidden">
              <div className="rounded-xl overflow-hidden h-[400px]">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3976.5!2d-74.066!3d4.658!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNMKwMzknMjguOCJOIDc0wrAwMycyOC44Ilc!5e0!3m2!1ses!2sco!4v1600000000000!5m2!1ses!2sco"
                  width="100%"
                  height="100%"
                  style={{ 
                    border: 0, 
                    filter: 'invert(90%) hue-rotate(180deg) brightness(80%) contrast(90%)'
                  }}
                  allowFullScreen
                  loading="lazy"
                  title="Ubicación Pachanga y Pochola"
                />
              </div>
            </div>
          </ScrollReveal>

          {/* Note */}
          <ScrollReveal delay={0.5}>
            <div className="mt-8 text-center">
              <p className="text-white/40 text-sm font-body">
                * El consumo mínimo por persona puede variar según el evento. <br />
                * Para grupos grandes (más de 10 personas), recomendamos reservar con anticipación.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}
