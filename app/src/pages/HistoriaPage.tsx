import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { ScrollReveal } from '@/components/ScrollReveal';
import { StaggerContainer, StaggerItem } from '@/components/StaggerContainer';
import { Music, Award, Users, Wine, Star } from 'lucide-react';

const milestones = [
  {
    year: '1988',
    title: 'El Inicio',
    description: 'Nace Pachanga y Pochola en el corazón de Galerías, cuando un grupo de amigos del Pacífico y el Valle decidieron traer la verdadera rumba afrocolombiana a la capital.',
    icon: Star,
  },
  {
    year: '1995',
    title: 'Expansión',
    description: 'Apertura del segundo piso, duplicando la capacidad y creando un espacio íntimo para los verdaderos salseros.',
    icon: Users,
  },
  {
    year: '2005',
    title: 'Tradición Consagrada',
    description: 'La Fiesta de Blanco se consagra como evento insignia, reuniendo a cientos de personas vestidas de blanco en una noche inolvidable.',
    icon: Award,
  },
  {
    year: '2018',
    title: '30 Años de Ritmo',
    description: 'Celebración de tres décadas como referente de la salsa en Bogotá, con conciertos memorables y la visita de artistas internacionales.',
    icon: Music,
  },
  {
    year: '2025',
    title: 'Renovación',
    description: 'Modernización de instalaciones manteniendo la esencia tradicional. Seguimos siendo la embajada del sabor chocoano y valluno.',
    icon: Wine,
  },
];

const values = [
  { title: 'Autenticidad', desc: 'La salsa brava en su máxima expresión' },
  { title: 'Comunidad', desc: 'Un lugar de encuentro para la familia salsera' },
  { title: 'Tradición', desc: '37 años de historia ininterrumpida' },
  { title: 'Pasión', desc: 'El ritmo en las caderas, el alma en el baile' },
];

export function HistoriaPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  const lineHeight = useTransform(scrollYProgress, [0, 0.8], ['0%', '100%']);

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Page Header */}
      <section className="relative h-[50vh] min-h-[400px] flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(/dancers.jpg)` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/80 via-[#0a0a0a]/60 to-[#0a0a0a]" />
        
        <div className="relative z-10 text-center px-4">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[#E31B23] uppercase tracking-[0.3em] text-sm font-heading mb-4 block"
          >
            Nuestra Historia
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-heading text-white mb-6"
          >
            37 AÑOS DE <span className="text-[#FFD700]">RUMBA</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-white/60 max-w-xl mx-auto font-body"
          >
            Desde 1988, el corazón de la salsa en Bogotá late con fuerza en Galerías.
          </motion.p>
        </div>
      </section>

      {/* Intro Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <ScrollReveal>
            <p className="text-2xl md:text-3xl text-white/90 font-body leading-relaxed mb-8">
              "Rescatamos la esencia de la rumba de verdad: esa que se baila <span className="text-[#E31B23] font-bold">pegadito</span>, 
              con el ritmo en la cadera y el alma en la pista."
            </p>
            <p className="text-white/60 font-body">
              — Fundadores, 1988
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Timeline */}
      <section ref={containerRef} className="py-20 px-4 relative">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal>
            <h2 className="text-4xl md:text-5xl font-heading text-white text-center mb-16">
              NUESTRA <span className="text-[#E31B23]">TRAYECTORIA</span>
            </h2>
          </ScrollReveal>

          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-[#333]" />
            <motion.div
              style={{ height: lineHeight }}
              className="absolute left-4 md:left-1/2 top-0 w-px bg-gradient-to-b from-[#E31B23] to-[#FFD700] origin-top"
            />

            {/* Timeline Items */}
            <div className="space-y-16">
              {milestones.map((milestone, index) => {
                const Icon = milestone.icon;
                const isLeft = index % 2 === 0;
                
                return (
                  <ScrollReveal
                    key={milestone.year}
                    direction={isLeft ? 'left' : 'right'}
                    delay={index * 0.1}
                  >
                    <div className={`flex items-start gap-8 ${isLeft ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                      {/* Content */}
                      <div className={`flex-1 ml-12 md:ml-0 ${isLeft ? 'md:text-right' : 'md:text-left'}`}>
                        <div className={`inline-flex items-center gap-3 mb-3 ${isLeft ? 'md:flex-row-reverse' : ''}`}>
                          <div className="w-10 h-10 rounded-full bg-[#E31B23]/20 border border-[#E31B23] flex items-center justify-center">
                            <Icon size={18} className="text-[#E31B23]" />
                          </div>
                          <span className="text-4xl font-heading text-[#FFD700]">{milestone.year}</span>
                        </div>
                        <h3 className="text-2xl font-heading text-white mb-2">{milestone.title}</h3>
                        <p className="text-white/60 font-body">{milestone.description}</p>
                      </div>

                      {/* Center Dot */}
                      <div className="absolute left-4 md:left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-[#E31B23] border-4 border-[#0a0a0a]" />

                      {/* Spacer for alternating layout */}
                      <div className="hidden md:block flex-1" />
                    </div>
                  </ScrollReveal>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Values Grid */}
      <section className="py-20 px-4 bg-[#0d0d0d]">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <h2 className="text-4xl md:text-5xl font-heading text-white text-center mb-16">
              NUESTROS <span className="text-[#FFD700]">VALORES</span>
            </h2>
          </ScrollReveal>

          <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value) => (
              <StaggerItem key={value.title}>
                <motion.div
                  whileHover={{ y: -10 }}
                  className="p-6 bg-gradient-to-br from-[#1a1a1a] to-[#111] border border-[#333] rounded-xl hover:border-[#E31B23]/50 transition-all group"
                >
                  <h3 className="text-xl font-heading text-white mb-2 group-hover:text-[#FFD700] transition-colors">
                    {value.title}
                  </h3>
                  <p className="text-white/60 font-body text-sm">{value.desc}</p>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Quote Section */}
      <section className="py-32 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[#E31B23]/5" />
        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <ScrollReveal>
            <blockquote className="text-3xl md:text-5xl font-heading text-white leading-tight">
              "SOMOS MÁS QUE UN BAR. <br />
              <span className="text-[#FFD700]">SOMOS UNA EMBAJADA</span> <br />
              DEL SABOR CHOCOANO Y VALLUNO EN BOGOTÁ."
            </blockquote>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}
