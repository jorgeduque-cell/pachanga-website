import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Music, PartyPopper, Sparkles, ArrowRight, ArrowLeft, Wine, Phone, Loader2 } from 'lucide-react';
import { ScrollReveal } from '@/components/ScrollReveal';
import { StaggerContainer, StaggerItem } from '@/components/StaggerContainer';
import { Button } from '@/components/ui/button';
import { useUpcomingEvents } from '@/hooks/useEvents';
import type { Event } from '@/types/events.types';
import { useState } from 'react';

// ─── Helpers ────────────────────────────────────────────────
function formatEventDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-CO', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

function truncateText(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen).trimEnd() + '...';
}

function getStatusBadge(status: string): { label: string; color: string } {
  switch (status) {
    case 'SOLD_OUT': return { label: '¡AGOTADO!', color: 'bg-orange-500' };
    case 'CANCELLED': return { label: 'CANCELADO', color: 'bg-red-600' };
    default: return { label: 'DISPONIBLE', color: 'bg-emerald-500' };
  }
}

// ─── Static Services ────────────────────────────────────────
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

// ─── Small Side Preview ─────────────────────────────────────
function SidePreview({ event }: { event: Event }) {
  const hasFlyer = !!event.flyerUrl;
  return (
    <div className="rounded-xl overflow-hidden glass-card border-white/5 h-full">
      <div className="relative w-full h-full">
        {hasFlyer ? (
          <img src={event.flyerUrl!} alt={event.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[var(--accent-red)]/15 to-[var(--accent-gold)]/10 flex items-center justify-center min-h-[300px]">
            <PartyPopper size={40} className="text-white/10" />
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent pt-10 pb-3 px-3">
          <h4 className="text-sm font-heading text-white/80 leading-tight">{event.name}</h4>
        </div>
      </div>
    </div>
  );
}

// ─── Main Event Card ────────────────────────────────────────
function MainEventCard({ event }: { event: Event }) {
  const [expanded, setExpanded] = useState(false);
  const badge = getStatusBadge(event.status);
  const hasFlyer = !!event.flyerUrl;
  const preview = event.description ? truncateText(event.description, 120) : null;
  const hasMore = event.description ? event.description.length > 120 : false;

  return (
    <div className="rounded-2xl overflow-hidden glass-card-heavy border-[var(--accent-gold)]/15 shadow-2xl shadow-black/40">
      {/* Flyer */}
      <div className="relative w-full overflow-hidden" style={{ maxHeight: '520px' }}>
        {hasFlyer ? (
          <img src={event.flyerUrl!} alt={event.name} className="w-full h-full object-contain bg-black/50" />
        ) : (
          <div className="w-full aspect-[4/5] bg-gradient-to-br from-[var(--accent-red)]/20 to-[var(--accent-gold)]/10 flex items-center justify-center">
            <PartyPopper size={80} className="text-[var(--accent-gold)]/30" />
          </div>
        )}
        <div className="absolute top-4 left-4">
          <span className={`px-4 py-1.5 text-white text-sm font-heading uppercase tracking-wider rounded-full ${badge.color} shadow-lg`}>
            {badge.label}
          </span>
        </div>
        {event.coverPrice !== null && event.coverPrice > 0 && (
          <div className="absolute top-4 right-4">
            <span className="px-4 py-1.5 text-white text-sm font-heading tracking-wider rounded-full bg-black/70 backdrop-blur-sm border border-[var(--accent-gold)]/30">
              💰 Precios desde ${event.coverPrice.toLocaleString('es-CO')}
            </span>
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent pt-14 pb-4 px-6">
          <h3 className="text-2xl md:text-3xl font-heading text-white leading-tight">{event.name}</h3>
        </div>
      </div>

      {/* Info */}
      <div className="p-5 space-y-3">
        <div className="flex flex-wrap gap-2">
          <span className="flex items-center gap-1.5 text-white/80 text-xs glass-card px-2.5 py-1 rounded-full">
            <Calendar size={12} className="text-[var(--accent-gold)]" />
            {formatEventDate(event.eventDate)}
          </span>
          <span className="flex items-center gap-1.5 text-white/80 text-xs glass-card px-2.5 py-1 rounded-full">
            <Clock size={12} className="text-[var(--accent-gold)]" />
            {event.eventTime}
          </span>
        </div>
        {event.description && (
          <div className="text-white/50 font-body text-xs leading-relaxed">
            <p>{expanded ? event.description : preview}</p>
            {hasMore && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-[var(--accent-gold)] hover:text-white text-[10px] mt-1 font-heading uppercase tracking-wider transition-colors"
              >
                {expanded ? '▲ Ver menos' : '▼ Ver más'}
              </button>
            )}
          </div>
        )}
        <Link to="/reservas" className="block pt-1">
          <Button className="w-full btn-gold transition-all" disabled={event.status === 'SOLD_OUT'}>
            {event.status === 'SOLD_OUT' ? 'Agotado' : (
              <>Reservar para este evento <ArrowRight size={14} className="ml-1" /></>
            )}
          </Button>
        </Link>
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────
export function EventosPage() {
  const { data: eventsData, isLoading, error } = useUpcomingEvents();
  const [activeIndex, setActiveIndex] = useState(0);

  const events: Event[] = Array.isArray(eventsData)
    ? eventsData
    : (eventsData as { data?: Event[] })?.data ?? [];

  const prevEvent = activeIndex > 0 ? events[activeIndex - 1] : null;
  const nextEvent = activeIndex < events.length - 1 ? events[activeIndex + 1] : null;
  const currentEvent = events[activeIndex];

  const goTo = (idx: number) => {
    if (idx >= 0 && idx < events.length) setActiveIndex(idx);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)] pt-24">
      {/* Header */}
      <section className="relative py-16 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--accent-red)]/10 to-transparent" />
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[var(--accent-gold)]/5 rounded-full blur-[150px]" />

        <div className="max-w-7xl mx-auto relative z-10">
          <ScrollReveal>
            <div className="text-center mb-12">
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

          {/* Loading */}
          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={40} className="text-[var(--accent-gold)] animate-spin" />
              <span className="ml-4 text-white/60 text-lg">Cargando eventos...</span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="text-center py-12 glass-card p-8 rounded-xl">
              <p className="text-white/60 text-lg">No pudimos cargar los eventos en este momento.</p>
            </div>
          )}

          {/* No Events */}
          {!isLoading && !error && events.length === 0 && (
            <div className="text-center py-16 glass-card p-10 rounded-xl">
              <PartyPopper size={56} className="text-[var(--accent-gold)] mx-auto mb-6" />
              <p className="text-white text-xl font-heading mb-2">¡Próximamente nuevos eventos!</p>
              <p className="text-white/40">Síguenos en redes para enterarte primero.</p>
            </div>
          )}

          {/* ─── STACKED CAROUSEL ─────────────────────────── */}
          {events.length > 0 && currentEvent && (
            <div className="relative flex items-start justify-center" style={{ minHeight: '500px' }}>

              {/* LEFT SIDE — peeking from behind */}
              {prevEvent && (
                <motion.div
                  key={`left-${prevEvent.id}`}
                  initial={{ x: -40, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="hidden md:block absolute left-0 top-4 bottom-4 cursor-pointer"
                  style={{ width: '220px', zIndex: 1 }}
                  onClick={() => goTo(activeIndex - 1)}
                >
                  <motion.div
                    whileHover={{ scale: 1.03, opacity: 0.8 }}
                    className="h-full"
                    style={{ opacity: 0.4, filter: 'brightness(0.5)' }}
                  >
                    <SidePreview event={prevEvent} />
                  </motion.div>
                </motion.div>
              )}

              {/* CENTER — Main Card */}
              <motion.div
                key={currentEvent.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="relative w-full max-w-lg"
                style={{ zIndex: 10 }}
              >
                <MainEventCard event={currentEvent} />
              </motion.div>

              {/* RIGHT SIDE — peeking from behind */}
              {nextEvent && (
                <motion.div
                  key={`right-${nextEvent.id}`}
                  initial={{ x: 40, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="hidden md:block absolute right-0 top-4 bottom-4 cursor-pointer"
                  style={{ width: '220px', zIndex: 1 }}
                  onClick={() => goTo(activeIndex + 1)}
                >
                  <motion.div
                    whileHover={{ scale: 1.03, opacity: 0.8 }}
                    className="h-full"
                    style={{ opacity: 0.4, filter: 'brightness(0.5)' }}
                  >
                    <SidePreview event={nextEvent} />
                  </motion.div>
                </motion.div>
              )}

              {/* Arrows */}
              {events.length > 1 && (
                <>
                  <button
                    onClick={() => goTo(activeIndex - 1)}
                    disabled={activeIndex === 0}
                    className="absolute left-2 md:left-[230px] top-1/2 -translate-y-1/2 w-10 h-10 rounded-full glass-card-heavy flex items-center justify-center text-white hover:bg-[var(--accent-gold)]/20 transition-all disabled:opacity-15 disabled:cursor-not-allowed"
                    style={{ zIndex: 15 }}
                  >
                    <ArrowLeft size={16} />
                  </button>
                  <button
                    onClick={() => goTo(activeIndex + 1)}
                    disabled={activeIndex === events.length - 1}
                    className="absolute right-2 md:right-[230px] top-1/2 -translate-y-1/2 w-10 h-10 rounded-full glass-card-heavy flex items-center justify-center text-white hover:bg-[var(--accent-gold)]/20 transition-all disabled:opacity-15 disabled:cursor-not-allowed"
                    style={{ zIndex: 15 }}
                  >
                    <ArrowRight size={16} />
                  </button>
                </>
              )}
            </div>
          )}

          {/* Dots */}
          {events.length > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {events.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => goTo(idx)}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    idx === activeIndex
                      ? 'w-8 bg-[var(--accent-gold)]'
                      : 'w-2.5 bg-white/20 hover:bg-white/40'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Services */}
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
                    <h3 className="text-2xl font-heading text-white mb-3 relative z-10">{service.title}</h3>
                    <p className="text-white/60 font-body mb-6 relative z-10">{service.description}</p>
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
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(227,27,35,0.15), rgba(255,215,0,0.1))' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[var(--accent-gold)]/10 rounded-full blur-[100px]" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <ScrollReveal>
            <h2 className="text-4xl md:text-5xl font-heading text-white mb-6">¿QUIERES CELEBRAR CON NOSOTROS?</h2>
            <p className="text-white/80 font-body text-lg mb-8">Contáctanos y planificamos juntos tu evento perfecto</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/reservas">
                <Button size="lg" className="btn-gold text-lg px-8">
                  <Calendar size={20} className="mr-2" />Solicitar Reserva
                </Button>
              </Link>
              <a href="tel:+573219992719">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 px-8 text-lg">
                  <Phone size={20} className="mr-2" />Llamar Ahora
                </Button>
              </a>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}
