import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Music, PartyPopper, Sparkles, ArrowRight, Wine, Phone } from 'lucide-react';
import { ScrollReveal } from '@/components/ScrollReveal';
import { StaggerContainer, StaggerItem } from '@/components/StaggerContainer';
import { Button } from '@/components/ui/button';

const upcomingEvents = [
  {
    id: 1,
    title: 'Fiesta de Blanco',
    date: '28 de Febrero',
    time: '8:00 PM',
    description: 'Nuestra tradición más icónica. Todos de blanco, una noche de pura elegancia y salsa.',
    image: '/fondo pyp.png',
    category: 'Especial',
    featured: true,
  },
  {
    id: 2,
    title: 'Noche de Timba Cubana',
    date: '6 de Marzo',
    time: '9:00 PM',
    description: 'Lo mejor de la timba cubana con DJ especializado y orquesta en vivo.',
    image: '/pachanga5.jpeg',
    category: 'Música',
    featured: false,
  },
  {
    id: 3,
    title: 'Salsa Romántica',
    date: '14 de Marzo',
    time: '8:00 PM',
    description: 'Noche dedicada a los clásicos románticos de la salsa. Perfecto para enamorados.',
    image: '/pachanga3.jpeg',
    category: 'Temática',
    featured: false,
  },
];

const services = [
  {
    icon: PartyPopper,
    title: 'Cumpleaños',
    description: 'Celebración completa con decoración, cumpleañero gratis y sorpresas.',
    features: ['Decoración tradicional', 'Entrada gratis al festejado', 'Botella de aguardiente', 'Foto con Pochola'],
  },
  {
    icon: Wine,
    title: 'Eventos Corporativos',
    description: 'Espacio ideal para integraciones empresariales y celebraciones de equipo.',
    features: ['Menú personalizado', 'Reserva de zona VIP', 'Coctelería premium', 'Música a elección'],
  },
  {
    icon: Music,
    title: 'Orquestas en Vivo',
    description: 'Los mejores artistas de salsa y música tropical en nuestro escenario.',
    features: ['Sonido profesional', 'Escenario amplio', 'Capacidad 300+ personas', 'Dos pisos de rumba'],
  },
];

export function EventosPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-base)] pt-24">
      {/* Hero with Featured Event */}
      <section className="relative py-20 px-4 overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--accent-red)]/10 to-transparent" />
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[var(--accent-gold)]/5 rounded-full blur-[150px]" />
        
        <div className="max-w-6xl mx-auto relative z-10">
          <ScrollReveal>
            <div className="text-center mb-16">
              <span className="text-[var(--accent-red)] uppercase tracking-[0.3em] text-sm font-heading mb-4 block">
                Vive la Experiencia
              </span>
              <h1 className="text-5xl md:text-7xl font-heading text-white mb-6">
                EVENTOS & <span className="text-gradient-gold">CELEBRACIONES</span>
              </h1>
              <p className="text-white/60 max-w-2xl mx-auto font-body text-lg">
                Desde cumpleaños inolvidables hasta nuestras icónicas Fiestas de Blanco. 
                Cada evento en Pachanga y Pochola es una experiencia única.
              </p>
            </div>
          </ScrollReveal>

          {/* Featured Event - Hero Style */}
          <ScrollReveal delay={0.2}>
            <div className="relative rounded-2xl overflow-hidden glass-card-heavy p-2">
              <div className="aspect-[21/9] md:aspect-[3/1] relative rounded-xl overflow-hidden">
                <img
                  src={upcomingEvents[0].image}
                  alt={upcomingEvents[0].title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent" />
              </div>
              
              <div className="absolute inset-0 flex items-center p-8 md:p-16">
                <div className="max-w-xl">
                  <motion.span 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="inline-block px-4 py-1.5 bg-[var(--accent-gold)] text-black font-heading text-sm uppercase tracking-wider rounded-full mb-4"
                  >
                    Evento Destacado
                  </motion.span>
                  <h2 className="text-4xl md:text-6xl font-heading text-white mb-4">
                    {upcomingEvents[0].title}
                  </h2>
                  <div className="flex flex-wrap gap-4 mb-6 text-white/80">
                    <span className="flex items-center gap-2 glass-card px-3 py-1 rounded-full">
                      <Calendar size={18} className="text-[var(--accent-gold)]" />
                      {upcomingEvents[0].date}
                    </span>
                    <span className="flex items-center gap-2 glass-card px-3 py-1 rounded-full">
                      <Clock size={18} className="text-[var(--accent-gold)]" />
                      {upcomingEvents[0].time}
                    </span>
                  </div>
                  <p className="text-white/70 font-body mb-8 text-lg">
                    {upcomingEvents[0].description}
                  </p>
                  <Link to="/reservas">
                    <Button size="lg" className="btn-primary">
                      Reservar para este evento
                      <ArrowRight size={18} className="ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="py-20 px-4 bg-[var(--bg-surface)]">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <h2 className="text-4xl md:text-5xl font-heading text-white text-center mb-12">
              PRÓXIMOS <span className="text-[var(--accent-red)]">EVENTOS</span>
            </h2>
          </ScrollReveal>

          <StaggerContainer className="grid md:grid-cols-2 gap-6">
            {upcomingEvents.slice(1).map((event) => (
              <StaggerItem key={event.id}>
                <motion.div
                  whileHover={{ y: -8 }}
                  className="group glass-card overflow-hidden hover:border-[var(--accent-red)]/30 transition-all"
                >
                  <div className="aspect-video relative">
                    <img
                      src={event.image}
                      alt={event.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute top-4 left-4">
                      <span 
                        className="px-3 py-1 text-white text-xs font-heading uppercase tracking-wider rounded-full"
                        style={{
                          background: 'linear-gradient(135deg, var(--accent-red), var(--accent-red-light))',
                        }}
                      >
                        {event.category}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <h3 className="text-2xl font-heading text-white mb-2 group-hover:text-[var(--accent-gold)] transition-colors">
                      {event.title}
                    </h3>
                    <div className="flex gap-4 mb-4 text-white/60 text-sm">
                      <span className="flex items-center gap-1">
                        <Calendar size={14} className="text-[var(--accent-gold)]" />
                        {event.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={14} className="text-[var(--accent-gold)]" />
                        {event.time}
                      </span>
                    </div>
                    <p className="text-white/60 font-body text-sm mb-6">
                      {event.description}
                    </p>
                    <Link 
                      to="/reservas"
                      className="inline-flex items-center text-[var(--accent-gold)] hover:text-white font-heading text-sm uppercase tracking-wider transition-colors group/link"
                    >
                      Reservar
                      <ArrowRight size={16} className="ml-1 transform group-hover/link:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Services - Glass Cards with Hover Reveal */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-heading text-white mb-4">
                SERVICIOS PARA <span className="text-gradient-gold">EVENTOS</span>
              </h2>
              <p className="text-white/60 max-w-xl mx-auto font-body">
                Transformamos tus celebraciones en momentos inolvidables
              </p>
            </div>
          </ScrollReveal>

          <StaggerContainer className="grid md:grid-cols-3 gap-8">
            {services.map((service) => {
              const Icon = service.icon;
              return (
                <StaggerItem key={service.title}>
                  <motion.div
                    whileHover={{ y: -10 }}
                    className="h-full glass-card-heavy p-8 group cursor-pointer overflow-hidden relative"
                  >
                    {/* Hover glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-gold)]/0 to-[var(--accent-gold)]/0 group-hover:from-[var(--accent-gold)]/10 group-hover:to-transparent transition-all duration-500" />
                    
                    <div 
                      className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 relative z-10"
                      style={{
                        background: 'linear-gradient(135deg, rgba(227,27,35,0.2), rgba(227,27,35,0.1))',
                        border: '1px solid rgba(227,27,35,0.3)',
                      }}
                    >
                      <Icon size={32} className="text-[var(--accent-red)]" />
                    </div>
                    
                    <h3 className="text-2xl font-heading text-white mb-3 relative z-10">
                      {service.title}
                    </h3>
                    <p className="text-white/60 font-body mb-6 relative z-10">
                      {service.description}
                    </p>

                    <ul className="space-y-3 relative z-10">
                      {service.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-3 text-white/70 text-sm">
                          <Sparkles size={14} className="text-[var(--accent-gold)] flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    <Link to="/reservas" className="block mt-8 relative z-10">
                      <Button className="w-full btn-outline-gold group-hover:bg-[var(--accent-gold)] group-hover:text-black transition-all">
                        Reservar Ahora
                      </Button>
                    </Link>
                  </motion.div>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 relative overflow-hidden">
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, rgba(227,27,35,0.15), rgba(255,215,0,0.1))',
          }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[var(--accent-gold)]/10 rounded-full blur-[100px]" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <ScrollReveal>
            <h2 className="text-4xl md:text-5xl font-heading text-white mb-6">
              ¿QUIERES CELEBRAR CON NOSOTROS?
            </h2>
            <p className="text-white/80 font-body text-lg mb-8">
              Contáctanos y planificamos juntos tu evento perfecto
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/reservas">
                <Button size="lg" className="btn-gold text-lg px-8">
                  <Calendar size={20} className="mr-2" />
                  Solicitar Reserva
                </Button>
              </Link>
              <a href="tel:+573219992719">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 px-8 text-lg">
                  <Phone size={20} className="mr-2" />
                  Llamar Ahora
                </Button>
              </a>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}
