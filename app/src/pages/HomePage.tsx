import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef, useState } from 'react';
import { ArrowRight, Music, Star, ChevronRight, Users, Award, type LucideIcon } from 'lucide-react';
import { HeroSection } from '@/sections/HeroSection';
import { ScrollReveal } from '@/components/ScrollReveal';
import { StaggerContainer, StaggerItem } from '@/components/StaggerContainer';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { Button } from '@/components/ui/button';

// Componente TooltipStat para palabras clave interactivas
interface TooltipStatProps {
  word: string;
  value: number;
  suffix: string;
  label: string;
  icon: LucideIcon;
  delay?: number;
}

function TooltipStat({ word, value, suffix, label, icon: Icon, delay = 0 }: TooltipStatProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showValue, setShowValue] = useState(false);

  const handleMouseEnter = () => {
    setIsHovered(true);
    // Pequeño delay para la animación del contador
    setTimeout(() => setShowValue(true), 150);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setShowValue(false);
  };

  return (
    <span 
      className="relative inline-block cursor-pointer"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Palabra subrayada con efecto */}
      <motion.span
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: delay + 0.3, duration: 0.5 }}
        className={`
          relative text-[#FFD700] font-heading
          transition-all duration-300 ease-out
          ${isHovered ? 'text-[#E31B23]' : ''}
        `}
      >
        {word}
        {/* Línea decorativa subrayada */}
        <span 
          className={`
            absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-[#E31B23] to-[#FFD700]
            transition-all duration-300 ease-out
            ${isHovered ? 'w-full' : 'w-0'}
          `}
        />
      </motion.span>

      {/* Tooltip/Burbuja emergente */}
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.8 }}
        animate={{ 
          opacity: isHovered ? 1 : 0, 
          y: isHovered ? 0 : 10,
          scale: isHovered ? 1 : 0.8
        }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className={`
          absolute left-1/2 -translate-x-1/2 bottom-full mb-3
          pointer-events-none z-50
          ${isHovered ? 'visible' : 'invisible'}
        `}
      >
        {/* Burbuja neón */}
        <div className="relative">
          {/* Glow effect */}
          <div className="absolute inset-0 bg-[#E31B23] blur-xl opacity-40 rounded-2xl" />
          
          {/* Contenido */}
          <div className="relative px-5 py-4 bg-[#0a0a0a] border border-[#E31B23]/60 rounded-2xl shadow-2xl shadow-[#E31B23]/30 min-w-[140px]">
            {/* Icono */}
            <div className="flex justify-center mb-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#E31B23] to-[#E31B23]/60 flex items-center justify-center">
                <Icon className="text-white" size={16} />
              </div>
            </div>
            
            {/* Valor */}
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-heading text-white leading-none">
                {showValue ? (
                  <AnimatedCounter 
                    end={value} 
                    suffix={suffix}
                    duration={1}
                  />
                ) : (
                  <span>0{suffix}</span>
                )}
              </div>
              <p className="text-[#FFD700] text-xs uppercase tracking-wider mt-1 font-heading">
                {label}
              </p>
            </div>

            {/* Decorative corner */}
            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-gradient-to-tl from-[#E31B23]/20 to-transparent rounded-tl-full" />
          </div>

          {/* Flecha */}
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-[#0a0a0a]" />
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-[9px] w-0 h-0 border-l-[9px] border-r-[9px] border-t-[9px] border-l-transparent border-r-transparent border-t-[#E31B23]/40" />
        </div>
      </motion.div>
    </span>
  );
}

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
  const statsRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  // Scroll progress específico para la sección de stats
  const { scrollYProgress: statsScrollProgress } = useScroll({
    target: statsRef,
    offset: ['start end', 'end start'],
  });

  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  
  // Transformaciones dinámicas para la sección de stats
  // Aparece cuando se acerca al centro, desaparece al alejarse
  const statsOpacity = useTransform(
    statsScrollProgress, 
    [0, 0.2, 0.4, 0.6, 0.8], 
    [0, 0.5, 1, 0.5, 0]
  );
  
  const statsY = useTransform(
    statsScrollProgress, 
    [0, 0.2, 0.4, 0.6, 0.8], 
    [100, 50, 0, 50, 100]
  );
  
  const textOpacity = useTransform(
    statsScrollProgress, 
    [0.1, 0.25, 0.35, 0.55, 0.7], 
    [0, 0.5, 1, 0.5, 0]
  );
  
  const lineScale = useTransform(
    statsScrollProgress, 
    [0.15, 0.3, 0.4, 0.6, 0.75], 
    [0, 0.5, 1, 0.5, 0]
  );

  return (
    <div ref={containerRef}>
      <HeroSection />

      {/* Stats Section - Diseño Editorial Interactivo con scroll dinámico */}
      <section ref={statsRef} className="relative z-10 px-4 py-32 overflow-hidden min-h-[80vh] flex items-center">
        {/* Imagen de fondo sutil con parallax */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-fixed"
          style={{ backgroundImage: `url(/hero-salsa.jpg)` }}
        />
        
        {/* Gradiente de transición suave desde el Hero */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-[#0a0a0a]/85 to-[#0a0a0a]/95" />
        
        {/* Overlay con patrón sutil */}
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, #E31B23/20 0%, transparent 50%),
                           radial-gradient(circle at 75% 75%, #FFD700/10 0%, transparent 50%)`
        }} />
        
        {/* Glow effect sutil */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#E31B23]/5 via-transparent to-[#FFD700]/5 blur-3xl" />
        
        <div className="max-w-5xl mx-auto">
          <motion.div
            style={{ opacity: statsOpacity, y: statsY }}
            className="relative"
          >
            {/* Label */}
            <motion.span
              style={{ opacity: textOpacity }}
              className="text-[#E31B23] uppercase tracking-[0.3em] text-sm font-heading mb-8 block text-center"
            >
              Nuestra Esencia
            </motion.span>

            {/* Texto Editorial Principal */}
            <motion.div
              style={{ opacity: textOpacity }}
              className="relative"
            >
              <div className="text-2xl md:text-4xl lg:text-5xl font-heading text-white/90 leading-relaxed md:leading-relaxed text-center">
                Somos el alma de la fiesta.{' '}
                <TooltipStat 
                  word="Una tradición"
                  value={37}
                  suffix="+"
                  label="Años de Historia"
                  icon={Award}
                  delay={0}
                />{' '}
                que lleva conectando corazones. Con{' '}
                <TooltipStat 
                  word="múltiples espacios"
                  value={2}
                  suffix=""
                  label="Pisos de Rumba"
                  icon={Music}
                  delay={0.1}
                />{' '}
                y{' '}
                <TooltipStat 
                  word="miles de noches épicas"
                  value={1000}
                  suffix="+"
                  label="Noches Épicas"
                  icon={Star}
                  delay={0.2}
                />, hemos hecho bailar a una legión de{' '}
                <TooltipStat 
                  word="fanáticos."
                  value={50000}
                  suffix="+"
                  label="Bailadores"
                  icon={Users}
                  delay={0.3}
                />
              </div>
            </motion.div>

            {/* Decorative line */}
            <motion.div
              style={{ opacity: textOpacity, scaleX: lineScale }}
              className="mt-12 mx-auto w-24 h-px bg-gradient-to-r from-transparent via-[#E31B23] to-transparent"
            />
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
                Rescatamos la esencia de la rumba de verdad: esa que se baila pegadito, con el 
                ritmo en la cadera y el alma en la pista. Aquí se viene a gozar cada vibración, 
                desde el golpe del tambor hasta el grito de la trompeta.
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
                VIVE LA <span className="text-[#E31B23]">PACHANGA</span>
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
