import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Music, PartyPopper, Sparkles, ArrowRight, Wine, Phone, Loader2 } from 'lucide-react';
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
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}


function truncateText(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen).trimEnd() + '...';
}

function getStatusLabel(status: string): { label: string; color: string } {
  switch (status) {
    case 'SOLD_OUT': return { label: '¡AGOTADO!', color: 'bg-orange-500' };
    case 'CANCELLED': return { label: 'CANCELADO', color: 'bg-red-600' };
    default: return { label: 'DISPONIBLE', color: 'bg-emerald-500' };
  }
}

// ─── Static Services Data ───────────────────────────────────
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

// ─── Event Card Component ───────────────────────────────────
function EventCard({ event, featured = false }: { event: Event; featured?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const statusInfo = getStatusLabel(event.status);
  const hasFlyer = !!event.flyerUrl;
  const descriptionPreview = event.description ? truncateText(event.description, 120) : null;
  const hasMore = event.description ? event.description.length > 120 : false;

  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`group rounded-2xl overflow-hidden transition-all duration-300 ${
        featured
          ? 'glass-card-heavy border-[var(--accent-gold)]/20 hover:border-[var(--accent-gold)]/50'
          : 'glass-card hover:border-[var(--accent-red)]/30'
      }`}
    >
      {/* Flyer Image — Full, no overlay */}
      <div className={`relative w-full overflow-hidden ${featured ? 'max-h-[600px]' : 'max-h-[480px]'}`}>
        {hasFlyer ? (
          <img
            src={event.flyerUrl!}
            alt={event.name}
            className="w-full h-full object-contain bg-black/40"
          />
        ) : (
          <div className="w-full aspect-video bg-gradient-to-br from-[var(--accent-red)]/20 to-[var(--accent-gold)]/10 flex items-center justify-center">
            <PartyPopper size={64} className="text-[var(--accent-gold)]/40" />
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute top-4 left-4">
          <span className={`px-3 py-1.5 text-white text-xs font-heading uppercase tracking-wider rounded-full ${statusInfo.color} shadow-lg`}>
            {statusInfo.label}
          </span>
        </div>

        {/* Cover Price Badge */}
        {event.coverPrice !== null && event.coverPrice > 0 && (
          <div className="absolute top-4 right-4">
            <span className="px-3 py-1.5 text-white text-xs font-heading tracking-wider rounded-full bg-black/70 backdrop-blur-sm border border-white/20 shadow-lg">
              💰 ${event.coverPrice.toLocaleString('es-CO')} COP
            </span>
          </div>
        )}

        {/* Date overlay at bottom */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-12 pb-4 px-6">
          <h3 className={`font-heading text-white mb-1 ${featured ? 'text-3xl md:text-4xl' : 'text-2xl'}`}>
            {event.name}
          </h3>
        </div>
      </div>

      {/* Event Info */}
      <div className="p-6 space-y-4">
        {/* Date, Time, Location */}
        <div className="flex flex-wrap gap-3">
          <span className="flex items-center gap-2 text-white/80 text-sm glass-card px-3 py-1.5 rounded-full">
            <Calendar size={14} className="text-[var(--accent-gold)]" />
            {formatEventDate(event.eventDate)}
          </span>
          <span className="flex items-center gap-2 text-white/80 text-sm glass-card px-3 py-1.5 rounded-full">
            <Clock size={14} className="text-[var(--accent-gold)]" />
            {event.eventTime}
          </span>
          {event.coverPrice === 0 || event.coverPrice === null ? (
            <span className="flex items-center gap-2 text-emerald-400 text-sm glass-card px-3 py-1.5 rounded-full">
              🆓 Entrada libre
            </span>
          ) : null}
        </div>

        {/* Description — truncated, expandable */}
        {event.description && (
          <div className="text-white/60 font-body text-sm leading-relaxed">
            <p>{expanded ? event.description : descriptionPreview}</p>
            {hasMore && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-[var(--accent-gold)] hover:text-white text-xs mt-1 font-heading uppercase tracking-wider transition-colors"
              >
                {expanded ? 'Ver menos' : 'Ver más'}
              </button>
            )}
          </div>
        )}

        {/* CTA */}
        <Link to="/reservas" className="block">
          <Button
            className={`w-full ${
              featured
                ? 'btn-gold text-lg'
                : 'btn-outline-gold hover:bg-[var(--accent-gold)] hover:text-black'
            } transition-all`}
            size={featured ? 'lg' : 'default'}
            disabled={event.status === 'SOLD_OUT'}
          >
            {event.status === 'SOLD_OUT' ? (
              'Agotado — Lista de espera'
            ) : (
              <>
                Reservar para este evento
                <ArrowRight size={16} className="ml-2" />
              </>
            )}
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}

// ─── Main Page ──────────────────────────────────────────────
export function EventosPage() {
  const { data: eventsData, isLoading, error } = useUpcomingEvents();

  const events: Event[] = Array.isArray(eventsData)
    ? eventsData
    : (eventsData as { data?: Event[] })?.data ?? [];

  const featuredEvent = events[0];
  const otherEvents = events.slice(1);

  return (
    <div className="min-h-screen bg-[var(--bg-base)] pt-24">
      {/* Header */}
      <section className="relative py-16 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--accent-red)]/10 to-transparent" />
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[var(--accent-gold)]/5 rounded-full blur-[150px]" />

        <div className="max-w-6xl mx-auto relative z-10">
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

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={40} className="text-[var(--accent-gold)] animate-spin" />
              <span className="ml-4 text-white/60 text-lg">Cargando eventos...</span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-12 glass-card p-8 rounded-xl">
              <p className="text-white/60 text-lg">No pudimos cargar los eventos en este momento.</p>
              <p className="text-white/40 mt-2">Intenta de nuevo más tarde.</p>
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

          {/* Featured Event — Full flyer card */}
          {featuredEvent && (
            <ScrollReveal delay={0.2}>
              <div className="max-w-2xl mx-auto">
                <div className="text-center mb-6">
                  <span className="inline-block px-5 py-2 bg-[var(--accent-gold)] text-black font-heading text-sm uppercase tracking-wider rounded-full">
                    🔥 Próximo Evento
                  </span>
                </div>
                <EventCard event={featuredEvent} featured />
              </div>
            </ScrollReveal>
          )}
        </div>
      </section>

      {/* Other Events Grid */}
      {otherEvents.length > 0 && (
        <section className="py-20 px-4 bg-[var(--bg-surface)]">
          <div className="max-w-6xl mx-auto">
            <ScrollReveal>
              <h2 className="text-4xl md:text-5xl font-heading text-white text-center mb-12">
                MÁS <span className="text-[var(--accent-red)]">EVENTOS</span>
              </h2>
            </ScrollReveal>

            <StaggerContainer className={`grid gap-8 ${otherEvents.length === 1 ? 'max-w-2xl mx-auto' : 'md:grid-cols-2'}`}>
              {otherEvents.map((event) => (
                <StaggerItem key={event.id}>
                  <EventCard event={event} />
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>
      )}

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
          style={{ background: 'linear-gradient(135deg, rgba(227,27,35,0.15), rgba(255,215,0,0.1))' }}
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
