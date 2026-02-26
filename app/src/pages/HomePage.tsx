import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { ArrowRight, Music, Star, ChevronRight, Users, Award } from 'lucide-react';
import { HeroSection } from '@/sections/HeroSection';
import { ScrollReveal } from '@/components/ScrollReveal';
import { StaggerContainer, StaggerItem } from '@/components/StaggerContainer';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { Button } from '@/components/ui/button';

const stats = [
  { value: 37, suffix: '+', label: 'Años de Historia', icon: Award },
  { value: 2, suffix: '', label: 'Pisos de Rumba', icon: Music },
  { value: 1000, suffix: '+', label: 'Noches Épicas', icon: Star },
  { value: 50000, suffix: '+', label: 'Bailadores', icon: Users },
];

const highlights = [
  {
    title: 'SALSA BRAVA',
    subtitle: 'La clásica de siempre',
    image: '/pachanga3.jpeg',
    link: '/galeria',
  },
  {
    title: 'TIMBA CUBANA',
    subtitle: 'El sabor de La Habana',
    image: '/pachanga5.jpeg',
    link: '/eventos',
  },
  {
    title: 'EVENTOS',
    subtitle: 'Celebra con nosotros',
    image: '/pachanga4.jpeg',
    link: '/eventos',
  },
];

export function HomePage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);

  return (
    <div ref={containerRef}>
      <HeroSection />

      {/* Stats Section - Contadores Animados */}
      <section className="relative z-10 px-4 py-16 bg-gradient-to-b from-transparent via-[#0a0a0a] to-[#0a0a0a]">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            {/* Background glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#E31B23]/20 via-[#FFD700]/10 to-[#E31B23]/20 blur-3xl -z-10" />
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 30, scale: 0.9 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.15, duration: 0.5 }}
                    whileHover={{ y: -5, scale: 1.02 }}
                    className="relative group"
                  >
                    <div className="relative p-6 bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] border border-[#333] rounded-2xl overflow-hidden hover:border-[#E31B23]/50 transition-all duration-300">
                      {/* Animated background on hover */}
                      <div className="absolute inset-0 bg-gradient-to-br from-[#E31B23]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      
                      {/* Icon */}
                      <div className="relative mb-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#E31B23]/20 to-[#E31B23]/5 border border-[#E31B23]/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          <Icon className="text-[#E31B23]" size={24} />
                        </div>
                      </div>
                      
                      {/* Counter */}
                      <div className="relative">
                        <p className="text-4xl md:text-5xl font-heading text-white mb-1">
                          <AnimatedCounter 
                            end={stat.value} 
                            suffix={stat.suffix}
                            duration={2.5}
                          />
                        </p>
                        <p className="text-[#FFD700] text-xs md:text-sm uppercase tracking-wider font-heading">
                          {stat.label}
                        </p>
                      </div>

                      {/* Decorative corner */}
                      <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-gradient-to-tl from-[#E31B23]/20 to-transparent rounded-tl-full opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </section>

      {/* About Preview */}
      <section className="py-24 px-4 relative overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <ScrollReveal direction="left">
              <div className="relative">
                <div className="aspect-[4/5] rounded-2xl overflow-hidden">
                  <img
                    src="/dancers.jpg"
                    alt="Pareja bailando salsa"
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Decorative elements */}
                <div className="absolute -bottom-6 -right-6 w-48 h-48 border-2 border-[#E31B23] rounded-2xl -z-10" />
                <div className="absolute -top-6 -left-6 w-32 h-32 bg-[#FFD700] rounded-2xl -z-10" />
                
                {/* Floating badge */}
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute -right-4 top-1/4 bg-[#111] border border-[#333] p-4 rounded-xl shadow-xl"
                >
                  <p className="text-3xl font-heading text-[#FFD700]">37</p>
                  <p className="text-white/60 text-xs uppercase font-heading">Años</p>
                </motion.div>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="right">
              <span className="text-[#E31B23] uppercase tracking-[0.3em] text-sm font-heading mb-4 block">
                Desde 1988
              </span>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-heading text-white mb-6 leading-tight">
                LA RUMBA <br />
                <span className="text-[#FFD700]">SALSERA</span> AUTÉNTICA
              </h2>
              <p className="text-white/70 font-body text-lg leading-relaxed mb-6">
                En Pachanga y Pochola no se viene a hacer piruetas de academia. Se viene a bailar 
                "pegadito", con el ritmo en la cadera, sintiendo cada golpe de tambor, cada nota 
                de piano, cada grito de la trompeta.
              </p>
              <p className="text-white/60 font-body mb-8">
                Somos más que un bar. Somos una embajada del sabor chocoano y valluno en Bogotá.
              </p>
              <Link to="/historia">
                <Button className="btn-outline-red group">
                  Conoce nuestra historia
                  <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Highlights Grid */}
      <section className="py-24 px-4 bg-[#0d0d0d]">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-16">
              <span className="text-[#FFD700] uppercase tracking-[0.3em] text-sm font-heading mb-4 block">
                Experiencias
              </span>
              <h2 className="text-4xl md:text-5xl font-heading text-white">
                VIVE LA <span className="text-[#E31B23]">POCHOLA</span>
              </h2>
            </div>
          </ScrollReveal>

          <StaggerContainer className="grid md:grid-cols-3 gap-6">
            {highlights.map((item) => (
              <StaggerItem key={item.title}>
                <Link to={item.link}>
                  <motion.div
                    whileHover={{ y: -10 }}
                    className="group relative h-[400px] rounded-2xl overflow-hidden cursor-pointer"
                  >
                    <img
                      src={item.image}
                      alt={item.title}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                    
                    <div className="absolute inset-0 p-8 flex flex-col justify-end">
                      <span className="text-[#FFD700] text-sm uppercase tracking-wider font-heading mb-2 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                        {item.subtitle}
                      </span>
                      <h3 className="text-3xl font-heading text-white mb-4">
                        {item.title}
                      </h3>
                      <div className="flex items-center text-white/60 group-hover:text-[#E31B23] transition-colors">
                        <span className="text-sm font-heading uppercase tracking-wider">Explorar</span>
                        <ChevronRight size={16} className="ml-1 transform group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>

                    {/* Hover border effect */}
                    <div className="absolute inset-0 border-2 border-transparent group-hover:border-[#E31B23] rounded-2xl transition-colors duration-300" />
                  </motion.div>
                </Link>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-4 relative overflow-hidden">
        <motion.div
          style={{ y: bgY }}
          className="absolute inset-0 z-0"
        >
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(/hero-salsa.jpg)` }}
          />
          <div className="absolute inset-0 bg-[#0a0a0a]/80" />
        </motion.div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <ScrollReveal>
            <h2 className="text-4xl md:text-6xl lg:text-7xl font-heading text-white mb-6">
              ¿LISTO PARA <span className="text-[#E31B23]">BAILAR</span>?
            </h2>
            <p className="text-white/70 text-lg md:text-xl font-body mb-10 max-w-2xl mx-auto">
              No te quedes fuera de la mejor rumba de Bogotá. Reserva tu mesa ahora 
              y vive una noche inolvidable.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/reservas">
                <Button size="lg" className="btn-primary text-base px-8 py-6">
                  RESERVAR AHORA
                </Button>
              </Link>
              <Link to="/menu">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 px-8 py-6 text-base">
                  VER MENÚ
                </Button>
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}
